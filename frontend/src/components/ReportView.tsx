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
  Download
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
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-slate-300 hover:text-white transition px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO STOCK PROFILE</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => window.print()}
            title="Download formatted PDF or print institutional investment memo"
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600/30 to-violet-600/30 hover:from-fuchsia-600/50 hover:to-violet-600/50 border border-fuchsia-500/40 text-fuchsia-200 text-xs font-mono font-medium transition-all shadow-md shadow-fuchsia-950/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>EXPORT AS PDF</span>
          </button>

          <span className="text-[11px] font-mono uppercase tracking-widest text-slate-400 hidden sm:inline">
            REPORT SECURITY TIER: INSTITUTIONAL
          </span>
          {isLiveVerified ? (
            <div className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>SYNTHESIS VERIFIED</span>
            </div>
          ) : isFallback ? (
            <div className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(245,158,11,0.2)]">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>FALLBACK AUDIT REPORT</span>
            </div>
          ) : (
            <div className="px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(217,70,239,0.2)]">
              <span className="w-2 h-2 rounded-full bg-fuchsia-400" />
              <span>LOCAL DEV STUB</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Terminal Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0c101d] via-[#090d18] to-[#060810] border border-white/15 p-6 sm:p-9 shadow-2xl shadow-black/80 backdrop-blur-xl">
        {/* Ambient neon backdrop glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-7 border-b border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-3">
              <span className="font-display text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                {report.symbol}
              </span>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md border ${isNSE
                  ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                  }`}
              >
                {report.exchange} LISTED
              </span>
              <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-white/5 text-slate-300 border border-white/10">
                MULTI-AGENT RESEARCH
              </span>

              {/* High-Impact Conviction Badge */}
              {report.conviction && (
                <div
                  className={`text-xs font-mono font-extrabold px-3 py-1 rounded-lg border flex items-center gap-2 ${isOverweight
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]'
                    : isUnderweight
                      ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]'
                      : 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]'
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
          <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/5">
            <span className="text-slate-400 font-mono block text-[11px] mb-1">RESEARCH COMMITTEE</span>
            <span className="text-white font-bold text-sm">13 Analyst Roles</span>
          </div>
          <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/5">
            <span className="text-slate-400 font-mono block text-[11px] mb-1">DEBATE FRAMEWORK</span>
            <span className="text-white font-bold text-sm">Draft + Rebuttal Review</span>
          </div>
          <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/5">
            <span className="text-slate-400 font-mono block text-[11px] mb-1">EVIDENCE CITATION</span>
            <span className="text-emerald-300 font-bold text-sm">BSE Filings + Multi-Year Fin</span>
          </div>
          <div className="bg-white/[0.03] p-3.5 rounded-xl border border-white/5">
            <span className="text-slate-400 font-mono block text-[11px] mb-1">CAPITAL CONVICTION</span>
            <span className={`font-bold text-sm ${isOverweight ? 'text-emerald-400' : isUnderweight ? 'text-rose-400' : 'text-amber-400'}`}>
              {report.conviction || 'NEUTRAL'}
            </span>
          </div>
        </div>
      </div>

      {/* ADVERSARIAL BULL VS. BEAR ARENA (Inspired by Neon Trading Terminal Theme) */}
      <div className="rounded-3xl bg-[#0c101d]/90 border border-white/15 p-6 sm:p-8 shadow-2xl shadow-black/80 backdrop-blur-xl relative overflow-hidden">
        {/* Glow corner */}
        <div className="absolute top-0 right-1/2 w-72 h-72 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 mb-6 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-600/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300 shadow-[0_0_15px_rgba(217,70,239,0.25)]">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-display">Investment Thesis: Bull vs. Bear Debate</h3>
              <p className="text-xs text-slate-300">Independent upside and downside analysis followed by cross-examination to eliminate confirmation bias.</p>
            </div>
          </div>
          <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 whitespace-nowrap self-start sm:self-auto">
            Cross-Examination &amp; Rebuttal
          </span>
        </div>

        {/* Bull vs Bear Balance Bar */}
        <div className="mb-7 bg-[#070b13] p-4 rounded-2xl border border-white/10">
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
          <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden flex p-0.5 border border-white/10">
            <div
              className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-l-full shadow-[0_0_12px_rgba(16,185,129,0.8)] transition-all"
              style={{ width: `${bullPct}%` }}
            />
            <div
              className="bg-gradient-to-r from-rose-500 to-crimson-500 h-full rounded-r-full shadow-[0_0_12px_rgba(244,63,94,0.8)] transition-all"
              style={{ width: `${bearPct}%` }}
            />
          </div>
        </div>

        {/* Two-Column Split: Neon Bull vs Neon Bear */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Bull Column */}
          <div className="rounded-2xl p-6 bg-gradient-to-b from-emerald-950/30 to-[#070d14] border border-emerald-500/40 shadow-xl shadow-emerald-950/20">
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
            <ul className="space-y-3">
              {report.bull_vs_bear.bull_case.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-100 flex items-start gap-2.5 bg-black/40 p-3 rounded-xl border border-emerald-500/20 leading-relaxed font-sans">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <span className="text-slate-100">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Bear Column */}
          <div className="rounded-2xl p-6 bg-gradient-to-b from-rose-950/30 to-[#070d14] border border-rose-500/40 shadow-xl shadow-rose-950/20">
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
            <ul className="space-y-3">
              {report.bull_vs_bear.bear_case.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-100 flex items-start gap-2.5 bg-black/40 p-3 rounded-xl border border-rose-500/20 leading-relaxed font-sans">
                  <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                  <span className="text-slate-100">{item}</span>
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
                <div key={idx} className="bg-[#070b13] p-4 rounded-xl border border-amber-500/30 text-xs text-slate-200 shadow-lg">
                  <span className="text-amber-400 font-mono text-[11px] font-bold block mb-1.5 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
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
        <div className="rounded-3xl bg-[#0c101d]/90 border border-cyan-500/30 p-6 sm:p-8 shadow-2xl shadow-cyan-950/20 backdrop-blur-xl">
          <div className="flex items-center justify-between pb-5 border-b border-white/10 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                <Crosshair className="w-5 h-5 stroke-[2]" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-display">Tactical Trade Desk Execution Matrix</h3>
                <p className="text-xs text-slate-300">Disciplined institutional entry bands, invalidation thresholds, and volatility buffers.</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
              Trade Desk Execution Parameters
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
            <div className="bg-[#070b13] p-4 rounded-xl border border-white/10">
              <span className="text-[11px] text-slate-400 font-mono block mb-1">OPTIMAL ENTRY (LOW)</span>
              <span className="text-base font-mono font-bold text-white">
                {report.execution_plan?.entry_range_low ? `₹${report.execution_plan.entry_range_low}` : 'Awaiting Desk Entry'}
              </span>
            </div>
            <div className="bg-[#070b13] p-4 rounded-xl border border-white/10">
              <span className="text-[11px] text-slate-400 font-mono block mb-1">OPTIMAL ENTRY (HIGH)</span>
              <span className="text-base font-mono font-bold text-white">
                {report.execution_plan?.entry_range_high ? `₹${report.execution_plan.entry_range_high}` : 'Awaiting Desk Entry'}
              </span>
            </div>
            <div className="bg-[#070b13] p-4 rounded-xl border border-rose-500/40 bg-rose-950/10 shadow-[0_0_10px_rgba(244,63,94,0.1)]">
              <span className="text-[11px] text-rose-400 font-mono font-bold block mb-1">INVALIDATION STOP</span>
              <span className="text-base font-mono font-bold text-rose-300">
                {report.execution_plan?.invalidation_stop ? `₹${report.execution_plan.invalidation_stop}` : 'Awaiting Invalidation Stop'}
              </span>
            </div>
            <div className="bg-[#070b13] p-4 rounded-xl border border-cyan-500/30">
              <span className="text-[11px] text-cyan-400 font-mono font-bold block mb-1">14-DAY ATR BUFFER</span>
              <span className="text-base font-mono font-bold text-cyan-200">
                {report.execution_plan?.atr_buffer ? `₹${report.execution_plan.atr_buffer}` : 'Awaiting ATR Buffer'}
              </span>
            </div>
          </div>

          {/* Staged Accumulation Pacing */}
          {report.execution_plan.staged_tranches && report.execution_plan.staged_tranches.length > 0 && (
            <div className="bg-[#070b13] p-5 rounded-2xl border border-white/10">
              <span className="text-xs font-mono text-slate-200 block mb-3 font-bold uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                Staged Position Accumulation Roadmap
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {report.execution_plan.staged_tranches.map((tranche, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 bg-white/5 p-3.5 rounded-xl border border-white/10">
                    <span className="text-cyan-400 font-mono font-extrabold text-sm shrink-0">0{idx + 1}</span>
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
        <div className="rounded-3xl bg-[#0c101d]/90 border border-white/10 p-6 sm:p-7 shadow-xl shadow-black/60">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
            <Layers className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-bold text-white font-display">{report.business_overview.title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4 font-sans">{report.business_overview.summary}</p>
          <div className="space-y-2">
            {report.business_overview.key_points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 bg-[#070b13] p-3 rounded-xl border border-white/5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Durability & Solvency */}
        <div className="rounded-3xl bg-[#0c101d]/90 border border-white/10 p-6 sm:p-7 shadow-xl shadow-black/60">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
            <FileCheck2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white font-display">{report.financial_analysis.title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4 font-sans">{report.financial_analysis.summary}</p>
          <div className="space-y-2">
            {report.financial_analysis.key_points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 bg-[#070b13] p-3 rounded-xl border border-white/5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(6,182,212,0.8)]" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Growth Prospects & Structural Tailwinds */}
        <div className="rounded-3xl bg-[#0c101d]/90 border border-white/10 p-6 sm:p-7 shadow-xl shadow-black/60">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
            <TrendingUp className="w-5 h-5 text-fuchsia-400" />
            <h3 className="text-base font-bold text-white font-display">{report.growth_prospects.title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4 font-sans">{report.growth_prospects.summary}</p>
          <div className="space-y-2">
            {report.growth_prospects.key_points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 bg-[#070b13] p-3 rounded-xl border border-white/5">
                <span className="w-2 h-2 rounded-full bg-fuchsia-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(217,70,239,0.8)]" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Valuation Benchmarking & Peer Multiple */}
        <div className="rounded-3xl bg-[#0c101d]/90 border border-white/10 p-6 sm:p-7 shadow-xl shadow-black/60">
          <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
            <Scale className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-white font-display">{report.valuation.title}</h3>
          </div>
          <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4 font-sans">{report.valuation.summary}</p>
          <div className="space-y-2">
            {report.valuation.key_points.map((pt, idx) => (
              <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 bg-[#070b13] p-3 rounded-xl border border-white/5">
                <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(245,158,11,0.8)]" />
                <span className="leading-relaxed font-sans">{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Downside Risks & Tail-Risk Stress Testing */}
      <div className="rounded-3xl bg-[#0c101d]/90 border border-rose-500/25 p-6 sm:p-8 shadow-xl shadow-black/60">
        <div className="flex items-center gap-2.5 pb-4 border-b border-white/10 mb-4">
          <ShieldAlert className="w-5 h-5 text-rose-400" />
          <h3 className="text-base font-bold text-white font-display">{report.risks.title}</h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed mb-4 font-sans">{report.risks.summary}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {report.risks.key_points.map((pt, idx) => (
            <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-200 bg-[#070b13] p-3.5 rounded-xl border border-rose-500/20">
              <span className="w-2 h-2 rounded-full bg-rose-400 shrink-0 mt-1.5 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
              <span className="leading-relaxed font-sans">{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* FINAL ASSESSMENT: INVESTMENT COMMITTEE SYNTHESIS */}
      <div className="rounded-3xl bg-gradient-to-br from-[#0c101d] via-[#10162a] to-[#0a0f1d] border border-white/20 p-6 sm:p-9 shadow-2xl shadow-fuchsia-950/20">
        <div className="flex items-center gap-3 pb-4 border-b border-white/10 mb-4">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-300">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white font-display">{report.final_assessment.title}</h3>
            <span className="text-[11px] font-mono text-emerald-400">Portfolio Manager Executive Synthesis</span>
          </div>
        </div>
        <p className="text-sm sm:text-base text-slate-100 leading-relaxed mb-5 font-sans font-medium">{report.final_assessment.summary}</p>
        <div className="space-y-2.5">
          {report.final_assessment.key_points.map((pt, idx) => (
            <div key={idx} className="flex items-start gap-3 text-xs sm:text-sm text-slate-200 bg-[#070b13] p-3.5 rounded-xl border border-white/10 font-sans">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 mt-2 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              <span className="leading-relaxed">{pt}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 13-STAGE RESEARCH COMMITTEE AUDIT */}
      {report.agent_runs && report.agent_runs.length > 0 && (
        <div className="rounded-3xl bg-[#0c101d]/90 border border-white/15 p-6 sm:p-8 shadow-2xl shadow-black/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-white/10 mb-6 gap-3">
            <div>
              <h3 className="text-lg font-bold text-white font-display">13-Stage Research Committee Audit</h3>
              <p className="text-xs text-slate-300">Execution traces, analyst confidence scores, verified findings, and audit notes.</p>
            </div>
            <span className="text-xs font-mono font-bold px-3 py-1 rounded-full bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30 whitespace-nowrap self-start sm:self-auto">
              {report.agent_runs.length} Roles Verified
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {report.agent_runs.map((agent, idx) => (
              <div
                key={idx}
                className="bg-[#070b13] p-5 rounded-2xl border border-white/10 flex flex-col justify-between space-y-3 hover:border-white/20 transition-all shadow-md"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <span className="font-bold text-sm text-white font-display">{agent.agent_name}</span>
                    <span
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${agent.execution_status === 'success'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40'
                        : agent.execution_status === 'error'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/40'
                          : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                        }`}
                    >
                      {agent.execution_status.toUpperCase()} ({agent.execution_duration_sec}s)
                    </span>
                  </div>
                  <p className="text-[11px] font-mono text-cyan-300 mb-2">[{agent.role}]</p>
                  <p className="text-xs text-slate-200 leading-relaxed mb-3 font-sans">{agent.summary}</p>

                  {/* Findings */}
                  {agent.findings.length > 0 && (
                    <div className="space-y-1.5 mb-2.5">
                      <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block tracking-wider">
                        Key Empirical Findings:
                      </span>
                      <ul className="space-y-1.5">
                        {agent.findings.slice(0, 2).map((f, fIdx) => (
                          <li key={fIdx} className="text-xs text-slate-300 flex items-start gap-2 font-sans">
                            <span className="text-emerald-400 font-bold">•</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Data limitations / Unknowns */}
                  {agent.missing_information.length > 0 && (
                    <div className="text-xs text-amber-300 bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/30 mt-2 font-sans">
                      <strong className="block text-[10px] uppercase font-mono font-bold text-amber-400 mb-0.5">
                        Audit Note:
                      </strong>
                      <span>{agent.missing_information[0]}</span>
                    </div>
                  )}
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>Confidence: <strong className="text-white">{(agent.confidence_score * 100).toFixed(0)}%</strong></span>
                  <span className="truncate max-w-[55%] text-right text-slate-400">{agent.confidence_explanation}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* INSTITUTIONAL COMPLIANCE FOOTER */}
      <div className="pt-6 border-t border-white/10 text-center">
        <p className="text-xs font-mono text-slate-500 max-w-3xl mx-auto leading-relaxed">
          EQUIAGENTIC CAPITAL RESEARCH • ALL FINDINGS ARE SYNTHESIZED THROUGH A 13-STAGE ANALYST FRAMEWORK
          GROUNDED IN DETERMINISTIC FINANCIAL MATH AND OFFICIAL EXCHANGE FILINGS. FOR PROFESSIONAL DUE DILIGENCE.
        </p>
      </div>
    </div>
  );
};
