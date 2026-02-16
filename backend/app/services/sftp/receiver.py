"""
SFTP Batch Document Receiver for AIDA.

Processes bulk document uploads via SFTP or HTTP upload.
Supports CSV, JSON, and XML batch formats for mass invoice creation.

Flow:
1. Client uploads file (CSV/JSON/XML) via SFTP or HTTP endpoint
2. System validates file format and content
3. Each document row is queued for emission
4. Results are logged per-row with success/error status
5. Summary report is generated
"""
import csv
import json
import uuid
import io
import structlog
from datetime import datetime, timezone
from dataclasses import dataclass, field

logger = structlog.get_logger()


@dataclass
class BatchResult:
    """Result of processing a single row in a batch."""
    row_number: int
    success: bool
    numero_control: str | None = None
    document_id: str | None = None
    error: str | None = None
    receptor_rif: str | None = None


@dataclass
class BatchSummary:
    """Summary of batch processing."""
    total_rows: int = 0
    success_count: int = 0
    error_count: int = 0
    results: list[BatchResult] = field(default_factory=list)
    started_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    completed_at: datetime | None = None
    file_name: str = ""
    file_format: str = ""

    @property
    def success_rate(self) -> float:
        if self.total_rows == 0:
            return 0.0
        return round(self.success_count / self.total_rows * 100, 1)

    def to_dict(self) -> dict:
        return {
            "file_name": self.file_name,
            "file_format": self.file_format,
            "total_rows": self.total_rows,
            "success_count": self.success_count,
            "error_count": self.error_count,
            "success_rate": self.success_rate,
            "started_at": self.started_at.isoformat(),
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "results": [
                {
                    "row": r.row_number,
                    "success": r.success,
                    "numero_control": r.numero_control,
                    "document_id": r.document_id,
                    "receptor_rif": r.receptor_rif,
                    "error": r.error,
                }
                for r in self.results
            ],
        }


