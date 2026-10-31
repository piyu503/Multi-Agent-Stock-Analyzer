import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Layers, Clock, LogIn, LogOut, Star } from 'lucide-react';
import type { User } from '../types';

interface NavbarProps {
  onHomeClick: () => void;
  onCatalogClick?: () => void;
  onHistoryClick: () => void;
  onWatchlistClick?: () => void;
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
  onCatalogClick,
  onHistoryClick,
  onWatchlistClick,
  backendHealthy,
  dhanProActive,
  user,
  onOpenAuth,
  onLogout,
  activeTab = 'catalog',
  savedCount = 0,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    if (isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isUserMenuOpen]);

  const handleCatalogNav = () => {
    if (onCatalogClick) {
      onCatalogClick();
    } else {
      onHomeClick();
    }
  };

  return (
    <header className="border-b border-white/10 bg-[#0d101d]/95 backdrop-blur-md sticky top-0 z-50 shadow-2xl shadow-black/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={onHomeClick}
          className="flex items-center gap-3 cursor-pointer group transition-colors duration-120"
        >
          <div className="relative w-9 h-9 rounded-[8px] bg-fuchsia-500/10 border border-fuchsia-500/30 flex items-center justify-center text-white font-black text-sm tracking-tight shadow-lg shadow-fuchsia-500/10 group-hover:border-fuchsia-400/60 group-hover:shadow-fuchsia-500/20 transition-colors">
            <span className="text-fuchsia-400 font-black">
              EQ
            </span>
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-fuchsia-400 ring-2 ring-[#07090e] animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-white tracking-normal text-base sm:text-lg">
                EQUI<span className="text-fuchsia-400">AGENTIC</span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded-[4px] bg-fuchsia-500/10 text-fuchsia-300 border border-fuchsia-500/30">
                RESEARCH
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:flex items-center gap-1.5 font-mono">
              <span>Institutional Equity Intelligence</span>
            </p>
          </div>
        </div>

        {/* Center Nav Links - Financial Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/5">
          <button
            type="button"
            onClick={onHomeClick}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-120 flex items-center gap-1.5 cursor-pointer ${
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
            onClick={handleCatalogNav}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-120 flex items-center gap-1.5 cursor-pointer ${
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
            className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-120 flex items-center gap-1.5 cursor-pointer ${
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
            <div className="hidden sm:flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-[4px] bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-mono text-[11px] font-semibold tracking-[0.04em]">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span>DHAN PRO</span>
            </div>
          )}

          {/* Authentication Component / Profile Pill */}
          {user ? (
            <div ref={userMenuRef} className="relative pl-2 border-l border-white/10 flex items-center">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1 rounded-[6px] border border-white/15 bg-white/[0.04] hover:bg-white/[0.08] hover:border-white/30 transition-all cursor-pointer"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-5 h-5 rounded-[4px] object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-[4px] bg-gradient-to-tr from-fuchsia-600 to-violet-600 flex items-center justify-center text-white font-bold text-[11px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-200 hover:text-white hidden sm:inline max-w-[120px] truncate">
                  {user.name}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-[8px] border border-white/15 bg-[#090d16] shadow-2xl p-2 z-50 animate-fade-in">
                  <div className="px-3 py-2 rounded-[6px] bg-white/[0.03] border border-white/5 mb-1.5">
                    <p className="text-xs font-bold text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-slate-400 font-mono truncate mt-0.5">{user.email}</p>
                  </div>

                  <div className="space-y-0.5">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onWatchlistClick) onWatchlistClick();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors duration-120 text-left cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span>Watchlist &amp; Favourites</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onHistoryClick();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-xs font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors duration-120 text-left cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-fuchsia-400 shrink-0" />
                      <span>Saved Reports</span>
                    </button>

                    <div className="pt-1.5 mt-1 border-t border-white/10">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[6px] text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors duration-120 text-left cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5 shrink-0" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="pl-2 border-l border-white/10">
              <button
                type="button"
                onClick={onOpenAuth}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-fuchsia-600/30 to-violet-600/30 hover:from-fuchsia-600/50 hover:to-violet-600/50 border border-fuchsia-500/40 text-fuchsia-200 text-xs font-mono font-medium transition-colors duration-120 shadow-sm cursor-pointer"
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
