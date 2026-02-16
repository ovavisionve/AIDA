"""
Tests for the SFTP/batch document processor.

Tests CSV, JSON, and XML parsing for mass document uploads.
"""
import json
import pytest
from app.services.sftp.receiver import SFTPDocumentProcessor, BatchSummary


class TestCSVParsing:
    """Tests for CSV file parsing."""

    def _get_processor(self):
        """Create a processor without DB (for parsing tests only)."""
        return SFTPDocumentProcessor(db=None, client_id=None)

    def test_parse_valid_csv(self):
        """Parse a valid CSV with required columns."""
        csv_content = (
            "tipo_documento,receptor_rif,receptor_razon_social,receptor_direccion,"
            "item_1_descripcion,item_1_cantidad,item_1_precio_unitario,item_1_tipo_impuesto\n"
            'factura,J-12345678-9,"Empresa A C.A.","Av. Test 1",Servicio,1,100.00,G\n'
            'factura,J-98765432-1,"Empresa B C.A.","Av. Test 2",Producto,5,20.00,G\n'
        )
        processor = self._get_processor()
        docs = processor._parse_csv(csv_content.encode("utf-8"))

        assert len(docs) == 2
        assert docs[0]["receptor"]["rif"] == "J-12345678-9"
        assert docs[0]["items"][0]["descripcion"] == "Servicio"
        assert docs[0]["items"][0]["cantidad"] == 1.0
        assert docs[0]["items"][0]["precio_unitario"] == 100.00
        assert docs[1]["receptor"]["rif"] == "J-98765432-1"
        assert len(docs[1]["items"]) == 1

    def test_csv_with_multiple_items(self):
        """CSV row with multiple items per document."""
        csv_content = (
            "tipo_documento,receptor_rif,receptor_razon_social,receptor_direccion,"
            "item_1_descripcion,item_1_cantidad,item_1_precio_unitario,item_1_tipo_impuesto,"
            "item_2_descripcion,item_2_cantidad,item_2_precio_unitario,item_2_tipo_impuesto\n"
            'factura,J-11111111-1,"Multi Items C.A.","Dir 1",Item A,2,50.00,G,Item B,3,30.00,R\n'
        )
        processor = self._get_processor()
        docs = processor._parse_csv(csv_content.encode("utf-8"))

        assert len(docs) == 1
        assert len(docs[0]["items"]) == 2
        assert docs[0]["items"][0]["descripcion"] == "Item A"
        assert docs[0]["items"][1]["descripcion"] == "Item B"
        assert docs[0]["items"][1]["tipo_impuesto"] == "R"

    def test_csv_missing_required_columns(self):
        """CSV with missing required columns raises error."""
        csv_content = "tipo_documento,receptor_rif\nfactura,J-12345678-9\n"
        processor = self._get_processor()

        with pytest.raises(ValueError, match="Columnas faltantes"):
            processor._parse_csv(csv_content.encode("utf-8"))

    def test_csv_empty_file(self):
        """Empty CSV raises error."""
        processor = self._get_processor()

        with pytest.raises(ValueError):
            processor._parse_csv(b"")

    def test_csv_bom_handling(self):
        """CSV with UTF-8 BOM is handled correctly."""
        csv_content = (
            "\ufefftipo_documento,receptor_rif,receptor_razon_social,receptor_direccion,"
            "item_1_descripcion,item_1_cantidad,item_1_precio_unitario\n"
            "factura,J-12345678-9,Test,Dir,Item,1,100\n"
        )
        processor = self._get_processor()
        docs = processor._parse_csv(csv_content.encode("utf-8-sig"))

        assert len(docs) == 1

    def test_csv_optional_fields(self):
        """CSV with optional fields like moneda and condicion_pago."""
        csv_content = (
            "tipo_documento,receptor_rif,receptor_razon_social,receptor_direccion,"
            "moneda,condicion_pago,observaciones,"
            "item_1_descripcion,item_1_cantidad,item_1_precio_unitario\n"
            "factura,J-12345678-9,Test,Dir,USD,credito_30,Nota de prueba,Servicio,1,500\n"
        )
        processor = self._get_processor()
        docs = processor._parse_csv(csv_content.encode("utf-8"))

        assert docs[0]["moneda"] == "USD"
        assert docs[0]["condicion_pago"] == "credito_30"
        assert docs[0]["observaciones"] == "Nota de prueba"