class SFTPDocumentProcessor:
    """Processes batch document files for mass invoice emission."""

    # Required CSV columns
    CSV_REQUIRED_COLUMNS = {
        "tipo_documento", "receptor_rif", "receptor_razon_social",
        "receptor_direccion",
    }
    # Item columns prefix
    ITEM_PREFIX = "item_"

    def __init__(self, db, client_id: uuid.UUID, user_id: uuid.UUID | None = None):
        self.db = db
        self.client_id = client_id
        self.user_id = user_id

    async def process_file(
        self,
        file_content: bytes,
        file_name: str,
        file_format: str = "auto",
    ) -> BatchSummary:
        """
        Process a batch file and emit documents.

        Args:
            file_content: Raw file bytes
            file_name: Original file name
            file_format: csv, json, xml, or auto (detect from extension)
        """
        if file_format == "auto":
            ext = file_name.rsplit(".", 1)[-1].lower() if "." in file_name else ""
            file_format = ext if ext in ("csv", "json", "xml") else "csv"

        summary = BatchSummary(file_name=file_name, file_format=file_format)

        try:
            if file_format == "csv":
                documents = self._parse_csv(file_content)
            elif file_format == "json":
                documents = self._parse_json(file_content)
            elif file_format == "xml":
                documents = self._parse_xml(file_content)
            else:
                summary.error_count = 1
                summary.results.append(BatchResult(
                    row_number=0, success=False,
                    error=f"Formato no soportado: {file_format}",
                ))
                return summary
        except Exception as e:
            summary.error_count = 1
            summary.results.append(BatchResult(
                row_number=0, success=False,
                error=f"Error al parsear archivo: {str(e)}",
            ))
            return summary

        summary.total_rows = len(documents)
        logger.info("batch_processing_start",
                     file=file_name, format=file_format, rows=len(documents))

        for i, doc_data in enumerate(documents, start=1):
            result = await self._emit_single_document(i, doc_data)
            summary.results.append(result)
            if result.success:
                summary.success_count += 1
            else:
                summary.error_count += 1

        summary.completed_at = datetime.now(timezone.utc)
        logger.info("batch_processing_complete",
                     file=file_name, total=summary.total_rows,
                     success=summary.success_count, errors=summary.error_count)

        return summary

    def _parse_csv(self, content: bytes) -> list[dict]:
        """Parse CSV file into list of document dicts."""
        text = content.decode("utf-8-sig")  # Handle BOM
        reader = csv.DictReader(io.StringIO(text))

        if not reader.fieldnames:
            raise ValueError("CSV vacío o sin encabezados")

        # Validate required columns
        cols = set(reader.fieldnames)
        missing = self.CSV_REQUIRED_COLUMNS - cols
        if missing:
            raise ValueError(f"Columnas faltantes: {', '.join(missing)}")

        documents = []
        for row in reader:
            doc = self._csv_row_to_document(row)
            documents.append(doc)

        return documents

    def _parse_json(self, content: bytes) -> list[dict]:
        """Parse JSON file (array of document objects)."""
        data = json.loads(content.decode("utf-8"))
        if isinstance(data, dict) and "documents" in data:
            return data["documents"]
        if isinstance(data, list):
            return data
        raise ValueError("JSON debe ser un array o {\"documents\": [...]}")

    def _parse_xml(self, content: bytes) -> list[dict]:
        """Parse XML batch file."""
        from xml.etree.ElementTree import fromstring

        root = fromstring(content)
        documents = []

        for doc_el in root.findall(".//document"):
            doc = {}
            for child in doc_el:
                if child.tag == "items":
                    items = []
                    for item_el in child.findall("item"):
                        item = {}
                        for item_child in item_el:
                            item[item_child.tag] = item_child.text
                        items.append(item)
                    doc["items"] = items
                else:
                    doc[child.tag] = child.text
            documents.append(doc)

        return documents

    def _csv_row_to_document(self, row: dict) -> dict:
        """Convert a CSV row into a document emission request dict."""
        # Main document fields
        doc = {
            "tipo_documento": row.get("tipo_documento", "factura"),
            "receptor": {
                "rif": row.get("receptor_rif", ""),
                "razon_social": row.get("receptor_razon_social", ""),
                "direccion": row.get("receptor_direccion", ""),
                "telefono": row.get("receptor_telefono"),
                "email": row.get("receptor_email"),
            },
            "moneda": row.get("moneda", "VES"),
            "condicion_pago": row.get("condicion_pago", "contado"),
            "observaciones": row.get("observaciones"),
        }

        if row.get("tasa_cambio"):
            doc["tasa_cambio"] = float(row["tasa_cambio"])

        # Parse items: look for item_1_descripcion, item_1_cantidad, etc.
        items = []
        for i in range(1, 51):  # Support up to 50 items per document
            prefix = f"item_{i}_"
            desc = row.get(f"{prefix}descripcion")
            if not desc:
                break
            item = {
                "numero_linea": i,
                "descripcion": desc,
                "cantidad": float(row.get(f"{prefix}cantidad", 1)),
                "precio_unitario": float(row.get(f"{prefix}precio_unitario", 0)),
                "tipo_impuesto": row.get(f"{prefix}tipo_impuesto", "G"),
                "codigo": row.get(f"{prefix}codigo"),
                "unidad": row.get(f"{prefix}unidad", "UND"),
            }
            if row.get(f"{prefix}descuento_porcentaje"):
                item["descuento_porcentaje"] = float(row[f"{prefix}descuento_porcentaje"])
            items.append(item)

        doc["items"] = items
        return doc

    async def _emit_single_document(self, row_num: int, doc_data: dict) -> BatchResult:
        """Emit a single document from batch data."""
        try:
            # Validate minimum fields
            receptor = doc_data.get("receptor", {})
            if isinstance(receptor, str):
                # JSON might have flat structure
                receptor = {"rif": doc_data.get("receptor_rif", receptor)}

            rif = receptor.get("rif", doc_data.get("receptor_rif", ""))
            if not rif:
                return BatchResult(row_number=row_num, success=False,
                                   error="receptor_rif es requerido")

            items = doc_data.get("items", [])
            if not items:
                return BatchResult(row_number=row_num, success=False,
                                   receptor_rif=rif, error="Al menos un item es requerido")

            # Build emission request
            from app.schemas.fiscal import (
                EmitirDocumentoRequest, FiscalReceptor, FiscalItem, FiscalPago,
            )

            fiscal_items = []
            for item in items:
                fiscal_items.append(FiscalItem(
                    numero_linea=item.get("numero_linea", 1),
                    codigo=item.get("codigo"),
                    descripcion=item.get("descripcion", ""),
                    unidad=item.get("unidad", "UND"),
                    cantidad=float(item.get("cantidad", 1)),
                    precio_unitario=float(item.get("precio_unitario", 0)),
                    descuento_porcentaje=float(item.get("descuento_porcentaje", 0)),
                    descuento_monto=float(item.get("descuento_monto", 0)),
                    tipo_impuesto=item.get("tipo_impuesto", "G"),
                ))

            request = EmitirDocumentoRequest(
                tipo_documento=doc_data.get("tipo_documento", "factura"),
                receptor=FiscalReceptor(
                    rif=rif,
                    razon_social=receptor.get("razon_social", doc_data.get("receptor_razon_social", "")),
                    direccion=receptor.get("direccion", doc_data.get("receptor_direccion", "")),
                    telefono=receptor.get("telefono", doc_data.get("receptor_telefono")),
                    email=receptor.get("email", doc_data.get("receptor_email")),
                ),
                items=fiscal_items,
                moneda=doc_data.get("moneda", "VES"),
                tasa_cambio=doc_data.get("tasa_cambio"),
                condicion_pago=doc_data.get("condicion_pago", "contado"),
                observaciones=doc_data.get("observaciones"),
                pagos=[FiscalPago(forma=doc_data.get("forma_pago", "efectivo"))],
            )

            from app.services.fiscal.document_emitter import emitir_documento
            response = await emitir_documento(
                self.db, self.client_id, request, self.user_id,
            )

            return BatchResult(
                row_number=row_num,
                success=True,
                numero_control=response.numero_control,
                document_id=str(response.document_id),
                receptor_rif=rif,
            )

        except Exception as e:
            logger.error("batch_row_error", row=row_num, error=str(e))
            return BatchResult(
                row_number=row_num,
                success=False,
                receptor_rif=doc_data.get("receptor", {}).get("rif") if isinstance(doc_data.get("receptor"), dict) else doc_data.get("receptor_rif"),
                error=str(e),
            )
