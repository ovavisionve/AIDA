"""Modelo de proyectos de integración (Portal 5)."""
import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class Project(Base, UUIDMixin, TimestampMixin):
    """Proyectos de integración de clientes."""
    __tablename__ = "projects"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    integration_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # api_directa, odoo, sap, woocommerce, prestashop, custom
    status: Mapped[str] = mapped_column(String(30), default="planificacion", nullable=False)
    # planificacion, desarrollo, testing, produccion, pausado
    progress: Mapped[int] = mapped_column(Integer, default=0, nullable=False)  # 0-100
    priority: Mapped[str] = mapped_column(String(20), default="media", nullable=False)
    # baja, media, alta, critica

    # URLs del sistema del cliente
    system_url: Mapped[str | None] = mapped_column(String(500))
    auth_type: Mapped[str | None] = mapped_column(String(30))  # api_key, oauth2, jwt, basic
    environment: Mapped[str] = mapped_column(String(20), default="desarrollo", nullable=False)

    # Fechas
    fecha_inicio: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fecha_estimada_fin: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fecha_produccion: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Configuración JSON (mapeos, reglas, sync config)
    config_json: Mapped[str | None] = mapped_column(Text)  # JSON completo de configuración

    # Notas internas
    notas_internas: Mapped[str | None] = mapped_column(Text)

    # Relationships
    logs: Mapped[list["ProjectLog"]] = relationship(back_populates="project", cascade="all, delete-orphan")


class ProjectLog(Base, UUIDMixin):
    """Logs de actividad del proyecto."""
    __tablename__ = "project_logs"

    project_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("projects.id", ondelete="CASCADE"), nullable=False, index=True)
    level: Mapped[str] = mapped_column(String(10), nullable=False)  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    message: Mapped[str] = mapped_column(Text, nullable=False)
    details: Mapped[str | None] = mapped_column(Text)
    user_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    project: Mapped["Project"] = relationship(back_populates="logs")
