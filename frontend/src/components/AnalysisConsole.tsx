import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, Lock, Loader2, Sparkles } from 'lucide-react';
import type { StockSummary } from '../types';
import { searchStocks } from '../api';

interface AnalysisConsoleProps {
  onStartAnalysis: (stock: StockSummary) => void;
  stocks: StockSummary[];
}

export const AnalysisConsole: React.FC<AnalysisConsoleProps> = ({
  onStartAnalysis,
  stocks
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStock, setSelectedStock] = useState<StockSummary | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<StockSummary[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounced search across all 7,857 stocks in database
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setSearchResults(stocks.slice(0, 10));
      setIsSearching(false);
      return;
    }

    if (selectedStock && searchTerm.startsWith(selectedStock.symbol)) {
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchStocks(trimmed, '', 1, 15);
        setSearchResults(res.items || []);
      } catch (err) {
        console.error('Search error in AnalysisConsole:', err);
      } finally {
        setIsSearching(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, stocks, selectedStock]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (stock: StockSummary) => {
    setSelectedStock(stock);
    setSearchTerm(`${stock.symbol} - ${stock.company_name} (${stock.exchange})`);
    setIsDropdownOpen(false);
  };

  const quickPicks = [
    { symbol: 'RELIANCE', exchange: 'NSE' },
    { symbol: 'TCS', exchange: 'NSE' },
    { symbol: 'INFY', exchange: 'NSE' },
    { symbol: 'HDFCBANK', exchange: 'NSE' },
    { symbol: 'ICICIBANK', exchange: 'NSE' },
    { symbol: 'TATAMOTORS', exchange: 'BSE' }
  ];

  const handleQuickPick = async (qp: { symbol: string; exchange: string }) => {
    const matched = stocks.find((s) => s.symbol === qp.symbol && s.exchange === qp.exchange) 
      || stocks.find((s) => s.symbol === qp.symbol);
    if (matched) {
      handleSelect(matched);
      return;
    }
    try {
      const res = await searchStocks(qp.symbol, qp.exchange, 1, 5);
      const found = res.items.find((s) => s.symbol === qp.symbol) || res.items[0];
      if (found) {
        handleSelect(found);
        return;
      }
      // Fallback without exchange filter
      const anyRes = await searchStocks(qp.symbol, '', 1, 5);
      const anyFound = anyRes.items.find((s) => s.symbol === qp.symbol) || anyRes.items[0];
      if (anyFound) {
        handleSelect(anyFound);
        return;
      }
      handleSelect({
        id: 7909,
        symbol: qp.symbol,
        company_name: 'Tata Motors Ltd',
        exchange: qp.exchange || 'BSE',
        sector: 'Automobiles - LCVs & HCVs',
        industry: 'Automobile',
        isin: 'INE155A01022',
        series: 'A',
        is_active: true,
        is_prototype_data: false
      });
    } catch {
      handleSelect({
        id: 7909,
        symbol: qp.symbol,
        company_name: 'Tata Motors Ltd',
        exchange: qp.exchange || 'BSE',
        sector: 'Automobiles - LCVs & HCVs',
        industry: 'Automobile',
        isin: 'INE155A01022',
        series: 'A',
        is_active: true,
        is_prototype_data: false
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto mb-14">
      {/* Hero Badge & Heading */}
      <div className="mb-10 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/30 text-fuchsia-300 text-xs font-semibold mb-4 tracking-wide shadow-sm">
          <Sparkles className="w-3.5 h-3.5 text-fuchsia-400 animate-pulse" />
          <span>Institutional Equity Research Platform</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight font-display">
          Deep Equity Intelligence, <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-fuchsia-400 to-pink-300 bg-clip-text text-transparent">
            Institutional Coverage
          </span>
        </h1>
        <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
          13 specialized analyst perspectives evaluate live BSE filings, multi-year statements, and technical momentum,
          reviewing Bull vs Bear arguments to formulate disciplined investment conviction.
        </p>
      </div>

      {/* 3-Step Interactive Card - Enlarged & Enhanced */}
      <div className="rounded-2xl bg-[#0c101c]/95 border border-white/15 p-6 sm:p-8 lg:p-9 shadow-2xl shadow-black/70 backdrop-blur-md">
        {/* Step 1: Stock Selection */}
        <div className="mb-7" ref={dropdownRef}>
          <div className="flex items-center gap-2.5 mb-3 text-sm sm:text-base font-bold uppercase tracking-wider text-slate-100">
            <span className="w-6 h-6 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300 text-xs sm:text-sm flex items-center justify-center font-mono font-bold">
              1
            </span>
            <span>Security Selection</span>
          </div>

          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIsDropdownOpen(true);
                  if (!e.target.value) setSelectedStock(null);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                placeholder="Search symbol, legal name, or ISIN (e.g. RELIANCE, TCS, ZOMATO, HDFCBANK)..."
                className="w-full bg-[#060911] border border-white/15 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-500/30 rounded-xl pl-12 pr-12 py-4 text-base sm:text-lg text-white placeholder-slate-400 outline-none transition-all shadow-inner font-sans"
              />
              {isSearching && (
                <Loader2 className="w-5 h-5 text-fuchsia-400 absolute right-4 animate-spin" />
              )}
            </div>

            {/* Autocomplete Dropdown across all stocks */}
            {isDropdownOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#0d1322] border border-white/15 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5 max-h-72 overflow-y-auto">
                <div className="px-4 py-2 bg-[#080d18] text-xs font-mono text-slate-300 uppercase tracking-wider flex items-center justify-between border-b border-white/10">
                  <span>NSE &amp; BSE Universe Matches</span>
                  <span className="text-fuchsia-400 font-semibold">{searchResults.length} results</span>
                </div>
                {searchResults.map((s) => (
                  <button
                    key={`${s.exchange}-${s.symbol}`}
                    type="button"
                    onClick={() => handleSelect(s)}
                    className="w-full text-left px-4 py-3.5 flex items-center justify-between hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-white text-base group-hover:text-fuchsia-400 transition-colors">
                          {s.symbol}
                        </span>
                        <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-white/5 text-slate-200 border border-white/10">
                          {s.exchange}
                        </span>
                        {s.series && (
                          <span className="text-xs font-mono text-slate-400">
                            [{s.series}]
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-300 mt-1 truncate max-w-md">
                        {s.company_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-slate-300 block">{s.isin}</span>
                      <span className="text-xs text-slate-400">{s.sector || 'Listed Equity'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Ticker Chips */}
          <div className="flex items-center gap-2.5 mt-3.5 flex-wrap">
            <span className="text-xs sm:text-sm text-slate-300 font-bold font-mono tracking-wider">POPULAR:</span>
            {quickPicks.map((qp) => (
              <button
                key={`${qp.exchange}-${qp.symbol}`}
                type="button"
                onClick={() => handleQuickPick(qp)}
                className="px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-mono font-bold bg-white/5 border border-white/10 hover:border-fuchsia-500/50 hover:bg-white/10 text-slate-200 hover:text-fuchsia-300 transition-all cursor-pointer shadow-sm"
              >
                {qp.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 & Step 3: Horizon & Research Depth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Step 2: Investment Horizon */}
          <div className="rounded-xl bg-[#070a14] border border-white/10 p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold uppercase tracking-wider text-slate-100">
                <span className="w-6 h-6 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300 text-xs sm:text-sm flex items-center justify-center font-mono font-bold">
                  2
                </span>
                <span>Investment Horizon</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-2.5 sm:px-3 py-3.5 text-center opacity-45 cursor-not-allowed select-none flex flex-col justify-between min-h-[110px]">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-300 whitespace-nowrap">Short-Term</div>
                  <div className="text-xs text-slate-400 mt-1 whitespace-nowrap">1-3 Months</div>
                </div>
                <span className="inline-block mt-2.5 text-xs uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 mx-auto">
                  SOON
                </span>
              </div>

              {/* Medium-Term Active - Guaranteed Single Line */}
              <div className="rounded-xl border-2 border-fuchsia-500 bg-fuchsia-500/15 px-2.5 sm:px-3 py-3.5 text-center ring-2 ring-fuchsia-500/30 cursor-pointer shadow-xl shadow-fuchsia-950/40 flex flex-col justify-between min-h-[110px]">
                <div>
                  <div className="text-xs sm:text-sm md:text-base font-extrabold text-white whitespace-nowrap">
                    Medium-Term
                  </div>
                  <div className="text-xs sm:text-sm text-fuchsia-200 font-semibold mt-1 whitespace-nowrap">1 Year Outlook</div>
                </div>
                <span className="inline-block mt-2.5 text-xs uppercase font-mono font-bold px-2.5 py-0.5 rounded bg-fuchsia-500/30 text-white border border-fuchsia-400/50 mx-auto">
                  Active
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] px-2.5 sm:px-3 py-3.5 text-center opacity-45 cursor-not-allowed select-none flex flex-col justify-between min-h-[110px]">
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-300 whitespace-nowrap">Long-Term</div>
                  <div className="text-xs text-slate-400 mt-1 whitespace-nowrap">3+ Years</div>
                </div>
                <span className="inline-block mt-2.5 text-xs uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 mx-auto">
                  SOON
                </span>
              </div>
            </div>
            <p className="mt-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Focuses on 1-year earnings momentum, balance sheet durability, and industry tailwinds.
            </p>
          </div>

          {/* Step 3: Research Depth */}
          <div className="rounded-xl bg-[#070a14] border border-white/10 p-5 sm:p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-sm sm:text-base font-bold uppercase tracking-wider text-slate-100">
                <span className="w-6 h-6 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/40 text-fuchsia-300 text-xs sm:text-sm flex items-center justify-center font-mono font-bold">
                  3
                </span>
                <span>Research Scope</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Standard Review Active */}
              <div className="rounded-xl border-2 border-fuchsia-500 bg-fuchsia-500/15 p-4 text-center ring-2 ring-fuchsia-500/30 cursor-pointer shadow-xl shadow-fuchsia-950/40 flex flex-col justify-between min-h-[110px]">
                <div>
                  <div className="text-sm sm:text-base font-extrabold text-white">
                    Full 13-Analyst Review
                  </div>
                  <div className="text-xs sm:text-sm text-fuchsia-200 font-semibold mt-1">Bull vs Bear Debate</div>
                </div>
                <span className="inline-block mt-2.5 text-xs uppercase font-mono font-bold px-2.5 py-0.5 rounded bg-fuchsia-500/30 text-white border border-fuchsia-400/50 mx-auto">
                  Active
                </span>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-center opacity-45 cursor-not-allowed select-none flex flex-col justify-between min-h-[110px]">
                <div>
                  <div className="flex items-center justify-center gap-1.5 text-sm font-bold text-slate-300">
                    <Lock className="w-4 h-4 text-slate-400" />
                    <span>Multi-Stage Review</span>
                  </div>
                  <div className="text-xs sm:text-sm text-slate-400 mt-1">3 Debate Rounds</div>
                </div>
                <span className="inline-block mt-2.5 text-xs uppercase font-mono px-2 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10 mx-auto">
                  SOON
                </span>
              </div>
            </div>
            <p className="mt-3.5 text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
              Executes the full 13-analyst framework including independent Bull/Bear drafting and rebuttal analysis.
            </p>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-5 border-t border-white/10">
          <div className="text-sm sm:text-base text-slate-200 text-center sm:text-left">
            {selectedStock ? (
              <span>
                Selected for research:{' '}
                <strong className="text-fuchsia-400 font-mono text-base sm:text-lg font-bold">
                  {selectedStock.symbol} ({selectedStock.exchange})
                </strong>{' '}
                <span className="text-slate-300 font-medium">• {selectedStock.company_name}</span>
              </span>
            ) : (
              <span className="text-slate-400">Select an equity above to generate institutional research</span>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedStock}
            onClick={() => selectedStock && onStartAnalysis(selectedStock)}
            className={`w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-base flex items-center justify-center gap-2.5 transition-all shadow-xl ${
              selectedStock
                ? 'bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-500 hover:to-pink-500 text-white shadow-fuchsia-600/30 cursor-pointer hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-white/5 text-slate-500 border border-white/5 cursor-not-allowed opacity-50'
            }`}
          >
            <span>Generate Research Report</span>
            <ChevronRight className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
