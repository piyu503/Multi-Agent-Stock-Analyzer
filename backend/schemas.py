"""Pydantic schemas for the Indian Stock Research Platform API."""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class CatalogCoverage(BaseModel):
    total: int = 0
    with_scrip_code: int = 0
    with_sector: int = 0
    with_listing_date: int = 0


class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    database: str
    catalog_imported: bool = Field(False, description="Whether official exchange catalog has been imported")
    total_listings: int = Field(0, description="Total active listings across exchanges")
    timestamp: str
    catalog_coverage: Optional[CatalogCoverage] = None


class StockSummary(BaseModel):
    id: Optional[int] = Field(None, description="Internal primary key")
    symbol: str = Field(..., description="Exchange trading symbol, e.g. RELIANCE, TCS, 500325")
    company_name: str = Field(..., description="Registered legal/trade name")
    exchange: str = Field(..., description="Exchange, e.g. NSE / BSE")
    scrip_code: Optional[str] = Field(None, description="Official 6-digit BSE Scrip Code if available")
    sector: Optional[str] = Field(None, description="Industry sector")
    industry: Optional[str] = Field(None, description="Industry classification")
    isin: Optional[str] = Field(None, description="ISIN number")
    series: Optional[str] = Field("EQ", description="Security series or group, e.g. EQ, BE, A, B")
    is_active: bool = Field(True, description="Active listing status")
    is_prototype_data: bool = Field(True, description="Flag indicating seed/mock dataset vs live terminal feed")


class StockDetail(StockSummary):
    market_cap_category: Optional[str] = Field(None, description="Large Cap, Mid Cap, Small Cap")
    currency: str = Field("INR", description="Trading currency")
    description: Optional[str] = Field(None, description="Brief overview of the business")
    headquarters: Optional[str] = Field(None, description="Location of headquarters")
    listing_date: Optional[str] = Field(None, description="Initial listing date")
    data_source: str = Field("Prototype Seed Catalog (Mock)", description="Transparency attribution")
    imported_at: Optional[str] = Field(None, description="Catalog import timestamp")


class StocksSearchResponse(BaseModel):
    query: str
    exchange: Optional[str] = None
    total: int
    page: int = 1
    page_size: int = 20
    total_pages: int = 1
    catalog_imported: bool = False
    message: Optional[str] = None
    items: List[StockSummary]


class ImportSummary(BaseModel):
    source_file: str
    exchange: str
    records_added: int
    records_updated: int
    records_skipped: int
    duplicates_detected: int
    invalid_rows: int
    total_processed: int
    timestamp: str
    status: str = "success"
    notes: Optional[str] = None


class ReportSection(BaseModel):
    title: str
    status: str = Field("prototype_demo", description="demo, generated, or pending")
    summary: str
    key_points: List[str] = Field(default_factory=list)


class BullBearDebate(BaseModel):
    bull_case: List[str] = Field(default_factory=list)
    bear_case: List[str] = Field(default_factory=list)
    critical_swing_factors: List[str] = Field(default_factory=list)


class TacticalExecutionPlan(BaseModel):
    entry_range_low: Optional[float] = None
    entry_range_high: Optional[float] = None
    invalidation_stop: Optional[float] = None
    atr_buffer: Optional[float] = None
    staged_tranches: List[str] = Field(default_factory=list)


class ResearchReport(BaseModel):
    report_id: str
    symbol: str
    company_name: str
    exchange: str
    generated_at: str
    status: str = "demo"
    is_prototype_demo: bool = True
    disclaimer: str = (
        "PROTOTYPE DEMO REPORT: Synthesized for development and interface validation only. "
        "Does not constitute genuine financial advice, live metrics, or verified agent synthesis."
    )
    conviction: Optional[str] = Field("NEUTRAL", description="OVERWEIGHT, NEUTRAL, or UNDERWEIGHT")
    target_allocation_pct: Optional[float] = Field(None, description="Suggested portfolio sizing, e.g. 1.0 to 5.0%")
    execution_plan: Optional[TacticalExecutionPlan] = None
    business_overview: ReportSection
    financial_analysis: ReportSection
    growth_prospects: ReportSection
    valuation: ReportSection
    risks: ReportSection
    bull_vs_bear: BullBearDebate
    final_assessment: ReportSection
    agent_runs: Optional[List[Dict[str, Any]]] = Field(default_factory=list, description="Audit manifest of all 13 specialized agent outputs")


# ============================================================================
# AUTHENTICATION & USER REPORT SCHEMAS
# ============================================================================

class UserLoginRequest(BaseModel):
    email: str = Field(..., description="Registered email address")
    password: str = Field(..., min_length=6, description="User password (min 6 characters)")


class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=60, description="Full user name")
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6, max_length=128, description="Password (min 6 characters)")


class GoogleAuthRequest(BaseModel):
    email: str = Field(..., description="Verified Google account email")
    name: str = Field(..., description="Google profile name")
    picture: Optional[str] = Field(None, description="Google profile avatar URL")
    credential: Optional[str] = Field(None, description="Optional Google ID token credential")


class UserProfileResponse(BaseModel):
    id: int
    email: str
    name: str
    picture: Optional[str] = None
    auth_provider: str = "local"


class AuthTokenResponse(BaseModel):
    token: str
    user: UserProfileResponse


class SavedReportSummary(BaseModel):
    id: int
    user_id: int
    symbol: str
    exchange: str
    company_name: str
    verdict: str
    conviction: Optional[str] = None
    target_price: Optional[str] = None
    created_at: str


class SaveReportRequest(BaseModel):
    symbol: str
    exchange: str = "NSE"
    company_name: str
    verdict: str
    conviction: Optional[str] = None
    target_price: Optional[str] = None
    report_data: Dict[str, Any]
