"""
Motor de emisión de documentos fiscales.

Este es el servicio central de AIDA: recibe un request estandarizado,
calcula impuestos, asigna número de control, genera firma digital,
QR, PDF, XML y almacena todo cumpliendo con SENIAT.
"""
import uuid
import hashlib
import json
import base64
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.documents import Invoice, CreditNote, DebitNote, DispatchGuide, DocumentItem
from app.models.clients import Client
from app.schemas.fiscal import (
    EmitirDocumentoRequest, EmitirDocumentoResponse,
    FiscalItemResponse, FiscalTotales,
    AnularDocumentoRequest, AnularDocumentoResponse,
)
from app.services.fiscal.calculator import calcular_item, calcular_totales
from app.services.fiscal.control_numbers import assign_control_number, void_control_number
from app.services.fiscal.seniat_validator import SeniatValidator
from app.services.fiscal.seniat_validator.bridge import build_seniat_json

import logging
_logger = logging.getLogger(__name__)


class DocumentEmissionError(Exception):
    def __init__(self, error_code: str, message: str, details: list[str] | None = None):
        self.error_code = error_code
        self.message = message
        self.details = details or []
        super().__init__(message)


async def emitir_documento(
    db: AsyncSession,
    client_id: uuid.UUID,
    request: EmitirDocumentoRequest,
    user_id: uuid.UUID | None = None,
    ip_address: str | None = None,
) -> EmitirDocumentoResponse:
    """
    Emite un documento fiscal completo.

    Flujo:
    1. Validar datos de entrada
    2. Obtener datos del emisor (del perfil del cliente)
    3. Calcular items (subtotales, impuestos)
    4. Calcular totales del documento
    5. Asignar número de control SENIAT
    6. Generar UUID único del documento
    7. Generar firma digital
    8. Generar QR de validación
    9. Almacenar documento en BD
    10. Retornar respuesta estandarizada
    """
    # 1. Validar
    _validar_request(request)

    # 2. Obtener datos del emisor
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise DocumentEmissionError("CLIENT_NOT_FOUND", "Cliente no encontrado")

    emisor_rif = request.emisor.rif if request.emisor and request.emisor.rif else client.rif
    emisor_razon = request.emisor.razon_social if request.emisor and request.emisor.razon_social else client.razon_social
    emisor_dir = request.emisor.direccion if request.emisor and request.emisor.direccion else client.direccion_fiscal

    # 3. Calcular items
    items_calculados = [calcular_item(item) for item in request.items]

    # 4. Calcular totales (con IGTF si pago en divisas)
    pago_en_divisas = getattr(request, "pago_en_divisas", False) or request.moneda != "VES"
    porcentaje_igtf = getattr(request, "porcentaje_igtf", 3.00)
    totales = calcular_totales(items_calculados, pago_en_divisas, porcentaje_igtf)

    # 4b. Validación SENIAT V1.4 pre-emisión
    try:
        seniat_json = build_seniat_json(
            tipo_documento=request.tipo_documento,
            emisor_rif=emisor_rif,
            emisor_razon_social=emisor_razon,
            emisor_direccion=emisor_dir or "",
            receptor_rif=request.receptor.rif,
            receptor_razon_social=request.receptor.razon_social,
            receptor_direccion=request.receptor.direccion or "",
            items_calculados=items_calculados,
            totales=totales,
            moneda=request.moneda,
            tasa_cambio=request.tasa_cambio,
            forma_pago=request.pagos[0].forma if request.pagos else "efectivo",
            observaciones=request.observaciones,
        )
        validator = SeniatValidator()
        seniat_result = validator.validate(seniat_json)
        if not seniat_result.is_valid:
            error_msgs = [
                f"[{e.code}] {e.field}: {e.message}"
                for e in seniat_result.errors
            ]
            raise DocumentEmissionError(
                "SENIAT_VALIDATION_FAILED",
                f"El documento no cumple con las reglas SENIAT V1.4 ({len(seniat_result.errors)} errores)",
                error_msgs,
            )
        if seniat_result.warnings:
            for w in seniat_result.warnings:
                _logger.warning("SENIAT warning [%s] %s: %s", w.code, w.field, w.message)
    except DocumentEmissionError:
        raise
    except Exception as e:
        _logger.warning("SENIAT pre-validation skipped due to error: %s", e)

    # 5. Crear el documento en BD para obtener ID
    fecha_emision = request.fecha_emision or datetime.now(timezone.utc)
    doc_uuid = str(uuid.uuid4())

    if request.tipo_documento == "factura":
        doc = await _crear_factura(
            db, client_id, request, emisor_rif, emisor_razon, emisor_dir,
            fecha_emision, totales, items_calculados, doc_uuid, user_id, ip_address,
        )
    elif request.tipo_documento == "nota_credito":
        doc = await _crear_nota_credito(
            db, client_id, request, emisor_rif, emisor_razon,
            fecha_emision, totales, items_calculados, doc_uuid, user_id, ip_address,
        )
    elif request.tipo_documento == "nota_debito":
        doc = await _crear_nota_debito(
            db, client_id, request, emisor_rif, emisor_razon,
            fecha_emision, totales, items_calculados, doc_uuid, user_id, ip_address,
        )
    elif request.tipo_documento == "guia_despacho":
        doc = await _crear_guia_despacho(
            db, client_id, request, emisor_rif, emisor_razon,
            fecha_emision, items_calculados, doc_uuid, user_id, ip_address,
        )
    else:
        raise DocumentEmissionError("INVALID_TYPE", f"Tipo de documento no válido: {request.tipo_documento}")

    # 6. Asignar número de control
    numero_control = await assign_control_number(
        db, client_id, request.tipo_documento, doc.id, user_id, ip_address,
    )
    doc.control_number = numero_control

    # 7. Firma digital (hash SHA-256 del contenido)
    firma_data = f"{numero_control}|{emisor_rif}|{request.receptor.rif}|{fecha_emision.isoformat()}|{totales.total}"
    firma_digital = hashlib.sha256(firma_data.encode()).hexdigest()

    # 8. QR code data (URL de validación)
    qr_data = json.dumps({
        "nc": numero_control,
        "rif_e": emisor_rif,
        "rif_r": request.receptor.rif,
        "f": fecha_emision.strftime("%Y-%m-%d"),
        "t": totales.total,
        "uuid": doc_uuid,
    })
    qr_base64 = base64.b64encode(qr_data.encode()).decode()

    # 9. Actualizar documento con número de control, firma y QR
    if hasattr(doc, "qr_code"):
        doc.qr_code = qr_base64
    if hasattr(doc, "firma_digital"):
        doc.firma_digital = firma_digital
    if hasattr(doc, "uuid_seniat"):
        doc.uuid_seniat = doc_uuid

    # URLs de descarga
    pdf_url = f"/api/v1/fiscal/documents/{doc.id}/pdf"
    xml_url = f"/api/v1/fiscal/documents/{doc.id}/xml"
    if hasattr(doc, "pdf_url"):
        doc.pdf_url = pdf_url
    if hasattr(doc, "xml_url"):
        doc.xml_url = xml_url

    # Generar y almacenar PDF/XML, enviar email al receptor
    try:
        from app.services.fiscal.pdf_generator import generate_invoice_pdf
        from app.services.fiscal.xml_generator import generate_document_xml
        from app.services.storage import get_storage

        # Proxy items para el generador
        doc_items = []
        for item in items_calculados:
            class _P: pass
            p = _P()
            for attr in ("numero_linea", "codigo", "descripcion", "unidad", "cantidad",
                         "precio_unitario", "descuento", "subtotal", "tipo_impuesto",
                         "alicuota", "monto_impuesto", "total"):
                setattr(p, attr, getattr(item, attr, 0))
            p.line_number = item.numero_linea
            p.product_code = item.codigo
            p.unit_of_measure = item.unidad
            p.unit_price = item.precio_unitario
            p.discount_amount = item.descuento
            p.tax_type = item.tipo_impuesto
            p.tax_rate = item.alicuota
            p.tax_amount = item.monto_impuesto
            doc_items.append(p)

        storage = get_storage()
        nc = numero_control.replace("/", "-") if numero_control else doc.document_number
        pdf_bytes = generate_invoice_pdf(doc, doc_items, request.tipo_documento)
        await storage.save(pdf_bytes, str(client_id), "pdf", f"{request.tipo_documento}_{nc}.pdf")
        xml_bytes = generate_document_xml(doc, doc_items, request.tipo_documento)
        await storage.save(xml_bytes, str(client_id), "xml", f"{request.tipo_documento}_{nc}.xml")

        # Email al receptor
        if request.receptor.email:
            try:
                from app.services.notifications.email_service import get_email_service
                await get_email_service().send_document_email(
                    to=request.receptor.email, doc_type=request.tipo_documento,
                    numero_control=numero_control, emisor_razon=emisor_razon,
                    receptor_razon=request.receptor.razon_social,
                    total=totales.total, moneda=request.moneda,
                    pdf_bytes=pdf_bytes, xml_bytes=xml_bytes,
                )
            except Exception:
                pass  # Email failure should not block emission
    except Exception:
        pass  # File generation failure should not block emission

    await db.flush()

    # 10. Respuesta
    numero_documento = request.numero_documento or doc.document_number

    return EmitirDocumentoResponse(
        document_id=doc.id,
        tipo_documento=request.tipo_documento,
        numero_documento=numero_documento,
        numero_control=numero_control,
        uuid_documento=doc_uuid,
        fecha_emision=fecha_emision,
        fecha_procesamiento=datetime.now(timezone.utc),
        totales=totales,
        items=items_calculados,
        pdf_url=pdf_url,
        xml_url=xml_url,
        qr_code=qr_base64,
        firma_digital=firma_digital,
        metadata=request.metadata,
    )


