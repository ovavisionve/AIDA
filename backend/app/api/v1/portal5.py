"""
Portal 5 - Gestión Avanzada de Integraciones.

Incluye:
- Dashboard de monitoreo en tiempo real
- Wizard de integración paso a paso
- Gestión de conexiones y templates
- Sistema de webhooks
- Gestión de errores
- Health checks y alertas
- Proyectos de integración
"""
import json
import uuid
import secrets
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.deps import get_current_user, require_permissions, log_audit
from app.core.permissions import (
    P5_PROJECTS_VIEW, P5_PROJECTS_CREATE, P5_PROJECTS_EDIT,
    P5_MONITORING_VIEW, P5_APIS_MANAGE, P5_ERRORS_MANAGE,
)
from app.models.security import User
from app.models.clients import Client
from app.models.projects import Project, ProjectLog
from app.models.integrations import (
    IntegrationTemplate, IntegrationConnection,
    Webhook, WebhookLog, IntegrationError, MonitoringMetric,
)
from app.schemas.integrations import (
    ConnectionResponse, ConnectionListResponse,
    WizardStep1_SelectTemplate, WizardStep2_Credentials,
    WizardStep3_FieldMapping, WizardStep4_WebhookConfig,
    WizardStep5_SyncConfig, WizardStep6_Test,
    WebhookCreate, WebhookUpdate,
    WebhookTestRequest,
    ErrorResolveRequest, ErrorRetryRequest,
    HealthOverviewResponse,
    WEBHOOK_EVENTS,
)
from app.services.integrations.templates import seed_templates, get_template_detail
from app.services.integrations.connectors import get_connector
from app.services.integrations.webhooks import test_webhook
from app.services.integrations.monitoring import (
    get_monitoring_dashboard, get_clients_health, run_health_checks,
)
from app.services.integrations.errors import (
    list_errors, resolve_error, bulk_resolve, retry_error, get_error_stats,
)
from app.services.fiscal.control_numbers import get_available_count
from pydantic import BaseModel

router = APIRouter()


# ===================================================================
# SCHEMAS (proyectos)
# ===================================================================
class ProjectCreate(BaseModel):
    client_id: uuid.UUID
    name: str
    description: str | None = None
    integration_type: str = "api_directa"
    priority: str = "media"
    system_url: str | None = None
    auth_type: str | None = None
    config_json: str | None = None
    notas_internas: str | None = None


class ProjectUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    status: str | None = None
    progress: int | None = None
    priority: str | None = None
    system_url: str | None = None
    auth_type: str | None = None
    environment: str | None = None
    config_json: str | None = None
    notas_internas: str | None = None


class ProjectResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    name: str
    description: str | None
    integration_type: str
    status: str
    progress: int
    priority: str
    system_url: str | None
    environment: str
    fecha_inicio: datetime | None
    fecha_estimada_fin: datetime | None
    fecha_produccion: datetime | None
    created_at: datetime
    updated_at: datetime
    model_config = {"from_attributes": True}


class ProjectListResponse(BaseModel):
    items: list[ProjectResponse]
    total: int
    page: int
    page_size: int


class ConnectionUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    environment: str | None = None
    system_base_url: str | None = None
    callback_url: str | None = None
    sync_enabled: bool | None = None
    sync_interval_seconds: int | None = None


# ===================================================================
# 1. DASHBOARD DE MONITOREO
# ===================================================================

