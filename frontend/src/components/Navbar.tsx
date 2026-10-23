import React from 'react';
import { BarChart3, BookOpen, Layers, Bookmark } from 'lucide-react';

interface NavbarProps {
  onHomeClick: () => void;
  backendHealthy: boolean | null;
}

export const Navbar: React.FC<NavbarProps> = ({ onHomeClick, backendHealthy }) => {
  return (
    <header className="border-b border-white/10 bg-[#07090e]/90 backdrop-blur-xl sticky top-0 z-40 shadow-2xl shadow-black/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={onHomeClick}
          className="flex items-center gap-3 cursor-pointer group transition-all"
        >
          <div className="relative w-9 h-9 rounded-xl bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-white font-black text-sm tracking-tighter shadow-lg shadow-fuchsia-500/10 group-hover:border-fuchsia-400/60 group-hover:shadow-fuchsia-500/20 transition-all">
            <span className="text-fuchsia-400 font-black">
              EQ
            </span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-fuchsia-400 ring-2 ring-[#07090e] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white tracking-wider text-base sm:text-lg">
                EQUI<span className="text-fuchsia-400">AGENTIC</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30">
                RESEARCH
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5 font-mono">
              <span>Institutional Equity Intelligence</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300">NSE &amp; BSE Universe</span>
            </p>
          </div>
        </div>

        {/* Center Nav Links - Financial Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={onHomeClick}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-white/10 shadow-sm border border-white/10 transition-all flex items-center gap-1.5"
          >
            <BarChart3 className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Markets</span>
          </button>
          <button
            type="button"
            onClick={onHomeClick}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Stock Catalog</span>
          </button>
          <span className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 cursor-not-allowed flex items-center gap-1.5 opacity-60">
            <Bookmark className="w-3.5 h-3.5" />
            <span>Watchlist</span>
          </span>
          <span className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-slate-200 cursor-not-allowed flex items-center gap-1.5 opacity-60">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Research Archive</span>
          </span>
        </nav>

        {/* Right Section: Live Feed Status & User Pill */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-slate-200 shadow-inner">
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealthy === true
                  ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)] animate-pulse'
                  : backendHealthy === false
                  ? 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.6)]'
                  : 'bg-amber-400'
              }`}
            />
            <span className="font-mono text-[11px] font-medium tracking-tight">
              {backendHealthy === true ? (
                <span className="text-slate-300 font-semibold">FEED ONLINE</span>
              ) : backendHealthy === false ? (
                <span className="text-rose-400">FEED OFFLINE</span>
              ) : (
                <span className="text-amber-300">CONNECTING</span>
              )}
            </span>
          </div>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2 pl-2 border-l border-white/10">
            <div className="w-7 h-7 rounded-lg bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-200 font-bold text-xs shadow-sm">
              P
            </div>
            <span className="text-xs text-slate-200 font-medium hidden sm:inline">Piyush</span>
          </div>
        </div>
      </div>
    </header>
  );
};
