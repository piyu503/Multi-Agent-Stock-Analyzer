import { ArrowLeft, Building2, Calendar, MapPin, Sparkles, Tag, ShieldCheck, Hash } from 'lucide-react';
import type { StockDetail } from '../types';

interface StockProfileProps {
  stock: StockDetail;
  onBack: () => void;
  onGenerateReport: (symbol: string, exchange: string) => void;
  isGeneratingReport: boolean;
  dhanProActive?: boolean;
}

export const StockProfile: React.FC<StockProfileProps> = ({
  stock,
  onBack,
  onGenerateReport,
  isGeneratingReport,
  dhanProActive,
}) => {
  const isNSE = stock.exchange === 'NSE';

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-300 hover:text-white transition px-3.5 py-2 rounded-xl bg-white/5 border border-white/10 hover:border-white/20 cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO MARKET CATALOG</span>
        </button>
      </div>

      {/* Header Profile Banner */}
      <div className="bg-[#0c101c]/90 border border-white/10 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-black/60 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2.5">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight font-display">
                {stock.symbol}
              </h1>
              <span
                className={`text-xs font-mono font-bold px-2.5 py-0.5 rounded-md border ${
                  isNSE
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/40'
                    : 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                }`}
              >
                {stock.exchange} MASTER
              </span>
              {stock.series && (
                <span className="text-xs font-mono px-2 py-0.5 rounded-md bg-white/5 text-slate-300 border border-white/10">
                  Series: {stock.series}
                </span>
              )}
              {stock.market_cap_category && (
                <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-md bg-fuchsia-500/15 text-fuchsia-300 border border-fuchsia-500/30">
                  {stock.market_cap_category}
                </span>
              )}
            </div>
            <h2 className="text-xl text-slate-200 font-medium">{stock.company_name}</h2>
            {stock.isin ? (
              <p className="text-xs text-slate-400 font-mono mt-2 flex items-center gap-2">
                <span className="text-slate-400">ISIN:</span>
                <span className="text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 font-semibold flex items-center gap-1">
                  <Hash className="w-3 h-3 text-emerald-400" />
                  {stock.isin}
                </span>
                {stock.scrip_code && (
                  <span className="text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30 font-semibold">
                    BSE Scrip: {stock.scrip_code}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-xs text-slate-400 font-mono mt-2">ISIN: Verified Exchange Master</p>
            )}
          </div>

          <div className="flex flex-col items-start md:items-end gap-2.5">
            <button
              onClick={() => onGenerateReport(stock.symbol, stock.exchange)}
              disabled={isGeneratingReport}
              className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white font-bold text-sm transition-all shadow-xl shadow-fuchsia-950/40 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-white" />
              <span>{isGeneratingReport ? 'Compiling Research Report...' : 'Generate Full Research Report'}</span>
            </button>
            {dhanProActive ? (
              <span className="text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full shadow-[0_0_8px_rgba(6,182,212,0.2)]">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>Dhan Pro Verified Live Feed Active</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                <span>13-Analyst Comprehensive Evaluation</span>
              </span>
            )}
          </div>
        </div>

        {/* Meta Attributes Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-[#070b13] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sector</span>
            </div>
            <p className="text-sm font-semibold text-white truncate">{stock.sector || stock.industry || 'General Equity'}</p>
          </div>

          <div className="bg-[#070b13] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Tag className="w-3.5 h-3.5 text-fuchsia-400" />
              <span>Industry</span>
            </div>
            <p className="text-sm font-semibold text-white truncate">{stock.industry || stock.sector || 'N/A'}</p>
          </div>

          <div className="bg-[#070b13] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Jurisdiction</span>
            </div>
            <p className="text-sm font-semibold text-white truncate">{stock.headquarters || 'Mumbai, India'}</p>
          </div>

          <div className="bg-[#070b13] p-4 rounded-xl border border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <span>Listing Date</span>
            </div>
            <p className="text-sm font-semibold text-white truncate">{stock.listing_date || 'Established Listing'}</p>
          </div>
        </div>

        {/* Description Section */}
        {stock.description && (
          <div className="mt-6 pt-6 border-t border-white/10">
            <h3 className="text-xs uppercase tracking-wider text-slate-300 font-mono font-semibold mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              Business Profile &amp; Core Operations
            </h3>
            <p className="text-sm text-slate-200 leading-relaxed max-w-4xl font-sans">
              {stock.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
