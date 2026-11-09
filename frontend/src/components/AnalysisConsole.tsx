import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronRight, Lock, Loader2 } from 'lucide-react';
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
    <div className="w-full max-w-5xl mx-auto mb-16">
      {/* Hero Heading - Coinbase Editorial Calm Typography */}
      <div className="mb-10 text-center sm:text-left">
        <h1 className="text-4xl sm:text-6xl font-normal tracking-tight text-[#0a0b0d] dark:text-white leading-[1.06] font-display">
          Deep Equity Intelligence, <br className="hidden sm:inline" />
          <span className="text-[#0052ff]">
            Institutional Coverage
          </span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-[#5b616e] dark:text-[#a8acb3] max-w-2xl leading-relaxed">
          13 specialized analyst perspectives evaluate live BSE filings, multi-year statements, and technical momentum,
          reviewing Bull vs Bear arguments to formulate disciplined investment conviction.
        </p>
      </div>

      {/* 3-Step Interactive Card - Coinbase 28px Card with 32px Padding */}
      <div className="cb-card p-7 sm:p-10 rounded-[28px] transition-all duration-200">
        {/* Step 1: Stock Selection */}
        <div className="mb-8" ref={dropdownRef}>
          <div className="flex items-center gap-2.5 mb-3 text-sm font-medium text-[#0a0b0d] dark:text-white">
            <span className="w-6 h-6 rounded-full bg-[#f7f7f7] dark:bg-white/10 border border-[#dee1e6] dark:border-white/15 text-[#0052ff] text-xs flex items-center justify-center font-mono font-medium">
              1
            </span>
            <span>Security Selection</span>
          </div>

          <div className="relative">
            <div className="relative flex items-center">
              <Search className="w-5 h-5 text-[#7c828a] absolute left-5 pointer-events-none" />
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
                className="w-full bg-[#f7f7f7] dark:bg-[#0a0b0d] border border-[#dee1e6] dark:border-white/10 focus:border-[#0052ff] focus:ring-2 focus:ring-[#0052ff]/20 rounded-full pl-13 pr-12 py-4 text-base sm:text-lg text-[#0a0b0d] dark:text-white placeholder-[#7c828a] outline-none transition-all font-sans"
              />
              {isSearching && (
                <Loader2 className="w-5 h-5 text-[#0052ff] absolute right-5 animate-spin" />
              )}
            </div>

            {/* Autocomplete Dropdown across all stocks */}
            {isDropdownOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#16181c] border border-[#dee1e6] dark:border-white/15 rounded-2xl shadow-2xl z-50 overflow-hidden divide-y divide-[#dee1e6] dark:divide-white/5 max-h-72 overflow-y-auto">
                <div className="px-5 py-2.5 bg-[#f7f7f7] dark:bg-[#0a0b0d] text-xs font-mono text-[#5b616e] dark:text-[#a8acb3] uppercase tracking-wider flex items-center justify-between border-b border-[#dee1e6] dark:border-white/10">
                  <span>NSE &amp; BSE Universe Matches</span>
                  <span className="text-[#0052ff] font-semibold">{searchResults.length} results</span>
                </div>
                {searchResults.map((s) => (
                  <button
                    key={`${s.exchange}-${s.symbol}`}
                    type="button"
                    onClick={() => handleSelect(s)}
                    className="w-full text-left px-5 py-3.5 flex items-center justify-between hover:bg-[#f7f7f7] dark:hover:bg-white/5 transition-colors group cursor-pointer"
                  >
                    <div>
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-bold text-[#0a0b0d] dark:text-white text-base group-hover:text-[#0052ff] transition-colors">
                          {s.symbol}
                        </span>
                        <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#eef0f3] dark:bg-white/10 text-[#5b616e] dark:text-slate-200 border border-[#dee1e6] dark:border-white/10">
                          {s.exchange}
                        </span>
                        {s.series && (
                          <span className="text-xs font-mono text-[#7c828a]">
                            [{s.series}]
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[#5b616e] dark:text-[#a8acb3] mt-1 truncate max-w-md">
                        {s.company_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono text-[#0a0b0d] dark:text-slate-200 block">{s.isin}</span>
                      <span className="text-xs text-[#7c828a]">{s.sector || 'Listed Equity'}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick Ticker Chips - Coinbase Pill Geometry */}
          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <span className="text-xs text-[#5b616e] dark:text-[#7c828a] font-bold font-mono tracking-wider mr-1">POPULAR:</span>
            {quickPicks.map((qp) => (
              <button
                key={`${qp.exchange}-${qp.symbol}`}
                type="button"
                onClick={() => handleQuickPick(qp)}
                className="px-4 py-1.5 rounded-full text-xs font-mono font-semibold bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 hover:border-[#0052ff] hover:bg-white dark:hover:bg-white/10 text-[#0a0b0d] dark:text-slate-200 transition-all cursor-pointer shadow-sm"
              >
                {qp.symbol}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2 & Step 3: Horizon & Research Depth */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Step 2: Investment Horizon */}
          <div className="rounded-[20px] bg-[#f7f7f7] dark:bg-[#121316] border border-[#dee1e6] dark:border-white/10 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-sm font-medium text-[#0a0b0d] dark:text-white">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-white/10 border border-[#dee1e6] dark:border-white/15 text-[#0052ff] text-xs flex items-center justify-center font-mono font-medium">
                  2
                </span>
                <span>Investment Horizon</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="rounded-[18px] border border-[#dee1e6] dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-2.5 py-3.5 text-center opacity-50 cursor-not-allowed select-none flex flex-col justify-between min-h-[110px]">
                <div>
                  <div className="text-xs sm:text-sm font-medium text-[#5b616e] dark:text-slate-400 whitespace-nowrap">Short-Term</div>
                  <div className="text-xs text-[#7c828a] mt-1 whitespace-nowrap">1-3 Months</div>
                </div>
                <span className="inline-block mt-2.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#dee1e6]/50 dark:bg-white/5 text-[#7c828a] mx-auto">
                  SOON
                </span>
              </div>

              {/* Medium-Term Active - Coinbase Blue selection */}
              <div className="rounded-[18px] border-2 border-[#0052ff] bg-white dark:bg-[#16181c] px-2.5 py-3.5 text-center cursor-pointer shadow-sm flex flex-col justify-between min-h-[110px]">
                <div>
                  <div className="text-xs sm:text-sm md:text-base font-medium text-[#0a0b0d] dark:text-white whitespace-nowrap">
                    Medium-Term
                  </div>
                  <div className="text-xs sm:text-sm text-[#0052ff] font-normal mt-1 whitespace-nowrap">1 Year Outlook</div>
                </div>
                <span className="inline-block mt-2.5 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#0052ff] text-white mx-auto">
                  Active
                </span>
              </div>

              <div className="rounded-[18px] border border-[#dee1e6] dark:border-white/10 bg-white/50 dark:bg-white/[0.02] px-2.5 py-3.5 text-center opacity-50 cursor-not-allowed select-none flex flex-col justify-between min-h-[110px]">
                <div>
                  <div className="text-xs sm:text-sm font-medium text-[#5b616e] dark:text-slate-400 whitespace-nowrap">Long-Term</div>
                  <div className="text-xs text-[#7c828a] mt-1 whitespace-nowrap">3+ Years</div>
                </div>
                <span className="inline-block mt-2.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#dee1e6]/50 dark:bg-white/5 text-[#7c828a] mx-auto">
                  SOON
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-[#5b616e] dark:text-[#a8acb3] leading-relaxed font-sans">
              Focuses on 1-year earnings momentum, balance sheet durability, and industry tailwinds.
            </p>
          </div>

          {/* Step 3: Research Depth */}
          <div className="rounded-[20px] bg-[#f7f7f7] dark:bg-[#121316] border border-[#dee1e6] dark:border-white/10 p-6 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5 text-sm font-medium text-[#0a0b0d] dark:text-white">
                <span className="w-6 h-6 rounded-full bg-white dark:bg-white/10 border border-[#dee1e6] dark:border-white/15 text-[#0052ff] text-xs flex items-center justify-center font-mono font-medium">
                  3
                </span>
                <span>Research Scope</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Full 13-Analyst Active - Coinbase Blue selection */}
              <div className="rounded-[18px] border-2 border-[#0052ff] bg-white dark:bg-[#16181c] p-4 text-center cursor-pointer shadow-sm flex flex-col justify-between min-h-[110px]">
                <div>
                  <div className="text-sm sm:text-base font-medium text-[#0a0b0d] dark:text-white">
                    Full 13-Analyst Review
                  </div>
                  <div className="text-xs sm:text-sm text-[#0052ff] font-normal mt-1">Bull vs Bear Debate</div>
                </div>
                <span className="inline-block mt-2.5 text-[11px] font-mono font-medium px-2.5 py-0.5 rounded-full bg-[#0052ff] text-white mx-auto">
                  Active
                </span>
              </div>

              <div className="rounded-[18px] border border-[#dee1e6] dark:border-white/10 bg-white/50 dark:bg-white/[0.02] p-4 text-center opacity-50 cursor-not-allowed select-none flex flex-col justify-between min-h-[110px]">
                <div>
                  <div className="flex items-center justify-center gap-1.5 text-sm font-medium text-[#5b616e] dark:text-slate-400">
                    <Lock className="w-4 h-4 text-[#7c828a]" />
                    <span>Multi-Stage Review</span>
                  </div>
                  <div className="text-xs text-[#7c828a] mt-1">3 Debate Rounds</div>
                </div>
                <span className="inline-block mt-2.5 text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#dee1e6]/50 dark:bg-white/5 text-[#7c828a] mx-auto">
                  SOON
                </span>
              </div>
            </div>
            <p className="mt-4 text-xs sm:text-sm text-[#5b616e] dark:text-[#a8acb3] leading-relaxed font-sans">
              Executes the full 13-analyst framework including independent Bull/Bear drafting and rebuttal analysis.
            </p>
          </div>
        </div>

        {/* CTA Button - Coinbase Pill */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#dee1e6] dark:border-white/10">
          <div className="text-sm sm:text-base text-[#0a0b0d] dark:text-slate-200 text-center sm:text-left">
            {selectedStock ? (
              <span>
                Selected for research:{' '}
                <strong className="text-[#0052ff] font-mono text-base sm:text-lg font-bold">
                  {selectedStock.symbol} ({selectedStock.exchange})
                </strong>{' '}
                <span className="text-[#5b616e] dark:text-[#a8acb3] font-medium">• {selectedStock.company_name}</span>
              </span>
            ) : (
              <span className="text-[#7c828a]">Select a security above to generate institutional research</span>
            )}
          </div>

          <button
            type="button"
            disabled={!selectedStock}
            onClick={() => selectedStock && onStartAnalysis(selectedStock)}
            className={`w-full sm:w-auto px-8 py-3.5 rounded-full font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${selectedStock
                ? 'cb-pill-btn-primary cursor-pointer active:scale-95'
                : 'bg-[#eef0f3] dark:bg-white/5 text-[#7c828a] border border-[#dee1e6] dark:border-white/5 cursor-not-allowed opacity-60'
              }`}
          >
            <span>Generate Research Report</span>
            <ChevronRight className="w-4 h-4 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
};
