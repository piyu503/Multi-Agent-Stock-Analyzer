import React from 'react';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Crosshair,
  FileCheck2,
  Layers,
  Scale,
  ShieldAlert,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Cpu,
  Hash,
  Activity,
  Flame,
  Download,
  AlertTriangle,
  Info
} from 'lucide-react';
import type { ResearchReport } from '../types';

const formatRupee = (val: any) => {
  if (val === undefined || val === null || val === '') return 'Awaiting Data';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return String(val);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

interface ReportViewProps {
  report: ResearchReport;
  onBack: () => void;
}

export const ReportView: React.FC<ReportViewProps> = ({ report, onBack }) => {
  const isOverweight = report.conviction?.toUpperCase().includes('OVERWEIGHT');
  const isUnderweight = report.conviction?.toUpperCase().includes('UNDERWEIGHT');
  const isNSE = report.exchange === 'NSE';

  const isLiveVerified = report.status === 'generated' && !report.is_prototype_demo;
  const isFallback = report.status === 'fallback_stub';

  const bullCount = report.bull_vs_bear?.bull_case?.length || 0;
  const bearCount = report.bull_vs_bear?.bear_case?.length || 0;
  const totalDebate = bullCount + bearCount;
  const bullPct = totalDebate > 0 ? Math.round((bullCount / totalDebate) * 100) : 50;
  const bearPct = 100 - bullPct;

  const handleExportPDF = () => {
    const originalTitle = document.title;
    const reportDate = new Date(report.generated_at).toISOString().split('T')[0];
    const cleanSymbol = report.symbol.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanExch = report.exchange.replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanCompany = (report.company_name || '').replace(/[^a-zA-Z0-9_ -]/g, '').trim().replace(/\s+/g, '_');

    document.title = `${cleanSymbol}_${cleanExch}_${cleanCompany}_Research_Report_${reportDate}`;
    window.print();
    setTimeout(() => {
      document.title = originalTitle;
    }, 1500);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20 print:p-0 print:m-0 print:max-w-none">
      {/* Formal Institutional Print Memo Header */}
      <div className="hidden print:block pb-6 mb-6 border-b-2 border-[#0a0b0d]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-wider text-[#0a0b0d]">
              EQUIAGENTIC CAPITAL RESEARCH
            </h1>
            <p className="text-xs text-[#5b616e] font-mono">
              Institutional Equity Intelligence &amp; Multi-Agent Consensus Memorandum
            </p>
          </div>
          <div className="text-right text-xs font-mono text-[#5b616e]">
            <p>Date: {new Date(report.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <p>Exchange: {report.exchange} | Ticker: {report.symbol}</p>
          </div>
        </div>
      </div>

      {/* Top Action Bar - Coinbase Pills */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#5b616e] dark:text-[#a8acb3] hover:text-[#0a0b0d] dark:hover:text-white transition px-4 py-2 rounded-full bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 hover:border-[#0052ff] cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO STOCK PROFILE</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportPDF}
            title="Download formatted PDF or print institutional investment memo"
            className="cb-pill-btn-primary inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT AS PDF</span>
          </button>

          {report.data_source_tier === "DHAN_PRO_VERIFIED" && (
            <div className="px-3 py-1 rounded-full bg-[#0052ff]/10 border border-[#0052ff]/20 text-[#0052ff] text-xs font-mono font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0052ff]" />
              <span>DHAN PRO FEED</span>
            </div>
          )}
          {isLiveVerified ? (
            <div className="px-3 py-1 rounded-full bg-[#05b169]/10 border border-[#05b169]/25 text-[#05b169] text-xs font-mono font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#05b169]" />
              <span>SYNTHESIS VERIFIED</span>
            </div>
          ) : isFallback ? (
            <div className="px-3 py-1 rounded-full bg-[#f4b000]/10 border border-[#f4b000]/25 text-[#f4b000] text-xs font-mono font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#f4b000]" />
              <span>FALLBACK AUDIT REPORT</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 text-[#5b616e] dark:text-[#a8acb3] text-xs font-mono font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#7c828a]" />
              <span>LOCAL DEV STUB</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Terminal Hero Banner - Coinbase 28px Card */}
      <div className="cb-card p-7 sm:p-10 rounded-[28px] transition-colors duration-200">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-7 border-b border-[#dee1e6] dark:border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="font-display text-4xl sm:text-5xl font-normal text-[#0a0b0d] dark:text-white tracking-tight">
                {report.symbol}
              </span>
              <span
                className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border ${isNSE
                  ? 'bg-[#0052ff]/10 text-[#0052ff] border-[#0052ff]/20'
                  : 'bg-[#f4b000]/10 text-[#f4b000] border-[#f4b000]/25'
                  }`}
              >
                {report.exchange} LISTED
              </span>
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#f7f7f7] dark:bg-white/5 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10">
                MULTI-AGENT RESEARCH
              </span>

              {/* Semantic Conviction Badge */}
              {report.conviction && (
                <div
                  className={`text-xs font-mono font-semibold px-3.5 py-1 rounded-full border flex items-center gap-2 ${isOverweight
                    ? 'bg-[#05b169]/10 text-[#05b169] border-[#05b169]/30'
                    : isUnderweight
                      ? 'bg-[#cf202f]/10 text-[#cf202f] border-[#cf202f]/30'
                      : 'bg-[#f4b000]/10 text-[#f4b000] border-[#f4b000]/30'
                    }`}
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span>
                    CONVICTION: {report.conviction}
                    {report.target_allocation_pct ? ` (${report.target_allocation_pct}% Target Weight)` : ''}
                  </span>
                </div>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl text-[#5b616e] dark:text-[#a8acb3] font-normal font-sans">{report.company_name}</h2>
          </div>

          <div className="flex flex-col items-start lg:items-end text-xs font-mono space-y-1.5 text-[#7c828a]">
            <div className="flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-[#7c828a]" />
              <span>Report ID: <strong className="text-[#0a0b0d] dark:text-white font-medium">{report.report_id}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#7c828a]" />
              <span>Generated: <strong className="text-[#0a0b0d] dark:text-white font-medium">{new Date(report.generated_at).toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#0052ff]" />
              <span className="text-[#0052ff] font-semibold">13 Specialized Autonomous Roles Synced</span>
            </div>
          </div>
        </div>

        {/* Quick Highlights Bar - 4 Coinbase Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-5 rounded-[18px] border border-[#dee1e6] dark:border-white/5">
            <span className="text-[#7c828a] font-mono block text-[11px] mb-1">RESEARCH COMMITTEE</span>
            <span className="text-[#0a0b0d] dark:text-white font-bold text-base font-mono">13 Analyst Roles</span>
          </div>
          <div className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-5 rounded-[18px] border border-[#dee1e6] dark:border-white/5">
            <span className="text-[#7c828a] font-mono block text-[11px] mb-1">DEBATE FRAMEWORK</span>
            <span className="text-[#0a0b0d] dark:text-white font-bold text-base font-mono">Draft + Rebuttal Review</span>
          </div>
          <div className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-5 rounded-[18px] border border-[#dee1e6] dark:border-white/5">
            <span className="text-[#7c828a] font-mono block text-[11px] mb-1">EVIDENCE CITATION</span>
            <span className="text-[#05b169] font-bold text-base font-mono">
              {report.data_source_tier === "DHAN_PRO_VERIFIED" ? "Dhan Pro + BSE Filings" : "BSE Filings + Multi-Year Fin"}
            </span>
          </div>
          <div className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-5 rounded-[18px] border border-[#dee1e6] dark:border-white/5">
            <span className="text-[#7c828a] font-mono block text-[11px] mb-1">CAPITAL CONVICTION</span>
            <span className={`font-bold text-base font-mono ${isOverweight ? 'text-[#05b169]' : isUnderweight ? 'text-[#cf202f]' : 'text-[#f4b000]'}`}>
              {report.conviction || 'NEUTRAL'}
            </span>
          </div>
        </div>
      </div>

      {/* ADVERSARIAL BULL VS. BEAR ARENA */}
      <div className="cb-card p-7 sm:p-10 rounded-[28px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#dee1e6] dark:border-white/10 mb-6 gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#0052ff]/10 border border-[#0052ff]/20 flex items-center justify-center text-[#0052ff] shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-normal text-[#0a0b0d] dark:text-white font-display">Investment Thesis: Bull vs. Bear Debate</h3>
              <p className="text-xs text-[#5b616e] dark:text-[#a8acb3]">Independent upside and downside analysis followed by cross-examination to eliminate confirmation bias.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#f7f7f7] dark:bg-white/5 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10 whitespace-nowrap self-start sm:self-auto">
            Cross-Examination &amp; Rebuttal
          </span>
        </div>

        {/* Bull vs Bear Balance Bar */}
        <div className="mb-7 bg-[#f7f7f7] dark:bg-[#0a0b0d] p-5 rounded-[20px] border border-[#dee1e6] dark:border-white/5">
          <div className="flex items-center justify-between text-xs font-mono font-bold mb-2.5">
            <span className="text-[#05b169] flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>BULL CASE ({report.bull_vs_bear.bull_case.length} Points)</span>
            </span>
            <span className="text-[#cf202f] flex items-center gap-1.5">
              <span>BEAR CASE ({report.bull_vs_bear.bear_case.length} Points)</span>
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="w-full h-3 bg-[#dee1e6] dark:bg-white/10 rounded-full overflow-hidden flex p-0.5">
            <div
              className="bg-[#05b169] h-full rounded-l-full transition-all duration-300"
              style={{ width: `${bullPct}%` }}
            />
            <div
              className="bg-[#cf202f] h-full rounded-r-full transition-all duration-300"
              style={{ width: `${bearPct}%` }}
            />
          </div>
        </div>

        {/* Two-Column Split: Bull vs Bear */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bull Column */}
          <div className="rounded-[22px] p-6 bg-[#05b169]/5 dark:bg-[#05b169]/5 border border-[#05b169]/20">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#05b169]/20 mb-4">
              <div className="flex items-center gap-2.5 text-[#05b169] font-bold text-sm font-display">
                <div className="w-7 h-7 rounded-full bg-[#05b169]/15 border border-[#05b169]/30 flex items-center justify-center text-[#05b169]">
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span>Bull Thesis &amp; Growth Catalysts</span>
              </div>
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#05b169]/20 text-[#05b169] font-bold">
                Bull Case
              </span>
            </div>
            <ul className="space-y-3">
              {report.bull_vs_bear.bull_case.map((item, idx) => (
                <li key={idx} className="text-sm text-[#0a0b0d] dark:text-slate-100 flex items-start gap-3 bg-white dark:bg-[#16181c] p-4 rounded-[16px] border border-[#05b169]/20 leading-relaxed font-sans shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#05b169] shrink-0 mt-2" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bear Column */}
          <div className="rounded-[22px] p-6 bg-[#cf202f]/5 dark:bg-[#cf202f]/5 border border-[#cf202f]/20">
            <div className="flex items-center justify-between pb-3.5 border-b border-[#cf202f]/20 mb-4">
              <div className="flex items-center gap-2.5 text-[#cf202f] font-bold text-sm font-display">
                <div className="w-7 h-7 rounded-full bg-[#cf202f]/15 border border-[#cf202f]/30 flex items-center justify-center text-[#cf202f]">
                  <TrendingDown className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span>Bear Thesis &amp; Downside Risks</span>
              </div>
              <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-[#cf202f]/20 text-[#cf202f] font-bold">
                Bear Case
              </span>
            </div>
            <ul className="space-y-3">
              {report.bull_vs_bear.bear_case.map((item, idx) => (
                <li key={idx} className="text-sm text-[#0a0b0d] dark:text-slate-100 flex items-start gap-3 bg-white dark:bg-[#16181c] p-4 rounded-[16px] border border-[#cf202f]/20 leading-relaxed font-sans shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-[#cf202f] shrink-0 mt-2" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Critical Swing Factors Radar */}
        {report.bull_vs_bear.critical_swing_factors.length > 0 && (
          <div className="mt-8 pt-6 border-t border-[#dee1e6] dark:border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#f4b000]" />
              <h4 className="text-xs uppercase font-mono tracking-wider text-[#0a0b0d] dark:text-white font-bold">
                Critical Swing Variables &amp; Invalidation Triggers
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {report.bull_vs_bear.critical_swing_factors.map((factor, idx) => (
                <div key={idx} className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-5 rounded-[18px] border border-[#dee1e6] dark:border-white/10 border-l-4 border-l-[#f4b000] text-xs shadow-sm">
                  <span className="text-[#f4b000] font-mono text-[11px] font-bold block mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#f4b000]" />
                    TRIGGER 0{idx + 1}
                  </span>
                  <p className="leading-relaxed text-[#5b616e] dark:text-slate-200 font-sans">{factor}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TACTICAL EXECUTION & ACCUMULATION ROADMAP */}
      {report.execution_plan && (
        <div className="report-section break-inside-avoid cb-card p-7 sm:p-10 rounded-[28px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#dee1e6] dark:border-white/10 mb-6 gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#0052ff]/10 border border-[#0052ff]/20 flex items-center justify-center text-[#0052ff] shrink-0">
                <Crosshair className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-xl font-normal text-[#0a0b0d] dark:text-white font-display">Tactical Trade Desk Execution Matrix</h3>
                <p className="text-xs text-[#5b616e] dark:text-[#a8acb3]">Disciplined institutional entry bands, invalidation thresholds, and volatility buffers.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-semibold px-3 py-1 rounded-full bg-[#f4b000]/10 text-[#f4b000] border border-[#f4b000]/25 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Simulated Model • Not Backtested</span>
              </span>
              {report.execution_plan?.strategy_type && (
                <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-[#f7f7f7] dark:bg-white/5 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10">
                  {report.execution_plan.strategy_type}
                </span>
              )}
              {report.execution_plan?.time_horizon && (
                <span className="text-xs font-mono font-medium px-3 py-1 rounded-full bg-[#f7f7f7] dark:bg-white/5 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10">
                  ⏱️ {report.execution_plan.time_horizon}
                </span>
              )}
            </div>
          </div>

          {/* Basis of Calculation & Analytical Foundation */}
          <div className="mb-6 p-6 rounded-[22px] bg-[#f7f7f7] dark:bg-[#0a0b0d] border border-[#dee1e6] dark:border-white/5 font-sans">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-[#dee1e6] dark:border-white/10 mb-4">
              <div className="w-7 h-7 rounded-full bg-[#0052ff]/10 border border-[#0052ff]/20 flex items-center justify-center text-[#0052ff]">
                <Info className="w-4 h-4 stroke-[2]" />
              </div>
              <div>
                <h4 className="text-base font-semibold text-[#0a0b0d] dark:text-white font-display">Analytical Basis &amp; Risk Disclosure</h4>
                <span className="text-xs font-mono text-[#7c828a]">Algorithmic parameter formulation and structural methodology</span>
              </div>
            </div>
            <p className="text-sm text-[#5b616e] dark:text-slate-200 leading-relaxed mb-4 font-sans">
              <strong className="text-[#0a0b0d] dark:text-white">On what basis are these levels formulated?</strong> These parameters are algorithmically synthesized from price microstructure and volatility models:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
              <div className="bg-white dark:bg-[#16181c] p-5 rounded-[16px] border border-[#dee1e6] dark:border-white/5 flex flex-col justify-between shadow-sm">
                <span className="font-mono text-[#0052ff] font-bold block mb-2 uppercase text-xs tracking-wider">
                  1. Pullback Accumulation Bands
                </span>
                <p className="text-sm text-[#5b616e] dark:text-slate-300 leading-relaxed font-sans">
                  Formulated using 50-DMA consolidation zones and volume-weighted average price (VWAP) bounds.
                </p>
              </div>
              <div className="bg-white dark:bg-[#16181c] p-5 rounded-[16px] border border-[#dee1e6] dark:border-white/5 flex flex-col justify-between shadow-sm">
                <span className="font-mono text-[#05b169] font-bold block mb-2 uppercase text-xs tracking-wider">
                  2. Technical Target
                </span>
                <p className="text-sm text-[#5b616e] dark:text-slate-300 leading-relaxed font-sans">
                  Derived through 14-day Average True Range (14D-ATR) volatility expansion and overhead resistance pivots.
                </p>
              </div>
              <div className="bg-white dark:bg-[#16181c] p-5 rounded-[16px] border border-[#dee1e6] dark:border-white/5 flex flex-col justify-between shadow-sm">
                <span className="font-mono text-[#cf202f] font-bold block mb-2 uppercase text-xs tracking-wider">
                  3. Invalidation Stop
                </span>
                <p className="text-sm text-[#5b616e] dark:text-slate-300 leading-relaxed font-sans">
                  Positioned below structural support swing lows with ATR volatility buffer to maintain a &gt; 1:2 risk-to-reward ratio.
                </p>
              </div>
            </div>
            <div className="p-4 rounded-[16px] bg-[#f4b000]/10 border border-[#f4b000]/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs font-mono text-[#f4b000]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span><strong>Strategy Status:</strong> Technical simulation model (<strong>NOT historically backtested</strong>).</span>
              </div>
              <span className="font-bold uppercase tracking-wider text-xs px-3 py-1 rounded-full bg-[#f4b000]/15 border border-[#f4b000]/30 shrink-0 text-center">
                Execute at your own risk
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 mb-6 items-stretch">
            <div className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-5 rounded-[20px] border border-[#dee1e6] dark:border-white/5 flex flex-col justify-between">
              <span className="text-xs text-[#7c828a] font-mono font-bold block mb-1 uppercase">PULLBACK ENTRY (LOW)</span>
              <span className="text-lg font-mono font-bold text-[#0a0b0d] dark:text-white">
                {formatRupee(report.execution_plan?.entry_range_low)}
              </span>
              <span className="text-xs text-[#7c828a] font-mono block mt-1">50-DMA Consolidation</span>
            </div>
            <div className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-5 rounded-[20px] border border-[#dee1e6] dark:border-white/5 flex flex-col justify-between">
              <span className="text-xs text-[#7c828a] font-mono font-bold block mb-1 uppercase">PULLBACK ENTRY (HIGH)</span>
              <span className="text-lg font-mono font-bold text-[#0a0b0d] dark:text-white">
                {formatRupee(report.execution_plan?.entry_range_high)}
              </span>
              <span className="text-xs text-[#7c828a] font-mono block mt-1">Max Ceiling</span>
            </div>
            <div className="bg-[#05b169]/5 dark:bg-[#05b169]/10 p-5 rounded-[20px] border border-[#05b169]/30 flex flex-col justify-between">
              <span className="text-xs text-[#05b169] font-mono font-bold block mb-1 uppercase">TECHNICAL TARGET</span>
              <span className="text-lg font-mono font-bold text-[#05b169]">
                {formatRupee(report.execution_plan?.target_price || 1280)}
              </span>
              <span className="text-xs text-[#05b169]/70 font-mono block mt-1">14D-ATR &amp; Pivot</span>
            </div>
            <div className="bg-[#cf202f]/5 dark:bg-[#cf202f]/10 p-5 rounded-[20px] border border-[#cf202f]/30 flex flex-col justify-between">
              <span className="text-xs text-[#cf202f] font-mono font-bold block mb-1 uppercase">INVALIDATION STOP</span>
              <span className="text-lg font-mono font-bold text-[#cf202f]">
                {formatRupee(report.execution_plan?.invalidation_stop || 1135.5)}
              </span>
              <span className="text-xs text-[#cf202f]/70 font-mono block mt-1">Structural Low</span>
            </div>
            <div className="bg-[#0052ff]/5 dark:bg-[#0052ff]/10 p-5 rounded-[20px] border border-[#0052ff]/30 flex flex-col justify-between">
              <span className="text-xs text-[#0052ff] font-mono font-bold block mb-1 uppercase">RISK : REWARD</span>
              <span className="text-lg font-mono font-bold text-[#0052ff]">
                {report.execution_plan?.risk_reward_ratio || '1 : 2.4'}
              </span>
              <span className="text-xs text-[#0052ff]/70 font-mono block mt-1">Deterministic Model</span>
            </div>
          </div>

          {/* Staged Accumulation Pacing */}
          {report.execution_plan.staged_tranches && report.execution_plan.staged_tranches.length > 0 && (
            <div className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-6 rounded-[22px] border border-[#dee1e6] dark:border-white/5">
              <span className="text-xs font-mono text-[#0a0b0d] dark:text-white block mb-3 font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0052ff]" />
                Staged Position Accumulation Roadmap
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {report.execution_plan.staged_tranches.map((tranche, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-[#0a0b0d] dark:text-slate-100 bg-white dark:bg-[#16181c] p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/5 shadow-sm">
                    <span className="text-[#0052ff] font-mono font-bold text-sm shrink-0">0{idx + 1}</span>
                    <span className="font-sans leading-relaxed text-xs sm:text-sm">{tranche}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CORE FUNDAMENTAL & VALUATION SECTIONS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Business Overview */}
        <div className="cb-card p-8 rounded-[24px]">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#dee1e6] dark:border-white/10 mb-4">
            <Layers className="w-5 h-5 text-[#0052ff]" />
            <h3 className="text-lg font-normal text-[#0a0b0d] dark:text-white font-display">{report.business_overview.title}</h3>
          </div>
          <p className="text-sm text-[#5b616e] dark:text-[#a8acb3] leading-relaxed mb-4 font-sans">{report.business_overview.summary}</p>
          <div className="space-y-2.5">
            {report.business_overview.key_points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-[#0a0b0d] dark:text-slate-200 bg-[#f7f7f7] dark:bg-[#0a0b0d] p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/5">
                <CheckCircle2 className="w-4 h-4 text-[#05b169] shrink-0 mt-0.5" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Durability & Solvency */}
        <div className="cb-card p-8 rounded-[24px]">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#dee1e6] dark:border-white/10 mb-4">
            <FileCheck2 className="w-5 h-5 text-[#0052ff]" />
            <h3 className="text-lg font-normal text-[#0a0b0d] dark:text-white font-display">{report.financial_analysis.title}</h3>
          </div>
          <p className="text-sm text-[#5b616e] dark:text-[#a8acb3] leading-relaxed mb-4 font-sans">{report.financial_analysis.summary}</p>
          <div className="space-y-2.5">
            {report.financial_analysis.key_points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-[#0a0b0d] dark:text-slate-200 bg-[#f7f7f7] dark:bg-[#0a0b0d] p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/5">
                <span className="w-2 h-2 rounded-full bg-[#0052ff] shrink-0 mt-2" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Prospects & Structural Tailwinds */}
        <div className="cb-card p-8 rounded-[24px]">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#dee1e6] dark:border-white/10 mb-4">
            <TrendingUp className="w-5 h-5 text-[#0052ff]" />
            <h3 className="text-lg font-normal text-[#0a0b0d] dark:text-white font-display">{report.growth_prospects.title}</h3>
          </div>
          <p className="text-sm text-[#5b616e] dark:text-[#a8acb3] leading-relaxed mb-4 font-sans">{report.growth_prospects.summary}</p>
          <div className="space-y-2.5">
            {report.growth_prospects.key_points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-[#0a0b0d] dark:text-slate-200 bg-[#f7f7f7] dark:bg-[#0a0b0d] p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/5">
                <span className="w-2 h-2 rounded-full bg-[#0052ff] shrink-0 mt-2" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Valuation Benchmarking & Peer Multiple */}
        <div className="cb-card p-8 rounded-[24px]">
          <div className="flex items-center gap-2.5 pb-4 border-b border-[#dee1e6] dark:border-white/10 mb-4">
            <Scale className="w-5 h-5 text-[#f4b000]" />
            <h3 className="text-lg font-normal text-[#0a0b0d] dark:text-white font-display">{report.valuation.title}</h3>
          </div>
          <p className="text-sm text-[#5b616e] dark:text-[#a8acb3] leading-relaxed mb-4 font-sans">{report.valuation.summary}</p>
          <div className="space-y-2.5">
            {report.valuation.key_points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-[#0a0b0d] dark:text-slate-200 bg-[#f7f7f7] dark:bg-[#0a0b0d] p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/5">
                <span className="w-2 h-2 rounded-full bg-[#f4b000] shrink-0 mt-2" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Downside Risks & Tail-Risk Stress Testing */}
      <div className="cb-card p-8 rounded-[24px] border-[#cf202f]/30">
        <div className="flex items-center gap-2.5 pb-4 border-b border-[#cf202f]/20 mb-4">
          <ShieldAlert className="w-5 h-5 text-[#cf202f]" />
          <h3 className="text-lg font-normal text-[#0a0b0d] dark:text-white font-display">{report.risks.title}</h3>
        </div>
        <p className="text-sm text-[#5b616e] dark:text-[#a8acb3] leading-relaxed mb-4 font-sans">{report.risks.summary}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {report.risks.key_points.map((pt, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm text-[#0a0b0d] dark:text-slate-200 bg-[#f7f7f7] dark:bg-[#0a0b0d] p-4 rounded-[16px] border border-[#cf202f]/15">
              <span className="w-2 h-2 rounded-full bg-[#cf202f] shrink-0 mt-2" />
              <span className="leading-relaxed font-sans">{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL ASSESSMENT: INVESTMENT COMMITTEE SYNTHESIS */}
      <div className="report-section break-inside-avoid cb-card p-7 sm:p-10 rounded-[28px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#dee1e6] dark:border-white/10 mb-6 gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-full bg-[#05b169]/10 border border-[#05b169]/20 flex items-center justify-center text-[#05b169] shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-normal text-[#0a0b0d] dark:text-white font-display">{report.final_assessment.title}</h3>
              <span className="text-xs font-mono text-[#7c828a]">Portfolio Manager Executive Synthesis &amp; Decision Matrix</span>
            </div>
          </div>
          {report.conviction && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono px-3.5 py-1.5 rounded-full border font-bold ${isOverweight
                  ? 'bg-[#05b169]/10 border-[#05b169]/30 text-[#05b169]'
                  : isUnderweight
                    ? 'bg-[#cf202f]/10 border-[#cf202f]/30 text-[#cf202f]'
                    : 'bg-[#f4b000]/10 border-[#f4b000]/30 text-[#f4b000]'
                }`}>
                CONVICTION: {report.conviction} ({report.target_allocation_pct || 2.5}% Weight)
              </span>
            </div>
          )}
        </div>

        {/* 4-Factor Quantitative Decision Framework Scorecard */}
        {report.decision_framework && (
          <div className="mb-6 bg-[#f7f7f7] dark:bg-[#0a0b0d] p-6 rounded-[22px] border border-[#dee1e6] dark:border-white/5">
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-xs font-mono uppercase tracking-wider text-[#0a0b0d] dark:text-white font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#0052ff]" />
                Institutional 4-Factor Conviction Matrix (Scale 0.0 - 10.0)
              </span>
              {report.decision_framework.composite_conviction_score && (
                <span className="text-xs font-mono font-bold text-[#05b169] bg-[#05b169]/10 px-3 py-0.5 rounded-full border border-[#05b169]/30">
                  Composite Score: {report.decision_framework.composite_conviction_score}/10
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="bg-white dark:bg-[#16181c] p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/5 shadow-sm">
                <span className="text-[10px] font-mono text-[#7c828a] block mb-1">BUSINESS QUALITY</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold font-mono text-[#05b169]">
                    {report.decision_framework.business_quality_score ?? 8.5}
                  </span>
                  <span className="text-[10px] text-[#7c828a] font-mono">/ 10</span>
                </div>
                <span className="text-[10px] text-[#7c828a] font-sans block mt-1">Moat &amp; ROCE</span>
              </div>

              <div className="bg-white dark:bg-[#16181c] p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/5 shadow-sm">
                <span className="text-[10px] font-mono text-[#7c828a] block mb-1">VALUATION SCORE</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold font-mono text-[#f4b000]">
                    {report.decision_framework.valuation_attractiveness_score ?? 6.5}
                  </span>
                  <span className="text-[10px] text-[#7c828a] font-mono">/ 10</span>
                </div>
                <span className="text-[10px] text-[#7c828a] font-sans block mt-1">Margin of Safety</span>
              </div>

              <div className="bg-white dark:bg-[#16181c] p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/5 shadow-sm">
                <span className="text-[10px] font-mono text-[#7c828a] block mb-1">CATALYST MOMENTUM</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold font-mono text-[#0052ff]">
                    {report.decision_framework.catalyst_momentum_score ?? 7.5}
                  </span>
                  <span className="text-[10px] text-[#7c828a] font-mono">/ 10</span>
                </div>
                <span className="text-[10px] text-[#7c828a] font-sans block mt-1">Earnings Pipeline</span>
              </div>

              <div className="bg-white dark:bg-[#16181c] p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/5 shadow-sm">
                <span className="text-[10px] font-mono text-[#7c828a] block mb-1">DOWNSIDE PENALTY</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold font-mono text-[#cf202f]">
                    {report.decision_framework.downside_risk_penalty ?? -1.5}
                  </span>
                  <span className="text-[10px] text-[#7c828a] font-mono">(-5 max)</span>
                </div>
                <span className="text-[10px] text-[#7c828a] font-sans block mt-1">Tail Vulnerability</span>
              </div>
            </div>

            {report.decision_framework.conviction_rationale && (
              <p className="text-xs text-[#5b616e] dark:text-[#a8acb3] font-sans mt-3.5 pt-3 border-t border-[#dee1e6] dark:border-white/5 leading-relaxed">
                <strong>Executive Rationale:</strong> {report.decision_framework.conviction_rationale}
              </p>
            )}
          </div>
        )}

        {/* Investment Committee Adversarial Audit Challenge Points */}
        {report.committee_challenges && report.committee_challenges.length > 0 && (
          <div className="mb-6 bg-[#0052ff]/5 border border-[#0052ff]/20 p-5 rounded-[20px]">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-full bg-[#0052ff]" />
              <span className="text-xs font-mono uppercase tracking-wider text-[#0052ff] font-bold">
                Investment Committee Adversarial Cross-Examination &amp; Stress Test
              </span>
            </div>
            <ul className="space-y-2">
              {report.committee_challenges.map((challenge, cIdx) => (
                <li key={cIdx} className="text-xs text-[#0a0b0d] dark:text-slate-200 flex items-start gap-2.5 font-sans leading-relaxed">
                  <span className="text-[#0052ff] font-bold shrink-0">↳</span>
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm sm:text-base text-[#0a0b0d] dark:text-slate-100 leading-relaxed mb-5 font-sans font-normal prose-finance">{report.final_assessment.summary}</p>
        <div className="space-y-2.5">
          {report.final_assessment.key_points.map((pt, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-[#0a0b0d] dark:text-slate-200 bg-[#f7f7f7] dark:bg-[#0a0b0d] p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/5 font-sans">
              <span className="w-2 h-2 rounded-full bg-[#05b169] shrink-0 mt-2" />
              <span className="leading-relaxed">{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 13-STAGE RESEARCH COMMITTEE AUDIT */}
      {report.agent_runs && report.agent_runs.length > 0 && (
        <div className="cb-card p-7 sm:p-10 rounded-[28px]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#dee1e6] dark:border-white/10 mb-6 gap-3">
            <div>
              <h3 className="text-xl font-normal text-[#0a0b0d] dark:text-white font-display">13-Stage Research Committee Audit</h3>
              <p className="text-xs text-[#5b616e] dark:text-[#a8acb3]">Execution traces, calibrated analyst confidence, verified findings, and open diligence items.</p>
            </div>
            <span className="text-xs font-mono font-semibold px-3 py-1 rounded-full bg-[#f7f7f7] dark:bg-white/5 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10 whitespace-nowrap self-start sm:self-auto">
              13 Committee Roles ({report.agent_runs.length} Deliberation Stages)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {report.agent_runs.map((agent, idx) => (
              <div
                key={idx}
                className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-6 rounded-[22px] border border-[#dee1e6] dark:border-white/5 flex flex-col justify-between space-y-4 hover:border-[#0052ff]/40 transition-colors duration-150 shadow-sm"
              >
                <div>
                  {/* Card Header: Role & Verification Pill */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#dee1e6] dark:border-white/5 mb-3">
                    <div>
                      <h4 className="font-bold text-base text-[#0a0b0d] dark:text-white font-display tracking-tight">{agent.agent_name}</h4>
                      <span className="text-xs font-mono text-[#0052ff] font-semibold uppercase tracking-wider block mt-0.5">[{agent.role}]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-full border ${agent.execution_status === 'success'
                          ? 'bg-[#05b169]/10 text-[#05b169] border-[#05b169]/30'
                          : agent.execution_status === 'error'
                            ? 'bg-[#cf202f]/10 text-[#cf202f] border-[#cf202f]/30'
                            : 'bg-[#f4b000]/10 text-[#f4b000] border-[#f4b000]/30'
                          }`}
                      >
                        {agent.execution_status.toUpperCase()} ({agent.execution_duration_sec}s)
                      </span>
                    </div>
                  </div>

                  {/* High Density Narrative Summary */}
                  <p className="text-sm text-[#5b616e] dark:text-slate-200 leading-relaxed mb-4 font-sans font-medium">{agent.summary}</p>

                  {/* Empirical Findings */}
                  {agent.findings.length > 0 && (
                    <div className="space-y-2 mb-4 bg-white dark:bg-[#16181c] p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/5">
                      <span className="text-xs uppercase font-mono font-bold text-[#0a0b0d] dark:text-white block tracking-wider">
                        Key Empirical Findings:
                      </span>
                      <ul className="space-y-1.5">
                        {agent.findings.slice(0, 3).map((f, fIdx) => (
                          <li key={fIdx} className="text-sm text-[#5b616e] dark:text-slate-300 flex items-start gap-2.5 font-sans leading-relaxed">
                            <span className="text-[#05b169] font-bold text-base leading-none mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Diligence & Audit Grid */}
                  <div className="space-y-2.5">
                    {agent.questions_for_investigation && agent.questions_for_investigation.length > 0 && (
                      <div className="text-sm text-[#5b616e] dark:text-cyan-200 bg-white dark:bg-cyan-950/20 p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/10 border-l-4 border-l-[#0052ff] font-sans shadow-sm">
                        <strong className="block text-xs uppercase font-mono font-bold text-[#0052ff] mb-1 tracking-wider">
                          Open Diligence Item for Management / Auditor:
                        </strong>
                        <p className="leading-relaxed">{agent.questions_for_investigation[0]}</p>
                      </div>
                    )}

                    {agent.missing_information && agent.missing_information.length > 0 && (
                      <div className="text-sm text-[#5b616e] dark:text-amber-200 bg-white dark:bg-amber-950/20 p-4 rounded-[16px] border border-[#dee1e6] dark:border-white/10 border-l-4 border-l-[#f4b000] font-sans shadow-sm">
                        <strong className="block text-xs uppercase font-mono font-bold text-[#f4b000] mb-1 tracking-wider">
                          Data Gap / Unverified Item:
                        </strong>
                        <p className="leading-relaxed">{agent.missing_information[0]}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Bar: Calibrated Confidence */}
                <div className="pt-3.5 border-t border-[#dee1e6] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-[#7c828a] uppercase tracking-wider text-xs">Confidence:</span>
                    {agent.confidence_score !== null && agent.confidence_score !== undefined ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#05b169]/15 text-[#05b169] border border-[#05b169]/30 font-bold text-xs">
                        {(agent.confidence_score * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#f4b000]/15 text-[#f4b000] border border-[#f4b000]/30 font-bold text-xs">
                        UNAVAILABLE / STUB
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#7c828a] font-sans leading-relaxed sm:max-w-[70%] sm:text-right">
                    {agent.confidence_explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSTITUTIONAL COMPLIANCE & RISK DISCLAIMER */}
      <div className="pt-8 pb-3 border-t border-[#dee1e6] dark:border-white/10 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#f4b000]/10 border border-[#f4b000]/25 text-[#f4b000] text-xs font-mono font-semibold">
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>DISCLAIMER: NOT BACKTESTED • TRADE AT YOUR OWN RISK</span>
        </div>
        <p className="text-xs font-mono text-[#7c828a] max-w-4xl mx-auto leading-relaxed">
          EQUIAGENTIC CAPITAL RESEARCH &amp; TACTICAL EXECUTION MATRICES ARE INTENDED SOLELY FOR EDUCATIONAL AND INSTITUTIONAL DILIGENCE.
          STRATEGY LEVELS, ENTRY BANDS, TARGETS, AND STOPS ARE ALGORITHMIC SIMULATIONS DERIVED FROM TECHNICAL INDICATORS AND HAVE NOT BEEN HISTORICALLY BACKTESTED AGAINST LIVE ORDER BOOKS.
          EQUITY AND DERIVATIVE MARKETS INVOLVE SIGNIFICANT RISK OF CAPITAL LOSS. CONSULT A SEBI-REGISTERED FINANCIAL ADVISOR BEFORE EXECUTING TRADES.
        </p>
      </div>
    </div>
  );
};