@router.get("/dashboard")
async def monitoring_dashboard(
    user: User = require_permissions(P5_MONITORING_VIEW),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard principal de monitoreo con métricas en tiempo real."""
    return await get_monitoring_dashboard(db)


@router.get("/health/clients")
async def clients_health_overview(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = require_permissions(P5_MONITORING_VIEW),
    db: AsyncSession = Depends(get_db),
):
    """Estado de salud de todos los clientes."""
    return await get_clients_health(db, skip, limit)


@router.post("/health/check")
async def trigger_health_checks(
    user: User = require_permissions(P5_MONITORING_VIEW),
    db: AsyncSession = Depends(get_db),
):
    """Ejecuta health checks en todas las conexiones activas."""
    result = await run_health_checks(db)
    await db.commit()
    return result


# ===================================================================
# 2. TEMPLATES DE INTEGRACIÓN
# ===================================================================

@router.get("/templates")
async def list_templates(
    category: str | None = None,
    user: User = require_permissions(P5_PROJECTS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    """Lista todos los templates de integración disponibles."""
    query = select(IntegrationTemplate).where(IntegrationTemplate.is_active == True)
    if category:
        query = query.where(IntegrationTemplate.category == category)
    query = query.order_by(IntegrationTemplate.name)

    result = await db.execute(query)
    templates = result.scalars().all()

    return [
        {
            "id": t.id,
            "code": t.code,
            "name": t.name,
            "description": t.description,
            "category": t.category,
            "version": t.version,
            "icon_url": t.icon_url,
            "supports_sync": t.supports_sync,
            "supports_webhook": t.supports_webhook,
            "supports_batch": t.supports_batch,
            "supports_realtime": t.supports_realtime,
            "is_official": t.is_official,
        }
        for t in templates
    ]


@router.get("/templates/{template_id}")
async def get_template(
    template_id: uuid.UUID,
    user: User = require_permissions(P5_PROJECTS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    """Detalle de un template con toda su configuración."""
    detail = await get_template_detail(db, template_id)
    if not detail:
        raise HTTPException(status_code=404, detail="Template no encontrado")
    return detail


@router.post("/templates/seed")
async def seed_all_templates(
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Carga/actualiza todos los templates oficiales."""
    count = await seed_templates(db)
    await db.commit()
    return {"message": f"{count} templates creados/actualizados", "status": "ok"}


# ===================================================================
# 3. WIZARD DE INTEGRACIÓN (paso a paso)
# ===================================================================

@router.post("/wizard/start")
async def wizard_start(
    data: WizardStep1_SelectTemplate,
    request: Request,
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Paso 1: Seleccionar template y crear conexión en modo configuración."""
    tpl_q = await db.execute(
        select(IntegrationTemplate).where(IntegrationTemplate.id == data.template_id)
    )
    template = tpl_q.scalar_one_or_none()
    if not template:
        raise HTTPException(status_code=404, detail="Template no encontrado")

    # Determinar client_id desde el proyecto
    client_id = None
    if data.project_id:
        proj_q = await db.execute(
            select(Project).where(Project.id == data.project_id)
        )
        project = proj_q.scalar_one_or_none()
        if project:
            client_id = project.client_id

    if not client_id:
        raise HTTPException(status_code=400, detail="Se requiere project_id con cliente asignado")

    connection = IntegrationConnection(
        client_id=client_id,
        project_id=data.project_id,
        template_id=template.id,
        name=data.name,
        status="configurando",
        environment=data.environment,
        wizard_step=1,
        custom_field_mapping=template.field_mapping,
        custom_config=template.default_config,
        custom_transformations=template.transformation_rules,
    )
    db.add(connection)
    await db.flush()
    await db.refresh(connection)

    await log_audit(db, user.id, "wizard_start", "connection",
                    str(connection.id), request=request)
    await db.commit()

    return {
        "connection_id": connection.id,
        "wizard_step": 1,
        "template": {
            "code": template.code,
            "name": template.name,
            "auth_config": json.loads(template.auth_config),
        },
        "message": "Conexión creada. Continúe al paso 2: configurar credenciales.",
    }


@router.put("/wizard/{connection_id}/credentials")
async def wizard_credentials(
    connection_id: uuid.UUID,
    data: WizardStep2_Credentials,
    request: Request,
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Paso 2: Configurar credenciales de conexión al sistema externo."""
    conn = await _get_connection(db, connection_id)

    conn.system_base_url = data.system_base_url
    conn.auth_credentials = json.dumps(data.credentials)
    conn.wizard_step = 2

    await db.flush()
    await log_audit(db, user.id, "wizard_credentials", "connection",
                    str(connection_id), request=request)
    await db.commit()

    return {
        "connection_id": connection_id,
        "wizard_step": 2,
        "message": "Credenciales guardadas. Continúe al paso 3: mapeo de campos.",
        "current_mapping": json.loads(conn.custom_field_mapping) if conn.custom_field_mapping else {},
    }


@router.put("/wizard/{connection_id}/mapping")
async def wizard_mapping(
    connection_id: uuid.UUID,
    data: WizardStep3_FieldMapping,
    request: Request,
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Paso 3: Personalizar mapeo de campos."""
    conn = await _get_connection(db, connection_id)

    conn.custom_field_mapping = json.dumps(data.field_mapping)
    if data.transformation_rules:
        conn.custom_transformations = json.dumps(data.transformation_rules)
    conn.wizard_step = 3

    await db.flush()
    await log_audit(db, user.id, "wizard_mapping", "connection",
                    str(connection_id), request=request)
    await db.commit()

    return {
        "connection_id": connection_id,
        "wizard_step": 3,
        "message": "Mapeo guardado. Continúe al paso 4: configurar webhooks.",
    }


@router.put("/wizard/{connection_id}/webhooks")
async def wizard_webhooks(
    connection_id: uuid.UUID,
    data: WizardStep4_WebhookConfig,
    request: Request,
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Paso 4: Configurar webhooks de notificación."""
    conn = await _get_connection(db, connection_id)

    if data.callback_url:
        conn.callback_url = data.callback_url

    for wh_data in data.webhooks:
        webhook = Webhook(
            client_id=conn.client_id,
            connection_id=connection_id,
            name=wh_data.name,
            url=wh_data.url,
            secret=wh_data.secret or secrets.token_hex(32),
            events=json.dumps(wh_data.events),
            headers=json.dumps(wh_data.headers) if wh_data.headers else None,
            retry_count=wh_data.retry_count,
            timeout_seconds=wh_data.timeout_seconds,
        )
        db.add(webhook)

    conn.wizard_step = 4
    await db.flush()
    await log_audit(db, user.id, "wizard_webhooks", "connection",
                    str(connection_id), request=request)
    await db.commit()

    return {
        "connection_id": connection_id,
        "wizard_step": 4,
        "webhooks_created": len(data.webhooks),
        "message": "Webhooks configurados. Continúe al paso 5: sincronización.",
    }


@router.put("/wizard/{connection_id}/sync")
async def wizard_sync(
    connection_id: uuid.UUID,
    data: WizardStep5_SyncConfig,
    request: Request,
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Paso 5: Configurar sincronización automática."""
    conn = await _get_connection(db, connection_id)

    conn.sync_enabled = data.sync_enabled
    conn.sync_interval_seconds = data.sync_interval_seconds
    conn.wizard_step = 5

    await db.flush()
    await log_audit(db, user.id, "wizard_sync", "connection",
                    str(connection_id), request=request)
    await db.commit()

    return {
        "connection_id": connection_id,
        "wizard_step": 5,
        "message": "Sincronización configurada. Continúe al paso 6: test y activación.",
    }


@router.post("/wizard/{connection_id}/test")
async def wizard_test_and_activate(
    connection_id: uuid.UUID,
    data: WizardStep6_Test,
    request: Request,
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Paso 6: Probar conexión y opcionalmente activar."""
    conn = await _get_connection(db, connection_id)

    tpl_q = await db.execute(
        select(IntegrationTemplate.code).where(IntegrationTemplate.id == conn.template_id)
    )
    tpl_code = tpl_q.scalar_one_or_none() or "api_directa"

    connector = get_connector(conn, tpl_code, db)
    test_result = await connector.test_connection()

    conn.wizard_step = 6

    if test_result["success"] and data.activate:
        conn.status = "activa"
        conn.health_status = "healthy"
        conn.wizard_completed = True
        conn.activated_at = datetime.now(timezone.utc)
        conn.environment = "production"

        if conn.project_id:
            db.add(ProjectLog(
                project_id=conn.project_id, level="INFO",
                message=f"Conexión '{conn.name}' activada en producción",
                user_id=user.id,
            ))

    elif test_result["success"]:
        conn.status = "testing"
        conn.health_status = "healthy"
        conn.wizard_completed = True

    await db.flush()
    await log_audit(db, user.id, "wizard_test", "connection",
                    str(connection_id),
                    details=f"Test: {test_result['success']}, Activate: {data.activate}",
                    request=request)
    await db.commit()

    return {
        "connection_id": connection_id,
        "wizard_step": 6,
        "test_result": test_result,
        "status": conn.status,
        "wizard_completed": conn.wizard_completed,
        "message": (
            "Conexión activada en producción." if conn.status == "activa"
            else "Test exitoso. Conexión en modo testing." if test_result["success"]
            else "Test falló. Revise las credenciales y vuelva a intentar."
        ),
    }


# ===================================================================
# 4. GESTIÓN DE CONEXIONES
# ===================================================================

@router.get("/connections")
async def list_connections(
    client_id: uuid.UUID | None = None,
    status: str | None = None,
    environment: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = require_permissions(P5_PROJECTS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    """Lista todas las conexiones de integración."""
    query = select(IntegrationConnection)
    conditions = []
    if client_id:
        conditions.append(IntegrationConnection.client_id == client_id)
    if status:
        conditions.append(IntegrationConnection.status == status)
    if environment:
        conditions.append(IntegrationConnection.environment == environment)
    if conditions:
        query = query.where(and_(*conditions))

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    result = await db.execute(
        query.order_by(IntegrationConnection.created_at.desc())
        .offset(skip).limit(limit)
    )
    connections = result.scalars().all()

    items = []
    for c in connections:
        tpl_q = await db.execute(
            select(IntegrationTemplate.code, IntegrationTemplate.name)
            .where(IntegrationTemplate.id == c.template_id)
        )
        tpl_row = tpl_q.one_or_none()

        items.append({
            "id": c.id,
            "client_id": c.client_id,
            "project_id": c.project_id,
            "template_id": c.template_id,
            "template_code": tpl_row[0] if tpl_row else None,
            "template_name": tpl_row[1] if tpl_row else None,
            "name": c.name,
            "status": c.status,
            "environment": c.environment,
            "system_base_url": c.system_base_url,
            "sync_enabled": c.sync_enabled,
            "health_status": c.health_status,
            "consecutive_failures": c.consecutive_failures,
            "total_documents_synced": c.total_documents_synced,
            "total_errors": c.total_errors,
            "wizard_step": c.wizard_step,
            "wizard_completed": c.wizard_completed,
            "activated_at": c.activated_at,
            "created_at": c.created_at,
        })

    return {"items": items, "total": total}


@router.get("/connections/{connection_id}")
async def get_connection_detail(
    connection_id: uuid.UUID,
    user: User = require_permissions(P5_PROJECTS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    """Detalle completo de una conexión con webhooks y errores recientes."""
    conn = await _get_connection(db, connection_id)

    tpl_q = await db.execute(
        select(IntegrationTemplate).where(IntegrationTemplate.id == conn.template_id)
    )
    template = tpl_q.scalar_one_or_none()

    wh_q = await db.execute(
        select(Webhook).where(Webhook.connection_id == connection_id)
    )
    webhooks = wh_q.scalars().all()

    err_q = await db.execute(
        select(IntegrationError).where(
            IntegrationError.connection_id == connection_id
        ).order_by(IntegrationError.last_seen_at.desc()).limit(10)
    )
    recent_errors = err_q.scalars().all()

    return {
        "id": conn.id,
        "client_id": conn.client_id,
        "name": conn.name,
        "status": conn.status,
        "environment": conn.environment,
        "system_base_url": conn.system_base_url,
        "sync_enabled": conn.sync_enabled,
        "sync_interval_seconds": conn.sync_interval_seconds,
        "last_sync_at": conn.last_sync_at,
        "health_status": conn.health_status,
        "consecutive_failures": conn.consecutive_failures,
        "total_documents_synced": conn.total_documents_synced,
        "total_errors": conn.total_errors,
        "wizard_step": conn.wizard_step,
        "wizard_completed": conn.wizard_completed,
        "activated_at": conn.activated_at,
        "created_at": conn.created_at,
        "template": {
            "code": template.code if template else None,
            "name": template.name if template else None,
            "category": template.category if template else None,
        },
        "field_mapping": json.loads(conn.custom_field_mapping) if conn.custom_field_mapping else None,
        "config": json.loads(conn.custom_config) if conn.custom_config else None,
        "webhooks": [
            {
                "id": w.id, "name": w.name, "url": w.url,
                "events": json.loads(w.events) if w.events else [],
                "is_active": w.is_active, "total_sent": w.total_sent,
                "last_status_code": w.last_status_code,
            }
            for w in webhooks
        ],
        "recent_errors": [
            {
                "id": e.id, "error_code": e.error_code, "severity": e.severity,
                "title": e.title, "status": e.status,
                "occurrence_count": e.occurrence_count, "last_seen_at": e.last_seen_at,
            }
            for e in recent_errors
        ],
    }


@router.put("/connections/{connection_id}")
async def update_connection(
    connection_id: uuid.UUID,
    data: ConnectionUpdate,
    request: Request,
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Actualizar configuración de una conexión."""
    conn = await _get_connection(db, connection_id)
    changes = data.model_dump(exclude_unset=True)

    old_status = conn.status
    for field, value in changes.items():
        setattr(conn, field, value)

    if "status" in changes and changes["status"] == "activa" and old_status != "activa":
        conn.activated_at = datetime.now(timezone.utc)
    elif "status" in changes and changes["status"] == "desactivada":
        conn.deactivated_at = datetime.now(timezone.utc)

    await db.flush()
    await log_audit(db, user.id, "update", "connection",
                    str(connection_id), details=str(changes), request=request)
    await db.commit()
    return {"message": "Conexión actualizada", "status": conn.status}


@router.post("/connections/{connection_id}/test")
async def test_connection(
    connection_id: uuid.UUID,
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Prueba la conectividad de una conexión existente."""
    conn = await _get_connection(db, connection_id)

    tpl_q = await db.execute(
        select(IntegrationTemplate.code).where(IntegrationTemplate.id == conn.template_id)
    )
    tpl_code = tpl_q.scalar_one_or_none() or "api_directa"

    connector = get_connector(conn, tpl_code, db)
    result = await connector.test_connection()

    conn.last_health_check = datetime.now(timezone.utc)
    conn.health_status = "healthy" if result["success"] else "down"
    if result["success"]:
        conn.consecutive_failures = 0
    else:
        conn.consecutive_failures += 1

    await db.commit()
    return result


# ===================================================================
# 5. WEBHOOKS
# ===================================================================

@router.get("/webhooks")
async def list_webhooks(
    client_id: uuid.UUID | None = None,
    connection_id: uuid.UUID | None = None,
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Lista webhooks configurados."""
    query = select(Webhook)
    if client_id:
        query = query.where(Webhook.client_id == client_id)
    if connection_id:
        query = query.where(Webhook.connection_id == connection_id)
    query = query.order_by(Webhook.created_at.desc())

    result = await db.execute(query)
    webhooks = result.scalars().all()

    return [
        {
            "id": w.id, "client_id": w.client_id, "connection_id": w.connection_id,
            "name": w.name, "url": w.url,
            "events": json.loads(w.events) if w.events else [],
            "is_active": w.is_active, "retry_count": w.retry_count,
            "total_sent": w.total_sent, "total_failed": w.total_failed,
            "last_triggered_at": w.last_triggered_at,
            "last_status_code": w.last_status_code,
            "last_error": w.last_error, "created_at": w.created_at,
        }
        for w in webhooks
    ]


@router.post("/webhooks", status_code=201)
async def create_webhook(
    data: WebhookCreate,
    request: Request,
    client_id: uuid.UUID = Query(...),
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Crea un nuevo webhook."""
    webhook = Webhook(
        client_id=client_id,
        connection_id=data.connection_id,
        name=data.name,
        url=data.url,
        secret=data.secret or secrets.token_hex(32),
        events=json.dumps(data.events),
        headers=json.dumps(data.headers) if data.headers else None,
        retry_count=data.retry_count,
        timeout_seconds=data.timeout_seconds,
    )
    db.add(webhook)
    await db.flush()
    await db.refresh(webhook)

    await log_audit(db, user.id, "create", "webhook", str(webhook.id), request=request)
    await db.commit()

    return {
        "id": webhook.id, "name": webhook.name, "url": webhook.url,
        "secret": webhook.secret, "events": data.events,
        "message": "Webhook creado exitosamente",
    }


@router.put("/webhooks/{webhook_id}")
async def update_webhook(
    webhook_id: uuid.UUID,
    data: WebhookUpdate,
    request: Request,
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Actualiza un webhook."""
    result = await db.execute(select(Webhook).where(Webhook.id == webhook_id))
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook no encontrado")

    changes = data.model_dump(exclude_unset=True)
    for field, value in changes.items():
        if field == "events":
            setattr(webhook, field, json.dumps(value))
        elif field == "headers":
            setattr(webhook, field, json.dumps(value) if value else None)
        else:
            setattr(webhook, field, value)

    await db.flush()
    await log_audit(db, user.id, "update", "webhook", str(webhook_id), request=request)
    await db.commit()
    return {"message": "Webhook actualizado"}


@router.delete("/webhooks/{webhook_id}")
async def delete_webhook(
    webhook_id: uuid.UUID,
    request: Request,
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Elimina un webhook."""
    result = await db.execute(select(Webhook).where(Webhook.id == webhook_id))
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook no encontrado")

    await db.delete(webhook)
    await log_audit(db, user.id, "delete", "webhook", str(webhook_id), request=request)
    await db.commit()
    return {"message": "Webhook eliminado"}


@router.post("/webhooks/{webhook_id}/test")
async def test_webhook_endpoint(
    webhook_id: uuid.UUID,
    data: WebhookTestRequest | None = None,
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Envía un test al webhook."""
    result = await db.execute(select(Webhook).where(Webhook.id == webhook_id))
    webhook = result.scalar_one_or_none()
    if not webhook:
        raise HTTPException(status_code=404, detail="Webhook no encontrado")

    return await test_webhook(
        db, webhook,
        event=data.event if data else "test.ping",
        payload=data.payload if data else None,
    )


@router.get("/webhooks/{webhook_id}/logs")
async def get_webhook_logs(
    webhook_id: uuid.UUID,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    user: User = require_permissions(P5_APIS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Historial de entregas del webhook."""
    count_q = await db.execute(
        select(func.count()).select_from(WebhookLog).where(
            WebhookLog.webhook_id == webhook_id
        )
    )
    total = count_q.scalar() or 0

    result = await db.execute(
        select(WebhookLog).where(WebhookLog.webhook_id == webhook_id)
        .order_by(WebhookLog.created_at.desc())
        .offset(skip).limit(limit)
    )
    logs = result.scalars().all()

    return {
        "items": [
            {
                "id": l.id, "event": l.event, "status_code": l.status_code,
                "response_time_ms": l.response_time_ms, "attempt": l.attempt,
                "status": l.status, "error_message": l.error_message,
                "created_at": l.created_at,
            }
            for l in logs
        ],
        "total": total,
    }


@router.get("/webhook-events")
async def get_available_webhook_events(
    user: User = require_permissions(P5_PROJECTS_VIEW),
):
    """Lista de eventos disponibles para webhooks."""
    return {"events": WEBHOOK_EVENTS}


# ===================================================================
# 6. GESTIÓN DE ERRORES
# ===================================================================

@router.get("/errors")
async def list_integration_errors(
    client_id: uuid.UUID | None = None,
    connection_id: uuid.UUID | None = None,
    status: str | None = None,
    category: str | None = None,
    severity: str | None = None,
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user: User = require_permissions(P5_ERRORS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Lista errores de integración con filtros."""
    return await list_errors(db, client_id, connection_id, status, category, severity, skip, limit)


@router.get("/errors/stats")
async def error_statistics(
    client_id: uuid.UUID | None = None,
    user: User = require_permissions(P5_ERRORS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Estadísticas de errores por categoría, severidad y código."""
    return await get_error_stats(db, client_id)


@router.put("/errors/{error_id}/resolve")
async def resolve_integration_error(
    error_id: uuid.UUID,
    data: ErrorResolveRequest,
    request: Request,
    user: User = require_permissions(P5_ERRORS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Resuelve un error."""
    error = await resolve_error(db, error_id, user.id, data.resolution_notes, data.status)
    if not error:
        raise HTTPException(status_code=404, detail="Error no encontrado")
    await log_audit(db, user.id, "resolve", "error", str(error_id), request=request)
    await db.commit()
    return {"message": "Error resuelto", "status": error.status}


@router.post("/errors/bulk-resolve")
async def bulk_resolve_errors(
    data: ErrorRetryRequest,
    request: Request,
    user: User = require_permissions(P5_ERRORS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Resuelve múltiples errores a la vez."""
    count = await bulk_resolve(db, data.error_ids, user.id)
    await log_audit(db, user.id, "bulk_resolve", "errors",
                    details=f"{count} errores resueltos", request=request)
    await db.commit()
    return {"resolved": count}


@router.post("/errors/{error_id}/retry")
async def retry_integration_error(
    error_id: uuid.UUID,
    request: Request,
    user: User = require_permissions(P5_ERRORS_MANAGE),
    db: AsyncSession = Depends(get_db),
):
    """Reintenta un error retryable."""
    error = await retry_error(db, error_id)
    if not error:
        raise HTTPException(status_code=400, detail="Error no retryable o límite alcanzado")
    await log_audit(db, user.id, "retry", "error", str(error_id), request=request)
    await db.commit()
    return {"message": "Reintento programado", "retry_count": error.retry_count}


# ===================================================================
# 7. PROYECTOS
# ===================================================================

@router.get("/projects", response_model=ProjectListResponse)
async def list_projects(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: str | None = None,
    client_id: uuid.UUID | None = None,
    integration_type: str | None = None,
    user: User = require_permissions(P5_PROJECTS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    query = select(Project)
    if status:
        query = query.where(Project.status == status)
    if client_id:
        query = query.where(Project.client_id == client_id)
    if integration_type:
        query = query.where(Project.integration_type == integration_type)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(Project.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    return ProjectListResponse(
        items=[ProjectResponse.model_validate(p) for p in result.scalars().all()],
        total=total, page=page, page_size=page_size,
    )


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    user: User = require_permissions(P5_PROJECTS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")
    return ProjectResponse.model_validate(project)


@router.post("/projects", response_model=ProjectResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    request: Request,
    user: User = require_permissions(P5_PROJECTS_CREATE),
    db: AsyncSession = Depends(get_db),
):
    client_result = await db.execute(select(Client).where(Client.id == data.client_id))
    if not client_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    project = Project(
        client_id=data.client_id,
        name=data.name,
        description=data.description,
        integration_type=data.integration_type,
        priority=data.priority,
        system_url=data.system_url,
        auth_type=data.auth_type,
        config_json=data.config_json,
        notas_internas=data.notas_internas,
        fecha_inicio=datetime.now(timezone.utc),
    )
    db.add(project)
    await db.flush()
    await db.refresh(project)

    db.add(ProjectLog(
        project_id=project.id, level="INFO",
        message=f"Proyecto creado: {data.name}",
        user_id=user.id,
    ))

    await log_audit(db, user.id, "create", "project", str(project.id), request=request)
    await db.commit()
    return ProjectResponse.model_validate(project)


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    data: ProjectUpdate,
    request: Request,
    user: User = require_permissions(P5_PROJECTS_EDIT),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Proyecto no encontrado")

    changes = data.model_dump(exclude_unset=True)
    old_status = project.status

    for field, value in changes.items():
        setattr(project, field, value)

    if "status" in changes and changes["status"] != old_status:
        db.add(ProjectLog(
            project_id=project.id, level="INFO",
            message=f"Estado cambió de '{old_status}' a '{changes['status']}'",
            user_id=user.id,
        ))
        if changes["status"] == "produccion":
            project.fecha_produccion = datetime.now(timezone.utc)

    await db.flush()
    await db.refresh(project)
    await log_audit(db, user.id, "update", "project", str(project.id),
                    details=str(changes), request=request)
    await db.commit()
    return ProjectResponse.model_validate(project)


@router.get("/projects/{project_id}/logs")
async def get_project_logs(
    project_id: uuid.UUID,
    level: str | None = None,
    page: int = Query(1, ge=1),
    page_size: int = Query(50, ge=1, le=200),
    user: User = require_permissions(P5_PROJECTS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    query = select(ProjectLog).where(ProjectLog.project_id == project_id)
    if level:
        query = query.where(ProjectLog.level == level)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(ProjectLog.timestamp.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    logs = [
        {
            "id": str(log.id), "level": log.level, "message": log.message,
            "details": log.details, "timestamp": log.timestamp.isoformat(),
        }
        for log in result.scalars().all()
    ]

    return {"items": logs, "total": total, "page": page, "page_size": page_size}


@router.get("/clients/{client_id}/control-numbers")
async def client_control_numbers_status(
    client_id: uuid.UUID,
    user: User = require_permissions(P5_PROJECTS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    return await get_available_count(db, client_id)


# ===================================================================
# Helpers
# ===================================================================

async def _get_connection(db: AsyncSession, connection_id: uuid.UUID) -> IntegrationConnection:
    result = await db.execute(
        select(IntegrationConnection).where(IntegrationConnection.id == connection_id)
    )
    conn = result.scalar_one_or_none()
    if not conn:
        raise HTTPException(status_code=404, detail="Conexión no encontrada")
    return conn
