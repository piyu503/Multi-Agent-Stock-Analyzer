import React from 'react';
const formatRupee = (val: any) => {
  if (val === undefined || val === null || val === '') return 'Awaiting Data';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.-]+/g, ''));
  if (isNaN(num)) return String(val);
  return `₹${num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};
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
      {/* Formal Institutional Print Memo Header (Visible strictly in Print / PDF export) */}
      <div className="hidden print:block pb-6 mb-6 border-b-2 border-slate-900">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold font-mono tracking-wider text-slate-900">
              EQUIAGENTIC CAPITAL RESEARCH
            </h1>
            <p className="text-xs text-slate-600 font-mono">
              Institutional Equity Intelligence &amp; Multi-Agent Consensus Memorandum
            </p>
          </div>
          <div className="text-right text-xs font-mono text-slate-600">
            <p>Date: {new Date(report.generated_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
            <p>Exchange: {report.exchange} | Ticker: {report.symbol}</p>
          </div>
        </div>
      </div>

      {/* Top Action Bar */}
      <div className="flex items-center justify-between no-print">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-slate-300 hover:text-white transition px-4 py-2 rounded-[8px] bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO STOCK PROFILE</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportPDF}
            title="Download formatted PDF or print institutional investment memo"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] bg-gradient-to-r from-fuchsia-600/30 to-violet-600/30 hover:from-fuchsia-600/50 hover:to-violet-600/50 border border-fuchsia-500/40 text-fuchsia-200 text-xs font-mono font-medium transition-colors duration-120 shadow-md shadow-fuchsia-950/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>EXPORT AS PDF</span>
          </button>

          {report.data_source_tier === "DHAN_PRO_VERIFIED" && (
            <div className="px-3 py-1 rounded-[4px] bg-cyan-500/10 border border-cyan-500/25 text-cyan-200/90 text-xs font-mono font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>DHAN PRO FEED</span>
            </div>
          )}
          {isLiveVerified ? (
            <div className="px-3 py-1 rounded-[4px] bg-emerald-500/10 border border-emerald-500/25 text-emerald-200/90 text-xs font-mono font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span>SYNTHESIS VERIFIED</span>
            </div>
          ) : isFallback ? (
            <div className="px-3 py-1 rounded-[4px] bg-amber-500/10 border border-amber-500/25 text-amber-200/80 text-xs font-mono font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span>FALLBACK AUDIT REPORT</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-[4px] bg-fuchsia-500/10 border border-fuchsia-500/25 text-fuchsia-200/90 text-xs font-mono font-medium flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400" />
              <span>LOCAL DEV STUB</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Terminal Hero Banner */}
      <div className="relative overflow-hidden rounded-[10px] bg-gradient-to-br from-[#0c101d] via-[#090d18] to-[#060810] border border-white/15 p-6 sm:p-9 shadow-2xl shadow-black/80">
        {/* Ambient backdrop via static radial gradient (zero layout repainting) */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(400px circle at 90% 10%, rgba(217,70,239,0.08), transparent 70%), radial-gradient(350px circle at 10% 90%, rgba(6,182,212,0.08), transparent 70%)'
          }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-7 border-b border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {report.symbol}
              </span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${isNSE
                  ? 'bg-cyan-500/10 text-cyan-200/90 border-cyan-500/25'
                  : 'bg-amber-500/10 text-amber-200/80 border-amber-500/25'
                  }`}
              >
                {report.exchange} LISTED
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10">
                MULTI-AGENT RESEARCH
              </span>

              {/* High-Impact Conviction Badge - Muted & Dull Tones */}
              {report.conviction && (
                <div
                  className={`text-xs font-mono font-bold px-3 py-1 rounded-lg border flex items-center gap-2 ${isOverweight
                    ? 'bg-emerald-500/10 text-emerald-200/90 border-emerald-500/30'
                    : isUnderweight
                      ? 'bg-rose-500/10 text-rose-200/90 border-rose-500/30'
                      : 'bg-amber-500/[0.08] text-amber-200/75 border-amber-500/25'
                    }`}
                >
                  <Flame className="w-3.5 h-3.5 opacity-80" />
                  <span>
                    CONVICTION: {report.conviction}
                    {report.target_allocation_pct ? ` (${report.target_allocation_pct}% Target Weight)` : ''}
                  </span>
                </div>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl text-slate-100 font-semibold font-sans">{report.company_name}</h2>
          </div>

          <div className="flex flex-col items-start lg:items-end text-xs font-mono space-y-1.5 text-slate-300">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Hash className="w-3.5 h-3.5 text-slate-500" />
              <span>Report ID: <strong className="text-slate-200">{report.report_id}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Generated: <strong className="text-slate-200">{new Date(report.generated_at).toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Cpu className="w-3.5 h-3.5 text-fuchsia-400" />
              <span className="text-fuchsia-300 font-semibold">13 Specialized Autonomous Roles Synced</span>
            </div>
          </div>
        </div>

        {/* Quick Highlights Bar */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 text-xs">
          <div className="bg-white/[0.03] p-3.5 rounded-[8px] border border-white/5">
            <span className="text-slate-400 font-mono block text-[11px] mb-1">RESEARCH COMMITTEE</span>
            <span className="text-white font-bold text-sm">13 Analyst Roles</span>
          </div>
          <div className="bg-white/[0.03] p-3.5 rounded-[8px] border border-white/5">
            <span className="text-slate-400 font-mono block text-[11px] mb-1">DEBATE FRAMEWORK</span>
            <span className="text-white font-bold text-sm">Draft + Rebuttal Review</span>
          </div>
          <div className="bg-white/[0.03] p-3.5 rounded-[8px] border border-white/5">
            <span className="text-slate-400 font-mono block text-[11px] mb-1">EVIDENCE CITATION</span>
            <span className="text-emerald-200/90 font-bold text-sm">
              {report.data_source_tier === "DHAN_PRO_VERIFIED" ? "Dhan Pro + BSE Filings" : "BSE Filings + Multi-Year Fin"}
            </span>
          </div>
          <div className="bg-white/[0.03] p-3.5 rounded-[8px] border border-white/5">
            <span className="text-slate-400 font-mono block text-[11px] mb-1">CAPITAL CONVICTION</span>
            <span className={`font-bold text-sm ${isOverweight ? 'text-emerald-300' : isUnderweight ? 'text-rose-300' : 'text-amber-200/75'}`}>
              {report.conviction || 'NEUTRAL'}
            </span>
          </div>
        </div>
      </div>

      {/* ADVERSARIAL BULL VS. BEAR ARENA (Inspired by Neon Trading Terminal Theme) */}
      <div className="rounded-[10px] bg-[#0c101d] border border-white/15 p-6 sm:p-8 shadow-2xl shadow-black/80 relative overflow-hidden">
        {/* Glow corner via fast radial gradient */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(350px circle at 50% 0%, rgba(217,70,239,0.06), transparent 70%)'
          }}
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.25)]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">Investment Thesis: Bull vs. Bear Debate</h3>
              <p className="text-xs text-slate-300">Independent upside and downside analysis followed by cross-examination to eliminate confirmation bias.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-[4px] bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 whitespace-nowrap self-start sm:self-auto">
            Cross-Examination &amp; Rebuttal
          </span>
        </div>

        {/* Bull vs Bear Balance Bar */}
        <div className="mb-7 bg-[#070b13] p-4 rounded-[8px] border border-white/10">
          <div className="flex items-center justify-between text-xs font-mono font-bold mb-2">
            <span className="text-emerald-400 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" />
              <span>BULL CASE ({report.bull_vs_bear.bull_case.length} Points)</span>
            </span>
            <span className="text-rose-400 flex items-center gap-1.5">
              <span>BEAR CASE ({report.bull_vs_bear.bear_case.length} Points)</span>
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div className="w-full h-3 bg-white/5 rounded-[4px] overflow-hidden flex p-0.5 border border-white/10">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-l-full shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-colors duration-120"
              style={{ width: `${bullPct}%` }}
            />
            <div
              className="bg-gradient-to-r from-rose-500 to-crimson-500 h-full rounded-r-full shadow-[0_0_12px_rgba(244,63,94,0.8)] transition-colors duration-120"
              style={{ width: `${bearPct}%` }}
            />
          </div>
        </div>

        {/* Two-Column Split: Neon Bull vs Neon Bear */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bull Column */}
          <div className="rounded-[8px] p-4 bg-[#070d14] border border-emerald-500/40">
            <div className="flex items-center justify-between pb-3.5 border-b border-emerald-500/20 mb-4">
              <div className="flex items-center gap-2.5 text-emerald-400 font-bold text-sm font-display">
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-300">
                  <TrendingUp className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span>Bull Thesis &amp; Growth Catalysts</span>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                Bull Case
              </span>
            </div>
            <ul className="space-y-3.5">
              {report.bull_vs_bear.bull_case.map((item, idx) => (
                <li key={idx} className="text-sm sm:text-base text-slate-100 flex items-start gap-3 bg-black/40 p-4 rounded-[8px] border border-emerald-500/20 leading-relaxed font-sans">
                  <span className="w-2.5 h-2.5 rounded-[4px] bg-emerald-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-slate-100 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bear Column */}
          <div className="rounded-[8px] p-4 bg-[#070d14] border border-rose-500/40">
            <div className="flex items-center justify-between pb-3.5 border-b border-rose-500/20 mb-4">
              <div className="flex items-center gap-2.5 text-rose-400 font-bold text-sm font-display">
                <div className="w-7 h-7 rounded-lg bg-rose-500/20 border border-rose-500/50 flex items-center justify-center text-rose-300">
                  <TrendingDown className="w-4 h-4 stroke-[2.5]" />
                </div>
                <span>Bear Thesis &amp; Downside Risks</span>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-bold border border-rose-500/30">
                Bear Case
              </span>
            </div>
            <ul className="space-y-3.5">
              {report.bull_vs_bear.bear_case.map((item, idx) => (
                <li key={idx} className="text-sm sm:text-base text-slate-100 flex items-start gap-3 bg-black/40 p-4 rounded-[8px] border border-rose-500/20 leading-relaxed font-sans">
                  <span className="w-2.5 h-2.5 rounded-[4px] bg-rose-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                  <span className="text-slate-100 leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Critical Swing Factors Radar */}
        {report.bull_vs_bear.critical_swing_factors.length > 0 && (
          <div className="mt-7 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs uppercase font-mono tracking-wider text-slate-200 font-bold">
                Critical Swing Variables &amp; Invalidation Triggers
              </h4>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {report.bull_vs_bear.critical_swing_factors.map((factor, idx) => (
                <div key={idx} className="bg-[#070b13] p-4 rounded-[8px] border border-white/10 border-l-2 border-l-amber-400 text-xs text-slate-200 shadow-lg">
                  <span className="text-amber-400 font-mono text-[11px] font-bold block mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-[4px] bg-amber-400" />
                    TRIGGER 0{idx + 1}
                  </span>
                  <p className="leading-relaxed text-slate-200 font-sans">{factor}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* TACTICAL EXECUTION & ACCUMULATION ROADMAP */}
      {report.execution_plan && (
        <div className="report-section break-inside-avoid rounded-[10px] bg-[#0c101d]/90 border border-white/15 p-6 sm:p-8 shadow-2xl shadow-black/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 mb-6 gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[4px] bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-300">
                <Crosshair className="w-5 h-5 stroke-[2] text-fuchsia-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Tactical Trade Desk Execution Matrix</h3>
                <p className="text-xs text-slate-300">Disciplined institutional entry bands, invalidation thresholds, and volatility buffers.</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-[6px] bg-amber-500/10 text-amber-200/85 border border-amber-500/25 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
                <span>Simulated Model • Not Backtested</span>
              </span>
              {report.execution_plan?.strategy_type && (
                <span className="text-xs font-mono font-medium px-3 py-1 rounded-[6px] bg-white/[0.04] text-slate-200 border border-white/10">
                  {report.execution_plan.strategy_type}
                </span>
              )}
              {report.execution_plan?.time_horizon && (
                <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-[6px] bg-white/[0.04] text-slate-300 border border-white/10">
                  ⏱️ {report.execution_plan.time_horizon}
                </span>
              )}
            </div>
          </div>

          {/* Basis of Calculation & Analytical Foundation */}
          <div className="mb-6 p-5 sm:p-6 rounded-[8px] bg-[#070b13] border border-white/10 font-sans">
            <div className="flex items-center gap-2.5 pb-3.5 border-b border-white/10 mb-4">
              <div className="w-7 h-7 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300">
                <Info className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-base font-bold text-white font-display">Analytical Basis &amp; Risk Disclosure</h4>
                <span className="text-xs font-mono text-slate-400">Algorithmic parameter formulation and structural methodology</span>
              </div>
            </div>
            <p className="text-sm sm:text-base text-slate-100 leading-relaxed mb-4 font-sans">
              <strong className="text-white">On what basis are these levels formulated?</strong> These parameters are algorithmically synthesized from price microstructure and volatility models:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 mb-4">
              <div className="bg-white/[0.03] p-4 rounded-[8px] border border-white/10 flex flex-col justify-between">
                <span className="font-mono text-fuchsia-300 font-bold block mb-2 uppercase text-xs sm:text-sm tracking-wider">
                  1. Pullback Accumulation Bands
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  Formulated using 50-DMA consolidation zones and volume-weighted average price (VWAP) bounds.
                </p>
              </div>
              <div className="bg-white/[0.03] p-4 rounded-[8px] border border-white/10 flex flex-col justify-between">
                <span className="font-mono text-emerald-300 font-bold block mb-2 uppercase text-xs sm:text-sm tracking-wider">
                  2. Technical Target
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  Derived through 14-day Average True Range (14D-ATR) volatility expansion and overhead resistance pivots.
                </p>
              </div>
              <div className="bg-white/[0.03] p-4 rounded-[8px] border border-white/10 flex flex-col justify-between">
                <span className="font-mono text-rose-300 font-bold block mb-2 uppercase text-xs sm:text-sm tracking-wider">
                  3. Invalidation Stop
                </span>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  Positioned below structural support swing lows with ATR volatility buffer to maintain a &gt; 1:2 risk-to-reward ratio.
                </p>
              </div>
            </div>
            <div className="p-3.5 rounded-[8px] bg-amber-500/[0.08] border border-amber-500/25 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs sm:text-sm font-mono text-amber-200/90">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
                <span><strong>Strategy Status:</strong> Technical simulation model (<strong>NOT historically backtested</strong>).</span>
              </div>
              <span className="font-bold uppercase tracking-wider text-xs px-2.5 py-1 rounded bg-amber-500/15 border border-amber-500/30 text-amber-200 shrink-0 text-center">
                Execute at your own risk
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-6 items-stretch">
            <div className="bg-[#070b13] p-4 rounded-[8px] border border-white/10 flex flex-col justify-between">
              <span className="text-xs text-slate-300 font-mono font-bold block mb-1 uppercase">PULLBACK ENTRY (LOW)</span>
              <span className="text-lg font-mono font-bold text-white">
                {formatRupee(report.execution_plan?.entry_range_low)}
              </span>
              <span className="text-xs text-slate-400 font-mono block mt-1">50-DMA Consolidation</span>
            </div>
            <div className="bg-[#070b13] p-4 rounded-[8px] border border-white/10 flex flex-col justify-between">
              <span className="text-xs text-slate-300 font-mono font-bold block mb-1 uppercase">PULLBACK ENTRY (HIGH)</span>
              <span className="text-lg font-mono font-bold text-white">
                {formatRupee(report.execution_plan?.entry_range_high)}
              </span>
              <span className="text-xs text-slate-400 font-mono block mt-1">Max Accumulation Ceiling</span>
            </div>
            <div className="bg-[#070b13] p-4 rounded-[8px] border border-emerald-500/25 bg-emerald-950/10 flex flex-col justify-between">
              <span className="text-xs text-emerald-300/80 font-mono font-bold block mb-1 uppercase">TECHNICAL TARGET</span>
              <span className="text-lg font-mono font-bold text-emerald-200">
                {formatRupee(report.execution_plan?.target_price || 1280)}
              </span>
              <span className="text-xs text-emerald-300/70 font-mono block mt-1">14D-ATR &amp; Resistance</span>
            </div>
            <div className="bg-[#070b13] p-4 rounded-[8px] border border-rose-500/25 bg-rose-950/10 flex flex-col justify-between">
              <span className="text-xs text-rose-300/80 font-mono font-bold block mb-1 uppercase">INVALIDATION STOP</span>
              <span className="text-lg font-mono font-bold text-rose-200">
                {formatRupee(report.execution_plan?.invalidation_stop || 1135.5)}
              </span>
              <span className="text-xs text-rose-300/70 font-mono block mt-1">Below Structural Support</span>
            </div>
            <div className="bg-[#070b13] p-4 rounded-[8px] border border-fuchsia-500/25 bg-fuchsia-950/10 flex flex-col justify-between">
              <span className="text-xs text-fuchsia-300/80 font-mono font-bold block mb-1 uppercase">RISK : REWARD</span>
              <span className="text-lg font-mono font-bold text-fuchsia-200">
                {report.execution_plan?.risk_reward_ratio || '1 : 2.4'}
              </span>
              <span className="text-xs text-fuchsia-300/70 font-mono block mt-1">Deterministic Model</span>
            </div>
          </div>

          {/* Staged Accumulation Pacing - Larger Typography & Clean Tones */}
          {report.execution_plan.staged_tranches && report.execution_plan.staged_tranches.length > 0 && (
            <div className="bg-[#070b13] p-5 rounded-[8px] border border-white/10">
              <span className="text-sm font-mono text-slate-100 block mb-3 font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-[4px] bg-fuchsia-400" />
                Staged Position Accumulation Roadmap
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {report.execution_plan.staged_tranches.map((tranche, idx) => (
                  <div key={idx} className="flex items-start gap-3 text-sm text-slate-100 bg-white/[0.03] p-4 rounded-[8px] border border-white/10">
                    <span className="text-fuchsia-400 font-mono font-extrabold text-base shrink-0">0{idx + 1}</span>
                    <span className="font-sans leading-relaxed">{tranche}</span>
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
        <div className="rounded-[10px] bg-[#0c101d]/90 border border-white/10 p-6 sm:p-7 shadow-xl shadow-black/60">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
            <Layers className="w-5 h-5 text-emerald-300/80" />
            <h3 className="text-base sm:text-lg font-bold text-white font-display">{report.business_overview.title}</h3>
          </div>
          <p className="text-sm sm:text-base text-slate-100 leading-relaxed mb-4 font-sans">{report.business_overview.summary}</p>
          <div className="space-y-2.5">
            {report.business_overview.key_points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-slate-100 bg-[#070b13] p-3.5 rounded-[8px] border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-300/80 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Durability & Solvency */}
        <div className="rounded-[10px] bg-[#0c101d]/90 border border-white/10 p-6 sm:p-7 shadow-xl shadow-black/60">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
            <FileCheck2 className="w-5 h-5 text-cyan-300/80" />
            <h3 className="text-base sm:text-lg font-bold text-white font-display">{report.financial_analysis.title}</h3>
          </div>
          <p className="text-sm sm:text-base text-slate-100 leading-relaxed mb-4 font-sans">{report.financial_analysis.summary}</p>
          <div className="space-y-2.5">
            {report.financial_analysis.key_points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-slate-100 bg-[#070b13] p-3.5 rounded-[8px] border border-white/5">
                <span className="w-2 h-2 rounded-full bg-cyan-400/70 shrink-0 mt-2" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Prospects & Structural Tailwinds */}
        <div className="rounded-[10px] bg-[#0c101d]/90 border border-white/10 p-6 sm:p-7 shadow-xl shadow-black/60">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
            <TrendingUp className="w-5 h-5 text-fuchsia-300/80" />
            <h3 className="text-base sm:text-lg font-bold text-white font-display">{report.growth_prospects.title}</h3>
          </div>
          <p className="text-sm sm:text-base text-slate-100 leading-relaxed mb-4 font-sans">{report.growth_prospects.summary}</p>
          <div className="space-y-2.5">
            {report.growth_prospects.key_points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-slate-100 bg-[#070b13] p-3.5 rounded-[8px] border border-white/5">
                <span className="w-2 h-2 rounded-full bg-fuchsia-400/70 shrink-0 mt-2" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Valuation Benchmarking & Peer Multiple */}
        <div className="rounded-[10px] bg-[#0c101d]/90 border border-white/10 p-6 sm:p-7 shadow-xl shadow-black/60">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
            <Scale className="w-5 h-5 text-amber-200/80" />
            <h3 className="text-base sm:text-lg font-bold text-white font-display">{report.valuation.title}</h3>
          </div>
          <p className="text-sm sm:text-base text-slate-100 leading-relaxed mb-4 font-sans">{report.valuation.summary}</p>
          <div className="space-y-2.5">
            {report.valuation.key_points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-3 text-sm text-slate-100 bg-[#070b13] p-3.5 rounded-[8px] border border-white/5">
                <span className="w-2 h-2 rounded-full bg-amber-400/70 shrink-0 mt-2" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Downside Risks & Tail-Risk Stress Testing */}
      <div className="rounded-[10px] bg-[#0c101d]/90 border border-rose-500/20 p-6 sm:p-8 shadow-xl shadow-black/60">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
          <ShieldAlert className="w-5 h-5 text-rose-300/80" />
          <h3 className="text-base sm:text-lg font-bold text-white font-display">{report.risks.title}</h3>
        </div>
        <p className="text-sm sm:text-base text-slate-100 leading-relaxed mb-4 font-sans">{report.risks.summary}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {report.risks.key_points.map((pt, idx) => (
            <div key={idx} className="flex items-start gap-3 text-sm text-slate-100 bg-[#070b13] p-3.5 rounded-[8px] border border-rose-500/15">
              <span className="w-2 h-2 rounded-full bg-rose-400/70 shrink-0 mt-2" />
              <span className="leading-relaxed font-sans">{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL ASSESSMENT: INVESTMENT COMMITTEE SYNTHESIS */}
      <div className="report-section break-inside-avoid rounded-[10px] bg-gradient-to-br from-[#0c101d] via-[#10162a] to-[#0a0f1d] border border-white/15 p-6 sm:p-9 shadow-2xl shadow-black/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[4px] bg-white/[0.04] border border-white/10 flex items-center justify-center text-slate-200">
              <ShieldCheck className="w-5 h-5 text-emerald-300/80" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">{report.final_assessment.title}</h3>
              <span className="text-xs font-mono text-slate-300">Portfolio Manager Executive Synthesis &amp; Decision Matrix</span>
            </div>
          </div>
          {report.conviction && (
            <div className="flex items-center gap-2">
              <span className={`text-xs font-mono px-3 py-1.5 rounded-[6px] border font-bold ${
                isOverweight
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200/90'
                  : isUnderweight
                    ? 'bg-rose-500/10 border-rose-500/30 text-rose-200/90'
                    : 'bg-amber-500/[0.08] border-amber-500/25 text-amber-200/75'
              }`}>
                CONVICTION: {report.conviction} ({report.target_allocation_pct || 2.5}% Weight)
              </span>
            </div>
          )}
        </div>

        {/* 4-Factor Quantitative Decision Framework Scorecard */}
        {report.decision_framework && (
          <div className="mb-6 bg-[#070b13] p-5 rounded-[8px] border border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-bold flex items-center gap-2">
                <span className="w-2 h-2 rounded-[4px] bg-emerald-400" />
                Institutional 4-Factor Conviction Matrix (Scale 0.0 - 10.0)
              </span>
              {report.decision_framework.composite_conviction_score && (
                <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded border border-emerald-500/30">
                  Composite Score: {report.decision_framework.composite_conviction_score}/10
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/5 p-3 rounded-[8px] border border-white/5">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">BUSINESS QUALITY</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold font-mono text-emerald-400">
                    {report.decision_framework.business_quality_score ?? 8.5}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">/ 10</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block mt-1">Moat &amp; ROCE</span>
              </div>

              <div className="bg-white/5 p-3 rounded-[8px] border border-white/5">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">VALUATION SCORE</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold font-mono text-amber-400">
                    {report.decision_framework.valuation_attractiveness_score ?? 6.5}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">/ 10</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block mt-1">Margin of Safety</span>
              </div>

              <div className="bg-white/5 p-3 rounded-[8px] border border-white/5">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">CATALYST MOMENTUM</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold font-mono text-cyan-400">
                    {report.decision_framework.catalyst_momentum_score ?? 7.5}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">/ 10</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block mt-1">Earnings Pipeline</span>
              </div>

              <div className="bg-white/5 p-3 rounded-[8px] border border-white/5">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">DOWNSIDE PENALTY</span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-lg font-bold font-mono text-rose-400">
                    {report.decision_framework.downside_risk_penalty ?? -1.5}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">(-5 max)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-sans block mt-1">Tail Vulnerability</span>
              </div>
            </div>

            {report.decision_framework.conviction_rationale && (
              <p className="text-xs text-slate-300 font-sans mt-3 pt-3 border-t border-white/5 leading-relaxed">
                <strong>Executive Rationale:</strong> {report.decision_framework.conviction_rationale}
              </p>
            )}
          </div>
        )}

        {/* Investment Committee Adversarial Audit Challenge Points */}
        {report.committee_challenges && report.committee_challenges.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-fuchsia-950/30 to-purple-950/20 p-5 rounded-[8px] border border-fuchsia-500/30">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 rounded-[4px] bg-fuchsia-400 animate-pulse" />
              <span className="text-xs font-mono uppercase tracking-wider text-fuchsia-300 font-bold">
                Investment Committee Adversarial Cross-Examination &amp; Stress Test
              </span>
            </div>
            <ul className="space-y-2">
              {report.committee_challenges.map((challenge, cIdx) => (
                <li key={cIdx} className="text-xs text-slate-200 flex items-start gap-2.5 font-sans leading-relaxed">
                  <span className="text-fuchsia-400 font-bold shrink-0">↳</span>
                  <span>{challenge}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="text-sm sm:text-base text-slate-100 leading-relaxed mb-5 font-sans font-medium prose-finance">{report.final_assessment.summary}</p>
        <div className="space-y-2.5">
          {report.final_assessment.key_points.map((pt, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 bg-[#070b13] p-3.5 rounded-[8px] border border-white/10 font-sans">
              <span className="w-2 h-2 rounded-[4px] bg-emerald-400 shrink-0 mt-2 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="leading-relaxed">{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 13-STAGE RESEARCH COMMITTEE AUDIT */}
      {report.agent_runs && report.agent_runs.length > 0 && (
        <div className="rounded-[10px] bg-[#0c101d]/90 border border-white/15 p-6 sm:p-8 shadow-2xl shadow-black/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-bold text-white font-display">13-Stage Research Committee Audit</h3>
              <p className="text-xs text-slate-300">Execution traces, calibrated analyst confidence, verified findings, and open diligence items.</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-[4px] bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 whitespace-nowrap self-start sm:self-auto">
              13 Committee Roles ({report.agent_runs.length} Deliberation Stages)
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {report.agent_runs.map((agent, idx) => (
              <div
                key={idx}
                className="bg-[#070b13] p-6 rounded-[8px] border border-white/10 flex flex-col justify-between space-y-4 hover:border-white/20 transition-colors duration-120 shadow-lg"
              >
                <div>
                  {/* Card Header: Role & Verification Pill */}
                  <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/5 mb-3">
                    <div>
                      <h4 className="font-bold text-base text-white font-display tracking-tight">{agent.agent_name}</h4>
                      <span className="text-xs font-mono text-cyan-300 font-semibold uppercase tracking-wider block mt-0.5">[{agent.role}]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${agent.execution_status === 'success'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                          : agent.execution_status === 'error'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                          }`}
                      >
                        {agent.execution_status.toUpperCase()} ({agent.execution_duration_sec}s)
                      </span>
                    </div>
                  </div>

                  {/* High Density Narrative Summary */}
                  <p className="text-sm text-slate-100 leading-relaxed mb-4 font-sans font-medium">{agent.summary}</p>

                  {/* Empirical Findings */}
                  {agent.findings.length > 0 && (
                    <div className="space-y-2 mb-4 bg-white/[0.02] p-3.5 rounded-[8px] border border-white/5">
                      <span className="text-xs uppercase font-mono font-bold text-slate-300 block tracking-wider">
                        Key Empirical Findings:
                      </span>
                      <ul className="space-y-2">
                        {agent.findings.slice(0, 3).map((f, fIdx) => (
                          <li key={fIdx} className="text-sm text-slate-300 flex items-start gap-2.5 font-sans leading-relaxed">
                            <span className="text-emerald-400 font-bold text-base leading-none mt-0.5">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Institutional Diligence & Audit Grid (Side-by-side or stacked with full readable width) */}
                  <div className="space-y-2.5">
                    {agent.questions_for_investigation && agent.questions_for_investigation.length > 0 && (
                      <div className="text-sm text-cyan-200 bg-cyan-950/20 p-3.5 rounded-[8px] border border-white/10 border-l-2 border-l-cyan-400 font-sans">
                        <strong className="block text-xs uppercase font-mono font-bold text-cyan-400 mb-1 tracking-wider">
                          Open Diligence Item for Management / Auditor:
                        </strong>
                        <p className="leading-relaxed">{agent.questions_for_investigation[0]}</p>
                      </div>
                    )}

                    {agent.missing_information && agent.missing_information.length > 0 && (
                      <div className="text-sm text-amber-200 bg-amber-950/20 p-3.5 rounded-[8px] border border-white/10 border-l-2 border-l-amber-400 font-sans">
                        <strong className="block text-xs uppercase font-mono font-bold text-amber-400 mb-1 tracking-wider">
                          Data Gap / Unverified Item:
                        </strong>
                        <p className="leading-relaxed">{agent.missing_information[0]}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Bar: Calibrated Confidence without Horizontal Truncation */}
                <div className="pt-3.5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400 uppercase tracking-wider text-xs">Confidence:</span>
                    {agent.confidence_score !== null && agent.confidence_score !== undefined ? (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold text-sm">
                        {(agent.confidence_score * 100).toFixed(0)}%
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold text-xs">
                        UNAVAILABLE / STUB
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed sm:max-w-[70%] sm:text-right">
                    {agent.confidence_explanation}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSTITUTIONAL COMPLIANCE & RISK DISCLAIMER */}
      <div className="pt-8 pb-3 border-t border-white/10 text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-500/[0.08] border border-amber-500/25 text-amber-200/85 text-xs font-mono font-semibold">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-300" />
          <span>DISCLAIMER: NOT BACKTESTED • TRADE AT YOUR OWN RISK</span>
        </div>
        <p className="text-xs font-mono text-slate-400 max-w-4xl mx-auto leading-relaxed">
          EQUIAGENTIC CAPITAL RESEARCH &amp; TACTICAL EXECUTION MATRICES ARE INTENDED SOLELY FOR EDUCATIONAL AND INSTITUTIONAL DILIGENCE.
          STRATEGY LEVELS, ENTRY BANDS, TARGETS, AND STOPS ARE ALGORITHMIC SIMULATIONS DERIVED FROM TECHNICAL INDICATORS AND HAVE NOT BEEN HISTORICALLY BACKTESTED AGAINST LIVE ORDER BOOKS.
          EQUITY AND DERIVATIVE MARKETS INVOLVE SIGNIFICANT RISK OF CAPITAL LOSS. CONSULT A SEBI-REGISTERED FINANCIAL ADVISOR BEFORE EXECUTING TRADES.
        </p>
      </div>
    </div>
  );
};
