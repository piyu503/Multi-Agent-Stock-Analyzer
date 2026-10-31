import React from 'react';
import { ArrowUpRight, Building2, Hash, Star } from 'lucide-react';
import type { StockSummary } from '../types';

interface StockCardProps {
  stock: StockSummary;
  onSelect: (symbol: string, exchange: string) => void;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (stock: StockSummary, e: React.MouseEvent) => void;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, onSelect, isWatchlisted = false, onToggleWatchlist }) => {
  return (
    <div
      onClick={() => onSelect(stock.symbol, stock.exchange)}
      className="group relative bg-[#0d121f]/80 hover:bg-[#131b2e] border border-white/10 hover:border-white/20 p-4 rounded-[8px] transition-colors duration-120 cursor-pointer flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-lg font-bold text-white tracking-wide group-hover:text-fuchsia-300 transition-colors">
              {stock.symbol}
            </span>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-[4px] bg-white/5 text-slate-300 border border-white/10 tracking-[0.04em]">
              {stock.exchange}
            </span>
            {stock.series && (
              <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded-[4px] bg-white/5 text-slate-400 border border-white/5 tracking-[0.04em]">
                {stock.series}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {onToggleWatchlist && (
              <button
                type="button"
                onClick={(e) => onToggleWatchlist(stock, e)}
                title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
                className={`p-1 rounded-[4px] transition-colors cursor-pointer ${
                  isWatchlisted
                    ? "text-amber-400 hover:text-amber-300 bg-amber-500/10 border border-amber-500/30"
                    : "text-slate-500 hover:text-amber-400 hover:bg-white/5 border border-transparent"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${isWatchlisted ? "fill-amber-400" : ""}`} />
              </button>
            )}
            <div className="p-1 rounded-[4px] text-slate-400 group-hover:text-white transition-colors">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
        </div>

        <h3 className="text-sm font-medium text-slate-200 line-clamp-1 mb-3">
          {stock.company_name}
        </h3>
      </div>

      <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-1.5 truncate max-w-[65%]">
          <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span className="truncate text-slate-300">{stock.sector || stock.industry || 'Listed Equity'}</span>
        </div>
        {stock.isin ? (
          <span className="text-[10px] font-mono text-slate-300 bg-white/5 px-1.5 py-0.5 rounded-[4px] border border-white/10 flex items-center gap-1 tracking-[0.02em]">
            <Hash className="w-2.5 h-2.5 text-slate-500" />
            <span>{stock.isin}</span>
          </span>
        ) : (
          <span className="text-[10px] font-mono text-slate-500">EQUITY</span>
        )}
      </div>
    </div>
  );
};
