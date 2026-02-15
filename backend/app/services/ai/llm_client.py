"""Cliente LLM multi-proveedor (Groq/Anthropic/OpenAI).

Usa el formato OpenAI-compatible que Groq implementa.
En producción se cambia a Anthropic simplemente ajustando AI_PROVIDER en .env.
"""
import json
import logging
import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)

settings = get_settings()


async def chat_completion(
    messages: list[dict],
    system_prompt: str | None = None,
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
    response_format: dict | None = None,
) -> dict:
    """Envía una solicitud de chat completion al LLM configurado.

    Args:
        messages: Lista de mensajes [{"role": "user", "content": "..."}]
        system_prompt: Prompt del sistema (se añade al inicio)
        model: Override del modelo
        temperature: Override de temperatura
        max_tokens: Override de max tokens
        response_format: {"type": "json_object"} para forzar JSON

    Returns:
        {"content": str, "usage": {"prompt_tokens": int, "completion_tokens": int}, "model": str}
    """
    _model = model or settings.AI_MODEL
    _temperature = temperature if temperature is not None else settings.AI_TEMPERATURE
    _max_tokens = max_tokens or settings.AI_MAX_TOKENS

    all_messages = []
    if system_prompt:
        all_messages.append({"role": "system", "content": system_prompt})
    all_messages.extend(messages)

    body: dict = {
        "model": _model,
        "messages": all_messages,
        "temperature": _temperature,
        "max_tokens": _max_tokens,
    }
    if response_format:
        body["response_format"] = response_format

    try:
        async with httpx.AsyncClient(timeout=60) as client:
            response = await client.post(
                f"{settings.AI_BASE_URL}/chat/completions",
                headers={
                    "Authorization": f"Bearer {settings.AI_API_KEY}",
                    "Content-Type": "application/json",
                },
                json=body,
            )
            response.raise_for_status()
            data = response.json()

            return {
                "content": data["choices"][0]["message"]["content"],
                "usage": data.get("usage", {}),
                "model": data.get("model", _model),
            }

    except httpx.HTTPStatusError as e:
        logger.error(f"LLM API error {e.response.status_code}: {e.response.text[:500]}")
        raise
    except Exception as e:
        logger.error(f"LLM client error: {e}")
        raise


async def chat_completion_stream(
    messages: list[dict],
    system_prompt: str | None = None,
    model: str | None = None,
    temperature: float | None = None,
    max_tokens: int | None = None,
):
    """Stream de chat completion para respuestas en tiempo real.

    Yields: chunks de texto
    """
    _model = model or settings.AI_MODEL
    _temperature = temperature if temperature is not None else settings.AI_TEMPERATURE
    _max_tokens = max_tokens or settings.AI_MAX_TOKENS

    all_messages = []
    if system_prompt:
        all_messages.append({"role": "system", "content": system_prompt})
    all_messages.extend(messages)

    body = {
        "model": _model,
        "messages": all_messages,
        "temperature": _temperature,
        "max_tokens": _max_tokens,
        "stream": True,
    }

    async with httpx.AsyncClient(timeout=120) as client:
        async with client.stream(
            "POST",
            f"{settings.AI_BASE_URL}/chat/completions",
            headers={
                "Authorization": f"Bearer {settings.AI_API_KEY}",
                "Content-Type": "application/json",
            },
            json=body,
        ) as response:
            response.raise_for_status()
            async for line in response.aiter_lines():
                if line.startswith("data: "):
                    data_str = line[6:]
                    if data_str.strip() == "[DONE]":
                        break
                    try:
                        chunk = json.loads(data_str)
                        delta = chunk["choices"][0].get("delta", {})
                        content = delta.get("content", "")
                        if content:
                            yield content
                    except (json.JSONDecodeError, KeyError, IndexError):
                        continue
