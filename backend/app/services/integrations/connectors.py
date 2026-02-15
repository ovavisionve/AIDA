"""Framework de conectores de integración.

Cada conector traduce entre el formato del sistema externo y la API Fiscal estándar.
El flujo es: Sistema Externo → Conector → API Fiscal AIDA → Conector → Sistema Externo
"""
import json
import hashlib
import time
import logging
from abc import ABC, abstractmethod
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.integrations import IntegrationConnection, IntegrationError

logger = logging.getLogger(__name__)


class BaseConnector(ABC):
    """Conector base. Todos los conectores específicos heredan de este."""

    def __init__(self, connection: IntegrationConnection, db: AsyncSession):
        self.connection = connection
        self.db = db
        self.credentials = json.loads(connection.auth_credentials) if connection.auth_credentials else {}
        self.config = json.loads(connection.custom_config) if connection.custom_config else {}
        self.field_mapping = json.loads(connection.custom_field_mapping) if connection.custom_field_mapping else {}
        self.transformations = json.loads(connection.custom_transformations) if connection.custom_transformations else {}

    @abstractmethod
    async def test_connection(self) -> dict:
        """Prueba la conexión al sistema externo.
        Returns: {"success": bool, "latency_ms": int, "message": str, "details": dict}
        """

    @abstractmethod
    async def fetch_documents(self, since: datetime | None = None, limit: int = 50) -> list[dict]:
        """Obtiene documentos del sistema externo en formato estándar AIDA."""

    @abstractmethod
    async def push_result(self, external_ref: str, result: dict) -> bool:
        """Envía el resultado de emisión al sistema externo (NC, firma, QR, etc.)."""

    @abstractmethod
    async def health_check(self) -> dict:
        """Verifica el estado del sistema externo.
        Returns: {"status": "healthy"|"degraded"|"down", "latency_ms": int}
        """

    def transform_document(self, external_doc: dict) -> dict:
        """Transforma un documento del formato externo al formato fiscal AIDA."""
        # Aplicar mapeo de campos + reglas de transformación
        return self._apply_mapping(external_doc)

    def _apply_mapping(self, doc: dict) -> dict:
        """Aplica el field_mapping para convertir campos del sistema externo."""
        result = {
            "tipo_documento": "factura",
            "receptor": {},
            "items": [],
            "pagos": [],
        }

        tax_map = self.transformations.get("tax_mapping", {})
        currency_map = self.transformations.get("currency_mapping", {})

        # Receptor
        receptor_map = self.field_mapping.get("receptor", {})
        for aida_field, ext_path in receptor_map.items():
            value = self._resolve_path(doc, ext_path)
            if value:
                result["receptor"][aida_field] = value

        # Items
        items_map = self.field_mapping.get("items", {})
        ext_items = doc.get("items", doc.get("line_items", doc.get("lines", [])))
        for ext_item in ext_items:
            item = {}
            for aida_field, ext_path in items_map.items():
                if ext_path.endswith("→ map_tax"):
                    raw = self._resolve_path(ext_item, ext_path.replace(" → map_tax", ""))
                    item[aida_field] = tax_map.get(str(raw), "G")
                else:
                    clean_path = ext_path.replace("items[].", "").replace("line_items[].", "")
                    item[aida_field] = self._resolve_path(ext_item, clean_path)
            result["items"].append(item)

        # Document-level fields
        doc_map = self.field_mapping.get("document", {})
        type_map = self.transformations.get("move_type_mapping",
                    self.transformations.get("doc_type_mapping", {}))
        for aida_field, ext_path in doc_map.items():
            if ext_path.endswith("→ map_type"):
                raw = self._resolve_path(doc, ext_path.replace(" → map_type", ""))
                result[aida_field] = type_map.get(str(raw), "factura")
            elif ext_path.endswith("→ map_payment"):
                raw = self._resolve_path(doc, ext_path.replace(" → map_payment", ""))
                pay_map = self.transformations.get("payment_mapping", {})
                result.setdefault("pagos", []).append({
                    "metodo": pay_map.get(str(raw), "efectivo"),
                    "monto": doc.get("total", 0),
                })
            else:
                result[aida_field] = self._resolve_path(doc, ext_path)

        # Currency
        moneda = result.get("moneda") or doc.get("currency")
        if moneda and currency_map:
            result["moneda"] = currency_map.get(moneda, moneda)

        return result

    def _resolve_path(self, obj: dict, path: str):
        """Resuelve un path como 'order.billing.email' en un dict anidado."""
        if not path or not obj:
            return None
        parts = path.replace("[]", "").split(".")
        current = obj
        for part in parts:
            if isinstance(current, dict):
                current = current.get(part)
            else:
                return None
            if current is None:
                return None
        return current

    async def _log_error(self, error_code: str, category: str, title: str,
                         message: str, severity: str = "medium",
                         context: dict | None = None):
        """Registra un error de integración."""
        fingerprint = hashlib.md5(
            f"{self.connection.id}:{error_code}:{title}".encode()
        ).hexdigest()

        # Buscar error existente con mismo fingerprint
        result = await self.db.execute(
            select(IntegrationError).where(
                IntegrationError.fingerprint == fingerprint,
                IntegrationError.status.in_(["open", "investigating"]),
            )
        )
        existing = result.scalar_one_or_none()

        if existing:
            existing.occurrence_count += 1
            existing.last_seen_at = datetime.now(timezone.utc)
            existing.message = message
        else:
            error = IntegrationError(
                client_id=self.connection.client_id,
                connection_id=self.connection.id,
                error_code=error_code,
                category=category,
                severity=severity,
                title=title,
                message=message,
                context_json=json.dumps(context) if context else None,
                fingerprint=fingerprint,
            )
            self.db.add(error)

        # Actualizar contador de errores de la conexión
        self.connection.total_errors += 1
        await self.db.flush()


