"""Portal 4 - API para Developers: gestión de API keys, documentación, uso."""
import secrets
import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.deps import get_current_user, log_audit
from app.models.security import User, AuditLog
from app.models.api_keys import APIKey
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


# --- Helpers ---

def _hash_key(raw_key: str) -> str:
    """SHA-256 hash of the API key for storage."""
    return hashlib.sha256(raw_key.encode()).hexdigest()


# --- API Key endpoints (DB-backed) ---

@router.get("/api-keys", response_model=list[APIKeyResponse])
async def list_api_keys(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Listar API keys del usuario."""
    result = await db.execute(
        select(APIKey)
        .where(APIKey.user_id == user.id)
        .order_by(APIKey.created_at.desc())
    )
    keys = result.scalars().all()
    return [
        APIKeyResponse(
            id=str(k.id),
            name=k.name,
            key_prefix=k.key_prefix,
            description=k.description,
            created_at=k.created_at.isoformat(),
            last_used=k.last_used_at.isoformat() if k.last_used_at else None,
            is_active=k.is_active,
        )
        for k in keys
    ]


@router.post("/api-keys", response_model=APIKeyCreatedResponse)
async def create_api_key(
    data: APIKeyCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Crear una nueva API key. La clave completa solo se muestra una vez."""
    raw_key = f"aida_{secrets.token_urlsafe(32)}"
    key_prefix = raw_key[:12] + "..."

    api_key = APIKey(
        user_id=user.id,
        name=data.name,
        description=data.description,
        key_hash=_hash_key(raw_key),
        key_prefix=key_prefix,
        is_active=True,
    )
    db.add(api_key)
    await db.flush()

    await log_audit(db, user.id, "create", "api_key", str(api_key.id), request=request)

    return APIKeyCreatedResponse(
        id=str(api_key.id),
        name=data.name,
        key_prefix=key_prefix,
        description=data.description,
        created_at=api_key.created_at.isoformat(),
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
    result = await db.execute(
        select(APIKey).where(APIKey.id == key_id, APIKey.user_id == user.id)
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(status_code=404, detail="API key no encontrada")

    api_key.is_active = False
    api_key.revoked_at = datetime.now(timezone.utc)
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

    action_result = await db.execute(
        select(AuditLog.action, func.count(AuditLog.id))
        .where(AuditLog.user_id == user.id)
        .group_by(AuditLog.action)
    )
    by_action = {row[0]: row[1] for row in action_result.all()}

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


# --- API Key authentication dependency ---

async def authenticate_api_key(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> APIKey:
    """Validates X-API-Key header and returns the associated APIKey record."""
    raw_key = request.headers.get("X-API-Key")
    if not raw_key:
        raise HTTPException(status_code=401, detail="X-API-Key header requerido")

    key_hash = _hash_key(raw_key)
    result = await db.execute(
        select(APIKey).where(APIKey.key_hash == key_hash, APIKey.is_active == True)
    )
    api_key = result.scalar_one_or_none()

    if not api_key:
        raise HTTPException(status_code=401, detail="API key invalida o revocada")

    api_key.last_used_at = datetime.now(timezone.utc)
    api_key.last_used_ip = request.client.host if request.client else None
    api_key.request_count += 1

    return api_key


# --- Documentation endpoints ---

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
    db: AsyncSession = Depends(get_db),
):
    """Información de la cuenta del developer."""
    active_count = (await db.execute(
        select(func.count(APIKey.id)).where(
            APIKey.user_id == user.id, APIKey.is_active == True
        )
    )).scalar() or 0

    total_count = (await db.execute(
        select(func.count(APIKey.id)).where(APIKey.user_id == user.id)
    )).scalar() or 0

    return {
        "user_id": str(user.id),
        "email": user.email,
        "name": f"{user.first_name} {user.last_name}",
        "active_api_keys": active_count,
        "total_api_keys": total_count,
        "plan": "developer",
        "rate_limit": "1000 requests/hour",
    }
