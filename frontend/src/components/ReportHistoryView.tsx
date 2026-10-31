import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
  ExternalLink,
  Trash2,
  FileText,
  Loader2,
  ArrowLeft,
  Sparkles
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

  const filteredReports = reports.filter((r) => {
    const matchesSearch =
      r.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.company_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterVerdict === 'ALL') return matchesSearch;
    return matchesSearch && r.verdict.toUpperCase().includes(filterVerdict);
  });

  const getVerdictStyle = (verdict: string) => {
    const upper = verdict.toUpperCase();
    if (upper.includes('BUY') || upper.includes('ACCUMULATE') || upper.includes('OVERWEIGHT')) {
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    }
    if (upper.includes('SELL') || upper.includes('REDUCE') || upper.includes('UNDERWEIGHT')) {
      return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }
    return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Guest Mode Callout Banner */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 rounded-2xl border border-fuchsia-500/30 bg-gradient-to-r from-fuchsia-950/40 via-violet-950/20 to-black/60 backdrop-blur-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-fuchsia-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300 shrink-0">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-white">Viewing Session Reports</h4>
              <p className="text-xs text-slate-400 font-mono">Sign in to sync your reports across devices and unlock permanent cloud archive.</p>
            </div>
          </div>
          <button
            onClick={onRequireAuth}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-violet-600 hover:from-fuchsia-500 hover:to-violet-500 text-white text-xs font-semibold shrink-0 cursor-pointer shadow-lg shadow-fuchsia-950/40"
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
            className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white mb-2 font-mono transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Market Catalog</span>
          </button>
          <h1 className="text-2xl font-bold text-white font-display flex items-center gap-2.5">
            <span>Research Archive &amp; History</span>
            <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-fuchsia-500/10 text-fuchsia-400 border border-fuchsia-500/30">
              {reports.length} Reports Saved
            </span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Instantly reload comprehensive multi-agent investment memos from your archive
          </p>
        </div>

        {/* Search within history */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker or company..."
              className="w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3.5 py-1.5 text-xs text-white placeholder-slate-600 focus:border-fuchsia-500 focus:outline-none transition-all font-sans"
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
            className={`px-3 py-1 rounded-lg text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${
              filterVerdict === verdict
                ? 'bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/40 shadow-sm'
                : 'bg-white/[0.02] text-slate-400 hover:text-white border border-white/5'
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
        <div className="rounded-2xl border border-dashed border-white/10 p-12 text-center bg-white/[0.01]">
          <FileText className="mx-auto h-10 w-10 text-slate-600 mb-3" />
          <h3 className="text-sm font-semibold text-white mb-1">No research reports found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4 font-mono">
            {searchQuery
              ? `No saved reports match "${searchQuery}".`
              : 'Generate an institutional report for any NSE or BSE stock to automatically archive it here.'}
          </p>
          <button
            onClick={onBackToCatalog}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-medium transition-all cursor-pointer"
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
              className="group relative rounded-2xl border border-white/10 bg-[#07090e]/80 hover:bg-[#07090e] p-5 transition-all hover:border-fuchsia-500/40 hover:shadow-xl hover:shadow-fuchsia-950/20 cursor-pointer backdrop-blur-xl flex flex-col justify-between"
            >
              <div>
                {/* Header: Ticker, Exchange & Verdict */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-white tracking-wide group-hover:text-fuchsia-400 transition-colors">
                        {report.symbol}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-slate-400 border border-white/10">
                        {report.exchange}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium truncate max-w-[200px] mt-0.5" title={report.company_name}>
                      {report.company_name}
                    </p>
                  </div>

                  <span
                    className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full border font-semibold ${getVerdictStyle(
                      report.verdict
                    )}`}
                  >
                    {report.verdict}
                  </span>
                </div>

                {/* Key Metrics / Highlights */}
                <div className="grid grid-cols-2 gap-2 my-3 py-2.5 px-3 rounded-xl bg-white/[0.02] border border-white/5 text-xs font-mono">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Conviction</span>
                    <span className="text-slate-300 font-semibold">{report.conviction || 'NEUTRAL'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Target Price</span>
                    <span className="text-fuchsia-400 font-semibold">{report.target_price || 'Multi-tranche'}</span>
                  </div>
                </div>
              </div>

              {/* Card Footer: Timestamp and Open Button */}
              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>{new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDelete(report.id, e)}
                    disabled={deletingReportId === report.id}
                    title="Delete saved report"
                    className="p-1 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                  >
                    {deletingReportId === report.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>

                  <button
                    disabled={loadingReportId === report.id}
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-fuchsia-400 group-hover:text-fuchsia-300 transition-colors"
                  >
                    {loadingReportId === report.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <span>View</span>
                        <ExternalLink className="w-3 h-3" />
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
