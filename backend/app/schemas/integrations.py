"""Schemas para integraciones, webhooks y monitoreo."""
import uuid
from datetime import datetime
from pydantic import BaseModel, Field, HttpUrl


# ---------------------------------------------------------------------------
# Integration Templates
# ---------------------------------------------------------------------------
class TemplateListItem(BaseModel):
    id: uuid.UUID
    code: str
    name: str
    description: str | None
    category: str
    version: str
    icon_url: str | None
    supports_sync: bool
    supports_webhook: bool
    supports_batch: bool
    supports_realtime: bool
    is_official: bool

    class Config:
        from_attributes = True


class TemplateDetail(TemplateListItem):
    auth_config: dict
    field_mapping: dict
    endpoint_mapping: dict
    default_config: dict
    transformation_rules: dict | None
    webhook_events: list[str] | None


# ---------------------------------------------------------------------------
# Integration Connections
# ---------------------------------------------------------------------------
class ConnectionCreate(BaseModel):
    template_id: uuid.UUID
    name: str = Field(min_length=3, max_length=200)
    project_id: uuid.UUID | None = None
    environment: str = Field(default="sandbox", pattern="^(sandbox|staging|production)$")


class ConnectionUpdate(BaseModel):
    name: str | None = None
    status: str | None = None
    environment: str | None = None
    system_base_url: str | None = None
    callback_url: str | None = None
    sync_enabled: bool | None = None
    sync_interval_seconds: int | None = None


class WizardStepData(BaseModel):
    """Datos de un paso del wizard de integración."""
    step: int = Field(ge=1, le=6)
    data: dict


class ConnectionResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    project_id: uuid.UUID | None
    template_id: uuid.UUID
    template_code: str | None = None
    template_name: str | None = None
    name: str
    status: str
    environment: str
    system_base_url: str | None
    callback_url: str | None
    sync_enabled: bool
    sync_interval_seconds: int
    last_sync_at: datetime | None
    health_status: str
    consecutive_failures: int
    total_documents_synced: int
    total_errors: int
    wizard_step: int
    wizard_completed: bool
    activated_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConnectionListResponse(BaseModel):
    items: list[ConnectionResponse]
    total: int


class ConnectionTestResult(BaseModel):
    success: bool
    latency_ms: int
    message: str
    details: dict | None = None


# ---------------------------------------------------------------------------
# Wizard Steps
# ---------------------------------------------------------------------------
class WizardStep1_SelectTemplate(BaseModel):
    """Paso 1: Selección de template."""
    template_id: uuid.UUID
    name: str = Field(min_length=3, max_length=200)
    environment: str = Field(default="sandbox")
    project_id: uuid.UUID | None = None


class WizardStep2_Credentials(BaseModel):
    """Paso 2: Configuración de credenciales."""
    system_base_url: str
    credentials: dict  # Dinámico según template: api_key, oauth tokens, etc.


class WizardStep3_FieldMapping(BaseModel):
    """Paso 3: Mapeo de campos."""
    field_mapping: dict  # Mapeo personalizado sobre el template base
    transformation_rules: dict | None = None


class WizardStep4_WebhookConfig(BaseModel):
    """Paso 4: Configuración de webhooks."""
    webhooks: list["WebhookCreate"] = []
    callback_url: str | None = None


class WizardStep5_SyncConfig(BaseModel):
    """Paso 5: Configuración de sincronización."""
    sync_enabled: bool = False
    sync_interval_seconds: int = 300
    initial_sync: bool = False  # Hacer sync inicial al activar


class WizardStep6_Test(BaseModel):
    """Paso 6: Test y activación."""
    activate: bool = False  # True para pasar directo a producción


# ---------------------------------------------------------------------------
# Webhooks
# ---------------------------------------------------------------------------
class WebhookCreate(BaseModel):
    name: str = Field(min_length=3, max_length=200)
    url: str = Field(max_length=1000)
    events: list[str] = Field(min_length=1)
    secret: str | None = None
    headers: dict | None = None
    connection_id: uuid.UUID | None = None
    retry_count: int = Field(default=3, ge=0, le=10)
    timeout_seconds: int = Field(default=30, ge=5, le=120)


