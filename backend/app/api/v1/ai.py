"""API de IA - Chat fiscal, análisis, reportes inteligentes, analytics."""
import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.core.deps import get_current_user, get_client_id_from_token
from app.models.security import User

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
