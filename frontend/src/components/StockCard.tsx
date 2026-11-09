import React from 'react';
import { ArrowUpRight, Building2, Hash, Star } from 'lucide-react';
import type { StockSummary } from '../types';

interface StockCardProps {
  stock: StockSummary;
  onSelect: (symbol: string, exchange: string) => void;
  isWatchlisted?: boolean;
  onToggleWatchlist?: (stock: StockSummary, e: React.MouseEvent) => void;
}

export const StockCard: React.FC<StockCardProps> = ({
  stock,
  onSelect,
  isWatchlisted = false,
  onToggleWatchlist
}) => {
  const monogram = stock.symbol.slice(0, 2).toUpperCase();

  return (
    <div
      onClick={() => onSelect(stock.symbol, stock.exchange)}
      className="cb-card cb-card-hover p-6 rounded-[24px] cursor-pointer flex flex-col justify-between group transition-all duration-200 select-none"
    >
      <div>
        {/* Top Header: Circular Monogram + Symbol + Actions */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            {/* 44px Circular Asset Plate - Signature Coinbase Geometry */}
            <div className="w-11 h-11 rounded-full bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 flex items-center justify-center font-mono font-medium text-sm text-[#0a0b0d] dark:text-white group-hover:bg-[#0052ff] group-hover:text-white group-hover:border-[#0052ff] transition-all duration-200 shrink-0">
              {monogram}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-semibold text-[#0a0b0d] dark:text-white tracking-tight group-hover:text-[#0052ff] transition-colors">
                  {stock.symbol}
                </span>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#eef0f3] dark:bg-white/10 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10">
                  {stock.exchange}
                </span>
                {stock.series && (
                  <span className="text-[10px] font-mono font-normal px-1.5 py-0.5 rounded-full bg-[#f7f7f7] dark:bg-white/5 text-[#7c828a] border border-[#dee1e6] dark:border-white/5">
                    {stock.series}
                  </span>
                )}
              </div>
              <h3 className="text-sm font-normal text-[#5b616e] dark:text-[#a8acb3] group-hover:text-[#0a0b0d] dark:group-hover:text-white truncate mt-0.5 transition-colors">
                {stock.company_name}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onToggleWatchlist && (
              <button
                type="button"
                onClick={(e) => onToggleWatchlist(stock, e)}
                title={isWatchlisted ? "Remove from watchlist" : "Add to watchlist"}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${isWatchlisted
                    ? "text-[#f4b000] bg-[#f4b000]/10 border border-[#f4b000]/30"
                    : "text-[#7c828a] hover:text-[#f4b000] hover:bg-black/5 dark:hover:bg-white/10 border border-transparent"
                  }`}
              >
                <Star className={`w-4 h-4 ${isWatchlisted ? "fill-[#f4b000]" : ""}`} />
              </button>
            )}
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-[#7c828a] group-hover:text-[#0052ff] transition-colors">
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
        </div>

        {/* Sector Tag Pill */}
        <div className="mb-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 text-xs text-[#5b616e] dark:text-[#a8acb3] font-normal truncate max-w-full">
            <Building2 className="w-3 h-3 text-[#7c828a] shrink-0" />
            <span className="truncate">{stock.sector || stock.industry || 'Listed Security'}</span>
          </span>
        </div>
      </div>

      {/* Bottom Metadata & Hover CTA with Hairline Border */}
      <div className="pt-3 border-t border-[#dee1e6] dark:border-white/10 flex items-center justify-between text-xs text-[#7c828a]">
        {stock.isin ? (
          <span className="text-[11px] font-mono text-[#7c828a] dark:text-[#636870] flex items-center gap-1">
            <Hash className="w-2.5 h-2.5" />
            <span>{stock.isin}</span>
          </span>
        ) : (
          <span className="text-[11px] font-mono text-[#7c828a] dark:text-[#636870]">EQUITY MASTER</span>
        )}

        <span className="text-xs font-medium text-[#0052ff] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
          Analyze Dossier →
        </span>
      </div>
    </div>
  );
};