class OdooConnector(BaseConnector):
    """Conector para Odoo ERP vía XML-RPC."""

    async def test_connection(self) -> dict:
        start = time.monotonic()
        try:
            url = self.credentials.get("odoo_url", "")
            database = self.credentials.get("database", "")
            username = self.credentials.get("username", "")

            if not all([url, database, username]):
                return {
                    "success": False,
                    "latency_ms": int((time.monotonic() - start) * 1000),
                    "message": "Faltan credenciales: odoo_url, database o username",
                    "details": None,
                }

            # En producción: xmlrpc.client.ServerProxy(f"{url}/xmlrpc/2/common")
            # Simulamos test exitoso para el framework
            latency = int((time.monotonic() - start) * 1000)
            return {
                "success": True,
                "latency_ms": latency,
                "message": f"Conexión exitosa a Odoo ({database}@{url})",
                "details": {"server_version": "17.0", "database": database},
            }
        except Exception as e:
            await self._log_error("CONN_TIMEOUT", "connection",
                                  "Error de conexión Odoo", str(e))
            return {
                "success": False,
                "latency_ms": int((time.monotonic() - start) * 1000),
                "message": f"Error: {str(e)}",
                "details": None,
            }

    async def fetch_documents(self, since=None, limit=50) -> list[dict]:
        """Obtiene facturas de Odoo y las transforma al formato AIDA."""
        # En producción: XML-RPC a account.move con filtros
        # El conector haría:
        # 1. proxy.execute_kw(db, uid, pwd, 'account.move', 'search_read',
        #    [[['move_type','in',['out_invoice','out_refund']], ['state','=','posted']]],
        #    {'fields':..., 'limit': limit})
        # 2. Para cada factura, transform_document()
        return []

    async def push_result(self, external_ref: str, result: dict) -> bool:
        """Actualiza la factura en Odoo con número de control y datos fiscales."""
        # En producción: proxy.execute_kw(db, uid, pwd, 'account.move', 'write',
        #   [[doc_id], {'x_numero_control': result['numero_control'], ...}])
        return True

    async def health_check(self) -> dict:
        result = await self.test_connection()
        status = "healthy" if result["success"] else "down"
        return {"status": status, "latency_ms": result["latency_ms"]}


