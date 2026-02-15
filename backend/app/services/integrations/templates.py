"""Servicio de templates de integración pre-configurados."""
import json
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.integrations import IntegrationTemplate


# ---------------------------------------------------------------------------
# Templates oficiales pre-configurados
# ---------------------------------------------------------------------------

OFFICIAL_TEMPLATES = [
    {
        "code": "api_directa",
        "name": "API Directa AIDA",
        "description": (
            "Integración directa con la API Fiscal Estándar de AIDA. "
            "Ideal para sistemas propios o desarrollos a medida. "
            "El cliente usa los endpoints /fiscal/* directamente con X-API-Key."
        ),
        "category": "custom",
        "version": "1.0",
        "auth_config": {
            "type": "api_key",
            "fields": [
                {"name": "api_key", "label": "API Key", "type": "text", "required": True},
                {"name": "api_secret", "label": "API Secret", "type": "password", "required": True},
            ],
            "header_name": "X-API-Key",
            "description": "Las credenciales se generan automáticamente al crear el cliente.",
        },
        "field_mapping": {
            "emisor": {"rif": "emisor.rif", "razon_social": "emisor.razon_social"},
            "receptor": {
                "rif": "receptor.rif",
                "razon_social": "receptor.razon_social",
                "direccion": "receptor.direccion",
                "email": "receptor.email",
            },
            "items": {
                "codigo": "items[].codigo",
                "descripcion": "items[].descripcion",
                "cantidad": "items[].cantidad",
                "precio_unitario": "items[].precio_unitario",
                "tipo_impuesto": "items[].tipo_impuesto",
            },
        },
        "endpoint_mapping": {
            "emit": "POST /api/v1/fiscal/emit",
            "void": "POST /api/v1/fiscal/void",
            "query": "GET /api/v1/fiscal/documents",
            "validate": "GET /api/v1/fiscal/validate/{nc}",
            "status": "GET /api/v1/fiscal/status",
        },
        "default_config": {
            "sync_interval": 0,
            "retry_count": 3,
            "batch_size": 1,
            "auto_print": False,
            "notification_email": True,
        },
        "transformation_rules": None,
        "webhook_events": [
            "document.emitted", "document.voided", "control_number.low",
        ],
        "supports_sync": False,
        "supports_webhook": True,
        "supports_batch": False,
        "supports_realtime": True,
    },
    {
        "code": "odoo",
        "name": "Odoo ERP",
        "description": (
            "Integración con Odoo (v14+) vía XML-RPC/JSON-RPC. "
            "Sincroniza facturas emitidas en Odoo con el sistema de impresión fiscal AIDA. "
            "Soporta: facturación, notas de crédito, productos e inventario."
        ),
        "category": "erp",
        "version": "1.0",
        "auth_config": {
            "type": "odoo_xmlrpc",
            "fields": [
                {"name": "odoo_url", "label": "URL Odoo", "type": "url", "required": True,
                 "placeholder": "https://miempresa.odoo.com"},
                {"name": "database", "label": "Base de datos", "type": "text", "required": True},
                {"name": "username", "label": "Usuario", "type": "text", "required": True},
                {"name": "password", "label": "Contraseña/API Key", "type": "password", "required": True},
            ],
            "description": "Usa las credenciales de un usuario Odoo con permisos de facturación.",
        },
        "field_mapping": {
            "emisor": {
                "rif": "res.company.vat",
                "razon_social": "res.company.name",
                "direccion_fiscal": "res.company.street + street2 + city",
            },
            "receptor": {
                "rif": "res.partner.vat",
                "razon_social": "res.partner.name",
                "direccion": "res.partner.street + city",
                "email": "res.partner.email",
                "telefono": "res.partner.phone",
            },
            "items": {
                "codigo": "account.move.line.product_id.default_code",
                "descripcion": "account.move.line.name",
                "cantidad": "account.move.line.quantity",
                "precio_unitario": "account.move.line.price_unit",
                "descuento": "account.move.line.discount",
                "tipo_impuesto": "account.move.line.tax_ids → map_tax",
            },
            "document": {
                "tipo_documento": "account.move.move_type → map_type",
                "numero_referencia": "account.move.name",
                "fecha_emision": "account.move.invoice_date",
                "moneda": "account.move.currency_id.name",
                "observaciones": "account.move.narration",
            },
        },
        "endpoint_mapping": {
            "authenticate": "XML-RPC /xmlrpc/2/common authenticate",
            "list_invoices": "XML-RPC /xmlrpc/2/object execute_kw account.move search_read",
            "get_invoice": "XML-RPC /xmlrpc/2/object execute_kw account.move read",
            "update_invoice": "XML-RPC /xmlrpc/2/object execute_kw account.move write",
            "list_products": "XML-RPC /xmlrpc/2/object execute_kw product.product search_read",
            "list_partners": "XML-RPC /xmlrpc/2/object execute_kw res.partner search_read",
        },
        "default_config": {
            "sync_interval": 300,
            "retry_count": 3,
            "batch_size": 50,
            "auto_emit": True,
            "sync_direction": "odoo_to_aida",
            "invoice_states_to_sync": ["posted"],
            "map_type": {
                "out_invoice": "factura",
                "out_refund": "nota_credito",
            },
            "map_tax": {
                "IVA 16%": "G",
                "IVA 8%": "R",
                "Exento": "E",
                "No sujeto": "NS",
            },
        },
        "transformation_rules": {
            "tax_mapping": {"iva_16": "G", "iva_8": "R", "exento": "E", "no_sujeto": "NS"},
            "currency_mapping": {"VEF": "VES", "USD": "USD", "EUR": "EUR"},
            "move_type_mapping": {
                "out_invoice": "factura",
                "out_refund": "nota_credito",
                "in_invoice": "ignore",
                "in_refund": "ignore",
            },
        },
        "webhook_events": [
            "document.emitted", "document.voided", "sync.completed", "sync.failed",
        ],
        "supports_sync": True,
        "supports_webhook": True,
        "supports_batch": True,
        "supports_realtime": False,
    },
    {
        "code": "sap_b1",
        "name": "SAP Business One",
        "description": (
            "Integración con SAP Business One vía Service Layer (OData). "
            "Sincroniza documentos de venta y recibe números de control fiscal. "
            "Compatible con SAP B1 v10.0+ (HANA y SQL Server)."
        ),
        "category": "erp",
        "version": "1.0",
        "auth_config": {
            "type": "sap_session",
            "fields": [
                {"name": "service_layer_url", "label": "URL Service Layer", "type": "url", "required": True,
                 "placeholder": "https://sap-server:50000/b1s/v1"},
                {"name": "company_db", "label": "Base de datos empresa", "type": "text", "required": True},
                {"name": "username", "label": "Usuario SAP", "type": "text", "required": True},
                {"name": "password", "label": "Contraseña", "type": "password", "required": True},
            ],
            "description": "Requiere usuario SAP con permisos de lectura/escritura en documentos de venta.",
        },
        "field_mapping": {
            "emisor": {
                "rif": "Companies('current').FederalTaxID",
                "razon_social": "Companies('current').CompanyName",
                "direccion_fiscal": "Companies('current').AddressName",
            },
            "receptor": {
                "rif": "BusinessPartners.FederalTaxID",
                "razon_social": "BusinessPartners.CardName",
                "direccion": "BusinessPartners.Address",
                "email": "BusinessPartners.EmailAddress",
            },
            "items": {
                "codigo": "DocumentLines.ItemCode",
                "descripcion": "DocumentLines.ItemDescription",
                "cantidad": "DocumentLines.Quantity",
                "precio_unitario": "DocumentLines.UnitPrice",
                "descuento": "DocumentLines.DiscountPercent",
                "tipo_impuesto": "DocumentLines.TaxCode → map_tax",
            },
            "document": {
                "numero_referencia": "Invoices.DocNum",
                "fecha_emision": "Invoices.DocDate",
                "moneda": "Invoices.DocCurrency",
            },
        },
        "endpoint_mapping": {
            "login": "POST /b1s/v1/Login",
            "list_invoices": "GET /b1s/v1/Invoices?$filter=...",
            "get_invoice": "GET /b1s/v1/Invoices({DocEntry})",
            "update_invoice": "PATCH /b1s/v1/Invoices({DocEntry})",
            "list_credit_notes": "GET /b1s/v1/CreditNotes?$filter=...",
            "list_partners": "GET /b1s/v1/BusinessPartners?$filter=...",
        },
        "default_config": {
            "sync_interval": 600,
            "retry_count": 3,
            "batch_size": 20,
            "auto_emit": True,
            "sync_direction": "sap_to_aida",
            "doc_types_to_sync": ["13", "14"],
            "udf_control_number": "U_NumControl",
            "udf_fiscal_status": "U_EstadoFiscal",
            "map_tax": {
                "IVA_16": "G",
                "IVA_8": "R",
                "EXENTO": "E",
            },
        },
        "transformation_rules": {
            "tax_mapping": {"IVA_16": "G", "IVA_8": "R", "EXENTO": "E", "NOSUJ": "NS"},
            "doc_type_mapping": {"13": "factura", "14": "nota_credito"},
            "currency_mapping": {"VES": "VES", "USD": "USD"},
        },
        "webhook_events": [
            "document.emitted", "document.voided", "sync.completed", "sync.failed",
        ],
        "supports_sync": True,
        "supports_webhook": True,
        "supports_batch": True,
        "supports_realtime": False,
    },
    {
        "code": "woocommerce",
        "name": "WooCommerce",
        "description": (
            "Integración con tiendas WooCommerce vía REST API. "
            "Emite documentos fiscales automáticamente al completar pedidos. "
            "Compatible con WooCommerce 5.0+ y WordPress 5.8+."
        ),
        "category": "ecommerce",
        "version": "1.0",
        "auth_config": {
            "type": "woo_rest",
            "fields": [
                {"name": "store_url", "label": "URL de la tienda", "type": "url", "required": True,
                 "placeholder": "https://mitienda.com"},
                {"name": "consumer_key", "label": "Consumer Key", "type": "text", "required": True},
                {"name": "consumer_secret", "label": "Consumer Secret", "type": "password", "required": True},
            ],
            "description": "Genera las API Keys en WooCommerce → Ajustes → REST API.",
        },
        "field_mapping": {
            "receptor": {
                "rif": "order.meta_data[_billing_rif]",
                "razon_social": "order.billing.company || order.billing.first_name + last_name",
                "direccion": "order.billing.address_1 + address_2 + city + state",
                "email": "order.billing.email",
                "telefono": "order.billing.phone",
            },
            "items": {
                "codigo": "line_items[].sku",
                "descripcion": "line_items[].name",
                "cantidad": "line_items[].quantity",
                "precio_unitario": "line_items[].price",
                "tipo_impuesto": "line_items[].tax_class → map_tax",
            },
            "document": {
                "numero_referencia": "order.number",
                "fecha_emision": "order.date_completed",
                "moneda": "order.currency",
                "forma_pago": "order.payment_method → map_payment",
            },
        },
        "endpoint_mapping": {
            "list_orders": "GET /wp-json/wc/v3/orders?status=completed",
            "get_order": "GET /wp-json/wc/v3/orders/{id}",
            "update_order": "PUT /wp-json/wc/v3/orders/{id}",
            "list_products": "GET /wp-json/wc/v3/products",
            "webhooks": "POST /wp-json/wc/v3/webhooks",
        },
        "default_config": {
            "sync_interval": 120,
            "retry_count": 3,
            "batch_size": 25,
            "auto_emit": True,
            "sync_direction": "woo_to_aida",
            "order_statuses_to_sync": ["completed", "processing"],
            "require_rif": True,
            "rif_meta_key": "_billing_rif",
            "map_tax": {
                "standard": "G",
                "reduced-rate": "R",
                "zero-rate": "E",
            },
            "map_payment": {
                "bacs": "transferencia",
                "cod": "efectivo",
                "ppcp-gateway": "tarjeta_credito",
            },
        },
        "transformation_rules": {
            "tax_mapping": {"standard": "G", "reduced-rate": "R", "zero-rate": "E"},
            "payment_mapping": {
                "bacs": "transferencia",
                "cod": "efectivo",
                "cheque": "cheque",
                "paypal": "tarjeta_credito",
            },
        },
        "webhook_events": [
            "document.emitted", "document.voided", "sync.completed",
        ],
        "supports_sync": True,
        "supports_webhook": True,
        "supports_batch": True,
        "supports_realtime": True,
    },
    {
        "code": "prestashop",
        "name": "PrestaShop",
        "description": (
            "Integración con PrestaShop 1.7+ vía Web Service API. "
            "Facturación automática al confirmar pedidos."
        ),
        "category": "ecommerce",
        "version": "1.0",
        "auth_config": {
            "type": "prestashop_webservice",
            "fields": [
                {"name": "shop_url", "label": "URL de la tienda", "type": "url", "required": True},
                {"name": "api_key", "label": "Web Service Key", "type": "password", "required": True},
            ],
            "description": "Genera la clave en PrestaShop → Parámetros Avanzados → Servicio Web.",
        },
        "field_mapping": {
            "receptor": {
                "rif": "customer.siret (campo personalizado)",
                "razon_social": "customer.company || customer.firstname + lastname",
                "direccion": "address.address1 + address2 + city",
                "email": "customer.email",
            },
            "items": {
                "codigo": "order_detail.product_reference",
                "descripcion": "order_detail.product_name",
                "cantidad": "order_detail.product_quantity",
                "precio_unitario": "order_detail.unit_price_tax_excl",
                "tipo_impuesto": "order_detail.tax_rate → map_tax",
            },
        },
        "endpoint_mapping": {
            "list_orders": "GET /api/orders?filter[current_state]=5",
            "get_order": "GET /api/orders/{id}",
            "list_products": "GET /api/products",
            "list_customers": "GET /api/customers",
        },
        "default_config": {
            "sync_interval": 180,
            "retry_count": 3,
            "batch_size": 30,
            "auto_emit": True,
            "map_tax": {"16.00": "G", "8.00": "R", "0.00": "E"},
        },
        "transformation_rules": {
            "tax_mapping": {"16.00": "G", "8.00": "R", "0.00": "E"},
        },
        "webhook_events": ["document.emitted", "document.voided", "sync.completed"],
        "supports_sync": True,
        "supports_webhook": True,
        "supports_batch": True,
        "supports_realtime": False,
    },
    {
        "code": "contpaqi",
        "name": "CONTPAQi Comercial",
        "description": (
            "Integración con CONTPAQi Comercial Premium vía SDK/API. "
            "Popular en empresas venezolanas que usan CONTPAQi para contabilidad."
        ),
        "category": "contabilidad",
        "version": "1.0",
        "auth_config": {
            "type": "contpaqi_sdk",
            "fields": [
                {"name": "server_host", "label": "Servidor CONTPAQi", "type": "text", "required": True},
                {"name": "database_name", "label": "Nombre empresa", "type": "text", "required": True},
                {"name": "username", "label": "Usuario", "type": "text", "required": True},
                {"name": "password", "label": "Contraseña", "type": "password", "required": True},
            ],
            "description": "Se conecta al servidor de aplicaciones CONTPAQi.",
        },
        "field_mapping": {
            "receptor": {
                "rif": "Clientes.RFC",
                "razon_social": "Clientes.RazonSocial",
                "direccion": "Clientes.Direccion",
            },
            "items": {
                "codigo": "MovimientosDocumento.CodigoProducto",
                "descripcion": "MovimientosDocumento.Descripcion",
                "cantidad": "MovimientosDocumento.Unidades",
                "precio_unitario": "MovimientosDocumento.Precio",
            },
        },
        "endpoint_mapping": {
            "list_documents": "SDK tDocumentoModelo.Consulta",
            "get_document": "SDK tDocumentoModelo.ConsultaPorId",
            "list_clients": "SDK tClienteProveedorModelo.Consulta",
        },
        "default_config": {
            "sync_interval": 600,
            "retry_count": 2,
            "batch_size": 10,
            "auto_emit": False,
            "map_tax": {"1": "G", "2": "R", "0": "E"},
        },
        "transformation_rules": {
            "tax_mapping": {"1": "G", "2": "R", "0": "E"},
        },
        "webhook_events": ["document.emitted", "sync.completed"],
        "supports_sync": True,
        "supports_webhook": False,
        "supports_batch": True,
        "supports_realtime": False,
    },
]


