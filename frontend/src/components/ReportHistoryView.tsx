import React, { useState, useEffect } from 'react';
import {
  Clock,
  Search,
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
      try {
        const local = localStorage.getItem('equiagentic_guest_reports');
        if (local) {
          setReports(JSON.parse(local));
        }
      } catch { }
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
      return 'text-[#05b169]';
    }
    if (upper.includes('SELL') || upper.includes('REDUCE') || upper.includes('UNDERWEIGHT')) {
      return 'text-[#cf202f]';
    }
    return 'text-[#f4b000]';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Guest Mode Callout Banner - Coinbase Card */}
      {!isAuthenticated && (
        <div className="mb-6 p-5 rounded-3xl border border-[#dee1e6] dark:border-white/10 bg-[#f7f7f7] dark:bg-[#16181c] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-10 h-10 rounded-xl object-contain bg-white dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 p-1 shrink-0 shadow-sm"
            />
            <div>
              <h4 className="text-sm font-semibold text-[#0a0b0d] dark:text-white">Viewing Session Reports</h4>
              <p className="text-xs text-[#5b616e] dark:text-[#a8acb3] font-mono">Sign in to sync your reports across devices and unlock permanent cloud archive.</p>
            </div>
          </div>
          <button
            onClick={onRequireAuth}
            className="cb-pill-btn-primary px-5 py-2.5 text-xs font-semibold shrink-0 cursor-pointer shadow-sm"
          >
            Sign In / Register
          </button>
        </div>
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#dee1e6] dark:border-white/10 mb-6">
        <div>
          <button
            onClick={onBackToCatalog}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 hover:border-[#0052ff] text-xs font-mono text-[#5b616e] dark:text-[#a8acb3] hover:text-[#0a0b0d] dark:hover:text-white mb-3 transition-all cursor-pointer shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#0052ff]" />
            <span>Back to Market Catalog</span>
          </button>
          <h1 className="text-2xl sm:text-3xl font-normal text-[#0a0b0d] dark:text-white font-display flex items-center gap-3">
            <span>Research Archive &amp; History</span>
            <span className="text-xs font-mono px-3 py-1 rounded-full bg-[#eef0f3] dark:bg-white/10 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10 font-semibold">
              {isAuthenticated
                ? `${reports.length} Reports Saved`
                : `${reports.length} Local Session Reports`}
            </span>
          </h1>
        </div>

        {/* Search within history */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-4 top-3 h-4 w-4 text-[#7c828a] pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search ticker or company..."
              className="w-full rounded-full border border-[#dee1e6] dark:border-white/10 bg-[#f7f7f7] dark:bg-[#16181c] pl-11 pr-4 py-2.5 text-sm text-[#0a0b0d] dark:text-white placeholder-[#7c828a] focus:border-[#0052ff] focus:outline-none transition-all font-sans"
            />
          </div>
        </div>
      </div>

      {/* Filter Chips - Coinbase Pill Hierarchy */}
      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {['ALL', 'BUY', 'NEUTRAL', 'SELL'].map((verdict) => (
          <button
            key={verdict}
            onClick={() => setFilterVerdict(verdict)}
            className={`px-4 py-1.5 rounded-full text-xs font-mono uppercase tracking-wider transition-all cursor-pointer ${filterVerdict === verdict
                ? 'bg-[#0052ff] text-white font-semibold shadow-sm'
                : 'bg-[#f7f7f7] dark:bg-white/5 text-[#5b616e] dark:text-[#a8acb3] hover:text-[#0a0b0d] dark:hover:text-white border border-[#dee1e6] dark:border-white/10'
              }`}
          >
            {verdict}
          </button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center text-[#7c828a]">
          <Loader2 className="w-8 h-8 animate-spin text-[#0052ff] mb-3" />
          <p className="text-xs font-mono">Retrieving saved deliberation archives...</p>
        </div>
      ) : filteredReports.length === 0 ? (
        /* Empty State */
        <div className="rounded-3xl border border-dashed border-[#dee1e6] dark:border-white/10 p-12 text-center bg-[#f7f7f7] dark:bg-white/[0.02]">
          <FileText className="mx-auto h-10 w-10 text-[#7c828a] mb-3" />
          <h3 className="text-sm font-semibold text-[#0a0b0d] dark:text-white mb-1">No research reports found</h3>
          <p className="text-xs text-[#5b616e] dark:text-[#a8acb3] max-w-sm mx-auto mb-4 font-mono">
            {searchQuery
              ? `No saved reports match "${searchQuery}".`
              : 'Generate an institutional report for any NSE or BSE stock to automatically archive it here.'}
          </p>
          <button
            onClick={onBackToCatalog}
            className="cb-pill-btn-primary px-5 py-2 text-xs font-semibold cursor-pointer shadow-sm"
          >
            Explore Stock Catalog
          </button>
        </div>
      ) : (
        /* Report Cards Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredReports.map((report) => {
            const monogram = report.symbol.slice(0, 2).toUpperCase();
            return (
              <div
                key={report.id}
                onClick={() => handleOpen(report.id)}
                className="cb-card cb-card-hover p-6 rounded-[24px] cursor-pointer flex flex-col justify-between group transition-all duration-200 select-none"
              >
                <div>
                  {/* Header: Monogram Plate + Ticker + Exchange */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 flex items-center justify-center font-mono font-medium text-sm text-[#0a0b0d] dark:text-white group-hover:bg-[#0052ff] group-hover:text-white group-hover:border-[#0052ff] transition-all duration-200 shrink-0">
                        {monogram}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-base font-semibold text-[#0a0b0d] dark:text-white tracking-tight group-hover:text-[#0052ff] transition-colors">
                            {report.symbol}
                          </span>
                          <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-[#eef0f3] dark:bg-white/10 text-[#5b616e] dark:text-[#a8acb3] border border-[#dee1e6] dark:border-white/10">
                            {report.exchange}
                          </span>
                          {!isAuthenticated && (
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#f4b000]/10 text-[#f4b000] border border-[#f4b000]/30 font-medium">
                              Local
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-normal text-[#5b616e] dark:text-[#a8acb3] group-hover:text-[#0a0b0d] dark:group-hover:text-white truncate mt-0.5 transition-colors" title={report.company_name}>
                          {report.company_name}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDelete(report.id, e)}
                      disabled={deletingReportId === report.id}
                      title="Delete research report"
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[#7c828a] hover:text-[#cf202f] hover:bg-[#cf202f]/10 transition-colors"
                    >
                      {deletingReportId === report.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Key Metrics / Highlights - Coinbase Recessed Metric Plate */}
                  <div className="grid grid-cols-2 gap-3 my-4 py-3.5 px-4 rounded-[18px] bg-[#f7f7f7] dark:bg-[#0a0b0d] border border-[#dee1e6] dark:border-white/5 font-mono items-center">
                    <div>
                      <span className="text-[11px] text-[#7c828a] block uppercase font-medium tracking-wider mb-1">Conviction</span>
                      <span className={`text-sm sm:text-base font-semibold ${getConvictionColor(getCleanConviction(report))}`}>
                        {getCleanConviction(report)}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#7c828a] block uppercase font-medium tracking-wider mb-1">Target Price</span>
                      <span className="text-sm sm:text-base text-[#0a0b0d] dark:text-white font-semibold font-mono">
                        {report.target_price || 'Multi-tranche'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer: Timestamp & Action */}
                <div className="pt-3 border-t border-[#dee1e6] dark:border-white/10 flex items-center justify-between text-xs text-[#7c828a]">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-mono text-[#7c828a] dark:text-[#636870]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(report.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  </span>
                  <span className="text-xs font-medium text-[#0052ff] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                    {loadingReportId === report.id ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Opening...</span>
                      </>
                    ) : (
                      <span>Open Report →</span>
                    )}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