async def anular_documento(
    db: AsyncSession,
    client_id: uuid.UUID,
    request: AnularDocumentoRequest,
    user_id: uuid.UUID | None = None,
    ip_address: str | None = None,
) -> AnularDocumentoResponse:
    """Anula un documento fiscal por número de control."""
    # Buscar el documento
    invoice = await db.execute(
        select(Invoice).where(
            Invoice.control_number == request.numero_control,
            Invoice.client_id == client_id,
        )
    )
    doc = invoice.scalar_one_or_none()

    if not doc:
        # Intentar en notas de crédito/débito
        for model in [CreditNote, DebitNote]:
            result = await db.execute(
                select(model).where(
                    model.control_number == request.numero_control,
                    model.client_id == client_id,
                )
            )
            doc = result.scalar_one_or_none()
            if doc:
                break

    if not doc:
        raise DocumentEmissionError("DOC_NOT_FOUND", "Documento no encontrado con ese número de control")

    if doc.status == "anulado":
        raise DocumentEmissionError("ALREADY_VOIDED", "El documento ya fue anulado")

    # Anular
    doc.status = "anulado"
    doc.motivo_anulacion = request.motivo
    doc.fecha_anulacion = datetime.now(timezone.utc)

    # Anular número de control
    await void_control_number(db, request.numero_control, request.motivo, user_id, ip_address)

    await db.flush()

    return AnularDocumentoResponse(
        message=f"Documento {request.numero_control} anulado exitosamente",
        numero_control=request.numero_control,
        fecha_anulacion=doc.fecha_anulacion,
    )


