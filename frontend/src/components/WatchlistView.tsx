import React, { useState, useEffect } from 'react';
import { Star, ArrowLeft, Building2, Trash2, Loader2 } from 'lucide-react';
import { fetchWatchlist, removeFromWatchlist } from '../api';

interface WatchlistViewProps {
  onSelectStock: (symbol: string, exchange: string) => void;
  onBackToCatalog: () => void;
  onRequireAuth: () => void;
  isAuthenticated: boolean;
}

export const WatchlistView: React.FC<WatchlistViewProps> = ({
  onSelectStock,
  onBackToCatalog,
  onRequireAuth,
  isAuthenticated,
}) => {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [removingSymbol, setRemovingSymbol] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadWatchlist();
    } else {
      try {
        const local = localStorage.getItem('equiagentic_guest_watchlist');
        if (local) {
          setItems(JSON.parse(local));
        }
      } catch { }
    }
  }, [isAuthenticated]);

  const loadWatchlist = async () => {
    setIsLoading(true);
    try {
      const data = await fetchWatchlist();
      setItems(data || []);
    } catch (err) {
      console.error('Failed to load watchlist:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemove = async (symbol: string, exchange: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRemovingSymbol(symbol);
    try {
      if (isAuthenticated) {
        await removeFromWatchlist(symbol, exchange);
      } else {
        const updated = items.filter((it) => it.symbol !== symbol);
        setItems(updated);
        localStorage.setItem('equiagentic_guest_watchlist', JSON.stringify(updated));
      }
      setItems((prev) => prev.filter((it) => it.symbol !== symbol));
    } catch (err) {
      console.error('Failed to remove from watchlist:', err);
    } finally {
      setRemovingSymbol(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#dee1e6] dark:border-white/10 mb-6">
        <div>
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 hover:border-[#0052ff] text-xs font-mono text-[#5b616e] dark:text-[#a8acb3] hover:text-[#0a0b0d] dark:hover:text-white mb-3 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#0052ff]" />
            <span>Back to Market Catalog</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-normal text-[#0a0b0d] dark:text-white font-display flex items-center gap-3">
            <span>Watchlist &amp; Favourites</span>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#f4b000]/10 text-[#f4b000] border border-[#f4b000]/30 font-semibold">
              {items.length} Tracked
            </span>
          </h1>
          <p className="text-xs text-[#5b616e] dark:text-[#a8acb3] font-mono mt-1">
            Institutional watchlist for priority equity monitoring and quick multi-agent research.
          </p>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="mb-6 p-5 rounded-3xl border border-[#dee1e6] dark:border-white/10 bg-[#f7f7f7] dark:bg-[#16181c] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 rounded-full bg-[#f4b000]/10 border border-[#f4b000]/30 flex items-center justify-center text-[#f4b000] shrink-0">
              <Star className="h-5 w-5 fill-[#f4b000]" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-[#0a0b0d] dark:text-white">Local Session Watchlist</h4>
              <p className="text-xs text-[#5b616e] dark:text-[#a8acb3] font-mono">Sign in to sync your favourites across all devices.</p>
            </div>
          </div>
          <button
            onClick={onRequireAuth}
            className="cb-pill-btn-primary px-5 py-2 text-xs font-semibold shrink-0 cursor-pointer shadow-sm"
          >
            Sign In to Sync
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#7c828a]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0052ff] mb-3" />
          <p className="text-xs font-mono">Retrieving watchlist equities...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#dee1e6] dark:border-white/10 p-12 text-center bg-[#f7f7f7] dark:bg-white/[0.02]">
          <Star className="mx-auto h-10 w-10 text-[#7c828a] mb-3" />
          <h3 className="text-sm font-semibold text-[#0a0b0d] dark:text-white mb-1">Your watchlist is empty</h3>
          <p className="text-xs text-[#5b616e] dark:text-[#a8acb3] max-w-sm mx-auto mb-4 font-mono">
            Click the star icon on any stock card in the catalog to add it to your favourites.
          </p>
          <button
            onClick={onBackToCatalog}
            className="cb-pill-btn-primary px-5 py-2 text-xs font-semibold cursor-pointer shadow-sm"
          >
            Explore Stock Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => {
            const monogram = item.symbol.slice(0, 2).toUpperCase();
            return (
              <div
                key={`${item.symbol}-${item.exchange}`}
                onClick={() => onSelectStock(item.symbol, item.exchange || 'NSE')}
                className="cb-card cb-card-hover p-6 rounded-[24px] cursor-pointer flex flex-col justify-between group transition-all duration-200 select-none"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 flex items-center justify-center font-mono font-medium text-sm text-[#0a0b0d] dark:text-white group-hover:bg-[#0052ff] group-hover:text-white group-hover:border-[#0052ff] transition-all duration-200 shrink-0">
                        {monogram}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-semibold text-[#0a0b0d] dark:text-white tracking-tight group-hover:text-[#0052ff] transition-colors">
                            {item.symbol}
                          </span>
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#eef0f3] dark:bg-white/10 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10">
                            {item.exchange || 'NSE'}
                          </span>
                        </div>
                        <p className="text-sm font-normal text-[#5b616e] dark:text-[#a8acb3] group-hover:text-[#0a0b0d] dark:group-hover:text-white truncate mt-0.5 transition-colors">
                          {item.company_name}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleRemove(item.symbol, item.exchange || 'NSE', e)}
                      disabled={removingSymbol === item.symbol}
                      title="Remove from watchlist"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[#7c828a] hover:text-[#cf202f] hover:bg-[#cf202f]/10 transition-colors"
                    >
                      {removingSymbol === item.symbol ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  <div className="mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 text-xs text-[#5b616e] dark:text-[#a8acb3] font-normal truncate max-w-full">
                      <Building2 className="w-3 h-3 text-[#7c828a] shrink-0" />
                      <span className="truncate">{item.sector || 'Listed Equity'}</span>
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#dee1e6] dark:border-white/10 flex items-center justify-between text-xs text-[#7c828a]">
                  <span className="text-[11px] font-mono text-[#7c828a] dark:text-[#636870]">TRACKED ASSET</span>
                  <span className="text-xs font-medium text-[#0052ff] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    Analyze Dossier →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
