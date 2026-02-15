import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class ProductCategory(Base, UUIDMixin, TimestampMixin):
    """Categorías/familias de productos."""
    __tablename__ = "product_categories"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    parent_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("product_categories.id"))
    description: Mapped[str | None] = mapped_column(Text)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    children: Mapped[list["ProductCategory"]] = relationship(back_populates="parent")
    parent: Mapped["ProductCategory"] = relationship(back_populates="children", remote_side="ProductCategory.id")


class Product(Base, UUIDMixin, TimestampMixin):
    """Productos y servicios."""
    __tablename__ = "products"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    barcode: Mapped[str | None] = mapped_column(String(50), index=True)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("product_categories.id"))
    unit_of_measure: Mapped[str] = mapped_column(String(20), default="UND", nullable=False)

    # Precios
    cost_price: Mapped[float] = mapped_column(Numeric(18, 4), default=0, nullable=False)
    sale_price_1: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    sale_price_2: Mapped[float | None] = mapped_column(Numeric(18, 4))
    sale_price_3: Mapped[float | None] = mapped_column(Numeric(18, 4))
    sale_price_4: Mapped[float | None] = mapped_column(Numeric(18, 4))
    sale_price_5: Mapped[float | None] = mapped_column(Numeric(18, 4))

    # Impuestos
    tax_type: Mapped[str] = mapped_column(String(20), default="gravado", nullable=False)
    tax_rate: Mapped[float] = mapped_column(Numeric(5, 2), default=16.00, nullable=False)

    # Stock
    stock_actual: Mapped[float] = mapped_column(Numeric(18, 4), default=0, nullable=False)
    stock_minimo: Mapped[float] = mapped_column(Numeric(18, 4), default=0, nullable=False)
    stock_maximo: Mapped[float | None] = mapped_column(Numeric(18, 4))
    ubicacion_almacen: Mapped[str | None] = mapped_column(String(100))

    # Proveedor
    proveedor_principal_id: Mapped[uuid.UUID | None] = mapped_column()

    # Físico
    peso: Mapped[float | None] = mapped_column(Numeric(10, 3))
    dimensiones: Mapped[str | None] = mapped_column(String(100))
    imagen_url: Mapped[str | None] = mapped_column(String(500))

    is_service: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    category: Mapped["ProductCategory"] = relationship()


class Inventory(Base, UUIDMixin, TimestampMixin):
    """Movimientos de inventario."""
    __tablename__ = "inventory_movements"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("products.id"), nullable=False, index=True)
    movement_type: Mapped[str] = mapped_column(String(20), nullable=False)
    # entrada, salida, ajuste_positivo, ajuste_negativo, transferencia
    quantity: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    stock_before: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    stock_after: Mapped[float] = mapped_column(Numeric(18, 4), nullable=False)
    unit_cost: Mapped[float | None] = mapped_column(Numeric(18, 4))
    reference_type: Mapped[str | None] = mapped_column(String(30))  # invoice, purchase, adjustment
    reference_id: Mapped[uuid.UUID | None] = mapped_column()
    warehouse: Mapped[str] = mapped_column(String(50), default="principal", nullable=False)
    reason: Mapped[str | None] = mapped_column(Text)
    performed_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    product: Mapped["Product"] = relationship()
