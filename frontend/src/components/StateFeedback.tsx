import React from 'react';
import { AlertCircle, AlertTriangle, FolderSearch, Loader2, RefreshCw } from 'lucide-react';

interface StateCardProps {
  type: 'loading' | 'empty' | 'error' | 'no-results' | 'unimported-catalog';
  title?: string;
  message?: string;
  onRetry?: () => void;
  query?: string;
  exchange?: string;
}

export const StateFeedback: React.FC<StateCardProps> = ({
  type,
  title,
  message,
  onRetry,
  query,
  exchange,
}) => {
  if (type === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center p-14 text-center bg-[#f7f7f7] dark:bg-[#16181c] rounded-3xl border border-[#dee1e6] dark:border-white/10 shadow-sm transition-colors duration-200">
        <Loader2 className="w-9 h-9 text-[#0052ff] animate-spin mb-4" />
        <h4 className="text-base font-semibold text-[#0a0b0d] dark:text-white font-display">{title || 'Scanning Indian Equity Universe...'}</h4>
        <p className="text-xs text-[#5b616e] dark:text-[#a8acb3] mt-1.5 max-w-sm font-sans">{message || 'Querying active securities, ISIN records, and exchange masters.'}</p>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-[#cf202f]/5 dark:bg-[#cf202f]/10 rounded-3xl border border-[#cf202f]/25 shadow-sm transition-colors duration-200">
        <AlertCircle className="w-10 h-10 text-[#cf202f] mb-3" />
        <h4 className="text-base font-semibold text-[#cf202f] font-display">{title || 'System Operational Alert'}</h4>
        <p className="text-xs text-[#5b616e] dark:text-[#a8acb3] mt-1.5 max-w-md font-sans leading-relaxed">{message || 'Unable to connect to the intelligence backend or query failed.'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 cb-pill-btn-primary inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold shadow-sm cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reconnect Terminal</span>
          </button>
        )}
      </div>
    );
  }

  if (type === 'no-results') {
    return (
      <div className="flex flex-col items-center justify-center p-14 text-center bg-[#f7f7f7] dark:bg-[#16181c] rounded-3xl border border-dashed border-[#dee1e6] dark:border-white/15 transition-colors duration-200">
        <FolderSearch className="w-10 h-10 text-[#7c828a] mb-3" />
        <h4 className="text-base font-semibold text-[#0a0b0d] dark:text-white font-display">
          No matches found {query ? `for "${query}"` : ''} {exchange ? `on ${exchange}` : ''}
        </h4>
        <p className="text-xs text-[#5b616e] dark:text-[#a8acb3] mt-1.5 max-w-md font-sans leading-relaxed">
          Verify spelling or search by legal name, exchange symbol, or 12-digit ISIN (e.g. <span className="font-mono text-[#0052ff] font-bold">INE002A01018</span> or <span className="font-mono text-[#0052ff] font-bold">500325</span>).
        </p>
      </div>
    );
  }

  if (type === 'unimported-catalog') {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-[#f4b000]/10 rounded-3xl border border-[#f4b000]/30 transition-colors duration-200">
        <AlertTriangle className="w-10 h-10 text-[#f4b000] mb-3" />
        <h4 className="text-base font-semibold text-[#f4b000] font-display">{title || 'Catalog Sync Notice'}</h4>
        <p className="text-xs text-[#5b616e] dark:text-[#a8acb3] mt-1 max-w-lg leading-relaxed font-sans">
          {message || 'The full NSE and BSE stock directory is being synced.'}
        </p>
      </div>
    );
  }

  // Generic empty state
  return (
    <div className="flex flex-col items-center justify-center p-14 text-center bg-[#f7f7f7] dark:bg-[#16181c] rounded-3xl border border-dashed border-[#dee1e6] dark:border-white/15 transition-colors duration-200">
      <FolderSearch className="w-10 h-10 text-[#7c828a] mb-3" />
      <h4 className="text-base font-semibold text-[#0a0b0d] dark:text-white font-display">{title || 'No Equities Listed'}</h4>
      <p className="text-xs text-[#5b616e] dark:text-[#a8acb3] mt-1 max-w-md font-sans">{message || 'Stock database contains no matching records.'}</p>
    </div>
  );
};
