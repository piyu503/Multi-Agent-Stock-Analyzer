import { useState } from 'react';
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
    <div className="w-full space-y-3">
      <form onSubmit={handleSubmit} className="w-full relative">
        <div className="relative flex items-center">
          <div className="absolute left-4 pointer-events-none text-slate-400">
            <Search className="w-5 h-5 text-slate-400" />
          </div>
          <input
            type="text"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              onSearch(e.target.value, exchange);
            }}
            placeholder="Search by company name, ticker symbol, or ISIN (e.g. RELIANCE, TCS, INE002A01018, 500325)..."
            className="w-full bg-[#0d121f]/90 text-white placeholder-slate-400 pl-12 pr-28 py-4 rounded-xl border border-white/10 focus:outline-none focus:ring-2 focus:ring-fuchsia-500/40 focus:border-fuchsia-500 transition-all text-sm sm:text-base shadow-xl shadow-black/40 font-sans"
          />

          <div className="absolute right-3 flex items-center gap-2">
            {value && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-fuchsia-600 hover:bg-fuchsia-500 text-white text-xs font-bold tracking-wide transition shadow-lg shadow-fuchsia-950/50 cursor-pointer disabled:opacity-50"
              disabled={isLoading}
            >
              {isLoading ? 'Scanning...' : 'Scan'}
            </button>
          </div>
        </div>
      </form>

      {/* Exchange Filters and Shortcuts */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 flex items-center gap-1.5 font-medium">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <span>Exchange:</span>
          </span>
          <button
            type="button"
            onClick={() => handleExchangeChange('')}
            className={`px-3 py-1 rounded-lg border font-mono transition cursor-pointer ${
              exchange === ''
                ? 'bg-fuchsia-600 text-white border-fuchsia-500 font-bold shadow-md shadow-fuchsia-600/20'
                : 'bg-white/5 text-slate-300 border-white/10 hover:border-white/20 hover:text-white'
            }`}
          >
            All Markets
          </button>
          <button
            type="button"
            onClick={() => handleExchangeChange('NSE')}
            className={`px-3 py-1 rounded-lg border font-mono transition cursor-pointer ${
              exchange === 'NSE'
                ? 'bg-fuchsia-600 text-white border-fuchsia-500 font-bold shadow-md shadow-fuchsia-600/20'
                : 'bg-white/5 text-slate-300 border-white/10 hover:border-fuchsia-500/40 hover:text-white'
            }`}
          >
            NSE
          </button>
          <button
            type="button"
            onClick={() => handleExchangeChange('BSE')}
            className={`px-3 py-1 rounded-lg border font-mono transition cursor-pointer ${
              exchange === 'BSE'
                ? 'bg-fuchsia-600 text-white border-fuchsia-500 font-bold shadow-md shadow-fuchsia-600/20'
                : 'bg-white/5 text-slate-300 border-white/10 hover:border-fuchsia-500/40 hover:text-white'
            }`}
          >
            BSE
          </button>
        </div>

        <div className="text-[11px] font-mono text-slate-400 hidden sm:block">
          Matches Ticker • Corporate Name • 12-Digit ISIN • Scrip Code
        </div>
      </div>
    </div>
  );
};
