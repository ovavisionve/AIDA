"""API de carga masiva de documentos fiscales via upload de archivos."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.deps import get_current_user, get_client_id_from_token, log_audit
from app.models.security import User
from app.services.sftp.receiver import SFTPDocumentProcessor

router = APIRouter()

MAX_BATCH_FILE_SIZE = 10 * 1024 * 1024  # 10 MB


@router.post("/batch/upload")
async def batch_upload(
    request: Request,
    file: UploadFile = File(...),
    client_id: uuid.UUID | None = Form(None),
    user: User = Depends(get_current_user),
    token_client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """
    Carga masiva de documentos fiscales.

    Sube un archivo CSV, JSON o XML con múltiples documentos.
    El sistema procesa cada fila y emite los documentos individualmente.

    Formatos soportados:
    - CSV: columnas tipo_documento, receptor_rif, receptor_razon_social, receptor_direccion,
           item_1_descripcion, item_1_cantidad, item_1_precio_unitario, etc.
    - JSON: array de objetos con estructura EmitirDocumentoRequest
    - XML: <batch><document>...</document></batch>

    Retorna un resumen con el resultado de cada fila.
    """
    # Determine client_id
    effective_client_id = client_id or token_client_id
    if not effective_client_id:
        raise HTTPException(400, "client_id es requerido (form field o token)")

    # Validate file
    if not file.filename:
        raise HTTPException(400, "Archivo requerido")

    content = await file.read()
    if len(content) > MAX_BATCH_FILE_SIZE:
        raise HTTPException(413, f"Archivo excede el tamaño máximo ({MAX_BATCH_FILE_SIZE // 1024 // 1024} MB)")

    if len(content) == 0:
        raise HTTPException(400, "Archivo vacío")

    # Process
    processor = SFTPDocumentProcessor(db, effective_client_id, user.id)
    summary = await processor.process_file(content, file.filename or "upload")

    await log_audit(
        db, user.id, "batch_upload", "documents",
        details=f"Archivo: {file.filename}, Total: {summary.total_rows}, Éxitos: {summary.success_count}, Errores: {summary.error_count}",
        request=request, client_id=effective_client_id,
    )

    return summary.to_dict()


@router.get("/batch/template/csv")
async def download_csv_template():
    """Descargar plantilla CSV para carga masiva."""
    from fastapi.responses import Response

    header = (
        "tipo_documento,receptor_rif,receptor_razon_social,receptor_direccion,"
        "receptor_telefono,receptor_email,moneda,condicion_pago,observaciones,"
        "item_1_codigo,item_1_descripcion,item_1_cantidad,item_1_precio_unitario,"
        "item_1_tipo_impuesto,item_1_unidad,"
        "item_2_codigo,item_2_descripcion,item_2_cantidad,item_2_precio_unitario,"
        "item_2_tipo_impuesto,item_2_unidad\n"
    )
    example = (
        'factura,J-12345678-9,"Empresa Ejemplo C.A.","Av. Principal, Caracas",'
        '0412-1234567,contacto@ejemplo.com,VES,contado,Primera factura de prueba,'
        'PROD-001,"Servicio de Consultoría",1,100.00,G,UND,'
        'PROD-002,"Mantenimiento Mensual",1,50.00,G,UND\n'
    )

    return Response(
        content=header + example,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=aida_batch_template.csv"},
    )


@router.get("/batch/template/json")
async def download_json_template():
    """Descargar plantilla JSON para carga masiva."""
    import json
    from fastapi.responses import Response

    template = {
        "documents": [
            {
                "tipo_documento": "factura",
                "receptor": {
                    "rif": "J-12345678-9",
                    "razon_social": "Empresa Ejemplo C.A.",
                    "direccion": "Av. Principal, Caracas",
                    "email": "contacto@ejemplo.com",
                },
                "moneda": "VES",
                "condicion_pago": "contado",
                "items": [
                    {
                        "numero_linea": 1,
                        "codigo": "PROD-001",
                        "descripcion": "Servicio de Consultoría",
                        "cantidad": 1,
                        "precio_unitario": 100.00,
                        "tipo_impuesto": "G",
                        "unidad": "UND",
                    },
                ],
            },
        ],
    }

    return Response(
        content=json.dumps(template, indent=2, ensure_ascii=False),
        media_type="application/json",
        headers={"Content-Disposition": "attachment; filename=aida_batch_template.json"},
    )
