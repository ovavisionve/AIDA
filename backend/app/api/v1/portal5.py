"""
Portal 5 - Gestión de Proyectos de Integración y Onboarding.

Dashboard de proyectos, monitoreo de integraciones, y gestión
de la configuración de cada cliente.
"""
import uuid
import math
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.deps import get_current_user, require_permissions, log_audit
from app.core.permissions import P5_PROJECTS_VIEW, P5_PROJECTS_CREATE, P5_PROJECTS_EDIT
from app.models.security import User
from app.models.clients import Client
from app.models.projects import Project, ProjectLog
from app.services.fiscal.control_numbers import get_available_count
from pydantic import BaseModel

router = APIRouter()


# --- Schemas ---

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


class Portal5Dashboard(BaseModel):
    total_proyectos: int
    proyectos_produccion: int
    proyectos_desarrollo: int
    proyectos_por_estado: dict[str, int]
    clientes_activos: int
    alertas: list[str]


# --- Endpoints ---

@router.get("/dashboard", response_model=Portal5Dashboard)
async def portal5_dashboard(
    user: User = require_permissions(P5_PROJECTS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard del Portal 5 con estado general de proyectos."""
    total = (await db.execute(select(func.count(Project.id)))).scalar() or 0

    prod = (await db.execute(
        select(func.count(Project.id)).where(Project.status == "produccion")
    )).scalar() or 0

    dev = (await db.execute(
        select(func.count(Project.id)).where(Project.status.in_(["desarrollo", "testing"]))
    )).scalar() or 0

    status_result = await db.execute(
        select(Project.status, func.count(Project.id)).group_by(Project.status)
    )
    by_status = {r[0]: r[1] for r in status_result.all()}

    active_clients = (await db.execute(
        select(func.count(Client.id)).where(Client.is_active == True)
    )).scalar() or 0

    alertas = []
    if total == 0:
        alertas.append("No hay proyectos creados. Use el onboarding para agregar clientes.")

    return Portal5Dashboard(
        total_proyectos=total,
        proyectos_produccion=prod,
        proyectos_desarrollo=dev,
        proyectos_por_estado=by_status,
        clientes_activos=active_clients,
        alertas=alertas,
    )


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
    # Verify client exists
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

    # Log inicial
    db.add(ProjectLog(
        project_id=project.id, level="INFO",
        message=f"Proyecto creado: {data.name}",
        user_id=user.id,
    ))

    await log_audit(db, user.id, "create", "project", str(project.id), request=request)
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

    # Si cambió de estado, registrar en logs
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
    await log_audit(db, user.id, "update", "project", str(project.id), details=str(changes), request=request)
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
    """Logs de actividad del proyecto."""
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
    """Estado de números de control de un cliente."""
    return await get_available_count(db, client_id)
