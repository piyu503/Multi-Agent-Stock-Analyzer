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
      <div className="flex flex-col items-center justify-center p-14 text-center bg-[#090d18]/80 rounded-3xl border border-white/10 shadow-xl backdrop-blur-md">
        <Loader2 className="w-9 h-9 text-fuchsia-400 animate-spin mb-4" />
        <h4 className="text-base font-bold text-white font-display">{title || 'Scanning Indian Equity Universe...'}</h4>
        <p className="text-xs text-slate-300 mt-1 max-w-sm font-sans">{message || 'Querying active securities, ISIN records, and exchange masters.'}</p>
      </div>
    );
  }

  if (type === 'error') {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-rose-950/20 rounded-3xl border border-rose-500/40 shadow-xl backdrop-blur-md">
        <AlertCircle className="w-10 h-10 text-rose-400 mb-3 shadow-[0_0_15px_rgba(244,63,94,0.3)]" />
        <h4 className="text-base font-bold text-rose-200 font-display">{title || 'System Operational Alert'}</h4>
        <p className="text-xs text-rose-200/90 mt-1 max-w-md font-sans leading-relaxed">{message || 'Unable to connect to the intelligence backend or query failed.'}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-xs font-bold text-rose-100 border border-rose-500/50 transition cursor-pointer shadow-lg shadow-rose-950/40"
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
      <div className="flex flex-col items-center justify-center p-14 text-center bg-[#090d18]/80 rounded-3xl border border-dashed border-white/15 backdrop-blur-md">
        <FolderSearch className="w-10 h-10 text-slate-400 mb-3" />
        <h4 className="text-base font-bold text-white font-display">
          No matches found {query ? `for "${query}"` : ''} {exchange ? `on ${exchange}` : ''}
        </h4>
        <p className="text-xs text-slate-300 mt-1.5 max-w-md font-sans leading-relaxed">
          Verify spelling or search by legal name, exchange symbol, or 12-digit ISIN (e.g. <span className="font-mono text-cyan-300 font-bold">INE002A01018</span> or <span className="font-mono text-fuchsia-300 font-bold">500325</span>).
        </p>
      </div>
    );
  }

  if (type === 'unimported-catalog') {
    return (
      <div className="flex flex-col items-center justify-center p-10 text-center bg-amber-950/20 rounded-3xl border border-amber-500/30">
        <AlertTriangle className="w-10 h-10 text-amber-400 mb-3" />
        <h4 className="text-base font-bold text-amber-200 font-display">{title || 'Catalog Sync Notice'}</h4>
        <p className="text-xs text-amber-200/90 mt-1 max-w-lg leading-relaxed font-sans">
          {message || 'The full NSE and BSE stock directory is being synced.'}
        </p>
      </div>
    );
  }

  // Generic empty state
  return (
    <div className="flex flex-col items-center justify-center p-14 text-center bg-[#090d18]/80 rounded-3xl border border-dashed border-white/15">
      <FolderSearch className="w-10 h-10 text-slate-400 mb-3" />
      <h4 className="text-base font-bold text-white font-display">{title || 'No Equities Listed'}</h4>
      <p className="text-xs text-slate-300 mt-1 max-w-md font-sans">{message || 'Stock database contains no matching records.'}</p>
    </div>
  );
};
