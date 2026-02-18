"""
Portal 2 - Módulo de Facturación.

Este módulo es la interfaz web del facturador. Internamente usa
la misma API Fiscal Estándar, lo que garantiza que los documentos
generados desde la web y desde integración API son idénticos.
"""
import uuid
import math
import logging
import httpx
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func, union_all, literal
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

logger = logging.getLogger(__name__)
router = APIRouter()

# ─── BCV Exchange Rate Cache ───────────────────────────────────────
_bcv_cache: dict = {"rates": None, "fetched_at": None}
BCV_CACHE_TTL = timedelta(minutes=30)


async def _fetch_bcv_rates() -> dict:
    """Fetch BCV exchange rates. Uses cache to avoid excessive requests."""
    now = datetime.now(timezone.utc)

    if (
        _bcv_cache["rates"]
        and _bcv_cache["fetched_at"]
        and now - _bcv_cache["fetched_at"] < BCV_CACHE_TTL
    ):
        return _bcv_cache["rates"]

    try:
        async with httpx.AsyncClient(timeout=10, verify=False) as client:
            resp = await client.get("https://www.bcv.org.ve/")
            html = resp.text

        import re
        rates = {}

        # Parse USD rate
        usd_match = re.search(
            r'id="dolar"[^>]*>.*?<strong>([\d,.]+)</strong>',
            html, re.DOTALL,
        )
        if usd_match:
            rates["USD"] = float(usd_match.group(1).replace(".", "").replace(",", "."))

        # Parse EUR rate
        eur_match = re.search(
            r'id="euro"[^>]*>.*?<strong>([\d,.]+)</strong>',
            html, re.DOTALL,
        )
        if eur_match:
            rates["EUR"] = float(eur_match.group(1).replace(".", "").replace(",", "."))

        # Parse CNY rate
        cny_match = re.search(
            r'id="yuan"[^>]*>.*?<strong>([\d,.]+)</strong>',
            html, re.DOTALL,
        )
        if cny_match:
            rates["CNY"] = float(cny_match.group(1).replace(".", "").replace(",", "."))

        if rates:
            _bcv_cache["rates"] = {
                "rates": rates,
                "source": "BCV",
                "date": now.strftime("%Y-%m-%d"),
                "timestamp": now.isoformat(),
            }
            _bcv_cache["fetched_at"] = now
            return _bcv_cache["rates"]
    except Exception as e:
        logger.warning(f"Error fetching BCV rates: {e}")

    # Return cached data even if stale, or fallback
    if _bcv_cache["rates"]:
        return _bcv_cache["rates"]

    return {
        "rates": {},
        "source": "unavailable",
        "date": now.strftime("%Y-%m-%d"),
        "timestamp": now.isoformat(),
        "error": "No se pudieron obtener las tasas del BCV",
    }


@router.get("/exchange-rates")
async def get_exchange_rates(
    user: User = Depends(get_current_user),
):
    """
    Obtener tasas de cambio oficiales del BCV (Banco Central de Venezuela).

    Retorna tasas USD/VES, EUR/VES actualizadas.
    Se cachean por 30 minutos para evitar exceso de consultas.
    """
    return await _fetch_bcv_rates()


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


