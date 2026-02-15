import uuid
from datetime import datetime
from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    code: str = Field(..., max_length=50)
    barcode: str | None = None
    name: str = Field(..., max_length=255)
    description: str | None = None
    category_id: uuid.UUID | None = None
    unit_of_measure: str = "UND"
    cost_price: float = 0
    sale_price_1: float
    sale_price_2: float | None = None
    sale_price_3: float | None = None
    tax_type: str = "gravado"
    tax_rate: float = 16.00
    stock_actual: float = 0
    stock_minimo: float = 0
    stock_maximo: float | None = None
    ubicacion_almacen: str | None = None
    is_service: bool = False
    imagen_url: str | None = None


class ProductUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    category_id: uuid.UUID | None = None
    unit_of_measure: str | None = None
    cost_price: float | None = None
    sale_price_1: float | None = None
    sale_price_2: float | None = None
    sale_price_3: float | None = None
    tax_type: str | None = None
    tax_rate: float | None = None
    stock_minimo: float | None = None
    stock_maximo: float | None = None
    ubicacion_almacen: str | None = None
    is_active: bool | None = None
    imagen_url: str | None = None


class ProductResponse(BaseModel):
    id: uuid.UUID
    code: str
    barcode: str | None
    name: str
    description: str | None
    unit_of_measure: str
    cost_price: float
    sale_price_1: float
    sale_price_2: float | None
    sale_price_3: float | None
    tax_type: str
    tax_rate: float
    stock_actual: float
    stock_minimo: float
    stock_maximo: float | None
    ubicacion_almacen: str | None
    is_service: bool
    is_active: bool
    imagen_url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductListResponse(BaseModel):
    items: list[ProductResponse]
    total: int
    page: int
    page_size: int
    pages: int


class InventoryAdjustment(BaseModel):
    product_id: uuid.UUID
    movement_type: str = Field(..., description="entrada, salida, ajuste_positivo, ajuste_negativo")
    quantity: float = Field(..., gt=0)
    unit_cost: float | None = None
    reason: str
    warehouse: str = "principal"


class CategoryCreate(BaseModel):
    name: str
    parent_id: uuid.UUID | None = None
    description: str | None = None


class CategoryResponse(BaseModel):
    id: uuid.UUID
    name: str
    parent_id: uuid.UUID | None
    description: str | None
    is_active: bool

    model_config = {"from_attributes": True}
