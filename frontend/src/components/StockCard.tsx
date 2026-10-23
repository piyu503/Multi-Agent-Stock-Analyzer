import React from 'react';
import { ArrowUpRight, Building2, Hash } from 'lucide-react';
import type { StockSummary } from '../types';

interface StockCardProps {
  stock: StockSummary;
  onSelect: (symbol: string, exchange: string) => void;
}

export const StockCard: React.FC<StockCardProps> = ({ stock, onSelect }) => {
  return (
    <div
      onClick={() => onSelect(stock.symbol, stock.exchange)}
      className="group relative bg-[#0d121f]/80 hover:bg-[#131b2e] border border-white/10 hover:border-fuchsia-500/40 p-5 rounded-2xl transition-all duration-300 cursor-pointer shadow-lg shadow-black/40 hover:shadow-fuchsia-950/20 hover:-translate-y-1 flex flex-col justify-between"
    >
      <div>
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono text-lg font-bold text-white tracking-wide group-hover:text-fuchsia-300 transition-colors">
              {stock.symbol}
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
              {stock.exchange}
            </span>
            {stock.series && (
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/5">
                {stock.series}
              </span>
            )}
          </div>
          <div className="p-1.5 rounded-lg text-slate-400 group-hover:text-fuchsia-300 group-hover:bg-fuchsia-500/10 group-hover:border-fuchsia-500/30 border border-transparent transition-all">
            <ArrowUpRight className="w-4 h-4" />
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
          <span className="text-[10px] font-mono text-slate-300 bg-white/5 px-2 py-0.5 rounded-md border border-white/10 flex items-center gap-1">
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