@router.get("/documents")
async def list_invoicing_documents(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: str | None = None,
    doc_type: str | None = None,
    status: str | None = None,
    date_from: str | None = None,
    date_to: str | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lista todos los documentos fiscales del cliente (facturas, NC, ND)."""

    client = await _get_client(user, db)

    # Build unified query from invoices, credit notes, and debit notes
    rows = []

    # Invoices
    if not doc_type or doc_type == "factura":
        inv_q = select(
            Invoice.id,
            literal("factura").label("tipo"),
            Invoice.document_number.label("numero"),
            Invoice.control_number,
            Invoice.receptor_rif,
            Invoice.receptor_razon_social,
            Invoice.fecha_emision.label("fecha"),
            Invoice.total,
            Invoice.moneda,
            Invoice.status,
            Invoice.pdf_url,
            Invoice.xml_url,
        ).where(Invoice.client_id == client.id)

        if status:
            inv_q = inv_q.where(Invoice.status == status)
        if search:
            inv_q = inv_q.where(
                func.coalesce(Invoice.control_number, "").ilike(f"%{search}%")
                | Invoice.document_number.ilike(f"%{search}%")
                | Invoice.receptor_rif.ilike(f"%{search}%")
                | Invoice.receptor_razon_social.ilike(f"%{search}%")
            )
        if date_from:
            try:
                d = datetime.strptime(date_from, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                inv_q = inv_q.where(Invoice.fecha_emision >= d)
            except ValueError:
                pass
        if date_to:
            try:
                d = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
                inv_q = inv_q.where(Invoice.fecha_emision <= d)
            except ValueError:
                pass

        rows.append(inv_q)

    # Credit notes
    if not doc_type or doc_type == "nota_credito":
        cn_q = select(
            CreditNote.id,
            literal("nota_credito").label("tipo"),
            CreditNote.document_number.label("numero"),
            CreditNote.control_number,
            CreditNote.receptor_rif,
            CreditNote.receptor_razon_social,
            CreditNote.fecha_emision.label("fecha"),
            CreditNote.total,
            literal("VES").label("moneda"),
            CreditNote.status,
            CreditNote.pdf_url,
            CreditNote.xml_url,
        ).where(CreditNote.client_id == client.id)

        if status:
            cn_q = cn_q.where(CreditNote.status == status)
        if search:
            cn_q = cn_q.where(
                func.coalesce(CreditNote.control_number, "").ilike(f"%{search}%")
                | CreditNote.document_number.ilike(f"%{search}%")
                | CreditNote.receptor_rif.ilike(f"%{search}%")
                | CreditNote.receptor_razon_social.ilike(f"%{search}%")
            )
        if date_from:
            try:
                d = datetime.strptime(date_from, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                cn_q = cn_q.where(CreditNote.fecha_emision >= d)
            except ValueError:
                pass
        if date_to:
            try:
                d = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
                cn_q = cn_q.where(CreditNote.fecha_emision <= d)
            except ValueError:
                pass

        rows.append(cn_q)

    # Debit notes
    if not doc_type or doc_type == "nota_debito":
        dn_q = select(
            DebitNote.id,
            literal("nota_debito").label("tipo"),
            DebitNote.document_number.label("numero"),
            DebitNote.control_number,
            DebitNote.receptor_rif,
            DebitNote.receptor_razon_social,
            DebitNote.fecha_emision.label("fecha"),
            DebitNote.total,
            literal("VES").label("moneda"),
            DebitNote.status,
            DebitNote.pdf_url,
            DebitNote.xml_url,
        ).where(DebitNote.client_id == client.id)

        if status:
            dn_q = dn_q.where(DebitNote.status == status)
        if search:
            dn_q = dn_q.where(
                func.coalesce(DebitNote.control_number, "").ilike(f"%{search}%")
                | DebitNote.document_number.ilike(f"%{search}%")
                | DebitNote.receptor_rif.ilike(f"%{search}%")
                | DebitNote.receptor_razon_social.ilike(f"%{search}%")
            )
        if date_from:
            try:
                d = datetime.strptime(date_from, "%Y-%m-%d").replace(tzinfo=timezone.utc)
                dn_q = dn_q.where(DebitNote.fecha_emision >= d)
            except ValueError:
                pass
        if date_to:
            try:
                d = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
                dn_q = dn_q.where(DebitNote.fecha_emision <= d)
            except ValueError:
                pass

        rows.append(dn_q)

    if not rows:
        return {"items": [], "total": 0, "page": page, "total_pages": 0}

    combined = union_all(*rows).subquery()
    count_q = select(func.count()).select_from(combined)
    total = (await db.execute(count_q)).scalar() or 0
    total_pages = math.ceil(total / per_page) if total > 0 else 0

    final_q = (
        select(combined)
        .order_by(combined.c.fecha.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    result = await db.execute(final_q)

    items = [
        {
            "id": str(row.id),
            "tipo": row.tipo,
            "numero": row.numero,
            "control_number": row.control_number or "",
            "receptor_rif": row.receptor_rif or "",
            "receptor_razon_social": row.receptor_razon_social or "",
            "fecha": row.fecha.strftime("%Y-%m-%d") if row.fecha else "",
            "total": float(row.total) if row.total else 0,
            "moneda": row.moneda or "VES",
            "status": row.status or "",
            "pdf_url": row.pdf_url,
            "xml_url": row.xml_url,
        }
        for row in result.all()
    ]

    return {"items": items, "total": total, "page": page, "total_pages": total_pages}


@router.post("/invoices/{invoice_id}/send-email")
async def send_invoice_email(
    invoice_id: uuid.UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Reenviar factura por email al receptor."""
    client = await _get_client(user, db)
    inv_result = await db.execute(
        select(Invoice).where(Invoice.id == invoice_id, Invoice.client_id == client.id)
    )
    invoice = inv_result.scalar_one_or_none()
    if not invoice:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    if not invoice.receptor_email:
        raise HTTPException(status_code=400, detail="La factura no tiene email de receptor")

    await log_audit(
        db, user.id, "send_email", "invoice", str(invoice.id),
        details=f"NC:{invoice.control_number} Email:{invoice.receptor_email}",
        request=request, client_id=client.id,
    )

    return {"message": "Email enviado", "email": invoice.receptor_email}


@router.get("/reports")
async def generate_report(
    report_type: str = Query(..., description="libro_ventas, libro_compras, iva, islr, ventas_periodo, ventas_vendedor, ventas_cliente"),
    date_from: str = Query(..., description="Fecha inicio YYYY-MM-DD"),
    date_to: str = Query(..., description="Fecha fin YYYY-MM-DD"),
    format: str = Query("json", description="json, excel, csv"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Genera reportes fiscales: libro de ventas, IVA, ISLR, ventas por periodo/vendedor/cliente."""
    from datetime import date as date_type
    from fastapi.responses import StreamingResponse
    import io

    client = await _get_client(user, db)
    try:
        d_from = datetime.strptime(date_from, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        d_to = datetime.strptime(date_to, "%Y-%m-%d").replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
    except ValueError:
        from fastapi import HTTPException as HE
        raise HE(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    base_filter = [
        Invoice.client_id == client.id,
        Invoice.fecha_emision >= d_from,
        Invoice.fecha_emision <= d_to,
        Invoice.status != "anulado",
    ]

    # Fetch invoices for the period
    result = await db.execute(
        select(Invoice).where(*base_filter).order_by(Invoice.fecha_emision)
    )
    invoices = result.scalars().all()

    if report_type == "libro_ventas":
        items = []
        total_base = total_iva = total_total = total_exento = total_igtf = 0.0
        for inv in invoices:
            base_imp = float(inv.base_imponible or 0)
            iva = float(inv.monto_iva_16 or 0) + float(inv.monto_iva_8 or 0)
            exento = float(inv.base_exenta or 0)
            igtf = float(inv.monto_igtf or 0)
            total = float(inv.total or 0)
            total_base += base_imp
            total_iva += iva
            total_total += total
            total_exento += exento
            total_igtf += igtf
            items.append({
                "fecha": inv.fecha_emision.strftime("%Y-%m-%d"),
                "control_number": inv.control_number or "",
                "document_number": inv.document_number,
                "receptor_rif": inv.receptor_rif,
                "receptor": inv.receptor_razon_social,
                "base_imponible": round(base_imp, 2),
                "exento": round(exento, 2),
                "iva": round(iva, 2),
                "igtf": round(igtf, 2),
                "total": round(total, 2),
            })
        report_data = {
            "resumen": {
                "total_documentos": len(invoices),
                "base_imponible": round(total_base, 2),
                "total_exento": round(total_exento, 2),
                "total_iva": round(total_iva, 2),
                "total_igtf": round(total_igtf, 2),
                "total_general": round(total_total, 2),
            },
            "items": items,
        }

    elif report_type == "iva":
        debito_fiscal = sum(float(inv.monto_iva_16 or 0) + float(inv.monto_iva_8 or 0) for inv in invoices)
        report_data = {
            "resumen": {
                "periodo": f"{date_from} a {date_to}",
                "total_ventas": round(sum(float(inv.total or 0) for inv in invoices), 2),
                "base_imponible_16": round(sum(float(inv.base_imponible or 0) for inv in invoices), 2),
                "debito_fiscal_16": round(sum(float(inv.monto_iva_16 or 0) for inv in invoices), 2),
                "debito_fiscal_8": round(sum(float(inv.monto_iva_8 or 0) for inv in invoices), 2),
                "debito_fiscal_total": round(debito_fiscal, 2),
                "total_exento": round(sum(float(inv.base_exenta or 0) for inv in invoices), 2),
                "documentos_emitidos": len(invoices),
            },
            "items": [
                {
                    "fecha": inv.fecha_emision.strftime("%Y-%m-%d"),
                    "control_number": inv.control_number or "",
                    "receptor": inv.receptor_razon_social,
                    "base_imponible": round(float(inv.base_imponible or 0), 2),
                    "iva": round(float(inv.monto_iva_16 or 0) + float(inv.monto_iva_8 or 0), 2),
                    "total": round(float(inv.total or 0), 2),
                }
                for inv in invoices
            ],
        }

    elif report_type == "islr":
        report_data = {
            "resumen": {
                "periodo": f"{date_from} a {date_to}",
                "documentos_sujetos_retencion": 0,
                "total_retenido": 0.0,
                "nota": "Las retenciones ISLR se calculan sobre pagos a personas naturales y jurídicas según Art. 87 LISLR",
            },
            "items": [],
        }

    elif report_type == "ventas_periodo":
        # Group by day
        daily: dict[str, dict] = {}
        for inv in invoices:
            day = inv.fecha_emision.strftime("%Y-%m-%d")
            if day not in daily:
                daily[day] = {"fecha": day, "documentos": 0, "total": 0.0}
            daily[day]["documentos"] += 1
            daily[day]["total"] += float(inv.total or 0)

        items = sorted(daily.values(), key=lambda x: x["fecha"])
        for item in items:
            item["total"] = round(item["total"], 2)
        report_data = {
            "resumen": {
                "total_documentos": len(invoices),
                "total_ventas": round(sum(float(inv.total or 0) for inv in invoices), 2),
                "promedio_diario": round(sum(float(inv.total or 0) for inv in invoices) / max(len(daily), 1), 2),
                "dias_con_ventas": len(daily),
            },
            "items": items,
        }

    elif report_type == "ventas_vendedor":
        by_user: dict[str, dict] = {}
        for inv in invoices:
            uid = str(inv.created_by_user_id or "sin-asignar")
            if uid not in by_user:
                by_user[uid] = {"vendedor": uid, "documentos": 0, "total": 0.0}
            by_user[uid]["documentos"] += 1
            by_user[uid]["total"] += float(inv.total or 0)

        items = sorted(by_user.values(), key=lambda x: x["total"], reverse=True)
        for item in items:
            item["total"] = round(item["total"], 2)
        report_data = {
            "resumen": {
                "total_vendedores": len(by_user),
                "total_ventas": round(sum(float(inv.total or 0) for inv in invoices), 2),
            },
            "items": items,
        }

    elif report_type == "ventas_cliente":
        by_client: dict[str, dict] = {}
        for inv in invoices:
            key = inv.receptor_rif or "desconocido"
            if key not in by_client:
                by_client[key] = {"receptor_rif": key, "receptor": inv.receptor_razon_social, "documentos": 0, "total": 0.0}
            by_client[key]["documentos"] += 1
            by_client[key]["total"] += float(inv.total or 0)

        items = sorted(by_client.values(), key=lambda x: x["total"], reverse=True)
        for item in items:
            item["total"] = round(item["total"], 2)
        report_data = {
            "resumen": {
                "total_clientes": len(by_client),
                "total_ventas": round(sum(float(inv.total or 0) for inv in invoices), 2),
            },
            "items": items,
        }

    else:
        report_data = {"resumen": {}, "items": []}

    # Return based on format
    if format == "json":
        return report_data

    elif format == "csv":
        import csv
        buf = io.StringIO()
        items = report_data.get("items", [])
        if items:
            writer = csv.DictWriter(buf, fieldnames=items[0].keys())
            writer.writeheader()
            writer.writerows(items)
        content = buf.getvalue().encode("utf-8")
        return StreamingResponse(
            io.BytesIO(content),
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="reporte_{report_type}_{date_from}_{date_to}.csv"'},
        )

    elif format == "excel":
        try:
            from openpyxl import Workbook
            wb = Workbook()
            ws = wb.active
            ws.title = report_type

            items = report_data.get("items", [])
            if items:
                headers = list(items[0].keys())
                ws.append(headers)
                for item in items:
                    ws.append([item.get(h, "") for h in headers])

            buf = io.BytesIO()
            wb.save(buf)
            buf.seek(0)
            return StreamingResponse(
                buf,
                media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                headers={"Content-Disposition": f'attachment; filename="reporte_{report_type}_{date_from}_{date_to}.xlsx"'},
            )
        except ImportError:
            return report_data

    return report_data
