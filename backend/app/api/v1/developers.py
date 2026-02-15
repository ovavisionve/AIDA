"""Portal 4 - API para Developers: gestión de API keys, documentación, uso."""
import uuid
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.deps import get_current_user, log_audit
from app.models.security import User, AuditLog
from pydantic import BaseModel

router = APIRouter()


# --- Schemas ---

class APIKeyCreate(BaseModel):
    name: str
    description: str | None = None


class APIKeyResponse(BaseModel):
    id: str
    name: str
    key_prefix: str
    description: str | None
    created_at: str
    last_used: str | None = None
    is_active: bool = True


class APIKeyCreatedResponse(APIKeyResponse):
    full_key: str


class UsageMetrics(BaseModel):
    total_requests: int
    requests_today: int
    requests_this_month: int
    by_action: dict[str, int]
    by_resource: dict[str, int]


class EndpointDoc(BaseModel):
    method: str
    path: str
    description: str
    auth: str
    request_body: str | None = None
    response: str


# --- In-memory API key store (production would use DB table) ---
_api_keys: dict[str, dict] = {}


@router.get("/api-keys", response_model=list[APIKeyResponse])
async def list_api_keys(
    user: User = Depends(get_current_user),
):
    """Listar API keys del usuario."""
    user_keys = [
        APIKeyResponse(
            id=k["id"],
            name=k["name"],
            key_prefix=k["key_prefix"],
            description=k["description"],
            created_at=k["created_at"],
            last_used=k.get("last_used"),
            is_active=k.get("is_active", True),
        )
        for k in _api_keys.values()
        if k["user_id"] == str(user.id)
    ]
    return user_keys


