"""
Portal 2 - Módulo de Facturación.

Este módulo es la interfaz web del facturador. Internamente usa
la misma API Fiscal Estándar, lo que garantiza que los documentos
generados desde la web y desde integración API son idénticos.
"""
import uuid
import math
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.core.deps import get_current_user, log_audit
from app.models.security import User
from app.models.clients import Client, ClientUser
from app.models.customers import Customer
from app.models.products import Product
from app.models.documents import Invoice, CreditNote, DebitNote
from app.schemas.invoicing import (
    InvoiceCreate, CreditNoteCreate, DebitNoteCreate,
    InvoiceFullResponse, FacturadorDashboard,
)
from app.schemas.fiscal import (
    EmitirDocumentoRequest, FiscalReceptor, FiscalItem, FiscalPago,
)
from app.services.fiscal.document_emitter import emitir_documento, DocumentEmissionError

router = APIRouter()


async def _get_client(user: User, db: AsyncSession) -> Client:
    # Check direct ClientUser association first
    result = await db.execute(
        select(ClientUser.client_id).where(
            ClientUser.user_id == user.id, ClientUser.is_active == True
        ).limit(1)
    )
    row = result.first()
    if row:
        client_result = await db.execute(select(Client).where(Client.id == row[0]))
        return client_result.scalar_one()

    # Superadmins can access the first available client
    if user.is_superadmin:
        client_result = await db.execute(
            select(Client).where(Client.is_active == True).order_by(Client.created_at).limit(1)
        )
        client = client_result.scalar_one_or_none()
        if client:
            return client

    raise HTTPException(status_code=403, detail="No tiene un cliente asociado")


