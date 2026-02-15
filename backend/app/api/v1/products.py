"""Portal 2 - Gestión de Productos e Inventario."""
import uuid
import math
from fastapi import APIRouter, Depends, HTTPException, Query, Request, UploadFile, File
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.core.deps import get_current_user, get_client_id_from_token, log_audit
from app.models.security import User
from app.models.products import Product, ProductCategory, Inventory
from app.models.clients import ClientUser
from app.schemas.products import (
    ProductCreate, ProductUpdate, ProductResponse, ProductListResponse,
    InventoryAdjustment, CategoryCreate, CategoryResponse,
)

router = APIRouter()


async def _get_client_id(user: User, db: AsyncSession) -> uuid.UUID:
    """Obtiene el client_id del usuario actual."""
    result = await db.execute(
        select(ClientUser.client_id).where(
            ClientUser.user_id == user.id, ClientUser.is_active == True
        ).limit(1)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=403, detail="No tiene un cliente asociado")
    return row[0]


# --- Categorías ---

@router.get("/categories", response_model=list[CategoryResponse])
async def list_categories(
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_id = await _get_client_id(user, db)
    result = await db.execute(
        select(ProductCategory)
        .where(ProductCategory.client_id == client_id, ProductCategory.is_active == True)
        .order_by(ProductCategory.name)
    )
    return [CategoryResponse.model_validate(c) for c in result.scalars().all()]


@router.post("/categories", response_model=CategoryResponse, status_code=201)
async def create_category(
    data: CategoryCreate,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_id = await _get_client_id(user, db)
    cat = ProductCategory(client_id=client_id, name=data.name, parent_id=data.parent_id, description=data.description)
    db.add(cat)
    await db.flush()
    await db.refresh(cat)
    return CategoryResponse.model_validate(cat)


# --- Productos ---

@router.get("", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    search: str | None = None,
    category_id: uuid.UUID | None = None,
    is_active: bool | None = True,
    stock_bajo: bool | None = None,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_id = await _get_client_id(user, db)
    query = select(Product).where(Product.client_id == client_id)

    if search:
        query = query.where(
            or_(
                Product.code.ilike(f"%{search}%"),
                Product.name.ilike(f"%{search}%"),
                Product.barcode.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
            )
        )
    if category_id:
        query = query.where(Product.category_id == category_id)
    if is_active is not None:
        query = query.where(Product.is_active == is_active)
    if stock_bajo:
        query = query.where(Product.stock_actual <= Product.stock_minimo, Product.is_service == False)

    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(Product.name).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    return ProductListResponse(
        items=[ProductResponse.model_validate(p) for p in result.scalars().all()],
        total=total, page=page, page_size=page_size,
        pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(
    product_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_id = await _get_client_id(user, db)
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.client_id == client_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return ProductResponse.model_validate(product)


@router.post("", response_model=ProductResponse, status_code=201)
async def create_product(
    data: ProductCreate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_id = await _get_client_id(user, db)

    # Check code unique per client
    existing = await db.execute(
        select(Product).where(Product.client_id == client_id, Product.code == data.code)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Ya existe un producto con código {data.code}")

    product = Product(client_id=client_id, **data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)

    await log_audit(db, user.id, "create", "product", str(product.id), request=request, client_id=client_id)
    return ProductResponse.model_validate(product)


@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: uuid.UUID,
    data: ProductUpdate,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_id = await _get_client_id(user, db)
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.client_id == client_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    await db.flush()
    await db.refresh(product)
    await log_audit(db, user.id, "update", "product", str(product.id), request=request, client_id=client_id)
    return ProductResponse.model_validate(product)


@router.delete("/{product_id}")
async def delete_product(
    product_id: uuid.UUID,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    client_id = await _get_client_id(user, db)
    result = await db.execute(
        select(Product).where(Product.id == product_id, Product.client_id == client_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    product.is_active = False
    await log_audit(db, user.id, "deactivate", "product", str(product.id), request=request, client_id=client_id)
    return {"message": "Producto desactivado"}


# --- Inventario ---

@router.post("/inventory/adjust")
async def adjust_inventory(
    data: InventoryAdjustment,
    request: Request,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Ajuste manual de inventario con registro de movimiento."""
    client_id = await _get_client_id(user, db)
    result = await db.execute(
        select(Product).where(Product.id == data.product_id, Product.client_id == client_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    if product.is_service:
        raise HTTPException(status_code=400, detail="No se puede ajustar stock de un servicio")

    stock_before = float(product.stock_actual)

    if data.movement_type in ("entrada", "ajuste_positivo"):
        product.stock_actual = float(product.stock_actual) + data.quantity
    elif data.movement_type in ("salida", "ajuste_negativo"):
        if float(product.stock_actual) < data.quantity:
            raise HTTPException(status_code=400, detail="Stock insuficiente")
        product.stock_actual = float(product.stock_actual) - data.quantity
    else:
        raise HTTPException(status_code=400, detail="Tipo de movimiento no válido")

    # Registrar movimiento
    movement = Inventory(
        client_id=client_id,
        product_id=product.id,
        movement_type=data.movement_type,
        quantity=data.quantity,
        stock_before=stock_before,
        stock_after=float(product.stock_actual),
        unit_cost=data.unit_cost,
        reference_type="manual_adjustment",
        warehouse=data.warehouse,
        reason=data.reason,
        performed_by=user.id,
    )
    db.add(movement)
    await db.flush()

    await log_audit(
        db, user.id, "inventory_adjust", "product", str(product.id),
        details=f"{data.movement_type}: {data.quantity} ({data.reason})",
        request=request, client_id=client_id,
    )

    return {
        "message": "Inventario ajustado",
        "product_code": product.code,
        "stock_anterior": stock_before,
        "stock_actual": float(product.stock_actual),
        "movimiento": data.movement_type,
        "cantidad": data.quantity,
    }


@router.get("/{product_id}/movements")
async def get_product_movements(
    product_id: uuid.UUID,
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=50),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Historial de movimientos de inventario (kardex) de un producto."""
    client_id = await _get_client_id(user, db)

    query = select(Inventory).where(
        Inventory.product_id == product_id, Inventory.client_id == client_id
    )
    count_q = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_q)).scalar() or 0

    query = query.order_by(Inventory.timestamp.desc()).offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(query)

    movements = [
        {
            "id": str(m.id),
            "movement_type": m.movement_type,
            "quantity": float(m.quantity),
            "stock_before": float(m.stock_before),
            "stock_after": float(m.stock_after),
            "unit_cost": float(m.unit_cost) if m.unit_cost else None,
            "warehouse": m.warehouse,
            "reason": m.reason,
            "reference_type": m.reference_type,
            "timestamp": m.timestamp.isoformat(),
        }
        for m in result.scalars().all()
    ]

    return {"items": movements, "total": total, "page": page, "page_size": page_size}
