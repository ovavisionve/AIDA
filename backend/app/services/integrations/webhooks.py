"""Servicio de Webhooks - dispatcher con retry y backoff exponencial."""
import json
import hashlib
import hmac
import logging
import time
from datetime import datetime, timezone, timedelta
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.integrations import Webhook, WebhookLog

logger = logging.getLogger(__name__)


async def dispatch_webhook(
    db: AsyncSession,
    client_id,
    event: str,
    payload: dict,
) -> int:
    """Envía un evento a todos los webhooks activos del cliente que escuchan este evento.
    Returns: número de webhooks notificados.
    """
    result = await db.execute(
        select(Webhook).where(
            Webhook.client_id == client_id,
            Webhook.is_active == True,
        )
    )
    webhooks = result.scalars().all()

    sent_count = 0
    for wh in webhooks:
        events_list = json.loads(wh.events) if wh.events else []
        if event not in events_list and "*" not in events_list:
            continue

        log = await _send_webhook(db, wh, event, payload)
        if log.status == "sent":
            sent_count += 1

    await db.flush()
    return sent_count


async def _send_webhook(
    db: AsyncSession,
    webhook: Webhook,
    event: str,
    payload: dict,
    attempt: int = 1,
) -> WebhookLog:
    """Envía un webhook individual y registra el resultado."""
    body = json.dumps({
        "event": event,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": payload,
    })

    # Generar firma HMAC si hay secret
    signature = None
    if webhook.secret:
        signature = hmac.new(
            webhook.secret.encode(),
            body.encode(),
            hashlib.sha256,
        ).hexdigest()

    start = time.monotonic()
    status_code = None
    response_body = None
    error_message = None
    status = "pending"

    try:
        # En producción: httpx.AsyncClient con timeout
        # headers = json.loads(webhook.headers) if webhook.headers else {}
        # headers["Content-Type"] = "application/json"
        # headers["X-AIDA-Event"] = event
        # headers["X-AIDA-Signature"] = signature or ""
        # headers["X-AIDA-Delivery"] = str(log_id)
        # async with httpx.AsyncClient(timeout=webhook.timeout_seconds) as client:
        #     response = await client.post(webhook.url, content=body, headers=headers)
        #     status_code = response.status_code
        #     response_body = response.text[:2000]

        # Simulación para framework:
        status_code = 200
        response_body = '{"received": true}'
        status = "sent"

    except Exception as e:
        error_message = str(e)[:1000]
        status = "failed"
        logger.warning(f"Webhook {webhook.id} falló (intento {attempt}): {e}")

    elapsed_ms = int((time.monotonic() - start) * 1000)

    # Determinar si necesita retry
    next_retry = None
    if status == "failed" and attempt < webhook.retry_count:
        # Backoff exponencial: 60s, 120s, 240s, ...
        delay = webhook.retry_interval_seconds * (2 ** (attempt - 1))
        next_retry = datetime.now(timezone.utc) + timedelta(seconds=delay)
        status = "retrying"

    if status == "failed" and attempt >= webhook.retry_count:
        status = "exhausted"

    log = WebhookLog(
        webhook_id=webhook.id,
        event=event,
        payload=body,
        url=webhook.url,
        status_code=status_code,
        response_body=response_body,
        response_time_ms=elapsed_ms,
        attempt=attempt,
        max_attempts=webhook.retry_count,
        next_retry_at=next_retry,
        status=status,
        error_message=error_message,
    )
    db.add(log)

    # Actualizar stats del webhook
    webhook.last_triggered_at = datetime.now(timezone.utc)
    webhook.last_status_code = status_code
    webhook.total_sent += 1
    if status in ("failed", "exhausted"):
        webhook.total_failed += 1
        webhook.last_error = error_message

    await db.flush()
    return log


async def retry_pending_webhooks(db: AsyncSession) -> int:
    """Reintenta webhooks pendientes cuyo next_retry_at ya pasó.
    Llamar periódicamente (cada 30s-60s) desde un task worker.
    """
    now = datetime.now(timezone.utc)
    result = await db.execute(
        select(WebhookLog).where(
            WebhookLog.status == "retrying",
            WebhookLog.next_retry_at <= now,
        ).limit(100)
    )
    pending_logs = result.scalars().all()

    retried = 0
    for log in pending_logs:
        wh_result = await db.execute(
            select(Webhook).where(Webhook.id == log.webhook_id)
        )
        webhook = wh_result.scalar_one_or_none()
        if not webhook or not webhook.is_active:
            log.status = "exhausted"
            continue

        payload = json.loads(log.payload)
        new_log = await _send_webhook(
            db, webhook, log.event, payload.get("data", {}),
            attempt=log.attempt + 1,
        )
        # Marcar log anterior como completado
        log.status = "retried"
        retried += 1

    await db.flush()
    return retried


async def test_webhook(
    db: AsyncSession,
    webhook: Webhook,
    event: str = "test.ping",
    payload: dict | None = None,
) -> dict:
    """Envía un test al webhook y retorna el resultado."""
    test_payload = payload or {
        "test": True,
        "message": "Test de conectividad desde AIDA",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }

    start = time.monotonic()
    try:
        # En producción: httpx real
        status_code = 200
        response_body = '{"ok": true}'
        error = None
        success = True
    except Exception as e:
        status_code = None
        response_body = None
        error = str(e)
        success = False

    elapsed = int((time.monotonic() - start) * 1000)

    return {
        "success": success,
        "status_code": status_code,
        "response_time_ms": elapsed,
        "response_body": response_body,
        "error": error,
    }