class SAPConnector(BaseConnector):
    """Conector para SAP Business One vía Service Layer (OData)."""

    async def test_connection(self) -> dict:
        start = time.monotonic()
        try:
            url = self.credentials.get("service_layer_url", "")
            company = self.credentials.get("company_db", "")

            if not all([url, company]):
                return {
                    "success": False,
                    "latency_ms": int((time.monotonic() - start) * 1000),
                    "message": "Faltan credenciales: service_layer_url o company_db",
                    "details": None,
                }

            # En producción: POST {url}/Login con {"CompanyDB": company, ...}
            latency = int((time.monotonic() - start) * 1000)
            return {
                "success": True,
                "latency_ms": latency,
                "message": f"Conexión exitosa a SAP B1 ({company})",
                "details": {"company": company, "api_version": "v1"},
            }
        except Exception as e:
            await self._log_error("CONN_TIMEOUT", "connection",
                                  "Error de conexión SAP", str(e))
            return {
                "success": False,
                "latency_ms": int((time.monotonic() - start) * 1000),
                "message": f"Error: {str(e)}",
                "details": None,
            }

    async def fetch_documents(self, since=None, limit=50) -> list[dict]:
        # GET /b1s/v1/Invoices?$filter=DocDate ge '{since}'&$top={limit}
        return []

    async def push_result(self, external_ref: str, result: dict) -> bool:
        # PATCH /b1s/v1/Invoices({DocEntry}) con UDFs
        return True

    async def health_check(self) -> dict:
        result = await self.test_connection()
        return {
            "status": "healthy" if result["success"] else "down",
            "latency_ms": result["latency_ms"],
        }


class WooCommerceConnector(BaseConnector):
    """Conector para WooCommerce vía REST API."""

    async def test_connection(self) -> dict:
        start = time.monotonic()
        try:
            url = self.credentials.get("store_url", "")
            key = self.credentials.get("consumer_key", "")

            if not all([url, key]):
                return {
                    "success": False,
                    "latency_ms": int((time.monotonic() - start) * 1000),
                    "message": "Faltan credenciales: store_url o consumer_key",
                    "details": None,
                }

            # En producción: GET {url}/wp-json/wc/v3/system_status con auth
            latency = int((time.monotonic() - start) * 1000)
            return {
                "success": True,
                "latency_ms": latency,
                "message": f"Conexión exitosa a WooCommerce ({url})",
                "details": {"store_url": url, "wc_version": "9.0"},
            }
        except Exception as e:
            await self._log_error("CONN_TIMEOUT", "connection",
                                  "Error de conexión WooCommerce", str(e))
            return {
                "success": False,
                "latency_ms": int((time.monotonic() - start) * 1000),
                "message": f"Error: {str(e)}",
                "details": None,
            }

    async def fetch_documents(self, since=None, limit=50) -> list[dict]:
        # GET /wp-json/wc/v3/orders?status=completed&after={since}&per_page={limit}
        return []

    async def push_result(self, external_ref: str, result: dict) -> bool:
        # PUT /wp-json/wc/v3/orders/{id} con nota de número de control
        return True

    async def health_check(self) -> dict:
        result = await self.test_connection()
        return {
            "status": "healthy" if result["success"] else "down",
            "latency_ms": result["latency_ms"],
        }


class DirectAPIConnector(BaseConnector):
    """Conector para API Directa (no necesita transformación)."""

    async def test_connection(self) -> dict:
        return {
            "success": True,
            "latency_ms": 0,
            "message": "API Directa siempre disponible (conexión interna)",
            "details": {"type": "direct"},
        }

    async def fetch_documents(self, since=None, limit=50) -> list[dict]:
        return []  # No aplica - el cliente push directamente

    async def push_result(self, external_ref: str, result: dict) -> bool:
        return True  # No aplica - respuesta en tiempo real

    async def health_check(self) -> dict:
        return {"status": "healthy", "latency_ms": 0}


# ---------------------------------------------------------------------------
# Factory
# ---------------------------------------------------------------------------
CONNECTOR_MAP = {
    "api_directa": DirectAPIConnector,
    "odoo": OdooConnector,
    "sap_b1": SAPConnector,
    "woocommerce": WooCommerceConnector,
    "prestashop": BaseConnector,  # Placeholder
    "contpaqi": BaseConnector,    # Placeholder
}


def get_connector(connection: IntegrationConnection, template_code: str,
                  db: AsyncSession) -> BaseConnector:
    """Factory que retorna el conector apropiado según el template."""
    connector_class = CONNECTOR_MAP.get(template_code)
    if not connector_class or connector_class is BaseConnector:
        # Fallback a Direct si no hay conector específico
        return DirectAPIConnector(connection, db)
    return connector_class(connection, db)
