import uuid
from datetime import datetime, date
from sqlalchemy import (
    Boolean, Date, DateTime, ForeignKey, Integer, Numeric, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Client(Base, UUIDMixin, TimestampMixin):
    """Clientes de AIda (empresas que contratan el servicio)."""
    __tablename__ = "clients"

    # Datos fiscales
    rif: Mapped[str] = mapped_column(String(20), unique=True, nullable=False, index=True)
    razon_social: Mapped[str] = mapped_column(String(255), nullable=False)
    nombre_comercial: Mapped[str | None] = mapped_column(String(255))
    direccion_fiscal: Mapped[str] = mapped_column(Text, nullable=False)
    telefono_principal: Mapped[str | None] = mapped_column(String(20))
    telefono_secundario: Mapped[str | None] = mapped_column(String(20))
    email_principal: Mapped[str] = mapped_column(String(255), nullable=False)
    email_secundario: Mapped[str | None] = mapped_column(String(255))
    representante_legal: Mapped[str | None] = mapped_column(String(255))
    sector_industria: Mapped[str | None] = mapped_column(String(100))

    # Configuración de cuenta
    plan: Mapped[str] = mapped_column(String(50), default="basico", nullable=False)
    fecha_inicio: Mapped[date] = mapped_column(Date, nullable=False)
    fecha_renovacion: Mapped[date | None] = mapped_column(Date)
    metodo_pago: Mapped[str | None] = mapped_column(String(50))
    descuento_porcentaje: Mapped[float | None] = mapped_column(Numeric(5, 2))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_suspended: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    suspension_reason: Mapped[str | None] = mapped_column(Text)

    # Branding
    logo_url: Mapped[str | None] = mapped_column(String(500))
    color_primario: Mapped[str | None] = mapped_column(String(7))  # hex
    color_secundario: Mapped[str | None] = mapped_column(String(7))

    # Configuración regional
    idioma: Mapped[str] = mapped_column(String(5), default="es", nullable=False)
    zona_horaria: Mapped[str] = mapped_column(String(50), default="America/Caracas", nullable=False)
    moneda_principal: Mapped[str] = mapped_column(String(3), default="VES", nullable=False)

    # Límites del plan
    max_documentos_mes: Mapped[int] = mapped_column(Integer, default=100, nullable=False)
    max_usuarios: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_almacenamiento_gb: Mapped[int] = mapped_column(Integer, default=5, nullable=False)

    # Relationships
    users: Mapped[list["ClientUser"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    settings: Mapped[list["ClientSetting"]] = relationship(back_populates="client", cascade="all, delete-orphan")
    subscriptions: Mapped[list["ClientSubscription"]] = relationship(back_populates="client", cascade="all, delete-orphan")


class ClientUser(Base, UUIDMixin, TimestampMixin):
    """Relación entre usuarios globales y clientes (un usuario puede pertenecer a múltiples clientes)."""
    __tablename__ = "client_users"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    is_primary: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    client: Mapped["Client"] = relationship(back_populates="users")
    user: Mapped["User"] = relationship()


class ClientSetting(Base, UUIDMixin):
    """Configuraciones específicas por cliente (key-value)."""
    __tablename__ = "client_settings"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    key: Mapped[str] = mapped_column(String(100), nullable=False)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)

    client: Mapped["Client"] = relationship(back_populates="settings")


class ClientSubscription(Base, UUIDMixin, TimestampMixin):
    """Historial de suscripciones y planes."""
    __tablename__ = "client_subscriptions"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False)
    plan_name: Mapped[str] = mapped_column(String(50), nullable=False)
    price_monthly: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    price_annual: Mapped[float | None] = mapped_column(Numeric(12, 2))
    start_date: Mapped[date] = mapped_column(Date, nullable=False)
    end_date: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)  # active, cancelled, expired
    payment_method: Mapped[str | None] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(Text)

    client: Mapped["Client"] = relationship(back_populates="subscriptions")
