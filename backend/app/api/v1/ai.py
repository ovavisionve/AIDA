"""API de IA - Chat fiscal, análisis, reportes inteligentes, analytics, agent chat."""
import json
import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.deps import get_current_user, get_client_id_from_token
from app.models.security import User
from app.models.integrations import IntegrationAgent, AgentChatSession, AgentChatMessage

router = APIRouter()


# ---------------------------------------------------------------------------
# Schemas
# ---------------------------------------------------------------------------

class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=4000)
    conversation_history: list[dict] | None = None
    include_context: bool = True


class ChatResponse(BaseModel):
    response: str
    context_used: list[str] = []
    model: str
    usage: dict = {}


class AnalyzeDocumentRequest(BaseModel):
    document: dict


class AnalyzeDocumentResponse(BaseModel):
    analysis: str
    usage: dict = {}


class FiscalSummaryResponse(BaseModel):
    summary: str
    period: str
    raw_data: dict
    usage: dict = {}


class TaxOptimizationResponse(BaseModel):
    suggestions: str
    monthly_data: list[dict]
    usage: dict = {}


class AnalyticsResponse(BaseModel):
    period_days: int
    kpis: dict
    daily_trend: list[dict]
    tax_distribution: dict
    top_customers: list[dict]
    payment_distribution: list[dict]
    hourly_pattern: list[dict]
    prediction: dict
    control_numbers: dict


class InsightsResponse(BaseModel):
    insights: str
    analytics_summary: dict
    prediction: dict
    usage: dict = {}


class SalesBookResponse(BaseModel):
    report_type: str
    period: str
    generated_at: str
    summary: dict
    entries: list[dict]
    ai_analysis: str | None = None


class TaxSummaryResponse(BaseModel):
    report_type: str
    period: str
    generated_at: str
    ventas: dict
    notas_credito: dict
    notas_debito: dict
    resumen_iva: dict
    ai_recommendations: str | None = None


class ClientReportResponse(BaseModel):
    report_type: str
    customer_rif: str
    generated_at: str
    year: int
    summary: dict
    monthly_detail: list[dict]


# ---------------------------------------------------------------------------
# Chat fiscal
# ---------------------------------------------------------------------------