@router.post("/api-keys", response_model=APIKeyCreatedResponse)
async def create_api_key(
    data: APIKeyCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Crear una nueva API key."""
    raw_key = f"aida_{secrets.token_urlsafe(32)}"
    key_id = str(uuid.uuid4())

    key_data = {
        "id": key_id,
        "user_id": str(user.id),
        "name": data.name,
        "description": data.description,
        "key_prefix": raw_key[:12] + "...",
        "full_key": raw_key,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "is_active": True,
    }
    _api_keys[key_id] = key_data

    await log_audit(db, user.id, "create", "api_key", key_id, request=request)

    return APIKeyCreatedResponse(
        id=key_id,
        name=data.name,
        key_prefix=raw_key[:12] + "...",
        description=data.description,
        created_at=key_data["created_at"],
        is_active=True,
        full_key=raw_key,
    )


@router.delete("/api-keys/{key_id}")
async def revoke_api_key(
    key_id: str,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Revocar una API key."""
    if key_id not in _api_keys:
        raise HTTPException(status_code=404, detail="API key no encontrada")

    key_data = _api_keys[key_id]
    if key_data["user_id"] != str(user.id):
        raise HTTPException(status_code=403, detail="No autorizado")

    key_data["is_active"] = False
    await log_audit(db, user.id, "delete", "api_key", key_id, request=request)

    return {"message": "API key revocada exitosamente"}


@router.get("/usage", response_model=UsageMetrics)
async def get_usage(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obtener métricas de uso de la API."""
    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    total = (await db.execute(
        select(func.count(AuditLog.id)).where(AuditLog.user_id == user.id)
    )).scalar() or 0

    today = (await db.execute(
        select(func.count(AuditLog.id)).where(
            AuditLog.user_id == user.id,
            AuditLog.timestamp >= today_start,
        )
    )).scalar() or 0

    month = (await db.execute(
        select(func.count(AuditLog.id)).where(
            AuditLog.user_id == user.id,
            AuditLog.timestamp >= month_start,
        )
    )).scalar() or 0

    # By action
    action_result = await db.execute(
        select(AuditLog.action, func.count(AuditLog.id))
        .where(AuditLog.user_id == user.id)
        .group_by(AuditLog.action)
    )
    by_action = {row[0]: row[1] for row in action_result.all()}

    # By resource
    resource_result = await db.execute(
        select(AuditLog.resource_type, func.count(AuditLog.id))
        .where(AuditLog.user_id == user.id)
        .group_by(AuditLog.resource_type)
    )
    by_resource = {row[0]: row[1] for row in resource_result.all()}

    return UsageMetrics(
        total_requests=total,
        requests_today=today,
        requests_this_month=month,
        by_action=by_action,
        by_resource=by_resource,
    )


@router.get("/docs/endpoints", response_model=list[EndpointDoc])
async def get_api_docs():
    """Documentación de los endpoints de la API fiscal."""
    return [
        EndpointDoc(
            method="POST",
            path="/api/v1/fiscal/emit",
            description="Emitir una factura, nota de crédito o nota de débito",
            auth="X-API-Key",
            request_body='{"tipo": "factura", "rif_receptor": "J-...", "items": [...]}',
            response='{"numero_control": "00-00000001", "status": "emitida", "uuid": "..."}',
        ),
        EndpointDoc(
            method="POST",
            path="/api/v1/fiscal/void",
            description="Anular un documento fiscal emitido",
            auth="X-API-Key",
            request_body='{"numero_control": "00-00000001", "motivo": "Error en datos"}',
            response='{"status": "anulada", "message": "Documento anulado exitosamente"}',
        ),
        EndpointDoc(
            method="GET",
            path="/api/v1/fiscal/documents",
            description="Listar documentos fiscales con paginación y filtros",
            auth="X-API-Key",
            response='{"items": [...], "total": 100, "page": 1}',
        ),
        EndpointDoc(
            method="GET",
            path="/api/v1/fiscal/validate/{nc}",
            description="Validar un documento fiscal por número de control",
            auth="X-API-Key",
            response='{"valid": true, "document": {...}}',
        ),
        EndpointDoc(
            method="GET",
            path="/api/v1/fiscal/status",
            description="Estado del servicio fiscal y cuota de números de control",
            auth="X-API-Key",
            response='{"status": "active", "nc_available": 500, "nc_used": 150}',
        ),
        EndpointDoc(
            method="GET",
            path="/api/v1/validation/verify/{nc}",
            description="Verificación pública de documento fiscal (sin auth)",
            auth="Ninguna",
            response='{"found": true, "document_type": "factura", ...}',
        ),
    ]


@router.get("/quickstart")
async def get_quickstart():
    """Guía de inicio rápido para integración con la API."""
    return {
        "steps": [
            {
                "step": 1,
                "title": "Obtener API Key",
                "description": "Cree una API Key desde el portal de developers o via POST /api/v1/developers/api-keys",
            },
            {
                "step": 2,
                "title": "Configurar autenticación",
                "description": "Incluya su API Key en el header X-API-Key de cada request",
            },
            {
                "step": 3,
                "title": "Emitir primera factura",
                "description": "Use POST /api/v1/fiscal/emit con los datos de la factura",
            },
            {
                "step": 4,
                "title": "Verificar emisión",
                "description": "Consulte GET /api/v1/fiscal/documents para ver su factura emitida",
            },
        ],
        "code_examples": {
            "curl": 'curl -X POST https://api.aida.com/api/v1/fiscal/emit \\\n  -H "X-API-Key: aida_your_key_here" \\\n  -H "Content-Type: application/json" \\\n  -d \'{"tipo": "factura", "rif_receptor": "J-12345678-9", "items": [{"descripcion": "Servicio", "cantidad": 1, "precio_unitario": 100.00}]}\'',
            "python": 'import requests\n\nAPI_KEY = "aida_your_key_here"\nBASE_URL = "https://api.aida.com/api/v1"\n\nresponse = requests.post(\n    f"{BASE_URL}/fiscal/emit",\n    headers={"X-API-Key": API_KEY},\n    json={\n        "tipo": "factura",\n        "rif_receptor": "J-12345678-9",\n        "items": [{"descripcion": "Servicio", "cantidad": 1, "precio_unitario": 100.00}]\n    }\n)\nprint(response.json())',
            "javascript": 'const response = await fetch("https://api.aida.com/api/v1/fiscal/emit", {\n  method: "POST",\n  headers: {\n    "X-API-Key": "aida_your_key_here",\n    "Content-Type": "application/json"\n  },\n  body: JSON.stringify({\n    tipo: "factura",\n    rif_receptor: "J-12345678-9",\n    items: [{ descripcion: "Servicio", cantidad: 1, precio_unitario: 100.00 }]\n  })\n});\nconst data = await response.json();\nconsole.log(data);',
        },
    }


@router.get("/account")
async def get_developer_account(
    user: User = Depends(get_current_user),
):
    """Información de la cuenta del developer."""
    active_keys = sum(1 for k in _api_keys.values() if k["user_id"] == str(user.id) and k.get("is_active", True))
    total_keys = sum(1 for k in _api_keys.values() if k["user_id"] == str(user.id))

    return {
        "user_id": str(user.id),
        "email": user.email,
        "name": f"{user.first_name} {user.last_name}",
        "active_api_keys": active_keys,
        "total_api_keys": total_keys,
        "plan": "developer",
        "rate_limit": "1000 requests/hour",
    }