def _validar_request(request: EmitirDocumentoRequest):
    """Validaciones de negocio del request."""
    errors = []

    if request.tipo_documento in ("nota_credito", "nota_debito") and not request.documento_referencia:
        errors.append("documento_referencia es requerido para notas de crédito/débito")

    if request.tipo_documento in ("nota_credito", "nota_debito") and not request.motivo:
        errors.append("motivo es requerido para notas de crédito/débito")

    if request.moneda != "VES" and not request.tasa_cambio:
        errors.append("tasa_cambio es requerido cuando la moneda no es VES")

    if not request.receptor.rif:
        errors.append("receptor.rif es requerido")

    for i, item in enumerate(request.items):
        if item.cantidad <= 0:
            errors.append(f"Item {i+1}: cantidad debe ser mayor a 0")
        if item.precio_unitario < 0:
            errors.append(f"Item {i+1}: precio_unitario no puede ser negativo")

    if errors:
        raise DocumentEmissionError("VALIDATION_ERROR", "Errores de validación", errors)


async def _crear_factura(
    db, client_id, request, emisor_rif, emisor_razon, emisor_dir,
    fecha_emision, totales, items_calc, doc_uuid, user_id, ip_address,
) -> Invoice:
    """Crea una factura en la BD."""
    # Generar número interno si no viene
    numero_doc = request.numero_documento or f"FAC-{uuid.uuid4().hex[:8].upper()}"

    invoice = Invoice(
        client_id=client_id,
        document_number=numero_doc,
        uuid_seniat=doc_uuid,
        emisor_rif=emisor_rif,
        emisor_razon_social=emisor_razon,
        emisor_direccion=emisor_dir,
        receptor_rif=request.receptor.rif,
        receptor_razon_social=request.receptor.razon_social,
        receptor_direccion=request.receptor.direccion,
        receptor_telefono=request.receptor.telefono,
        receptor_email=request.receptor.email,
        fecha_emision=fecha_emision,
        fecha_vencimiento=request.fecha_vencimiento,
        subtotal=totales.subtotal,
        descuento=totales.descuento_total,
        base_imponible=totales.base_imponible,
        base_exenta=totales.base_exenta,
        monto_iva_16=totales.monto_iva_16,
        monto_iva_8=totales.monto_iva_8,
        # IGTF
        base_imponible_igtf=totales.base_imponible_igtf,
        porcentaje_igtf=totales.porcentaje_igtf,
        monto_igtf=totales.monto_igtf,
        total=totales.total,
        total_con_igtf=totales.total_con_igtf,
        moneda=request.moneda,
        tasa_cambio=request.tasa_cambio,
        forma_pago=request.pagos[0].forma if request.pagos else "efectivo",
        condicion_pago=request.condicion_pago,
        status="emitido",
        vendedor_id=None,
        observaciones=request.observaciones,
        created_by_user_id=user_id,
        created_by_ip=ip_address,
    )
    db.add(invoice)
    await db.flush()

    # Crear items
    for item in items_calc:
        doc_item = DocumentItem(
            invoice_id=invoice.id,
            product_code=item.codigo,
            description=item.descripcion,
            unit_of_measure=item.unidad,
            quantity=item.cantidad,
            unit_price=item.precio_unitario,
            discount_percent=0,
            discount_amount=item.descuento,
            subtotal=item.subtotal,
            tax_type=item.tipo_impuesto,
            tax_rate=item.alicuota,
            tax_amount=item.monto_impuesto,
            total=item.total,
            line_number=item.numero_linea,
        )
        db.add(doc_item)

    await db.flush()
    return invoice