@router.post("/chat", response_model=ChatResponse)
async def chat_fiscal(
    body: ChatRequest,
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Chat con el asistente fiscal IA, enriquecido con datos de la cuenta."""
    from app.services.ai.fiscal_assistant import chat_with_context

    try:
        result = await chat_with_context(
            db=db,
            client_id=client_id,
            user_message=body.message,
            conversation_history=body.conversation_history,
            include_account_context=body.include_context,
        )
        return ChatResponse(
            response=result["response"],
            context_used=result.get("context_used", []),
            model=result.get("model", ""),
            usage=result.get("usage", {}),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error del servicio de IA: {str(e)}")


@router.post("/chat/stream")
async def chat_fiscal_stream(
    body: ChatRequest,
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Chat streaming con el asistente fiscal (Server-Sent Events)."""
    from app.services.ai.fiscal_assistant import FISCAL_SYSTEM_PROMPT, _build_account_context, _detect_query_context
    from app.services.ai.llm_client import chat_completion_stream

    # Build context
    system = FISCAL_SYSTEM_PROMPT
    context_parts = []
    if body.include_context and client_id:
        account_ctx = await _build_account_context(db, client_id)
        if account_ctx:
            context_parts.append(account_ctx)
        query_ctx = await _detect_query_context(body.message, db, client_id)
        if query_ctx:
            context_parts.append(query_ctx)

    if context_parts:
        system += "\n\n--- CONTEXTO DE LA CUENTA ---\n" + "\n".join(context_parts)

    messages = []
    if body.conversation_history:
        messages.extend(body.conversation_history[-10:])
    messages.append({"role": "user", "content": body.message})

    async def event_generator():
        try:
            async for chunk in chat_completion_stream(
                messages=messages,
                system_prompt=system,
                temperature=0.3,
            ):
                yield f"data: {chunk}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ---------------------------------------------------------------------------
# Análisis de documentos
# ---------------------------------------------------------------------------

@router.post("/analyze-document", response_model=AnalyzeDocumentResponse)
async def analyze_document(
    body: AnalyzeDocumentRequest,
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Analiza un documento fiscal con IA (valida campos, cálculos, normativa)."""
    from app.services.ai.fiscal_assistant import analyze_document as analyze

    try:
        result = await analyze(db=db, client_id=client_id, document_data=body.document)
        return AnalyzeDocumentResponse(
            analysis=result["analysis"],
            usage=result.get("usage", {}),
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error al analizar documento: {str(e)}")


# ---------------------------------------------------------------------------
# Resumen fiscal
# ---------------------------------------------------------------------------

@router.get("/fiscal-summary", response_model=FiscalSummaryResponse)
async def fiscal_summary(
    period: str = Query("month", regex="^(week|month|year)$"),
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Genera un resumen fiscal inteligente del período con análisis IA."""
    from app.services.ai.fiscal_assistant import generate_fiscal_summary

    if not client_id:
        raise HTTPException(status_code=400, detail="Se requiere client_id en el token")
    try:
        result = await generate_fiscal_summary(db=db, client_id=client_id, period=period)
        return FiscalSummaryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error generando resumen: {str(e)}")


# ---------------------------------------------------------------------------
# Optimización fiscal
# ---------------------------------------------------------------------------

@router.get("/tax-optimization", response_model=TaxOptimizationResponse)
async def tax_optimization(
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Sugerencias de optimización fiscal basadas en patrones de facturación (3 meses)."""
    from app.services.ai.fiscal_assistant import suggest_tax_optimization

    if not client_id:
        raise HTTPException(status_code=400, detail="Se requiere client_id en el token")
    try:
        result = await suggest_tax_optimization(db=db, client_id=client_id)
        return TaxOptimizationResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error generando optimización: {str(e)}")


# ---------------------------------------------------------------------------
# Analytics avanzado
# ---------------------------------------------------------------------------

@router.get("/analytics", response_model=AnalyticsResponse)
async def advanced_analytics(
    period_days: int = Query(90, ge=7, le=365),
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Dashboard de analytics avanzado con KPIs, tendencias, predicciones."""
    from app.services.ai.analytics import get_advanced_analytics

    if not client_id:
        raise HTTPException(status_code=400, detail="Se requiere client_id en el token")
    try:
        result = await get_advanced_analytics(db=db, client_id=client_id, period_days=period_days)
        return AnalyticsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error en analytics: {str(e)}")


@router.get("/insights", response_model=InsightsResponse)
async def ai_insights(
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Genera insights accionables con IA basados en los datos del cliente."""
    from app.services.ai.analytics import get_ai_insights

    if not client_id:
        raise HTTPException(status_code=400, detail="Se requiere client_id en el token")
    try:
        result = await get_ai_insights(db=db, client_id=client_id)
        return InsightsResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error generando insights: {str(e)}")


# ---------------------------------------------------------------------------
# Reportes inteligentes
# ---------------------------------------------------------------------------

@router.get("/reports/sales-book", response_model=SalesBookResponse)
async def sales_book_report(
    year: int = Query(..., ge=2020, le=2030),
    month: int = Query(..., ge=1, le=12),
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Genera el Libro de Ventas del período con análisis IA."""
    from app.services.ai.reports import generate_sales_book

    if not client_id:
        raise HTTPException(status_code=400, detail="Se requiere client_id en el token")
    try:
        result = await generate_sales_book(db=db, client_id=client_id, year=year, month=month)
        return SalesBookResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error generando libro de ventas: {str(e)}")


@router.get("/reports/tax-summary", response_model=TaxSummaryResponse)
async def tax_summary_report(
    year: int = Query(..., ge=2020, le=2030),
    month: int = Query(..., ge=1, le=12),
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Genera resumen de IVA para declaración con recomendaciones IA."""
    from app.services.ai.reports import generate_tax_summary

    if not client_id:
        raise HTTPException(status_code=400, detail="Se requiere client_id en el token")
    try:
        result = await generate_tax_summary(db=db, client_id=client_id, year=year, month=month)
        return TaxSummaryResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error generando resumen IVA: {str(e)}")


@router.get("/reports/client/{customer_rif}", response_model=ClientReportResponse)
async def client_report(
    customer_rif: str,
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Reporte detallado de un cliente final específico."""
    from app.services.ai.reports import generate_client_report

    if not client_id:
        raise HTTPException(status_code=400, detail="Se requiere client_id en el token")
    try:
        result = await generate_client_report(db=db, client_id=client_id, customer_rif=customer_rif)
        return ClientReportResponse(**result)
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error generando reporte: {str(e)}")


# ---------------------------------------------------------------------------
# Agent Chat - Chat con agente IA de integración por cliente
# ---------------------------------------------------------------------------

AGENT_SYSTEM_PROMPT = """Eres un agente de integración de AIDA, la plataforma de facturación electrónica venezolana.

Tu rol es asistir al cliente en la integración de su sistema ERP con la API de AIDA.

**Contexto del cliente:**
{client_context}

**Notas de integración:**
{integration_notes}

**Tipo de ERP:** {erp_type} ({erp_display})

**Instrucciones adicionales:**
{custom_instructions}

**Capacidades habilitadas:**
- Leer código de integración: {can_read_code}
- Escribir código: {can_write_code}
- Probar conexión: {can_test_connection}
- Modificar mapeo: {can_modify_mapping}

**Guías generales:**
1. Habla siempre en español
2. Sé conciso pero completo en tus respuestas
3. Proporciona ejemplos de código cuando sea útil (cURL, Python, JavaScript, PHP según el ERP)
4. Explica los endpoints de AIDA relevantes para cada paso
5. Si el cliente pregunta algo fuera del alcance de integración, redirige amablemente
6. Recuerda que la API de AIDA usa:
   - Autenticación por API Key (header X-API-Key)
   - Base URL: /api/v1/fiscal/
   - Endpoints principales: /invoices (facturas), /credit-notes, /debit-notes
   - Formato JSON para request/response
   - Números de control asignados automáticamente al emitir

**API Reference resumida:**
- POST /api/v1/fiscal/invoices - Crear factura
- POST /api/v1/fiscal/credit-notes - Crear nota de crédito
- POST /api/v1/fiscal/debit-notes - Crear nota de débito
- GET /api/v1/fiscal/documents - Listar documentos
- GET /api/v1/fiscal/documents/{id}/pdf - Descargar PDF
- GET /api/v1/fiscal/documents/{id}/xml - Descargar XML
- GET /api/v1/fiscal/tax-rates - Tasas de IVA vigentes
"""


class AgentChatRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=8000)
    session_id: str | None = None
    conversation_history: list[dict] | None = None


class AgentChatResponse(BaseModel):
    response: str
    session_id: str
    model: str = ""
    usage: dict = {}


@router.get("/agent/detect")
async def detect_agent(
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Detect if the user's client has an active integration agent."""
    if not client_id:
        return {"has_agent": False}

    result = await db.execute(
        select(IntegrationAgent).where(
            IntegrationAgent.client_id == client_id,
            IntegrationAgent.status == "active",
        ).limit(1)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        return {"has_agent": False}

    return {
        "has_agent": True,
        "agent_id": str(agent.id),
        "agent_name": agent.agent_name,
        "erp_type": agent.erp_type,
    }


@router.get("/agent/sessions")
async def list_my_agent_sessions(
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """List the current user's agent chat sessions."""
    if not client_id:
        raise HTTPException(status_code=400, detail="Se requiere client_id")

    result = await db.execute(
        select(IntegrationAgent).where(
            IntegrationAgent.client_id == client_id,
            IntegrationAgent.status == "active",
        ).limit(1)
    )
    agent = result.scalar_one_or_none()
    if not agent:
        return {"sessions": []}

    sessions_q = await db.execute(
        select(AgentChatSession).where(
            AgentChatSession.agent_id == agent.id,
            AgentChatSession.user_id == user.id,
        ).order_by(AgentChatSession.last_activity.desc()).limit(20)
    )
    sessions = sessions_q.scalars().all()

    return {
        "sessions": [
            {
                "id": str(s.id),
                "title": s.title or "Nueva conversación",
                "status": s.status,
                "message_count": s.message_count,
                "started_at": s.started_at.isoformat(),
                "last_activity": s.last_activity.isoformat(),
            }
            for s in sessions
        ]
    }


@router.post("/agent/chat", response_model=AgentChatResponse)
async def agent_chat(
    body: AgentChatRequest,
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Chat with the client's integration agent (non-streaming)."""
    from app.services.ai.llm_client import chat_completion

    if not client_id:
        raise HTTPException(status_code=400, detail="Se requiere client_id en el token")

    # Find agent
    agent_q = await db.execute(
        select(IntegrationAgent).where(
            IntegrationAgent.client_id == client_id,
            IntegrationAgent.status == "active",
        ).limit(1)
    )
    agent = agent_q.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="No hay agente de integración activo para este cliente")

    # Get or create session
    session = None
    if body.session_id:
        sess_q = await db.execute(
            select(AgentChatSession).where(
                AgentChatSession.id == uuid.UUID(body.session_id),
                AgentChatSession.user_id == user.id,
            )
        )
        session = sess_q.scalar_one_or_none()

    if not session:
        session = AgentChatSession(
            agent_id=agent.id,
            user_id=user.id,
            title=body.message[:100],
            status="active",
        )
        db.add(session)
        await db.flush()

    # Build system prompt
    erp_types_map = {
        "sap_b1": "SAP Business One", "sap_hana": "SAP S/4HANA", "odoo": "Odoo",
        "profit_plus": "Profit Plus", "saint": "Saint", "a2": "A2 Softway",
        "valery": "Valery", "woocommerce": "WooCommerce", "prestashop": "PrestaShop",
        "shopify": "Shopify", "api_directa": "API Directa", "custom": "Personalizado",
    }
    system_prompt = AGENT_SYSTEM_PROMPT.format(
        client_context=agent.client_context or "No disponible",
        integration_notes=agent.integration_notes or "Ninguna",
        erp_type=agent.erp_type,
        erp_display=erp_types_map.get(agent.erp_type, agent.erp_type),
        custom_instructions=agent.custom_instructions or "Ninguna",
        can_read_code="Sí" if agent.can_read_code else "No",
        can_write_code="Sí" if agent.can_write_code else "No",
        can_test_connection="Sí" if agent.can_test_connection else "No",
        can_modify_mapping="Sí" if agent.can_modify_mapping else "No",
    )

    # Build messages from session history or request
    messages = []
    if body.conversation_history:
        messages.extend(body.conversation_history[-20:])
    else:
        # Load from DB
        hist_q = await db.execute(
            select(AgentChatMessage).where(
                AgentChatMessage.session_id == session.id,
                AgentChatMessage.role.in_(["user", "assistant"]),
            ).order_by(AgentChatMessage.timestamp.desc()).limit(20)
        )
        history = list(reversed(hist_q.scalars().all()))
        for m in history:
            messages.append({"role": m.role, "content": m.content})

    messages.append({"role": "user", "content": body.message})

    try:
        result = await chat_completion(
            messages=messages,
            system_prompt=system_prompt,
            temperature=0.4,
            max_tokens=4000,
        )

        # Save messages to DB
        db.add(AgentChatMessage(
            session_id=session.id, role="user",
            content=body.message, tokens_used=0,
        ))
        db.add(AgentChatMessage(
            session_id=session.id, role="assistant",
            content=result["content"],
            tokens_used=result.get("usage", {}).get("completion_tokens", 0),
        ))

        # Update counters
        session.message_count += 2
        session.tokens_used += result.get("usage", {}).get("total_tokens", 0)
        session.last_activity = datetime.now(timezone.utc)

        agent.total_messages += 2
        agent.total_tokens_used += result.get("usage", {}).get("total_tokens", 0)

        await db.commit()

        return AgentChatResponse(
            response=result["content"],
            session_id=str(session.id),
            model=result.get("model", ""),
            usage=result.get("usage", {}),
        )

    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Error del servicio de IA: {str(e)}")


@router.post("/agent/chat/stream")
async def agent_chat_stream(
    body: AgentChatRequest,
    user: User = Depends(get_current_user),
    client_id: uuid.UUID | None = Depends(get_client_id_from_token),
    db: AsyncSession = Depends(get_db),
):
    """Streaming chat with the client's integration agent (SSE)."""
    from app.services.ai.llm_client import chat_completion_stream

    if not client_id:
        raise HTTPException(status_code=400, detail="Se requiere client_id en el token")

    agent_q = await db.execute(
        select(IntegrationAgent).where(
            IntegrationAgent.client_id == client_id,
            IntegrationAgent.status == "active",
        ).limit(1)
    )
    agent = agent_q.scalar_one_or_none()
    if not agent:
        raise HTTPException(status_code=404, detail="No hay agente de integración activo")

    # Get or create session
    session = None
    if body.session_id:
        sess_q = await db.execute(
            select(AgentChatSession).where(
                AgentChatSession.id == uuid.UUID(body.session_id),
                AgentChatSession.user_id == user.id,
            )
        )
        session = sess_q.scalar_one_or_none()

    if not session:
        session = AgentChatSession(
            agent_id=agent.id,
            user_id=user.id,
            title=body.message[:100],
            status="active",
        )
        db.add(session)
        await db.flush()

    session_id = str(session.id)

    # Save user message
    db.add(AgentChatMessage(
        session_id=session.id, role="user",
        content=body.message, tokens_used=0,
    ))
    session.message_count += 1
    session.last_activity = datetime.now(timezone.utc)
    await db.commit()

    # Build system prompt
    erp_types_map = {
        "sap_b1": "SAP Business One", "sap_hana": "SAP S/4HANA", "odoo": "Odoo",
        "profit_plus": "Profit Plus", "saint": "Saint", "a2": "A2 Softway",
        "valery": "Valery", "woocommerce": "WooCommerce", "prestashop": "PrestaShop",
        "shopify": "Shopify", "api_directa": "API Directa", "custom": "Personalizado",
    }
    system_prompt = AGENT_SYSTEM_PROMPT.format(
        client_context=agent.client_context or "No disponible",
        integration_notes=agent.integration_notes or "Ninguna",
        erp_type=agent.erp_type,
        erp_display=erp_types_map.get(agent.erp_type, agent.erp_type),
        custom_instructions=agent.custom_instructions or "Ninguna",
        can_read_code="Sí" if agent.can_read_code else "No",
        can_write_code="Sí" if agent.can_write_code else "No",
        can_test_connection="Sí" if agent.can_test_connection else "No",
        can_modify_mapping="Sí" if agent.can_modify_mapping else "No",
    )

    # Build messages
    messages = []
    if body.conversation_history:
        messages.extend(body.conversation_history[-20:])
    else:
        hist_q = await db.execute(
            select(AgentChatMessage).where(
                AgentChatMessage.session_id == session.id,
                AgentChatMessage.role.in_(["user", "assistant"]),
            ).order_by(AgentChatMessage.timestamp.desc()).limit(20)
        )
        history = list(reversed(hist_q.scalars().all()))
        for m in history:
            messages.append({"role": m.role, "content": m.content})

    messages.append({"role": "user", "content": body.message})

    async def event_generator():
        full_response = ""
        try:
            async for chunk in chat_completion_stream(
                messages=messages,
                system_prompt=system_prompt,
                temperature=0.4,
                max_tokens=4000,
            ):
                full_response += chunk
                yield f"data: {chunk}\n\n"
            yield f"data: [DONE]\n\n"
            yield f"data: [SESSION_ID:{session_id}]\n\n"
        except Exception as e:
            yield f"data: [ERROR] {str(e)}\n\n"

        # Save assistant message after streaming completes
        if full_response:
            try:
                from app.database import async_session
                async with async_session() as save_db:
                    save_db.add(AgentChatMessage(
                        session_id=uuid.UUID(session_id), role="assistant",
                        content=full_response, tokens_used=0,
                    ))
                    sess_q = await save_db.execute(
                        select(AgentChatSession).where(AgentChatSession.id == uuid.UUID(session_id))
                    )
                    sess = sess_q.scalar_one_or_none()
                    if sess:
                        sess.message_count += 1
                        sess.last_activity = datetime.now(timezone.utc)
                    agent_q = await save_db.execute(
                        select(IntegrationAgent).where(IntegrationAgent.id == agent.id)
                    )
                    ag = agent_q.scalar_one_or_none()
                    if ag:
                        ag.total_messages += 2
                    await save_db.commit()
            except Exception:
                pass

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
