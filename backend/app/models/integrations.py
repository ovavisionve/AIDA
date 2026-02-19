"""Modelos para integraciones, webhooks y monitoreo (Portal 5 avanzado)."""
import uuid
from datetime import datetime
from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Integer, String, Text, func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base
from app.models.base import TimestampMixin, UUIDMixin


# ---------------------------------------------------------------------------
# Integration Templates - plantillas pre-configuradas por tipo de sistema
# ---------------------------------------------------------------------------
class IntegrationTemplate(Base, UUIDMixin, TimestampMixin):
    """Plantillas de integración para diferentes ERPs/eCommerce."""
    __tablename__ = "integration_templates"

    code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    # api_directa, odoo, sap_b1, sap_hana, woocommerce, prestashop, shopify, custom
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(30), nullable=False)
    # erp, ecommerce, pos, contabilidad, custom
    version: Mapped[str] = mapped_column(String(20), default="1.0", nullable=False)
    icon_url: Mapped[str | None] = mapped_column(String(500))

    # Configuración base del template (JSON)
    auth_config: Mapped[str] = mapped_column(Text, nullable=False)
    # {"type":"api_key","fields":["api_key","api_secret"]}
    field_mapping: Mapped[str] = mapped_column(Text, nullable=False)
    # {"emisor.rif":"company.vat", "items[].codigo":"line.product_code", ...}
    endpoint_mapping: Mapped[str] = mapped_column(Text, nullable=False)
    # {"emit":"/api/invoice/create", "void":"/api/invoice/cancel", ...}
    default_config: Mapped[str] = mapped_column(Text, nullable=False)
    # {"sync_interval":300, "retry_count":3, "batch_size":50, ...}
    transformation_rules: Mapped[str | None] = mapped_column(Text)
    # {"tax_map":{"G":"IVA16","R":"IVA8"}, "currency_map":{"VES":"VEF"}, ...}
    webhook_events: Mapped[str | None] = mapped_column(Text)
    # ["document_emitted","document_voided","payment_received"]

    # Capacidades del template
    supports_sync: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    supports_webhook: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    supports_batch: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    supports_realtime: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    is_official: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    connections: Mapped[list["IntegrationConnection"]] = relationship(
        back_populates="template", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Integration Connections - conexiones activas de clientes
# ---------------------------------------------------------------------------
class IntegrationConnection(Base, UUIDMixin, TimestampMixin):
    """Conexión de integración activa de un cliente."""
    __tablename__ = "integration_connections"

    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    project_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("projects.id", ondelete="SET NULL"), index=True
    )
    template_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("integration_templates.id"), nullable=False
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    status: Mapped[str] = mapped_column(String(30), default="configurando", nullable=False)
    # configurando, testing, activa, pausada, error, desactivada
    environment: Mapped[str] = mapped_column(String(20), default="sandbox", nullable=False)
    # sandbox, staging, production

    # Credenciales y configuración (JSON cifrado en producción)
    auth_credentials: Mapped[str | None] = mapped_column(Text)
    # {"api_key":"xxx","api_secret":"xxx","base_url":"https://..."}
    custom_field_mapping: Mapped[str | None] = mapped_column(Text)
    custom_config: Mapped[str | None] = mapped_column(Text)
    custom_transformations: Mapped[str | None] = mapped_column(Text)

    # Endpoints personalizados del cliente
    system_base_url: Mapped[str | None] = mapped_column(String(500))
    callback_url: Mapped[str | None] = mapped_column(String(500))

    # Sync config
    sync_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    sync_interval_seconds: Mapped[int] = mapped_column(Integer, default=300, nullable=False)
    last_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    next_sync_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Health
    last_health_check: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    health_status: Mapped[str] = mapped_column(String(20), default="unknown", nullable=False)
    # healthy, degraded, down, unknown
    consecutive_failures: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Stats
    total_documents_synced: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_errors: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Wizard state (para continuar wizard incompleto)
    wizard_step: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    wizard_completed: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    activated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    deactivated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    template: Mapped["IntegrationTemplate"] = relationship(back_populates="connections")
    webhooks: Mapped[list["Webhook"]] = relationship(
        back_populates="connection", cascade="all, delete-orphan"
    )
    errors: Mapped[list["IntegrationError"]] = relationship(
        back_populates="connection", cascade="all, delete-orphan"
    )
    metrics: Mapped[list["MonitoringMetric"]] = relationship(
        back_populates="connection", cascade="all, delete-orphan"
    )