async def _crear_nota_credito(
    db, client_id, request, emisor_rif, emisor_razon,
    fecha_emision, totales, items_calc, doc_uuid, user_id, ip_address,
) -> CreditNote:
    """Crea una nota de crédito vinculada a la factura original."""
    # Buscar factura original por número de control
    original = await db.execute(
        select(Invoice).where(
            Invoice.control_number == request.documento_referencia,
            Invoice.client_id == client_id,
        )
    )
    factura_original = original.scalar_one_or_none()
    if not factura_original:
        raise DocumentEmissionError(
            "REF_NOT_FOUND",
            f"Documento referencia {request.documento_referencia} no encontrado",
        )

    numero_doc = request.numero_documento or f"NC-{uuid.uuid4().hex[:8].upper()}"

    cn = CreditNote(
        client_id=client_id,
        document_number=numero_doc,
        uuid_seniat=doc_uuid,
        invoice_id=factura_original.id,
        emisor_rif=emisor_rif,
        emisor_razon_social=emisor_razon,
        receptor_rif=request.receptor.rif,
        receptor_razon_social=request.receptor.razon_social,
        fecha_emision=fecha_emision,
        motivo=request.motivo or "Anulación/devolución",
        tipo="total" if totales.total >= factura_original.total else "parcial",
        subtotal=totales.subtotal - totales.descuento_total,
        monto_iva=totales.total_impuestos,
        total=totales.total,
        base_imponible_igtf=totales.base_imponible_igtf,
        monto_igtf=totales.monto_igtf,
        moneda=request.moneda,
        status="emitido",
        created_by_user_id=user_id,
        created_by_ip=ip_address,
    )
    db.add(cn)
    await db.flush()

    for item in items_calc:
        doc_item = DocumentItem(
            credit_note_id=cn.id,
            product_code=item.codigo,
            description=item.descripcion,
            unit_of_measure=item.unidad,
            quantity=item.cantidad,
            unit_price=item.precio_unitario,
            discount_amount=item.descuento,
            subtotal=item.subtotal,
            tax_type=item.tipo_impuesto,
            tax_rate=item.alicuota,
            tax_amount=item.monto_impuesto,
            total=item.total,
            line_number=item.numero_linea,
        )
        db.add(doc_item)

    await db.flush()
    return cn


