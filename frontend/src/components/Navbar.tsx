import React, { useState, useEffect, useRef } from 'react';
import { BarChart3, Layers, Clock, LogIn, LogOut, Star, Sun, Moon } from 'lucide-react';
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
  theme?: 'dark' | 'light';
  onToggleTheme?: () => void;
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
  theme = 'dark',
  onToggleTheme,
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
    <header className="sticky top-0 z-50 h-16 border-b border-[#dee1e6] dark:border-white/10 bg-white/95 dark:bg-[#0a0b0d]/95 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={onHomeClick}
          className="flex items-center gap-2.5 cursor-pointer group select-none"
        >
          <img
            src="/logo.png"
            alt="EquiAgentic Logo"
            className="w-8 h-8 rounded-lg object-contain bg-white dark:bg-white/5 shrink-0 border border-[#dee1e6] dark:border-white/15 p-0.5 shadow-sm"
          />
          <div className="flex items-center gap-1.5">
            <span className="font-display font-bold text-[#0a0b0d] dark:text-white tracking-tight text-base sm:text-lg">
              EQUI<span className="text-[#0052ff]">AGENTIC</span>
            </span>
          </div>
        </div>

        {/* Center Nav Links - Coinbase Pill Geometry */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10">
          <button
            type="button"
            onClick={onHomeClick}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'bg-white dark:bg-white/15 text-[#0a0b0d] dark:text-white shadow-sm'
                : 'text-[#5b616e] dark:text-[#a8acb3] hover:text-[#0a0b0d] dark:hover:text-white'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 text-[#0052ff]" />
            <span>Markets</span>
          </button>

          <button
            type="button"
            onClick={handleCatalogNav}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'catalog'
                ? 'text-[#5b616e] dark:text-[#a8acb3] hover:text-[#0a0b0d] dark:hover:text-white'
                : 'text-[#7c828a] dark:text-[#a8acb3] hover:text-[#0a0b0d] dark:hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stock Universe</span>
          </button>

          {/* Research Archive / History Tab */}
          <button
            type="button"
            onClick={onHistoryClick}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'history'
                ? 'bg-white dark:bg-white/15 text-[#0a0b0d] dark:text-white shadow-sm'
                : 'text-[#5b616e] dark:text-[#a8acb3] hover:text-[#0a0b0d] dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-[#0052ff]" />
            <span>My Reports</span>
            {savedCount > 0 && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-[#0052ff]/10 dark:bg-[#0052ff]/20 text-[#0052ff] font-bold">
                {savedCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Section: Theme Toggle + Feed Status + User Auth */}
        <div className="flex items-center gap-2.5">
          {/* Feed Status Chip */}
          <div className="hidden sm:flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 text-[#5b616e] dark:text-[#a8acb3] font-mono text-[11px] font-semibold tracking-wider">
            <span
              className={`w-2 h-2 rounded-full ${
                backendHealthy === false
                  ? 'bg-[#cf202f]'
                  : dhanProActive
                  ? 'bg-[#0052ff]'
                  : 'bg-[#05b169]'
              }`}
            />
            <span>
              {backendHealthy === false
                ? 'FEED OFFLINE'
                : dhanProActive
                ? 'DHAN PRO'
                : 'EXCHANGE FEED'}
            </span>
          </div>

          {/* Dark / Light Mode Toggle Button */}
          {onToggleTheme && (
            <button
              type="button"
              onClick={onToggleTheme}
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              className="w-9 h-9 rounded-full border border-[#dee1e6] dark:border-white/10 bg-[#f7f7f7] dark:bg-white/5 hover:bg-[#eef0f3] dark:hover:bg-white/10 text-[#0a0b0d] dark:text-white transition-all flex items-center justify-center cursor-pointer shadow-sm hover:scale-105"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#f4b000]" />
              ) : (
                <Moon className="w-4 h-4 text-[#5b616e]" />
              )}
            </button>
          )}

          {/* Authentication Component / Profile Pill */}
          {user ? (
            <div ref={userMenuRef} className="relative pl-1 flex items-center">
              <button
                type="button"
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#dee1e6] dark:border-white/10 bg-[#f7f7f7] dark:bg-white/5 hover:bg-[#eef0f3] dark:hover:bg-white/10 transition-all cursor-pointer shadow-sm"
              >
                {user.picture ? (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-[#0052ff] flex items-center justify-center text-white font-bold text-[10px]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-[#0a0b0d] dark:text-white hidden sm:inline max-w-[120px] truncate">
                  {user.name}
                </span>
              </button>

              {/* User Dropdown Menu */}
              {isUserMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-[#dee1e6] dark:border-white/15 bg-white dark:bg-[#16181c] shadow-2xl p-2 z-50 animate-fade-in">
                  <div className="px-3.5 py-2.5 rounded-xl bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/5 mb-1.5">
                    <p className="text-xs font-bold text-[#0a0b0d] dark:text-white truncate">{user.name}</p>
                    <p className="text-[11px] text-[#5b616e] dark:text-[#a8acb3] font-mono truncate mt-0.5">{user.email}</p>
                  </div>

                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        if (onWatchlistClick) onWatchlistClick();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#0a0b0d] dark:text-slate-200 hover:bg-[#f7f7f7] dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    >
                      <Star className="w-3.5 h-3.5 text-[#f4b000] shrink-0 fill-[#f4b000]" />
                      <span>Watchlist &amp; Favourites</span>
                    </button>

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        onHistoryClick();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-[#0a0b0d] dark:text-slate-200 hover:bg-[#f7f7f7] dark:hover:bg-white/5 transition-colors text-left cursor-pointer"
                    >
                      <Clock className="w-3.5 h-3.5 text-[#0052ff] shrink-0" />
                      <span>Saved Reports</span>
                    </button>

                    <div className="pt-1.5 mt-1 border-t border-[#dee1e6] dark:border-white/10">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#cf202f] hover:bg-[#cf202f]/10 transition-colors text-left cursor-pointer"
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
            <div className="pl-1 flex items-center">
              <button
                type="button"
                onClick={onOpenAuth}
                className="cb-pill-btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