# ---------------------------------------------------------------------------
# Webhooks - sistema de notificaciones salientes
# ---------------------------------------------------------------------------
class Webhook(Base, UUIDMixin, TimestampMixin):
    """Webhook configurado para un cliente/conexión."""
    __tablename__ = "webhooks"

    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    connection_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("integration_connections.id", ondelete="SET NULL"), index=True
    )

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    url: Mapped[str] = mapped_column(String(1000), nullable=False)
    secret: Mapped[str | None] = mapped_column(String(255))  # HMAC signing secret
    events: Mapped[str] = mapped_column(Text, nullable=False)
    # JSON array: ["document.emitted","document.voided","payment.received",...]
    headers: Mapped[str | None] = mapped_column(Text)
    # JSON: {"Authorization":"Bearer xxx","X-Custom":"value"}

    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    retry_interval_seconds: Mapped[int] = mapped_column(Integer, default=60, nullable=False)
    timeout_seconds: Mapped[int] = mapped_column(Integer, default=30, nullable=False)

    # Stats
    total_sent: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_failed: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    last_triggered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    last_status_code: Mapped[int | None] = mapped_column(Integer)
    last_error: Mapped[str | None] = mapped_column(Text)

    connection: Mapped["IntegrationConnection | None"] = relationship(back_populates="webhooks")
    logs: Mapped[list["WebhookLog"]] = relationship(
        back_populates="webhook", cascade="all, delete-orphan"
    )


class WebhookLog(Base, UUIDMixin):
    """Log de cada envío de webhook."""
    __tablename__ = "webhook_logs"

    webhook_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("webhooks.id", ondelete="CASCADE"), nullable=False, index=True
    )

    event: Mapped[str] = mapped_column(String(100), nullable=False)
    payload: Mapped[str] = mapped_column(Text, nullable=False)  # JSON
    url: Mapped[str] = mapped_column(String(1000), nullable=False)

    # Response
    status_code: Mapped[int | None] = mapped_column(Integer)
    response_body: Mapped[str | None] = mapped_column(Text)
    response_time_ms: Mapped[int | None] = mapped_column(Integer)

    # Retry info
    attempt: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    max_attempts: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    next_retry_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    status: Mapped[str] = mapped_column(String(20), default="pending", nullable=False)
    # pending, sent, failed, retrying, exhausted
    error_message: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False, index=True
    )

    webhook: Mapped["Webhook"] = relationship(back_populates="logs")


# ---------------------------------------------------------------------------
# Integration Errors - errores de integración trackados
# ---------------------------------------------------------------------------
class IntegrationError(Base, UUIDMixin):
    """Errores de integración para seguimiento y resolución."""
    __tablename__ = "integration_errors"

    client_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), nullable=False, index=True
    )
    connection_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("integration_connections.id", ondelete="SET NULL"), index=True
    )

    error_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    # CONN_TIMEOUT, AUTH_FAILED, MAPPING_ERROR, VALIDATION_ERROR, RATE_LIMIT,
    # DUPLICATE_NC, API_ERROR, SYNC_FAILED, WEBHOOK_FAILED, UNKNOWN
    category: Mapped[str] = mapped_column(String(30), nullable=False, index=True)
    # connection, authentication, mapping, validation, fiscal, sync, webhook, system
    severity: Mapped[str] = mapped_column(String(20), default="medium", nullable=False)
    # low, medium, high, critical

    title: Mapped[str] = mapped_column(String(300), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    stack_trace: Mapped[str | None] = mapped_column(Text)
    context_json: Mapped[str | None] = mapped_column(Text)
    # {"document_id":"...", "endpoint":"/emit", "request_body":"..."}

    # Resolución
    status: Mapped[str] = mapped_column(String(20), default="open", nullable=False, index=True)
    # open, investigating, resolved, ignored, auto_resolved
    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    resolved_by: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("users.id"))
    resolution_notes: Mapped[str | None] = mapped_column(Text)

    # Retry
    is_retryable: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    retry_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    max_retries: Mapped[int] = mapped_column(Integer, default=3, nullable=False)
    last_retry_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    # Agrupación (para evitar duplicados)
    fingerprint: Mapped[str | None] = mapped_column(String(64), index=True)
    occurrence_count: Mapped[int] = mapped_column(Integer, default=1, nullable=False)
    first_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_seen_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    connection: Mapped["IntegrationConnection | None"] = relationship(back_populates="errors")


