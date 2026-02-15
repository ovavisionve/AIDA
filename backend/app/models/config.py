import uuid
from sqlalchemy import (
    Boolean, ForeignKey, String, Text,
)
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class SystemSetting(Base, UUIDMixin, TimestampMixin):
    """Configuración global del sistema."""
    __tablename__ = "system_settings"

    key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    value: Mapped[str] = mapped_column(Text, nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(50), nullable=False)  # empresa, facturacion, email, seguridad, etc.
    is_sensitive: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)


class EmailTemplate(Base, UUIDMixin, TimestampMixin):
    """Plantillas de email."""
    __tablename__ = "email_templates"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    body_html: Mapped[str] = mapped_column(Text, nullable=False)
    body_text: Mapped[str | None] = mapped_column(Text)
    variables: Mapped[str | None] = mapped_column(Text)  # JSON list of available variables
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)


class BusinessRule(Base, UUIDMixin, TimestampMixin):
    """Reglas de negocio configurables."""
    __tablename__ = "business_rules"

    client_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("clients.id"))
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    rule_type: Mapped[str] = mapped_column(String(30), nullable=False)
    # validation, transformation, routing, calculation
    condition: Mapped[str] = mapped_column(Text, nullable=False)  # JSON condition definition
    action: Mapped[str] = mapped_column(Text, nullable=False)  # JSON action definition
    priority: Mapped[int] = mapped_column(default=0, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_global: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
