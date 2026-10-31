import React, { useState, useEffect } from 'react';
import { Star, ArrowLeft, Building2, ExternalLink, Trash2, Loader2 } from 'lucide-react';
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
      } catch {}
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
        <div>
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 font-mono transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Market Catalog</span>
          </button>
          <h1 className="text-2xl font-bold text-white font-display flex items-center gap-2.5">
            <span>Watchlist &amp; Favourites</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-[4px] bg-amber-500/10 text-amber-300 border border-amber-500/30">
              {items.length} Tracked
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Institutional watchlist for priority equity monitoring and quick multi-agent research.
          </p>
        </div>
      </div>

      {!isAuthenticated && (
        <div className="mb-6 p-4 rounded-[8px] border border-amber-500/30 bg-gradient-to-r from-amber-950/40 via-violet-950/20 to-black/60 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[8px] bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 shrink-0">
              <Star className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Local Session Watchlist</h4>
              <p className="text-xs text-slate-400 font-mono">Sign in to sync your favourites across all devices.</p>
            </div>
          </div>
          <button
            onClick={onRequireAuth}
            className="px-4 py-2 rounded-[8px] bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black text-xs font-bold shrink-0 cursor-pointer shadow-lg shadow-amber-950/40"
          >
            Sign In to Sync
          </button>
        </div>
      )}

      {/* Loading state */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400 mb-3" />
          <p className="text-xs font-mono">Retrieving watchlist equities...</p>
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-[8px] border border-dashed border-white/10 p-12 text-center bg-white/[0.01]">
          <Star className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">Your watchlist is empty</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto mb-4 font-mono">
            Click the star icon on any stock card in the catalog to add it to your favourites.
          </p>
          <button
            onClick={onBackToCatalog}
            className="px-4 py-2 rounded-[8px] bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors cursor-pointer"
          >
            Explore Stock Catalog
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((item) => (
            <div
              key={`${item.symbol}-${item.exchange}`}
              onClick={() => onSelectStock(item.symbol, item.exchange || 'NSE')}
              className="group relative rounded-[8px] border border-white/10 bg-[#07090e] p-4 transition-colors hover:border-amber-500/40 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-white tracking-wide group-hover:text-amber-300 transition-colors">
                      {item.symbol}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[4px] bg-white/5 text-slate-300 border border-white/10">
                      {item.exchange || 'NSE'}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleRemove(item.symbol, item.exchange || 'NSE', e)}
                    disabled={removingSymbol === item.symbol}
                    title="Remove from watchlist"
                    className="p-1 rounded-[4px] text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    {removingSymbol === item.symbol ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <p className="text-xs text-slate-300 font-medium truncate mb-3" title={item.company_name}>
                  {item.company_name}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-1.5 truncate max-w-[70%]">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                  <span className="truncate text-slate-300">{item.sector || 'Listed Equity'}</span>
                </div>
                <span className="text-[11px] font-medium text-amber-400 group-hover:text-amber-300 flex items-center gap-1">
                  <span>Analyze</span>
                  <ExternalLink className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