class WebhookUpdate(BaseModel):
    name: str | None = None
    url: str | None = None
    events: list[str] | None = None
    secret: str | None = None
    headers: dict | None = None
    is_active: bool | None = None
    retry_count: int | None = None
    timeout_seconds: int | None = None


class WebhookResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    connection_id: uuid.UUID | None
    name: str
    url: str
    events: list[str]
    headers: dict | None
    is_active: bool
    retry_count: int
    timeout_seconds: int
    total_sent: int
    total_failed: int
    last_triggered_at: datetime | None
    last_status_code: int | None
    last_error: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class WebhookLogResponse(BaseModel):
    id: uuid.UUID
    webhook_id: uuid.UUID
    event: str
    status_code: int | None
    response_time_ms: int | None
    attempt: int
    max_attempts: int
    status: str
    error_message: str | None
    created_at: datetime

    class Config:
        from_attributes = True


class WebhookTestRequest(BaseModel):
    event: str = "test.ping"
    payload: dict | None = None


class WebhookTestResponse(BaseModel):
    success: bool
    status_code: int | None
    response_time_ms: int
    response_body: str | None
    error: str | None


# ---------------------------------------------------------------------------
# Integration Errors
# ---------------------------------------------------------------------------
class ErrorResponse(BaseModel):
    id: uuid.UUID
    client_id: uuid.UUID
    connection_id: uuid.UUID | None
    error_code: str
    category: str
    severity: str
    title: str
    message: str
    context_json: dict | None
    status: str
    resolved_at: datetime | None
    resolution_notes: str | None
    is_retryable: bool
    retry_count: int
    occurrence_count: int
    first_seen_at: datetime
    last_seen_at: datetime

    class Config:
        from_attributes = True


class ErrorListResponse(BaseModel):
    items: list[ErrorResponse]
    total: int
    open_count: int
    critical_count: int


class ErrorResolveRequest(BaseModel):
    resolution_notes: str = Field(min_length=5)
    status: str = Field(default="resolved", pattern="^(resolved|ignored)$")


class ErrorRetryRequest(BaseModel):
    error_ids: list[uuid.UUID] = Field(min_length=1)


# ---------------------------------------------------------------------------
# Monitoring
# ---------------------------------------------------------------------------
class MetricDataPoint(BaseModel):
    timestamp: datetime
    value: float


class MetricSeries(BaseModel):
    metric_name: str
    metric_unit: str
    data_points: list[MetricDataPoint]


class MonitoringDashboard(BaseModel):
    # Resumen global
    total_clients_active: int
    total_connections_active: int
    total_documents_today: int
    total_errors_open: int

    # Health overview
    connections_healthy: int
    connections_degraded: int
    connections_down: int

    # Métricas de tiempo real
    documents_per_hour: list[MetricDataPoint]
    errors_per_hour: list[MetricDataPoint]
    avg_response_time: list[MetricDataPoint]

    # Top errores
    top_errors: list[ErrorResponse]

    # Alertas activas
    alerts: list["AlertResponse"]


class AlertResponse(BaseModel):
    id: str
    severity: str
    title: str
    message: str
    connection_id: uuid.UUID | None
    client_name: str | None
    timestamp: datetime


class ClientHealthResponse(BaseModel):
    client_id: uuid.UUID
    client_name: str
    rif: str
    plan: str
    connections_count: int
    active_connections: int
    health_status: str  # healthy, degraded, critical
    documents_today: int
    documents_month: int
    errors_open: int
    control_numbers_remaining: int
    last_activity: datetime | None


class HealthOverviewResponse(BaseModel):
    clients: list[ClientHealthResponse]
    total: int


# Webhook events list
WEBHOOK_EVENTS = [
    "document.emitted",
    "document.voided",
    "document.updated",
    "control_number.assigned",
    "control_number.low",
    "payment.received",
    "client.activated",
    "client.suspended",
    "integration.connected",
    "integration.disconnected",
    "integration.error",
    "sync.started",
    "sync.completed",
    "sync.failed",
    "test.ping",
]
