"""
Modelos de plantillas de documentos y banners publicitarios.

Permite a los clientes:
  - Elegir entre múltiples diseños de plantilla para sus documentos fiscales
  - Subir banners publicitarios por tipo de documento
  - Personalizar la apariencia de sus facturas, NC, ND, etc.
"""
import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin


class DocumentTemplate(Base, UUIDMixin, TimestampMixin):
    """Plantillas de documentos fiscales.

    Cada plantilla define un diseño visual diferente para los PDFs.
    Los clientes pueden elegir qué plantilla usar por tipo de documento.
    """
    __tablename__ = "document_templates"

    name: Mapped[str] = mapped_column(String(100), nullable=False)
    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)  # clasica, moderna, corporativa, compacta
    description: Mapped[str | None] = mapped_column(Text)

    # Tipos de documento soportados (comma-separated: factura,nota_credito,nota_debito,guia_despacho,retencion)
    document_types: Mapped[str] = mapped_column(String(200), default="factura,nota_credito,nota_debito,guia_despacho,retencion")

    # Configuración visual (JSON)
    # Contiene: colores (header, accent, text), fuentes, posiciones de elementos,
    # estilo de tabla (bordes, alternado de filas), posición de logo/QR/barcode
    layout_config: Mapped[str | None] = mapped_column(Text)  # JSON

    # Preview
    preview_image_url: Mapped[str | None] = mapped_column(String(500))

    # Estado
    is_default: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0, nullable=False)


class ClientTemplatePreference(Base, UUIDMixin, TimestampMixin):
    """Preferencia de plantilla por cliente y tipo de documento.

    Un cliente puede elegir plantilla diferente para cada tipo de documento.
    Ej: factura → "moderna", nota_credito → "clasica"
    """
    __tablename__ = "client_template_preferences"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(30), nullable=False)  # factura, nota_credito, nota_debito, guia_despacho, retencion
    template_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("document_templates.id"), nullable=False)


class ClientBanner(Base, UUIDMixin, TimestampMixin):
    """Banners publicitarios por cliente y tipo de documento.

    El cliente puede subir un banner diferente para cada tipo de documento.
    El banner se renderiza en una posición configurable del PDF.
    """
    __tablename__ = "client_banners"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True)
    document_type: Mapped[str] = mapped_column(String(30), nullable=False)  # factura, nota_credito, etc. o "todos"
    banner_image_url: Mapped[str] = mapped_column(String(500), nullable=False)
    position: Mapped[str] = mapped_column(String(20), default="footer")  # header, footer, watermark
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Dimensiones originales (para scaling en PDF)
    width_px: Mapped[int | None] = mapped_column(Integer)
    height_px: Mapped[int | None] = mapped_column(Integer)
