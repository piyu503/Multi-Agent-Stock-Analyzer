import React, { useState } from 'react';
import { Search, X, SlidersHorizontal } from 'lucide-react';

interface SearchBarProps {
  onSearch: (query: string, exchange?: string) => void;
  isLoading?: boolean;
  activeExchange?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  isLoading,
  activeExchange = '',
}) => {
  const [value, setValue] = useState('');
  const [exchange, setExchange] = useState<string>(activeExchange);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(value, exchange);
  };

  const handleClear = () => {
    setValue('');
    onSearch('', exchange);
  };

  const handleExchangeChange = (newExch: string) => {
    const nextVal = exchange === newExch ? '' : newExch;
    setExchange(nextVal);
    onSearch(value, nextVal);
  };

  return (
    <div className="w-full space-y-3.5">
      <form onSubmit={handleSubmit} className="w-full relative">
        <div className="relative flex items-center">
          <div className="absolute left-5 pointer-events-none text-[#7c828a]">
            <Search className="w-5 h-5 text-[#7c828a]" />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              onSearch(e.target.value, exchange);
            }}
            placeholder="Search by company name, ticker symbol, or ISIN (e.g. RELIANCE, TCS, INE002A01018, 500325)..."
            className="w-full bg-[#f7f7f7] dark:bg-[#16181c] text-[#0a0b0d] dark:text-white placeholder-[#7c828a] pl-13 pr-32 py-4 rounded-full border border-[#dee1e6] dark:border-white/10 focus:outline-none focus:border-[#0052ff] focus:ring-2 focus:ring-[#0052ff]/20 transition-all text-sm sm:text-base shadow-sm font-sans"
          />

          <div className="absolute right-3.5 flex items-center gap-2">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-full text-[#7c828a] hover:text-[#0a0b0d] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="cb-pill-btn-primary px-5 py-2 text-xs font-semibold tracking-wide shadow-sm cursor-pointer disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>
      </form>

      {/* Exchange Filters and Shortcuts - Coinbase Pill Hierarchy */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-[#5b616e] dark:text-[#a8acb3] flex items-center gap-1.5 font-medium mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#7c828a]" />
            <span>Market Filter:</span>
          </span>
          <button
            type="button"
            onClick={() => handleExchangeChange('')}
            className={`px-4 py-1.5 rounded-full font-mono text-xs transition cursor-pointer ${
              exchange === ''
                ? 'bg-[#0052ff] text-white font-semibold shadow-sm'
                : 'bg-[#f7f7f7] dark:bg-white/5 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10 hover:border-[#0052ff] hover:text-[#0a0b0d] dark:hover:text-white'
            }`}
          >
            All Markets
          </button>
          <button
            type="button"
            onClick={() => handleExchangeChange('NSE')}
            className={`px-4 py-1.5 rounded-full font-mono text-xs transition cursor-pointer ${
              exchange === 'NSE'
                ? 'bg-[#0052ff] text-white font-semibold shadow-sm'
                : 'bg-[#f7f7f7] dark:bg-white/5 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10 hover:border-[#0052ff] hover:text-[#0a0b0d] dark:hover:text-white'
            }`}
          >
            NSE
          </button>
          <button
            type="button"
            onClick={() => handleExchangeChange('BSE')}
            className={`px-4 py-1.5 rounded-full font-mono text-xs transition cursor-pointer ${
              exchange === 'BSE'
                ? 'bg-[#0052ff] text-white font-semibold shadow-sm'
                : 'bg-[#f7f7f7] dark:bg-white/5 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10 hover:border-[#0052ff] hover:text-[#0a0b0d] dark:hover:text-white'
            }`}
          >
            BSE
          </button>
        </div>
      </div>
    </div>
  );
};