async def _crear_nota_debito(
    db, client_id, request, emisor_rif, emisor_razon,
    fecha_emision, totales, items_calc, doc_uuid, user_id, ip_address,
) -> DebitNote:
    """Crea una nota de débito."""
    original = await db.execute(
        select(Invoice).where(
            Invoice.control_number == request.documento_referencia,
            Invoice.client_id == client_id,
        )
    )
    factura_original = original.scalar_one_or_none()
    if not factura_original:
        raise DocumentEmissionError(
            "REF_NOT_FOUND",
            f"Documento referencia {request.documento_referencia} no encontrado",
        )

    numero_doc = request.numero_documento or f"ND-{uuid.uuid4().hex[:8].upper()}"

    dn = DebitNote(
        client_id=client_id,
        document_number=numero_doc,
        uuid_seniat=doc_uuid,
        invoice_id=factura_original.id,
        emisor_rif=emisor_rif,
        emisor_razon_social=emisor_razon,
        receptor_rif=request.receptor.rif,
        receptor_razon_social=request.receptor.razon_social,
        fecha_emision=fecha_emision,
        concepto=request.motivo or "Cargo adicional",
        subtotal=totales.subtotal - totales.descuento_total,
        monto_iva=totales.total_impuestos,
        total=totales.total,
        base_imponible_igtf=totales.base_imponible_igtf,
        monto_igtf=totales.monto_igtf,
        moneda=request.moneda,
        status="emitido",
        created_by_user_id=user_id,
        created_by_ip=ip_address,
    )
    db.add(dn)
    await db.flush()

    for item in items_calc:
        doc_item = DocumentItem(
            debit_note_id=dn.id,
            product_code=item.codigo,
            description=item.descripcion,
            unit_of_measure=item.unidad,
            quantity=item.cantidad,
            unit_price=item.precio_unitario,
            discount_amount=item.descuento,
            subtotal=item.subtotal,
            tax_type=item.tipo_impuesto,
            tax_rate=item.alicuota,
            tax_amount=item.monto_impuesto,
            total=item.total,
            line_number=item.numero_linea,
        )
        db.add(doc_item)

    await db.flush()
    return dn


async def _crear_guia_despacho(
    db, client_id, request, emisor_rif, emisor_razon,
    fecha_emision, items_calc, doc_uuid, user_id, ip_address,
) -> DispatchGuide:
    """Crea una guía de despacho."""
    numero_doc = request.numero_documento or f"GD-{uuid.uuid4().hex[:8].upper()}"

    gd = DispatchGuide(
        client_id=client_id,
        document_number=numero_doc,
        emisor_rif=emisor_rif,
        emisor_razon_social=emisor_razon,
        receptor_rif=request.receptor.rif,
        receptor_razon_social=request.receptor.razon_social,
        fecha_emision=fecha_emision,
        transportista_nombre=request.transportista,
        transportista_rif=request.transportista_rif,
        vehiculo_placa=request.vehiculo_placa,
        ruta_destino=request.ruta_destino,
        motivo_traslado=request.motivo_traslado,
        status="emitido",
        created_by_user_id=user_id,
        created_by_ip=ip_address,
    )
    db.add(gd)
    await db.flush()

    for item in items_calc:
        doc_item = DocumentItem(
            dispatch_guide_id=gd.id,
            product_code=item.codigo,
            description=item.descripcion,
            unit_of_measure=item.unidad,
            quantity=item.cantidad,
            unit_price=item.precio_unitario,
            discount_amount=item.descuento,
            subtotal=item.subtotal,
            tax_type=item.tipo_impuesto,
            tax_rate=item.alicuota,
            tax_amount=item.monto_impuesto,
            total=item.total,
            line_number=item.numero_linea,
        )
        db.add(doc_item)

    await db.flush()
    return gd