async def seed_templates(db: AsyncSession) -> int:
    """Crea o actualiza todos los templates oficiales."""
    count = 0
    for tpl_data in OFFICIAL_TEMPLATES:
        result = await db.execute(
            select(IntegrationTemplate).where(IntegrationTemplate.code == tpl_data["code"])
        )
        existing = result.scalar_one_or_none()

        values = {
            "code": tpl_data["code"],
            "name": tpl_data["name"],
            "description": tpl_data["description"],
            "category": tpl_data["category"],
            "version": tpl_data["version"],
            "auth_config": json.dumps(tpl_data["auth_config"]),
            "field_mapping": json.dumps(tpl_data["field_mapping"]),
            "endpoint_mapping": json.dumps(tpl_data["endpoint_mapping"]),
            "default_config": json.dumps(tpl_data["default_config"]),
            "transformation_rules": json.dumps(tpl_data["transformation_rules"]) if tpl_data.get("transformation_rules") else None,
            "webhook_events": json.dumps(tpl_data["webhook_events"]) if tpl_data.get("webhook_events") else None,
            "supports_sync": tpl_data.get("supports_sync", True),
            "supports_webhook": tpl_data.get("supports_webhook", True),
            "supports_batch": tpl_data.get("supports_batch", False),
            "supports_realtime": tpl_data.get("supports_realtime", False),
            "is_active": True,
            "is_official": True,
        }

        if existing:
            for k, v in values.items():
                setattr(existing, k, v)
        else:
            db.add(IntegrationTemplate(**values))
            count += 1

    await db.flush()
    return count


async def get_template_detail(db: AsyncSession, template_id) -> dict | None:
    """Obtiene un template con sus campos JSON parseados."""
    result = await db.execute(
        select(IntegrationTemplate).where(IntegrationTemplate.id == template_id)
    )
    tpl = result.scalar_one_or_none()
    if not tpl:
        return None

    return {
        "id": tpl.id,
        "code": tpl.code,
        "name": tpl.name,
        "description": tpl.description,
        "category": tpl.category,
        "version": tpl.version,
        "icon_url": tpl.icon_url,
        "auth_config": json.loads(tpl.auth_config),
        "field_mapping": json.loads(tpl.field_mapping),
        "endpoint_mapping": json.loads(tpl.endpoint_mapping),
        "default_config": json.loads(tpl.default_config),
        "transformation_rules": json.loads(tpl.transformation_rules) if tpl.transformation_rules else None,
        "webhook_events": json.loads(tpl.webhook_events) if tpl.webhook_events else None,
        "supports_sync": tpl.supports_sync,
        "supports_webhook": tpl.supports_webhook,
        "supports_batch": tpl.supports_batch,
        "supports_realtime": tpl.supports_realtime,
        "is_official": tpl.is_official,
    }
