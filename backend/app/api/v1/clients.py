"""Portal 6 Admin - Gestión de Clientes."""
import uuid
import math
from fastapi import APIRouter, Depends, HTTPException, Query, Request, status
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.deps import get_current_user, log_audit, require_permissions
from app.core.permissions import P6_CLIENTS_VIEW, P6_CLIENTS_CREATE, P6_CLIENTS_EDIT, P6_CLIENTS_DELETE
from app.models.security import User
from app.models.clients import Client
from app.schemas.clients import ClientCreate, ClientUpdate, ClientResponse, ClientListResponse

router = APIRouter()


@router.get("", response_model=ClientListResponse)
async def list_clients(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    plan: str | None = None,
    is_active: bool | None = None,
    user: User = require_permissions(P6_CLIENTS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    query = select(Client)

    if search:
        query = query.where(
            or_(
                Client.rif.ilike(f"%{search}%"),
                Client.razon_social.ilike(f"%{search}%"),
                Client.nombre_comercial.ilike(f"%{search}%"),
                Client.email_principal.ilike(f"%{search}%"),
            )
        )
    if plan:
        query = query.where(Client.plan == plan)
    if is_active is not None:
        query = query.where(Client.is_active == is_active)

    # Count
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # Paginate
    query = query.order_by(Client.created_at.desc())
    query = query.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)
    clients = result.scalars().all()

    return ClientListResponse(
        items=[ClientResponse.model_validate(c) for c in clients],
        total=total,
        page=page,
        page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/{client_id}", response_model=ClientResponse)
async def get_client(
    client_id: uuid.UUID,
    user: User = require_permissions(P6_CLIENTS_VIEW),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")
    return ClientResponse.model_validate(client)


@router.post("", response_model=ClientResponse, status_code=status.HTTP_201_CREATED)
async def create_client(
    data: ClientCreate,
    request: Request,
    user: User = require_permissions(P6_CLIENTS_CREATE),
    db: AsyncSession = Depends(get_db),
):
    # Check duplicates
    existing = await db.execute(select(Client).where(Client.rif == data.rif))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Ya existe un cliente con este RIF")

    client = Client(**data.model_dump())
    db.add(client)
    await db.flush()
    await db.refresh(client)

    await log_audit(db, user.id, "create", "client", str(client.id), request=request)

    return ClientResponse.model_validate(client)


@router.put("/{client_id}", response_model=ClientResponse)
async def update_client(
    client_id: uuid.UUID,
    data: ClientUpdate,
    request: Request,
    user: User = require_permissions(P6_CLIENTS_EDIT),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    update_data = data.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(client, field, value)

    await db.flush()
    await db.refresh(client)

    await log_audit(
        db, user.id, "update", "client", str(client.id),
        details=str(update_data), request=request,
    )

    return ClientResponse.model_validate(client)


@router.delete("/{client_id}")
async def delete_client(
    client_id: uuid.UUID,
    hard_delete: bool = False,
    request: Request = None,
    user: User = require_permissions(P6_CLIENTS_DELETE),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Client).where(Client.id == client_id))
    client = result.scalar_one_or_none()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if hard_delete:
        await db.delete(client)
        action = "hard_delete"
    else:
        client.is_active = False
        action = "soft_delete"

    await log_audit(db, user.id, action, "client", str(client.id), request=request)

    return {"message": f"Cliente {'eliminado' if hard_delete else 'desactivado'} exitosamente"}
