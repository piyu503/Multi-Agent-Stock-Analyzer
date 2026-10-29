export interface StockSummary {
  id?: number;
  symbol: string;
  company_name: string;
  exchange: string;
  sector?: string;
  industry?: string;
  isin?: string;
  scrip_code?: string;
  series?: string;
  is_active: boolean;
  is_prototype_data: boolean;
}

export interface StockDetail extends StockSummary {
  market_cap_category?: string;
  currency: string;
  description?: string;
  headquarters?: string;
  listing_date?: string;
  data_source: string;
  imported_at?: string;
}

export interface StocksSearchResponse {
  query: string;
  exchange?: string;
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  catalog_imported: boolean;
  message?: string;
  items: StockSummary[];
}

export interface ImportSummary {
  source_file: string;
  exchange: string;
  records_added: number;
  records_updated: number;
  records_skipped: number;
  duplicates_detected: number;
  invalid_rows: number;
  total_processed: number;
  timestamp: string;
  status: string;
  notes?: string;
}

export interface ReportSection {
  title: string;
  status: string;
  summary: string;
  key_points: string[];
}

export interface BullBearDebate {
  bull_case: string[];
  bear_case: string[];
  critical_swing_factors: string[];
}

export interface AgentOutput {
  agent_name: string;
  role: string;
  summary: string;
  findings: string[];
  supporting_evidence: string[];
  assumptions: string[];
  missing_information: string[];
  confidence_score: number;
  confidence_explanation: string;
  questions_for_investigation: string[];
  role_specific_data?: Record<string, any>;
  model_tier?: string;
  execution_status: string;
  execution_duration_sec: number;
  error_message?: string;
}

export interface TacticalExecutionPlan {
  entry_range_low?: number;
  entry_range_high?: number;
  invalidation_stop?: number;
  atr_buffer?: number;
  staged_tranches?: string[];
}

export interface ResearchReport {
  report_id: string;
  symbol: string;
  company_name: string;
  exchange: string;
  generated_at: string;
  status: string;
  is_prototype_demo: boolean;
  disclaimer: string;
  conviction?: string;
  target_allocation_pct?: number;
  execution_plan?: TacticalExecutionPlan;
  business_overview: ReportSection;
  financial_analysis: ReportSection;
  growth_prospects: ReportSection;
  valuation: ReportSection;
  risks: ReportSection;
  bull_vs_bear: BullBearDebate;
  final_assessment: ReportSection;
  agent_runs?: AgentOutput[];
}

export interface CatalogCoverage {
  total: number;
  with_scrip_code: number;
  with_sector: number;
  with_listing_date: number;
}

export interface HealthResponse {
  status: string;
  service: string;
  version: string;
  database: string;
  catalog_imported: boolean;
  total_listings: number;
  timestamp: string;
  catalog_coverage?: CatalogCoverage;
}


export interface User {
  id: number;
  email: string;
  name: string;
  picture?: string | null;
  auth_provider: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface SavedReportSummary {
  id: number;
  user_id: number;
  symbol: string;
  exchange: string;
  company_name: string;
  verdict: string;
  conviction?: string | null;
  target_price?: string | null;
  created_at: string;
}

export interface SavedReportDetail {
  id: number;
  user_id: number;
  symbol: string;
  exchange: string;
  company_name: string;
  verdict: string;
  conviction?: string | null;
  target_price?: string | null;
  report: ResearchReport;
  created_at: string;
}

export interface SaveReportPayload {
  symbol: string;
  exchange: string;
  company_name: string;
  verdict: string;
  conviction?: string | null;
  target_price?: string | null;
  report_data: ResearchReport;
}
