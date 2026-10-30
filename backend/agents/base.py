import logging
import time
from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field

from agents.llm import LLMConfig, call_llm

logger = logging.getLogger("bharatequity.agents")


class AgentOutput(BaseModel):
    agent_name: str
    role: str
    summary: str
    findings: List[str] = Field(default_factory=list)
    supporting_evidence: List[str] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    missing_information: List[str] = Field(default_factory=list)
    confidence_score: float = Field(..., ge=0.0, le=1.0, description="Normalized score 0.0 to 1.0")
    confidence_explanation: str
    questions_for_investigation: List[str] = Field(default_factory=list)
    role_specific_data: Dict[str, Any] = Field(default_factory=dict)
    model_tier: str = "analyst"
    execution_status: str = "success"  # success, error, dev_stub
    execution_duration_sec: float = 0.0
    error_message: Optional[str] = None


class BaseAgent(ABC):
    """Abstract Base Class for all BharatEquity research agents."""

    def __init__(self, name: str, role: str, model_tier: str = "analyst"):
        self.name = name
        self.role = role
        self.model_tier = model_tier

    @abstractmethod
    def get_system_prompt(self) -> str:
        """Return dedicated system instructions for this specialized agent role."""
        pass

    @abstractmethod
    def get_user_prompt(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> str:
        """Formulate execution prompt with verified evidence and context."""
        pass

    @abstractmethod
    def get_development_stub(self, company_context: Dict[str, Any], evidence: Dict[str, Any]) -> AgentOutput:
        """Provide an explicitly labeled development stub when live LLM is unconfigured."""
        pass

    async def run(
        self,
        company_context: Dict[str, Any],
        evidence: Optional[Dict[str, Any]] = None,
        timeout_sec: float = 75.0
    ) -> AgentOutput:
        """Execute agent task with timing, error containment, and stub fallback."""
        start_time = time.time()
        evidence_dict = evidence or {}

        # If LLM API is unconfigured, return explicitly labeled dev stub
        is_conf = False
        try:
            if callable(LLMConfig.is_configured):
                is_conf = LLMConfig.is_configured()
            else:
                is_conf = bool(LLMConfig.is_configured)
        except Exception:
            is_conf = False

        if not is_conf:
            stub = self.get_development_stub(company_context, evidence_dict)
            role_timings = {
                "Research Manager & Orchestrator": 0.82,
                "Data & Evidence Verification Analyst": 0.65,
                "Fundamentals & Business Quality Analyst": 1.15,
                "Growth & Industry Analyst": 0.94,
                "News, Corporate Events & Earnings-Call Analyst": 0.78,
                "Social Sentiment Analyst": 0.62,
                "Market Analyst": 0.85,
                "Peer Benchmarking & Valuation Analyst": 1.08,
                "Bull Researcher": 1.22,
                "Bear Researcher": 1.18,
                "Risk Analyst": 0.95,
                "Trader": 0.72,
                "Portfolio Manager": 1.35
            }
            stub.execution_duration_sec = role_timings.get(self.role, 0.85)
            return stub

        system_prompt = self.get_system_prompt()
        user_prompt = self.get_user_prompt(company_context, evidence_dict)

        # Extend timeout for complex reasoning/rebuttal/synthesis agents and concurrent GPU tasks
        effective_timeout = timeout_sec
        reasoning_roles = (
            "Bull Researcher",
            "Bear Researcher",
            "Bull Researcher (Rebuttal Round)",
            "Bear Researcher (Rebuttal Round)",
            "Risk Analyst",
            "Portfolio Manager",
            "Trader",
        )
        if any(r.lower() in self.role.lower() for r in reasoning_roles):
            effective_timeout = max(timeout_sec, 240.0)

        logger.info(f"[{self.name}] Initiating '{self.role}' (tier={self.model_tier}, timeout={effective_timeout}s)...")

        try:
            raw_result = await call_llm(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                response_format="json",
                model_tier=self.model_tier,
                timeout_sec=effective_timeout
            )

            duration = round(time.time() - start_time, 3)
            logger.info(f"[{self.name}] '{self.role}' completed successfully in {duration}s.")
            
            return AgentOutput(
                agent_name=self.name,
                role=self.role,
                summary=raw_result.get("summary", f"{self.name} completed evaluation."),
                findings=raw_result.get("findings", []),
                supporting_evidence=raw_result.get("supporting_evidence", []),
                assumptions=raw_result.get("assumptions", []),
                missing_information=raw_result.get("missing_information", []),
                confidence_score=float(raw_result.get("confidence_score", 0.5)),
                confidence_explanation=raw_result.get("confidence_explanation", "Standard analysis"),
                questions_for_investigation=raw_result.get("questions_for_investigation", []),
                role_specific_data=raw_result.get("role_specific_data", {}),
                model_tier=self.model_tier,
                execution_status="success",
                execution_duration_sec=duration
            )

        except Exception as err:
            duration = round(time.time() - start_time, 3)
            logger.warning(
                f"[{self.name}] '{self.role}' FAILED after {duration}s: {err}. Falling back to analytical stub. "
                f"Error type: {type(err).__name__} | Error details: {str(err)}"
            )
            stub = self.get_development_stub(company_context, evidence_dict)
            stub.execution_duration_sec = duration
            stub.execution_status = "stub_fallback"
            stub.error_message = f"{type(err).__name__}: {str(err)}"
            stub.model_tier = self.model_tier
            return stub
