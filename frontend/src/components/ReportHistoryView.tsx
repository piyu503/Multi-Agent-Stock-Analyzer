import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  ExternalLink,
  Trash2,
  FileText,
  Loader2,
  ArrowLeft
} from 'lucide-react';
import { fetchReportHistory, fetchSavedReportDetail, deleteSavedReport } from '../api';
import type { SavedReportSummary, ResearchReport } from '../types';

interface ReportHistoryViewProps {
  onOpenReport: (report: ResearchReport) => void;
  onBackToCatalog: () => void;
  onRequireAuth: () => void;
  isAuthenticated: boolean;
}

export const ReportHistoryView: React.FC<ReportHistoryViewProps> = ({
  onOpenReport,
  onBackToCatalog,
  onRequireAuth,
  isAuthenticated,
}) => {
  const [reports, setReports] = useState<SavedReportSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL');
  const [loadingReportId, setLoadingReportId] = useState<number | null>(null);
  const [deletingReportId, setDeletingReportId] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      loadHistory();
    } else {
      // Load any locally cached session reports
      try {
        const local = localStorage.getItem('equiagentic_guest_reports');
        if (local) {
          setReports(JSON.parse(local));
        }
      } catch {}
    }
  }, [isAuthenticated]);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      const data = await fetchReportHistory();
      setReports(data || []);
    } catch (err) {
      console.error('Failed to load report history:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpen = async (reportId: number) => {
    setLoadingReportId(reportId);
    try {
      if (isAuthenticated) {
        const detail = await fetchSavedReportDetail(reportId);
        const reportToOpen = (detail as any)?.report || (detail as any)?.report_data;
        if (reportToOpen) {
          onOpenReport(reportToOpen);
        }
      } else {
        // Open from guest session cache
        const local = localStorage.getItem('equiagentic_guest_reports_full');
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed[reportId]) {
            onOpenReport(parsed[reportId]);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load report detail:', err);
    } finally {
      setLoadingReportId(null);
    }
  };

  const handleDelete = async (reportId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this saved research report?')) {
      return;
    }
    setDeletingReportId(reportId);
    try {
      if (isAuthenticated) {
        await deleteSavedReport(reportId);
      } else {
        const local = localStorage.getItem('equiagentic_guest_reports');
        if (local) {
          const list = JSON.parse(local).filter((r: any) => r.id !== reportId);
          localStorage.setItem('equiagentic_guest_reports', JSON.stringify(list));
        }
      }
      setReports((prev) => prev.filter((r) => r.id !== reportId));
    } catch (err) {
      console.error('Failed to delete report:', err);
    } finally {
      setDeletingReportId(null);
    }
  };

  const getCleanConviction = (report: SavedReportSummary): string => {
    const raw = (report.conviction || report.verdict || '').toUpperCase();
    if (raw.includes('BUY') || raw.includes('OVERWEIGHT') || raw.includes('ACCUMULATE')) {
      return 'OVERWEIGHT';
    }
    if (raw.includes('SELL') || raw.includes('UNDERWEIGHT') || raw.includes('REDUCE')) {
      return 'UNDERWEIGHT';
    }
    return 'NEUTRAL';
  };

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.company_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (filterVerdict === 'ALL') return true;
    
    const cleanConviction = getCleanConviction(r);
    if (filterVerdict === 'BUY') return cleanConviction === 'OVERWEIGHT';
    if (filterVerdict === 'SELL') return cleanConviction === 'UNDERWEIGHT';
    if (filterVerdict === 'NEUTRAL') return cleanConviction === 'NEUTRAL';
    return true;
  });

  const getConvictionColor = (conviction?: string) => {
    const upper = (conviction || '').toUpperCase();
    if (upper.includes('BUY') || upper.includes('ACCUMULATE') || upper.includes('OVERWEIGHT')) {
      return 'text-emerald-300/90';
    }
    if (upper.includes('SELL') || upper.includes('REDUCE') || upper.includes('UNDERWEIGHT')) {
      return 'text-rose-300/90';
    }
    return 'text-amber-200/75';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Guest Mode Callout Banner */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 rounded-[8px] border border-white/10 bg-[#0c0e18] flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-10 h-10 rounded-[6px] object-cover border border-white/10 shrink-0"
            />
            <div>
              <h4 className="text-sm font-semibold text-white">Viewing Session Reports</h4>
              <p className="text-xs text-slate-400 font-mono">Sign in to sync your reports across devices and unlock permanent cloud archive.</p>
            </div>
          </div>
          <button
            onClick={onRequireAuth}
            className="px-4 py-2 rounded-[6px] bg-[#671270] hover:bg-[#86198f] text-white text-xs font-semibold shrink-0 cursor-pointer"
          >
            Sign In / Register
          </button>
        </div>
      )}
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10 mb-6">
        <div>
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] bg-white/[0.04] border border-white/10 hover:border-fuchsia-500/40 hover:bg-white/[0.08] text-xs font-mono text-slate-300 hover:text-white mb-3 transition-all cursor-pointer shadow-sm group"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-fuchsia-400 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Market Catalog</span>
          </button>
          <h1 className="text-2xl font-bold text-white font-display flex items-center gap-2.5">
            <span>Research Archive &amp; History</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-[4px] bg-white/[0.06] text-slate-300 border border-white/10 font-semibold">
              {isAuthenticated
                ? `${reports.length} Reports Saved`
                : `${reports.length} Local Session Reports (Unsynced)`}
            </span>
          </h1>
        </div>

        {/* Search within history */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker or company..."
              className="w-full rounded-[6px] border border-white/15 bg-white/[0.04] pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:border-fuchsia-500 focus:bg-white/[0.06] focus:outline-none transition-all font-sans"
            />
          </div>
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {['ALL', 'BUY', 'NEUTRAL', 'SELL'].map((verdict) => (
          <button
            key={verdict}
            onClick={() => setFilterVerdict(verdict)}
            className={`px-3 py-1 rounded-[4px] text-xs font-mono uppercase tracking-wider transition-colors duration-120 cursor-pointer ${
              filterVerdict === verdict
                ? 'bg-white/15 text-white border border-white/25 shadow-sm font-semibold'
                : 'bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.05] border border-white/5'
            }`}
          >
            {verdict}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-fuchsia-400 mb-3" />
          <p className="text-xs font-mono">Retrieving saved deliberation archives...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        /* Empty State */
        <div className="rounded-[8px] border border-dashed border-white/10 p-12 text-center bg-white/[0.01]">
          <FileText className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">No research reports found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 font-mono">
            {searchQuery
              ? `No saved reports match "${searchQuery}".`
              : 'Generate an institutional report for any NSE or BSE stock to automatically archive it here.'}
          </p>
          <button
            onClick={onBackToCatalog}
            className="px-4 py-2 rounded-[8px] bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-colors duration-120 cursor-pointer"
          >
            Explore Stock Catalog
          </button>
        </div>
      ) : (
        /* Report Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              onClick={() => handleOpen(report.id)}
              className="group relative rounded-[8px] border border-white/10 bg-[#07090e]/80 hover:bg-[#0b0e17] p-5 transition-all duration-150 hover:border-white/25 hover:shadow-lg hover:shadow-black/40 cursor-pointer flex flex-col justify-between"
            >
              <div>
                {/* Header: Ticker & Exchange */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-lg font-bold text-white tracking-wide group-hover:text-slate-100 transition-colors">
                        {report.symbol}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-[4px] bg-white/5 text-slate-300 border border-white/10 font-semibold">
                        {report.exchange}
                      </span>
                      {!isAuthenticated && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-[4px] bg-amber-500/10 text-amber-300 border border-amber-500/30 font-medium">
                          Local Session
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-300 font-medium truncate max-w-[260px] mt-1" title={report.company_name}>
                      {report.company_name}
                    </p>
                  </div>
                </div>

                {/* Key Metrics / Highlights - Larger & Highly Readable */}
                <div className="grid grid-cols-2 gap-3 my-4 py-3 px-4 rounded-[8px] bg-white/[0.03] border border-white/10 font-mono items-center">
                  <div>
                    <span className="text-xs text-slate-400 block uppercase font-medium tracking-wider mb-1">Conviction</span>
                    <span className={`text-base font-bold ${getConvictionColor(getCleanConviction(report))}`}>
                      {getCleanConviction(report)}
                    </span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block uppercase font-medium tracking-wider mb-1">Target Price</span>
                    <span className="text-base text-slate-100 font-bold font-mono">
                      {report.target_price || 'Multi-tranche'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Timestamp, Delete, and View in hoverable templates */}
              <div className="pt-3.5 border-t border-white/10 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white/[0.03] border border-white/10 text-xs text-slate-400 font-mono hover:text-slate-200 hover:border-white/20 hover:bg-white/[0.06] transition-all">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>{new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(report.id, e)}
                    disabled={deletingReportId === report.id}
                    title="Delete saved report"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white/[0.03] border border-white/10 text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-all cursor-pointer"
                  >
                    {deletingReportId === report.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-medium hidden sm:inline">Delete</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpen(report.id)}
                    disabled={loadingReportId === report.id}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[6px] bg-white/[0.06] border border-white/15 hover:bg-white/[0.12] hover:border-white/30 text-white transition-all text-xs font-medium cursor-pointer"
                  >
                    {loadingReportId === report.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>View</span>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
