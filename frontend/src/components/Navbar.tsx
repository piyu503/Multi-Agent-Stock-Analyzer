import React, { useState } from 'react';
import { BarChart3, Layers, Clock, LogIn, LogOut } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  onHomeClick: () => void;
  onHistoryClick: () => void;
  backendHealthy: boolean | null;
  dhanProActive?: boolean;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  activeTab?: string;
  savedCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onHomeClick,
  onHistoryClick,
  backendHealthy,
  dhanProActive,
  user,
  onOpenAuth,
  onLogout,
  activeTab = 'catalog',
  savedCount = 0,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'text-white bg-white/10 shadow-sm border border-white/10'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>Markets</span>
          </button>

          <button
            type="button"
            onClick={onHomeClick}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Stock Catalog</span>
          </button>

          {/* Research Archive / History Tab */}
          <button
            type="button"
            onClick={onHistoryClick}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'text-white bg-fuchsia-500/20 text-fuchsia-300 shadow-sm border border-fuchsia-500/30'
                : 'text-slate-300 hover:text-white hover:bg-white/[0.04]'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-fuchsia-400" />
            <span>My Reports</span>
            {savedCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40">
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Section: Live Feed Status & User Auth Pill */}
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
            <span className="font-mono text-[11px] font-medium tracking-tight hidden sm:inline">
              {backendHealthy === true ? (
                <span className="text-slate-300 font-semibold">FEED ONLINE</span>
              ) : backendHealthy === false ? (
                <span className="text-rose-400">FEED OFFLINE</span>
              ) : (
                <span className="text-amber-300">CONNECTING</span>
              )}
            </span>
          </div>

          {/* Dhan Pro Live Feed Indicator */}
          {dhanProActive && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-bold shadow-[0_0_10px_rgba(6,182,212,0.25)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>⚡ DHAN PRO</span>
            </div>
          )}

          {/* Authentication Component / Profile Pill */}
          {user ? (
            <div className="relative pl-2 border-l border-white/10">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 py-1 px-2 rounded-xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all cursor-pointer"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-7 h-7 rounded-lg object-cover ring-1 ring-fuchsia-500/40"
                  />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-fuchsia-600 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-slate-200 font-medium hidden sm:inline max-w-[100px] truncate">
                  {user.name}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-white/10 bg-[#090d16]/95 backdrop-blur-xl shadow-2xl shadow-black/80 p-1.5 z-50 animate-fade-in">
                  <div className="px-3 py-2 border-b border-white/5 mb-1">
                    <p className="text-xs font-semibold text-white truncate">{user.name}</p>
                    <p className="text-[10px] text-slate-400 font-mono truncate">{user.email}</p>
                  </div>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onHistoryClick();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-all text-left cursor-pointer"
                  >
                    <Clock className="w-3.5 h-3.5 text-fuchsia-400" />
                    <span>Saved Reports</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-all text-left mt-1 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="pl-2 border-l border-white/10">
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600/30 to-violet-600/30 hover:from-fuchsia-600/50 hover:to-violet-600/50 border border-fuchsia-500/40 text-fuchsia-200 text-xs font-mono font-medium transition-all shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-fuchsia-400" />
                <span>SIGN IN</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