@router.get("/dashboard", response_model=FacturadorDashboard)
async def facturador_dashboard(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard del facturador con KPIs de ventas, inventario y clientes."""
    client = await _get_client(user, db)
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    week_start = today_start - timedelta(days=today_start.weekday())
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    base = Invoice.client_id == client.id

    ventas_hoy = (await db.execute(
        select(func.coalesce(func.sum(Invoice.total), 0))
        .where(base, Invoice.fecha_emision >= today_start, Invoice.status != "anulado")
    )).scalar() or 0

    ventas_semana = (await db.execute(
        select(func.coalesce(func.sum(Invoice.total), 0))
        .where(base, Invoice.fecha_emision >= week_start, Invoice.status != "anulado")
    )).scalar() or 0

    ventas_mes = (await db.execute(
        select(func.coalesce(func.sum(Invoice.total), 0))
        .where(base, Invoice.fecha_emision >= month_start, Invoice.status != "anulado")
    )).scalar() or 0

    # Productos con stock bajo
    from app.models.products import Product as Prod
    stock_bajo = (await db.execute(
        select(func.count(Prod.id)).where(
            Prod.client_id == client.id,
            Prod.is_active == True,
            Prod.is_service == False,
            Prod.stock_actual <= Prod.stock_minimo,
        )
    )).scalar() or 0

    # Top productos del mes
    top_products_q = await db.execute(
        select(
            Invoice.receptor_razon_social,
            func.count(Invoice.id).label("count"),
            func.sum(Invoice.total).label("total"),
        )
        .where(base, Invoice.fecha_emision >= month_start, Invoice.status != "anulado")
        .group_by(Invoice.receptor_razon_social)
        .order_by(func.sum(Invoice.total).desc())
        .limit(5)
    )
    top_clients = [
        {"nombre": r[0], "facturas": r[1], "total": float(r[2])}
        for r in top_products_q.all()
    ]

    # Documentos recientes
    recent_result = await db.execute(
        select(Invoice).where(base).order_by(Invoice.fecha_emision.desc()).limit(10)
    )
    recent = [
        {
            "id": str(d.id), "numero": d.document_number,
            "control": d.control_number, "receptor": d.receptor_razon_social,
            "total": float(d.total), "status": d.status,
            "fecha": d.fecha_emision.isoformat(),
        }
        for d in recent_result.scalars().all()
    ]

    return FacturadorDashboard(
        ventas_hoy=float(ventas_hoy),
        ventas_semana=float(ventas_semana),
        ventas_mes=float(ventas_mes),
        facturas_pendientes_envio=0,
        productos_stock_bajo=stock_bajo,
        clientes_morosos=0,
        top_productos=[],
        top_clientes=top_clients,
        documentos_recientes=recent,
    )


@router.post("/invoices", response_model=InvoiceFullResponse, status_code=201)
async def create_invoice(
    data: InvoiceCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Crear factura desde el Portal 2.

    Resuelve automáticamente el cliente por ID o RIF, los productos por ID,
    y delega la emisión a la API Fiscal Estándar internamente.
    """
    client = await _get_client(user, db)

    # Resolver datos del receptor
    receptor_rif = data.receptor_rif
    receptor_razon = data.receptor_razon_social
    receptor_dir = data.receptor_direccion or ""
    receptor_email = data.receptor_email

    if data.customer_id:
        cust_result = await db.execute(
            select(Customer).where(Customer.id == data.customer_id, Customer.client_id == client.id)
        )
        customer = cust_result.scalar_one_or_none()
        if customer:
            receptor_rif = receptor_rif or customer.rif
            receptor_razon = receptor_razon or customer.razon_social
            receptor_dir = receptor_dir or customer.direccion_fiscal
            receptor_email = receptor_email or customer.email

    if not receptor_rif or not receptor_razon:
        raise HTTPException(status_code=400, detail="Datos del receptor incompletos (RIF y razón social requeridos)")

    # Resolver items (enriquecer con datos de producto si viene product_id)
    fiscal_items = []
    for i, item in enumerate(data.items):
        desc = item.description
        code = item.product_code
        price = item.unit_price
        tax_type = item.tax_type

        if item.product_id:
            prod_result = await db.execute(
                select(Product).where(Product.id == item.product_id, Product.client_id == client.id)
            )
            product = prod_result.scalar_one_or_none()
            if product:
                desc = desc or product.name
                code = code or product.code
                if item.unit_price == 0:
                    price = float(product.sale_price_1)
                tax_map = {"gravado": "G", "reducido": "R", "exento": "E"}
                tax_type = tax_map.get(product.tax_type, tax_type)

        fiscal_items.append(FiscalItem(
            numero_linea=i + 1,
            codigo=code,
            descripcion=desc,
            unidad=item.unit_of_measure,
            cantidad=item.quantity,
            precio_unitario=price,
            descuento_porcentaje=item.discount_percent,
            tipo_impuesto=tax_type,
        ))

    # Construir request fiscal estandarizado
    fiscal_request = EmitirDocumentoRequest(
        tipo_documento="factura",
        receptor=FiscalReceptor(
            rif=receptor_rif,
            razon_social=receptor_razon,
            direccion=receptor_dir,
            email=receptor_email,
        ),
        items=fiscal_items,
        pagos=[FiscalPago(forma=data.forma_pago)],
        condicion_pago=data.condicion_pago,
        moneda=data.moneda,
        tasa_cambio=data.tasa_cambio,
        fecha_vencimiento=data.fecha_vencimiento,
        observaciones=data.observaciones,
    )

    try:
        result = await emitir_documento(
            db=db, client_id=client.id, request=fiscal_request,
            user_id=user.id, ip_address=request.client.host if request.client else None,
        )
    except DocumentEmissionError as e:
        raise HTTPException(status_code=400, detail=e.message)

    # Actualizar stock de productos
    for item in data.items:
        if item.product_id:
            prod = await db.execute(
                select(Product).where(Product.id == item.product_id, Product.client_id == client.id)
            )
            product = prod.scalar_one_or_none()
            if product and not product.is_service:
                from app.models.products import Inventory
                stock_before = float(product.stock_actual)
                product.stock_actual = float(product.stock_actual) - item.quantity
                db.add(Inventory(
                    client_id=client.id, product_id=product.id,
                    movement_type="salida", quantity=item.quantity,
                    stock_before=stock_before, stock_after=float(product.stock_actual),
                    reference_type="invoice", reference_id=result.document_id,
                    warehouse="principal", performed_by=user.id,
                ))

    await db.flush()

    await log_audit(
        db, user.id, "create_invoice", "invoice", str(result.document_id),
        details=f"NC:{result.numero_control} Total:{result.totales.total}",
        request=request, client_id=client.id,
    )

    # Obtener la factura completa para respuesta
    inv_result = await db.execute(
        select(Invoice).where(Invoice.id == result.document_id).options(selectinload(Invoice.items))
    )
    invoice = inv_result.scalar_one()

    return InvoiceFullResponse(
        id=invoice.id,
        document_number=invoice.document_number,
        control_number=invoice.control_number,
        uuid_seniat=invoice.uuid_seniat,
        emisor_rif=invoice.emisor_rif,
        emisor_razon_social=invoice.emisor_razon_social,
        receptor_rif=invoice.receptor_rif,
        receptor_razon_social=invoice.receptor_razon_social,
        receptor_email=invoice.receptor_email,
        fecha_emision=invoice.fecha_emision,
        fecha_vencimiento=invoice.fecha_vencimiento,
        subtotal=float(invoice.subtotal),
        descuento=float(invoice.descuento),
        base_imponible=float(invoice.base_imponible),
        base_exenta=float(invoice.base_exenta),
        monto_iva_16=float(invoice.monto_iva_16),
        monto_iva_8=float(invoice.monto_iva_8),
        total=float(invoice.total),
        moneda=invoice.moneda,
        tasa_cambio=float(invoice.tasa_cambio) if invoice.tasa_cambio else None,
        forma_pago=invoice.forma_pago,
        condicion_pago=invoice.condicion_pago,
        status=invoice.status,
        observaciones=invoice.observaciones,
        pdf_url=invoice.pdf_url,
        xml_url=invoice.xml_url,
        qr_code=invoice.qr_code,
        items=[
            {
                "linea": it.line_number, "codigo": it.product_code,
                "descripcion": it.description, "cantidad": float(it.quantity),
                "precio": float(it.unit_price), "subtotal": float(it.subtotal),
                "iva": float(it.tax_amount), "total": float(it.total),
            }
            for it in invoice.items
        ],
        created_at=invoice.created_at,
    )


@router.post("/credit-notes", status_code=201)
async def create_credit_note(
    data: CreditNoteCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Crear nota de crédito vinculada a una factura."""
    client = await _get_client(user, db)

    # Obtener factura original
    inv_result = await db.execute(
        select(Invoice).where(Invoice.id == data.invoice_id, Invoice.client_id == client.id)
        .options(selectinload(Invoice.items))
    )
    original = inv_result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Factura original no encontrada")
    if not original.control_number:
        raise HTTPException(status_code=400, detail="La factura original no tiene número de control")

    # Preparar items (si es total, usar los de la factura original)
    if data.tipo == "total" or not data.items:
        fiscal_items = [
            FiscalItem(
                numero_linea=it.line_number,
                codigo=it.product_code,
                descripcion=it.description,
                unidad=it.unit_of_measure,
                cantidad=float(it.quantity),
                precio_unitario=float(it.unit_price),
                tipo_impuesto=it.tax_type or "G",
            )
            for it in original.items
        ]
    else:
        fiscal_items = [
            FiscalItem(
                numero_linea=i + 1,
                codigo=item.product_code,
                descripcion=item.description,
                unidad=item.unit_of_measure,
                cantidad=item.quantity,
                precio_unitario=item.unit_price,
                tipo_impuesto=item.tax_type,
            )
            for i, item in enumerate(data.items)
        ]

    fiscal_request = EmitirDocumentoRequest(
        tipo_documento="nota_credito",
        receptor=FiscalReceptor(
            rif=original.receptor_rif,
            razon_social=original.receptor_razon_social,
            direccion=original.receptor_direccion,
        ),
        items=fiscal_items,
        documento_referencia=original.control_number,
        motivo=data.motivo,
        moneda=original.moneda,
    )

    try:
        result = await emitir_documento(
            db=db, client_id=client.id, request=fiscal_request,
            user_id=user.id, ip_address=request.client.host if request.client else None,
        )
    except DocumentEmissionError as e:
        raise HTTPException(status_code=400, detail=e.message)

    await log_audit(
        db, user.id, "create_credit_note", "credit_note", str(result.document_id),
        details=f"NC:{result.numero_control} Ref:{original.control_number}",
        request=request, client_id=client.id,
    )

    return {
        "success": True,
        "document_id": str(result.document_id),
        "numero_control": result.numero_control,
        "total": result.totales.total,
        "factura_referencia": original.control_number,
    }


@router.post("/debit-notes", status_code=201)
async def create_debit_note(
    data: DebitNoteCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Crear nota de débito vinculada a una factura."""
    client = await _get_client(user, db)

    inv_result = await db.execute(
        select(Invoice).where(Invoice.id == data.invoice_id, Invoice.client_id == client.id)
    )
    original = inv_result.scalar_one_or_none()
    if not original:
        raise HTTPException(status_code=404, detail="Factura original no encontrada")
    if not original.control_number:
        raise HTTPException(status_code=400, detail="La factura original no tiene número de control")

    fiscal_items = [
        FiscalItem(
            numero_linea=i + 1,
            codigo=item.product_code,
            descripcion=item.description,
            unidad=item.unit_of_measure,
            cantidad=item.quantity,
            precio_unitario=item.unit_price,
            tipo_impuesto=item.tax_type,
        )
        for i, item in enumerate(data.items)
    ]

    fiscal_request = EmitirDocumentoRequest(
        tipo_documento="nota_debito",
        receptor=FiscalReceptor(
            rif=original.receptor_rif,
            razon_social=original.receptor_razon_social,
            direccion=original.receptor_direccion,
        ),
        items=fiscal_items,
        documento_referencia=original.control_number,
        motivo=data.concepto,
        moneda=original.moneda,
    )

    try:
        result = await emitir_documento(
            db=db, client_id=client.id, request=fiscal_request,
            user_id=user.id, ip_address=request.client.host if request.client else None,
        )
    except DocumentEmissionError as e:
        raise HTTPException(status_code=400, detail=e.message)

    await log_audit(
        db, user.id, "create_debit_note", "debit_note", str(result.document_id),
        details=f"NC:{result.numero_control} Ref:{original.control_number}",
        request=request, client_id=client.id,
    )

    return {
        "success": True,
        "document_id": str(result.document_id),
        "numero_control": result.numero_control,
        "total": result.totales.total,
        "factura_referencia": original.control_number,
    }


@router.post("/invoices/{invoice_id}/void")
async def void_invoice(
    invoice_id: uuid.UUID,
    motivo: str = Query(..., description="Motivo de anulación"),
    request: Request = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Anular una factura desde el Portal 2."""
    client = await _get_client(user, db)

    inv_result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.client_id == client.id)
    )
    invoice = inv_result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if invoice.status == "anulado":
        raise HTTPException(status_code=400, detail="La factura ya está anulada")

    invoice.status = "anulado"
    invoice.motivo_anulacion = motivo
    invoice.fecha_anulacion = datetime.now(timezone.utc)

    # Anular número de control si existe
    if invoice.control_number:
        from app.services.fiscal.control_numbers import void_control_number, ControlNumberError
        try:
            await void_control_number(
                db, invoice.control_number, motivo,
                user.id, request.client.host if request and request.client else None,
            )
        except ControlNumberError:
            pass

    await db.flush()

    await log_audit(
        db, user.id, "void_invoice", "invoice", str(invoice.id),
        details=f"NC:{invoice.control_number} Motivo:{motivo}",
        request=request, client_id=client.id,
    )

    return {"message": "Factura anulada exitosamente", "numero_control": invoice.control_number}