class TestJSONParsing:
    """Tests for JSON file parsing."""

    def _get_processor(self):
        return SFTPDocumentProcessor(db=None, client_id=None)

    def test_parse_json_array(self):
        """Parse a JSON array of documents."""
        data = [
            {
                "tipo_documento": "factura",
                "receptor": {
                    "rif": "J-12345678-9",
                    "razon_social": "Empresa A",
                    "direccion": "Dir A",
                },
                "items": [
                    {"numero_linea": 1, "descripcion": "Servicio", "cantidad": 1, "precio_unitario": 100},
                ],
            },
        ]
        processor = self._get_processor()
        docs = processor._parse_json(json.dumps(data).encode("utf-8"))

        assert len(docs) == 1
        assert docs[0]["receptor"]["rif"] == "J-12345678-9"

    def test_parse_json_wrapped(self):
        """Parse JSON with {documents: [...]} wrapper."""
        data = {
            "documents": [
                {
                    "tipo_documento": "factura",
                    "receptor": {"rif": "J-11111111-1", "razon_social": "A", "direccion": "B"},
                    "items": [{"descripcion": "X", "cantidad": 1, "precio_unitario": 50}],
                },
                {
                    "tipo_documento": "factura",
                    "receptor": {"rif": "J-22222222-2", "razon_social": "C", "direccion": "D"},
                    "items": [{"descripcion": "Y", "cantidad": 2, "precio_unitario": 75}],
                },
            ],
        }
        processor = self._get_processor()
        docs = processor._parse_json(json.dumps(data).encode("utf-8"))

        assert len(docs) == 2

    def test_parse_invalid_json(self):
        """Invalid JSON structure raises error."""
        processor = self._get_processor()

        with pytest.raises(ValueError):
            processor._parse_json(json.dumps({"not_documents": "invalid"}).encode("utf-8"))


class TestXMLParsing:
    """Tests for XML file parsing."""

    def _get_processor(self):
        return SFTPDocumentProcessor(db=None, client_id=None)

    def test_parse_valid_xml(self):
        """Parse valid XML batch file."""
        xml = """<?xml version="1.0" encoding="UTF-8"?>
        <batch>
            <document>
                <tipo_documento>factura</tipo_documento>
                <receptor_rif>J-12345678-9</receptor_rif>
                <receptor_razon_social>Empresa XML</receptor_razon_social>
                <receptor_direccion>Dir XML</receptor_direccion>
                <items>
                    <item>
                        <descripcion>Servicio XML</descripcion>
                        <cantidad>1</cantidad>
                        <precio_unitario>200</precio_unitario>
                    </item>
                </items>
            </document>
        </batch>"""

        processor = self._get_processor()
        docs = processor._parse_xml(xml.encode("utf-8"))

        assert len(docs) == 1
        assert docs[0]["tipo_documento"] == "factura"
        assert docs[0]["receptor_rif"] == "J-12345678-9"
        assert len(docs[0]["items"]) == 1
        assert docs[0]["items"][0]["descripcion"] == "Servicio XML"


class TestBatchSummary:
    """Tests for BatchSummary data structure."""

    def test_success_rate_calculation(self):
        """Verify success rate calculation."""
        summary = BatchSummary(total_rows=10, success_count=7, error_count=3)
        assert summary.success_rate == 70.0

    def test_success_rate_zero_rows(self):
        """Success rate is 0 when no rows processed."""
        summary = BatchSummary(total_rows=0)
        assert summary.success_rate == 0.0

    def test_to_dict(self):
        """Verify dictionary serialization."""
        summary = BatchSummary(
            total_rows=2,
            success_count=1,
            error_count=1,
            file_name="test.csv",
            file_format="csv",
        )
        result = summary.to_dict()

        assert result["file_name"] == "test.csv"
        assert result["total_rows"] == 2
        assert result["success_rate"] == 50.0
        assert isinstance(result["results"], list)
