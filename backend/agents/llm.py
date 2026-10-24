"""Centralized LLM Client for BharatEquity Multi-Agent System.

Supports:
- Local Ollama (e.g. Qwen3 4B)
- OpenAI, Google Gemini (via OpenAI compatibility), DeepSeek, vLLM
- Robust JSON extraction handling <think>...</think> reasoning tokens from reasoning models (Qwen, DeepSeek)
- Centralized timeout, retry, and connection failure handling
"""

import json
import logging
import os
import re
from typing import Any, Dict, List, Optional
import httpx

logger = logging.getLogger("bharatequity.llm")


class LLMConfig:
    @classmethod
    def get_provider(cls) -> str:
        return os.environ.get("LLM_PROVIDER", "ollama").lower()

    @classmethod
    def get_api_key(cls) -> Optional[str]:
        return (
            os.environ.get("LLM_API_KEY")
            or os.environ.get("OPENAI_API_KEY")
            or os.environ.get("GEMINI_API_KEY")
            or ("ollama" if cls.get_provider() == "ollama" else None)
        )

    @classmethod
    def get_base_url(cls) -> str:
        provider = cls.get_provider()
        if provider == "ollama":
            return os.environ.get("LLM_BASE_URL", "http://localhost:11434/v1").rstrip("/")
        return os.environ.get("LLM_BASE_URL", "https://api.openai.com/v1").rstrip("/")

    @classmethod
    def get_model(cls, tier: Optional[str] = None) -> str:
        provider = cls.get_provider()
        default_base = "qwen2.5:7b" if provider == "ollama" else "gpt-4o-mini"
        primary_model = os.environ.get("LLM_MODEL", default_base)

        tier_clean = (tier or "analyst").lower()
        if tier_clean in ("extractor", "classifier"):
            # IBM Granite for strict tabular fact extraction & classification
            granite_default = "granite3-dense:2b" if provider == "ollama" else primary_model
            return os.environ.get("LLM_MODEL_EXTRACTOR") or os.environ.get("GRANITE_MODEL") or granite_default
        elif tier_clean in ("reasoner", "challenger", "adversarial"):
            # DeepSeek-R1 for adversarial reasoning and critique
            deepseek_default = "deepseek-r1:7b" if provider == "ollama" else primary_model
            return os.environ.get("LLM_MODEL_REASONER") or os.environ.get("DEEPSEEK_MODEL") or deepseek_default
        else:
            # Qwen 2.5/3.5 for standard institutional analysis
            qwen_default = "qwen2.5:7b" if provider == "ollama" else primary_model
            return os.environ.get("LLM_MODEL_ANALYST") or os.environ.get("QWEN_MODEL") or primary_model

    @classmethod
    def get_temperature(cls) -> float:
        try:
            return float(os.environ.get("LLM_TEMPERATURE", "0.2"))
        except ValueError:
            return 0.2

    _configured_override: Optional[bool] = None

    @classmethod
    def set_configured(cls, val: Optional[bool]):
        cls._configured_override = val

    @classmethod
    def is_configured(cls) -> bool:
        if cls._configured_override is not None:
            return cls._configured_override
        provider = cls.get_provider()
        if provider == "ollama":
            return True
        key = cls.get_api_key()
        return bool(key and key.strip())


def sanitize_json_response(raw_text: str) -> str:
    """Extract valid JSON from LLM output, stripping reasoning tags (<think>...</think>)
    and markdown code blocks (```json ... ```).
    """
    cleaned = raw_text.strip()
    
    # Strip <think>...</think> tags emitted by reasoning models like DeepSeek-R1 and Qwen
    cleaned = re.sub(r"<think>[\s\S]*?</think>", "", cleaned, flags=re.IGNORECASE).strip()

    # Look for code block fences ```json ... ``` or ``` ... ```
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", cleaned)
    if match:
        cleaned = match.group(1).strip()
    else:
        # Find outermost { ... }
        brace_match = re.search(r"(\{[\s\S]*\})", cleaned)
        if brace_match:
            cleaned = brace_match.group(1).strip()

    return cleaned


