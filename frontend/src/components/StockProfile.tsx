import React from 'react';
import { ArrowLeft, Building2, Calendar, MapPin, Tag, ShieldCheck, Hash } from 'lucide-react';
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
  const monogram = stock.symbol.slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Back button - Coinbase Pill */}
      <div>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-mono font-medium text-[#5b616e] dark:text-[#a8acb3] hover:text-[#0a0b0d] dark:hover:text-white transition px-4 py-2 rounded-full bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 hover:border-[#0052ff] cursor-pointer shadow-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>RETURN TO MARKET CATALOG</span>
        </button>
      </div>

      {/* Header Profile Banner - Coinbase 28px Card */}
      <div className="cb-card p-7 sm:p-10 rounded-[28px] transition-colors duration-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-7 border-b border-[#dee1e6] dark:border-white/10">
          <div className="flex items-start gap-4">
            {/* 52px Circular Asset Plate */}
            <div className="w-14 h-14 rounded-full bg-[#f7f7f7] dark:bg-white/10 border border-[#dee1e6] dark:border-white/10 flex items-center justify-center font-bold text-lg text-[#0052ff] dark:text-white shrink-0 shadow-sm mt-1">
              {monogram}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <h1 className="text-3xl sm:text-5xl font-normal text-[#0a0b0d] dark:text-white tracking-tight font-display">
                  {stock.symbol}
                </h1>
                <span
                  className={`text-xs font-mono font-semibold px-3 py-1 rounded-full border ${isNSE
                      ? 'bg-[#0052ff]/10 text-[#0052ff] border-[#0052ff]/20'
                      : 'bg-[#f4b000]/10 text-[#f4b000] border-[#f4b000]/30'
                    }`}
                >
                  {stock.exchange} MASTER
                </span>
                {stock.series && (
                  <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-[#f7f7f7] dark:bg-white/5 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10">
                    Series: {stock.series}
                  </span>
                )}
                {stock.market_cap_category && (
                  <span className="text-xs font-mono font-medium px-2.5 py-1 rounded-full bg-[#f7f7f7] dark:bg-white/5 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10">
                    {stock.market_cap_category}
                  </span>
                )}
              </div>
              <h2 className="text-lg sm:text-xl text-[#5b616e] dark:text-[#a8acb3] font-normal">{stock.company_name}</h2>
              {stock.isin ? (
                <p className="text-xs text-[#7c828a] font-mono mt-2.5 flex items-center gap-2">
                  <span>ISIN:</span>
                  <span className="text-[#05b169] bg-[#05b169]/10 px-2.5 py-0.5 rounded-full border border-[#05b169]/30 font-semibold flex items-center gap-1">
                    <Hash className="w-3 h-3 text-[#05b169]" />
                    {stock.isin}
                  </span>
                  {stock.scrip_code && (
                    <span className="text-[#f4b000] bg-[#f4b000]/10 px-2.5 py-0.5 rounded-full border border-[#f4b000]/30 font-semibold">
                      BSE Scrip: {stock.scrip_code}
                    </span>
                  )}
                </p>
              ) : (
                <p className="text-xs text-[#7c828a] font-mono mt-2.5">ISIN: Verified Exchange Master</p>
              )}
            </div>
          </div>

          <div className="flex flex-col items-start md:items-end gap-3">
            <button
              onClick={() => onGenerateReport(stock.symbol, stock.exchange)}
              disabled={isGeneratingReport}
              className="cb-pill-btn-primary inline-flex items-center gap-2 px-6 py-3.5 text-xs font-semibold shadow-sm cursor-pointer"
            >
              <span>{isGeneratingReport ? 'Compiling Research Report...' : 'Generate Full Research Report'}</span>
            </button>
            {dhanProActive ? (
              <span className="text-[11px] font-mono text-[#0052ff] flex items-center gap-1.5 bg-[#0052ff]/10 border border-[#0052ff]/20 px-3 py-1 rounded-full">
                <span className="w-2 h-2 rounded-full bg-[#0052ff] animate-pulse" />
                <span>Dhan Pro Verified Live Feed Active</span>
              </span>
            ) : (
              <span className="text-[11px] font-mono text-[#7c828a] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#0052ff]" />
                <span>13-Analyst Comprehensive Evaluation</span>
              </span>
            )}
          </div>
        </div>

        {/* Meta Attributes Grid - Coinbase 20px Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-7">
          <div className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-5 rounded-[20px] border border-[#dee1e6] dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-[#7c828a] mb-1">
              <Building2 className="w-3.5 h-3.5 text-[#0052ff]" />
              <span>Sector</span>
            </div>
            <p className="text-sm font-semibold text-[#0a0b0d] dark:text-white truncate">{stock.sector || stock.industry || 'General Equity'}</p>
          </div>

          <div className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-5 rounded-[20px] border border-[#dee1e6] dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-[#7c828a] mb-1">
              <Tag className="w-3.5 h-3.5 text-[#0052ff]" />
              <span>Industry</span>
            </div>
            <p className="text-sm font-semibold text-[#0a0b0d] dark:text-white truncate">{stock.industry || stock.sector || 'N/A'}</p>
          </div>

          <div className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-5 rounded-[20px] border border-[#dee1e6] dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-[#7c828a] mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#05b169]" />
              <span>Jurisdiction</span>
            </div>
            <p className="text-sm font-semibold text-[#0a0b0d] dark:text-white truncate">{stock.headquarters || 'Mumbai, India'}</p>
          </div>

          <div className="bg-[#f7f7f7] dark:bg-[#0a0b0d] p-5 rounded-[20px] border border-[#dee1e6] dark:border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-[#7c828a] mb-1">
              <Calendar className="w-3.5 h-3.5 text-[#f4b000]" />
              <span>Listing Date</span>
            </div>
            <p className="text-sm font-semibold text-[#0a0b0d] dark:text-white truncate">{stock.listing_date || 'Established Listing'}</p>
          </div>
        </div>

        {/* Description Section */}
        {stock.description && (
          <div className="mt-7 pt-6 border-t border-[#dee1e6] dark:border-white/10">
            <h3 className="text-xs uppercase tracking-wider text-[#5b616e] dark:text-[#a8acb3] font-mono font-semibold mb-2.5 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0052ff]" />
              Business Profile &amp; Core Operations
            </h3>
            <p className="text-sm text-[#5b616e] dark:text-[#a8acb3] leading-relaxed max-w-4xl font-sans">
              {stock.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