# ---------------------------------------------------------------------------
# Monitoring Metrics - métricas de operación
# ---------------------------------------------------------------------------
class MonitoringMetric(Base, UUIDMixin):
    """Métricas de monitoreo para dashboards en tiempo real."""
    __tablename__ = "monitoring_metrics"

    client_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("clients.id", ondelete="CASCADE"), index=True
    )
    connection_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("integration_connections.id", ondelete="SET NULL"), index=True
    )

    metric_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # api_requests, documents_emitted, documents_voided, errors_count,
    # avg_response_time, sync_duration, webhook_deliveries, control_numbers_used
    metric_value: Mapped[float] = mapped_column(Float, nullable=False)
    metric_unit: Mapped[str] = mapped_column(String(20), default="count", nullable=False)
    # count, ms, seconds, bytes, percent
    tags: Mapped[str | None] = mapped_column(Text)
    # JSON: {"environment":"production","endpoint":"/emit"}

    period: Mapped[str] = mapped_column(String(20), default="minute", nullable=False)
    # minute, hourly, daily, weekly, monthly
    period_start: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), nullable=False, index=True
    )
    period_end: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    connection: Mapped["IntegrationConnection | None"] = relationship(back_populates="metrics")


# ---------------------------------------------------------------------------
# Integration Agents - Agentes IA por cliente para asistencia en integración
# ---------------------------------------------------------------------------
class IntegrationAgent(Base, UUIDMixin, TimestampMixin):
    """Agente IA asignado a un cliente para asistir su integración."""
    __tablename__ = "integration_agents"

    client_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("clients.id"), nullable=False, index=True)
    project_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("projects.id"))
    connection_id: Mapped[uuid.UUID | None] = mapped_column(ForeignKey("integration_connections.id"))

    # Agent identity
    agent_name: Mapped[str] = mapped_column(String(100), nullable=False)
    erp_type: Mapped[str] = mapped_column(String(50), nullable=False)
    # sap_b1, sap_hana, odoo, woocommerce, prestashop, shopify, profit_plus, saint, a2, valery, custom

    # Pre-loaded context for the agent
    client_context: Mapped[str | None] = mapped_column(Text)
    # JSON: {"razon_social": "...", "rif": "...", "erp_version": "...", "contact": "...", ...}
    integration_notes: Mapped[str | None] = mapped_column(Text)
    # Free text notes from admin about the client's integration needs
    custom_instructions: Mapped[str | None] = mapped_column(Text)
    # Extra instructions for the agent beyond the default system prompt

    # Agent capabilities
    can_read_code: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_write_code: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    can_test_connection: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    can_modify_mapping: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    # Status
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    # active, paused, archived

    # Usage tracking
    total_sessions: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_messages: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    total_tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    sessions: Mapped[list["AgentChatSession"]] = relationship(back_populates="agent", cascade="all, delete-orphan")


class AgentChatSession(Base, UUIDMixin):
    """Sesión de chat entre un usuario del cliente y su agente."""
    __tablename__ = "agent_chat_sessions"

    agent_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("integration_agents.id"), nullable=False, index=True)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    title: Mapped[str | None] = mapped_column(String(200))
    status: Mapped[str] = mapped_column(String(20), default="active", nullable=False)
    # active, closed

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    last_activity: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    message_count: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)

    # Relationships
    agent: Mapped["IntegrationAgent"] = relationship(back_populates="sessions")
    messages: Mapped[list["AgentChatMessage"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class AgentChatMessage(Base, UUIDMixin):
    """Mensaje individual en una sesión de chat con el agente."""
    __tablename__ = "agent_chat_messages"

    session_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("agent_chat_sessions.id"), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False)
    # user, assistant, system, tool_call, tool_result
    content: Mapped[str] = mapped_column(Text, nullable=False)

    # For tool use (future: when agent executes code/tests)
    tool_name: Mapped[str | None] = mapped_column(String(50))
    tool_input: Mapped[str | None] = mapped_column(Text)
    tool_output: Mapped[str | None] = mapped_column(Text)

    tokens_used: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    # Relationships
    session: Mapped["AgentChatSession"] = relationship(back_populates="messages")