async def call_llm(
    system_prompt: str,
    user_prompt: str,
    temperature: Optional[float] = None,
    response_format: Optional[str] = "json",
    timeout_sec: float = 60.0,
    model_tier: Optional[str] = "analyst",
    model: Optional[str] = None
) -> Dict[str, Any]:
    """Execute chat completion request using OpenAI-compatible HTTP client with multi-model tier routing.
    
    Supports:
    - model_tier="analyst" -> Qwen 2.5/3.5 (standard analysis)
    - model_tier="extractor" -> IBM Granite (zero-hallucination fact extraction)
    - model_tier="reasoner" -> DeepSeek-R1 (adversarial challenge)
    - Automatic fallback to primary model if specialized model fails or is uninstalled.
    """
    if not LLMConfig.is_configured():
        raise RuntimeError(
            "LLM is not configured. Set LLM_PROVIDER, LLM_API_KEY, and LLM_BASE_URL in backend/.env."
        )

    base_url = LLMConfig.get_base_url()
    api_key = LLMConfig.get_api_key() or "ollama"
    primary_model = LLMConfig.get_model("analyst")
    target_model = model or LLMConfig.get_model(model_tier)
    temp = temperature if temperature is not None else LLMConfig.get_temperature()

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    # Guide Qwen/local models with strict standard JSON schema guidance
    formatted_system = (
        f"{system_prompt}\n\n"
        "IMPORTANT: You MUST respond ONLY with a single valid JSON object formatted with these exact keys:\n"
        "{\n"
        '  "summary": "Brief 1-2 sentence executive summary of your analysis",\n'
        '  "findings": ["Detailed key finding 1", "Detailed key finding 2", "Detailed key finding 3"],\n'
        '  "supporting_evidence": ["Evidence point 1", "Evidence point 2"],\n'
        '  "assumptions": ["Underlying assumption 1"],\n'
        '  "missing_information": ["Missing data point or limitation"],\n'
        '  "confidence_score": 0.8,\n'
        '  "confidence_explanation": "Rationale for confidence rating",\n'
        '  "questions_for_investigation": ["Key follow-up question"],\n'
        '  "role_specific_data": {}\n'
        "}\n"
        "NOTE on 'role_specific_data':\n"
        "- If you are the Portfolio Manager, include: {\"conviction\": \"OVERWEIGHT\"|\"NEUTRAL\"|\"UNDERWEIGHT\", \"target_allocation_pct\": float (0.0 to 10.0)}.\n"
        "- If you are the Execution Trader, include: {\"entry_range_low\": float, \"entry_range_high\": float, \"invalidation_stop\": float, \"atr_buffer\": float, \"staged_tranches\": [string]}.\n"
        "- Otherwise, leave 'role_specific_data' as {}.\n"
        "Do NOT include preamble, conversational remarks, or markdown text outside the JSON block."
    )

    async def _execute_request(chosen_model: str) -> Dict[str, Any]:
        payload: Dict[str, Any] = {
            "model": chosen_model,
            "messages": [
                {"role": "system", "content": formatted_system},
                {"role": "user", "content": user_prompt}
            ],
            "temperature": temp
        }

        if response_format == "json":
            payload["response_format"] = {"type": "json_object"}

        async with httpx.AsyncClient(timeout=timeout_sec) as client:
            response = await client.post(
                f"{base_url}/chat/completions",
                headers=headers,
                json=payload
            )
            if response.status_code != 200:
                raise RuntimeError(
                    f"LLM Provider ({base_url}) returned error {response.status_code} for {chosen_model}: {response.text}"
                )

            data = response.json()
            content = data["choices"][0]["message"]["content"]

            if response_format == "json":
                cleaned = sanitize_json_response(content)
                try:
                    return json.loads(cleaned)
                except json.JSONDecodeError as decode_err:
                    logger.warning(f"Malformed JSON from model {chosen_model}: {content}")
                    raise ValueError(f"Model returned invalid JSON: {decode_err}") from decode_err
            return {"raw_text": content}

    # First try the target model (Granite / DeepSeek / Qwen)
    try:
        return await _execute_request(target_model)
    except Exception as primary_err:
        if target_model != primary_model:
            logger.warning(
                f"Specialized model tier '{model_tier}' ({target_model}) failed: {primary_err}. "
                f"Falling back to primary model '{primary_model}'."
            )
            try:
                return await _execute_request(primary_model)
            except Exception as fallback_err:
                raise fallback_err from primary_err
        raise primary_err

