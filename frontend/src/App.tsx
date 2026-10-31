import { useEffect, useState } from 'react';
import {
  checkBackendHealth,
  clearAuthSession,
  fetchCurrentUser,
  fetchReportHistory,
  generateReport,
  getAuthToken,
  getStoredUser,
  getStockDetail,
  saveReportToHistory,
  searchStocks
} from './api';
import { Navbar } from './components/Navbar';
import { ReportView } from './components/ReportView';
import { SearchBar } from './components/SearchBar';
import { StateFeedback } from './components/StateFeedback';
import { StockCard } from './components/StockCard';
import { StockProfile } from './components/StockProfile';
import { AnalysisConsole } from './components/AnalysisConsole';
import { FeatureGrid } from './components/FeatureGrid';
import { AgentExecutionModal } from './components/AgentExecutionModal';
import { AuthModal } from './components/AuthModal';
import { ReportHistoryView } from './components/ReportHistoryView';
import type { AgentProgressItem } from './components/AgentExecutionModal';
import type { ResearchReport, StockDetail, StockSummary, User } from './types';
import { ChevronLeft, ChevronRight, Database } from 'lucide-react';

type ViewMode = 'catalog' | 'profile' | 'report' | 'history';

const INITIAL_13_AGENTS: AgentProgressItem[] = [
  { id: 'manager', name: 'Research Manager', role: 'Research Manager & Orchestrator', stage: 0, status: 'pending' },
  { id: 'evidence', name: 'Evidence Verification Analyst', role: 'Data & Evidence Verification Analyst', stage: 1, status: 'pending' },
  { id: 'fundamentals', name: 'Fundamentals Analyst', role: 'Fundamentals & Business Quality Analyst', stage: 1, status: 'pending' },
  { id: 'growth', name: 'Growth & Industry Analyst', role: 'Growth & Industry Analyst', stage: 1, status: 'pending' },
  { id: 'news', name: 'News & Events Analyst', role: 'News, Corporate Events & Earnings-Call Analyst', stage: 1, status: 'pending' },
  { id: 'sentiment', name: 'Social Sentiment Analyst', role: 'Social Sentiment Analyst', stage: 1, status: 'pending' },
  { id: 'market', name: 'Market Analyst', role: 'Market Analyst', stage: 1, status: 'pending' },
  { id: 'valuation', name: 'Valuation Analyst', role: 'Peer Benchmarking & Valuation Analyst', stage: 1, status: 'pending' },
  { id: 'bull', name: 'Bull Researcher', role: 'Bull Researcher', stage: 2, status: 'pending' },
  { id: 'bear', name: 'Bear Researcher', role: 'Bear Researcher', stage: 2, status: 'pending' },
  { id: 'risk', name: 'Risk Analyst', role: 'Risk Analyst', stage: 4, status: 'pending' },
  { id: 'trader', name: 'Execution Trader', role: 'Trader', stage: 4, status: 'pending' },
  { id: 'pm', name: 'Portfolio Manager', role: 'Portfolio Manager', stage: 5, status: 'pending' },
];

export function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const [stocks, setStocks] = useState<StockSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExchange, setSelectedExchange] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalMatches, setTotalMatches] = useState(0);

  const [isLoadingStocks, setIsLoadingStocks] = useState(false);
  const [stocksError, setStocksError] = useState<string | null>(null);

  const [selectedStock, setSelectedStock] = useState<StockDetail | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  const [currentReport, setCurrentReport] = useState<ResearchReport | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  const [backendHealthy, setBackendHealthy] = useState<boolean | null>(null);
  const [dhanProActive, setDhanProActive] = useState<boolean>(false);
  const [streamTier, setStreamTier] = useState<string | null>(null);

  // Authentication State
  const [user, setUser] = useState<User | null>(getStoredUser());
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authPromptMessage, setAuthPromptMessage] = useState<string | null>(null);
  const [pendingAnalysisStock, setPendingAnalysisStock] = useState<{ symbol: string; company_name: string; exchange: string } | null>(null);
  const [savedCount, setSavedCount] = useState(0);

  // Live SSE Stepper State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isGeneratingReport = isModalOpen;
  const [modalStock, setModalStock] = useState<{ symbol: string; companyName: string; exchange: string }>({
    symbol: '',
    companyName: '',
    exchange: 'NSE'
  });
  const [agentProgress, setAgentProgress] = useState<AgentProgressItem[]>(INITIAL_13_AGENTS);
  const [currentStage, setCurrentStage] = useState(0);
  const [isDeliberationComplete, setIsDeliberationComplete] = useState(false);

  // Check health and load initial stocks on mount
  useEffect(() => {
    checkHealth();
    fetchStocksList('', '', 1);

    if (getAuthToken()) {
      fetchCurrentUser()
        .then((u) => {
          setUser(u);
          refreshSavedCount();
        })
        .catch(() => {
          clearAuthSession();
          setUser(null);
        });
    }
  }, []);

  const refreshSavedCount = async () => {
    try {
      const history = await fetchReportHistory();
      setSavedCount(history.length);
    } catch {
      // Ignore
    }
  };

  const checkHealth = async () => {
    try {
      const res = await checkBackendHealth();
      setBackendHealthy(true);
      setDhanProActive(Boolean(res && res.dhan_pro_active));
    } catch {
      setBackendHealthy(false);
      setDhanProActive(false);
    }
  };

  const fetchStocksList = async (query: string, exchange: string, page: number) => {
    setIsLoadingStocks(true);
    setStocksError(null);
    try {
      const data = await searchStocks(query, exchange, page, 18);
      setStocks(data.items);
      setTotalMatches(data.total);
      setTotalPages(data.total_pages);
      setCurrentPage(data.page);
    } catch (err: any) {
      setStocksError(err.message || 'Failed to fetch stocks.');
    } finally {
      setIsLoadingStocks(false);
    }
  };

  const handleSearch = (query: string, exchange?: string) => {
    setSearchQuery(query);
    setSelectedExchange(exchange || '');
    setCurrentPage(1);
    fetchStocksList(query, exchange || '', 1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
    fetchStocksList(searchQuery, selectedExchange, newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectStock = async (symbol: string, exchange: string) => {
    setIsLoadingProfile(true);
    setProfileError(null);
    try {
      const detail = await getStockDetail(symbol, exchange);
      setSelectedStock(detail);
      setViewMode('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err: any) {
      setProfileError(err.message || 'Failed to fetch company profile.');
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Auto-archive report to user account if logged in (or guest session cache)
  const autoSaveReport = async (reportData: ResearchReport) => {
    let targetPrice: string | undefined = undefined;
    if (reportData.execution_plan && reportData.execution_plan.entry_range_high) {
      targetPrice = `₹${reportData.execution_plan.entry_range_high.toLocaleString('en-IN')}`;
    }

    // Save locally for guest access
    try {
      const summaryItem = {
        id: Date.now(),
        user_id: 0,
        symbol: reportData.symbol,
        exchange: reportData.exchange,
        company_name: reportData.company_name,
        verdict: reportData.final_assessment?.title || 'ACCUMULATE',
        conviction: reportData.conviction || 'NEUTRAL',
        target_price: targetPrice,
        created_at: new Date().toISOString()
      };

      const existingGuest = JSON.parse(localStorage.getItem('equiagentic_guest_reports') || '[]');
      const updatedGuest = [summaryItem, ...existingGuest.filter((r: any) => r.symbol !== reportData.symbol)];
      localStorage.setItem('equiagentic_guest_reports', JSON.stringify(updatedGuest));

      const existingFull = JSON.parse(localStorage.getItem('equiagentic_guest_reports_full') || '{}');
      existingFull[summaryItem.id] = reportData;
      localStorage.setItem('equiagentic_guest_reports_full', JSON.stringify(existingFull));
    } catch {}

    if (!getAuthToken()) return;
    try {
      await saveReportToHistory({
        symbol: reportData.symbol,
        exchange: reportData.exchange,
        company_name: reportData.company_name,
        verdict: reportData.final_assessment?.title || 'ACCUMULATE',
        conviction: reportData.conviction || 'NEUTRAL',
        target_price: targetPrice,
        report_data: reportData
      });
      refreshSavedCount();
    } catch (err) {
      console.warn('Auto-save report note:', err);
    }
  };

  // Launch the live deliberation SSE process (Guarded by Authentication)
  const handleStartRealtimeAnalysis = (stock: { symbol: string; company_name: string; exchange: string }) => {
    // If user is not logged in, prompt sign in and save target stock to run right after authentication
    if (!user && !getAuthToken()) {
      setPendingAnalysisStock(stock);
      setAuthPromptMessage(`Sign in or create a free account to generate institutional research on ${stock.symbol} (${stock.company_name})`);
      setIsAuthModalOpen(true);
      return;
    }

    const sym = stock.symbol;
    const exch = stock.exchange || 'NSE';
    const compName = stock.company_name || sym;

    setModalStock({ symbol: sym, companyName: compName, exchange: exch });
    setAgentProgress(INITIAL_13_AGENTS.map((a) => ({ ...a, status: 'pending', summary: undefined, duration: undefined })));
    setCurrentStage(0);
    setIsDeliberationComplete(false);
    setCurrentReport(null);
    setReportError(null);
    setStreamTier(dhanProActive ? 'DHAN_PRO_VERIFIED' : null);
    setIsModalOpen(true);

    const token = getAuthToken();
    const tokenParam = token ? `&token=${encodeURIComponent(token)}` : '';
    const sseUrl = `/api/reports/stream/${encodeURIComponent(sym)}?exchange=${encodeURIComponent(exch)}${tokenParam}`;
    const eventSource = new EventSource(sseUrl);

    eventSource.addEventListener('started', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.data_source_tier) {
          setStreamTier(payload.data_source_tier);
        }
      } catch (err) {
        console.error('Error parsing started event', err);
      }
    });

    eventSource.addEventListener('agent_start', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        setCurrentStage(payload.stage || 0);
        if (payload.data_source_tier) {
          setStreamTier(payload.data_source_tier);
        }
        const incomingName = (payload.agent_name || '').toLowerCase();
        const incomingRole = (payload.role || '').toLowerCase();

        setAgentProgress((prev) =>
          prev.map((item) => {
            const matches =
              item.name.toLowerCase() === incomingName ||
              item.role.toLowerCase() === incomingRole ||
              incomingRole.includes(item.name.toLowerCase()) ||
              item.role.toLowerCase().includes(incomingRole);
            // If already completed with a real duration, never reset it back to running!
            if (matches && item.status !== 'completed') {
              return { ...item, status: 'running' };
            }
            return item;
          })
        );
      } catch (err) {
        console.error('Error parsing agent_start event', err);
      }
    });

    eventSource.addEventListener('agent_complete', (e: MessageEvent) => {
      try {
        const payload = JSON.parse(e.data);
        if (payload.data_source_tier) {
          setStreamTier(payload.data_source_tier);
        }
        const incomingName = (payload.agent_name || '').toLowerCase();
        const incomingRole = (payload.role || '').toLowerCase();

        setAgentProgress((prev) =>
          prev.map((item) => {
            const matches =
              item.name.toLowerCase() === incomingName ||
              item.role.toLowerCase() === incomingRole ||
              incomingRole.includes(item.name.toLowerCase()) ||
              item.role.toLowerCase().includes(incomingRole);
            return matches
              ? {
                  ...item,
                  status: 'completed',
                  summary: payload.summary,
                  duration: payload.duration
                }
              : item;
          })
        );
      } catch (err) {
        console.error('Error parsing agent_complete event', err);
      }
    });

    eventSource.addEventListener('rebuttal_start', () => {
      setCurrentStage(3);
      setAgentProgress((prev) =>
        prev.map((item) =>
          item.id === 'bull' || item.id === 'bear'
            ? { ...item, status: 'running' }
            : item
        )
      );
    });

    eventSource.addEventListener('report_ready', (e: MessageEvent) => {
      try {
        const reportData: ResearchReport = JSON.parse(e.data);
        setCurrentReport(reportData);
        setIsDeliberationComplete(true);
        // Only mark agents completed if they didn't already have their real duration from the stream
        setAgentProgress((prev) =>
          prev.map((a) => (a.status === 'completed' ? a : { ...a, status: 'completed' }))
        );
        eventSource.close();
        autoSaveReport(reportData);
      } catch (err) {
        console.error('Error parsing report_ready event', err);
      }
    });

    eventSource.addEventListener('error', (_e: any) => {
      // EventSource readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
      if (eventSource.readyState === 2) {
        console.warn('SSE stream closed unexpectedly, checking report status...');
        eventSource.close();
        // Only trigger fallback if the stream actually closed before report completion
        if (!isDeliberationComplete) {
          handleFallbackGenerateReport(sym, exch);
        }
      } else {
        // ReadyState 0 means browser is auto-reconnecting (e.g. temporary network pause), do not wipe state!
        console.info('SSE stream reconnecting automatically, preserving active deliberations...');
      }
    });
  };

  const handleFallbackGenerateReport = async (symbol: string, exchange: string) => {
    try {
      const report = await generateReport(symbol, exchange);
      setCurrentReport(report);

      // If the report contains real agent runs from the backend, use their exact real metrics!
      const runs = report.agent_runs || [];
      if (runs.length > 0) {
        setAgentProgress((prev) =>
          prev.map((item) => {
            const matched = runs.find((r: any) => {
              const runName = (r.agent_name || '').toLowerCase();
              const runRole = (r.role || '').toLowerCase();
              const itemName = item.name.toLowerCase();
              const itemRole = item.role.toLowerCase();
              return (
                runName === itemName ||
                runRole === itemRole ||
                runRole.includes(itemName) ||
                itemRole.includes(runRole)
              );
            });
            return {
              ...item,
              status: 'completed',
              summary: matched?.summary || item.summary,
              duration: matched?.execution_duration_sec ?? item.duration
            };
          })
        );
      } else {
        setAgentProgress((prev) =>
          prev.map((item) => ({
            ...item,
            status: 'completed'
          }))
        );
      }
      setIsDeliberationComplete(true);
      autoSaveReport(report);
    } catch (err: any) {
      setReportError(err.message || 'Report generation error.');
    }
  };

  const handleGenerateReport = async (symbol: string, exchange: string) => {
    handleStartRealtimeAnalysis({
      symbol,
      company_name: selectedStock?.company_name || symbol,
      exchange
    });
  };

  const handleGoHome = () => {
    setViewMode('catalog');
    setSelectedStock(null);
    setCurrentReport(null);
    setReportError(null);
    setIsModalOpen(false);
  };

  const handleBackToProfile = () => {
    setIsModalOpen(false);
    if (selectedStock) {
      setViewMode('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (currentReport) {
      // If report was opened directly from History or Hero search, fetch the profile
      handleSelectStock(currentReport.symbol, currentReport.exchange);
    } else {
      setViewMode('catalog');
    }
  };

  const handleOpenPastReport = (report: ResearchReport) => {
    setCurrentReport(report);
    setViewMode('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAuthSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
    refreshSavedCount();

    // If an analysis was pending, seamlessly launch it now that user is authenticated!
    if (pendingAnalysisStock) {
      const stockToRun = pendingAnalysisStock;
      setPendingAnalysisStock(null);
      setAuthPromptMessage(null);
      setTimeout(() => {
        handleStartRealtimeAnalysis(stockToRun);
      }, 200);
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setUser(null);
    setSavedCount(0);
    if (viewMode === 'history') {
      setViewMode('catalog');
    }
  };

  const handleScrollToCatalog = () => {
    if (viewMode !== 'catalog') {
      setViewMode('catalog');
      setSelectedStock(null);
      setCurrentReport(null);
      setReportError(null);
      setIsModalOpen(false);
    }
    setTimeout(() => {
      const el = document.getElementById('listed-equity-universe');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#06080e] text-slate-100 flex flex-col font-sans selection:bg-fuchsia-500/30 selection:text-fuchsia-200 relative overflow-hidden bg-terminal-grid">
      {/* Ambient background glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-fuchsia-600/5 rounded-full blur-[140px] pointer-events-none" />

      <Navbar
        onHomeClick={handleGoHome}
        onCatalogClick={handleScrollToCatalog}
        onHistoryClick={() => setViewMode('history')}
        backendHealthy={backendHealthy}
        dhanProActive={dhanProActive}
        user={user}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        activeTab={viewMode}
        savedCount={savedCount}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {/* VIEW 1: CATALOG / DASHBOARD */}
        {viewMode === 'catalog' && (
          <div className="space-y-8">
            <AnalysisConsole
              onStartAnalysis={(stock) => handleStartRealtimeAnalysis(stock)}
              stocks={stocks}
            />

            <FeatureGrid />

            {/* Catalog Browser Search Bar & Exchange Selector */}
            <div id="listed-equity-universe" className="pt-6 border-t border-white/10 scroll-mt-24">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-white font-display">
                  Listed Indian Equity Universe
                </h3>
                <p className="text-xs text-slate-400">
                  Direct master catalog covering active National Stock Exchange &amp; Bombay Stock Exchange equities
                </p>
              </div>
              <SearchBar
                onSearch={handleSearch}
                isLoading={isLoadingStocks}
                activeExchange={selectedExchange}
              />
            </div>

            {/* Catalog Content Area */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs text-slate-400 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-fuchsia-400" />
                  <span className="font-mono text-slate-300 font-semibold">{totalMatches}</span>
                  <span>securities indexed across</span>
                  <span className="font-mono text-fuchsia-300">NSE / BSE</span>
                </div>
                {totalPages > 1 && (
                  <span className="font-mono text-[11px] text-slate-500">
                    Page {currentPage} of {totalPages}
                  </span>
                )}
              </div>

              {isLoadingStocks && stocks.length === 0 ? (
                <div className="py-20">
                  <StateFeedback type="loading" title="Scanning Exchanges" message="Accessing master securities registry..." />
                </div>
              ) : stocksError ? (
                <div className="py-12">
                  <StateFeedback
                    type="error"
                    title="Registry Sync Unavailable"
                    message={stocksError}
                    onRetry={() => fetchStocksList(searchQuery, selectedExchange, currentPage)}
                  />
                </div>
              ) : stocks.length === 0 ? (
                <div className="py-16 text-center rounded-2xl border border-dashed border-white/10 bg-white/[0.01]">
                  <p className="text-sm text-slate-400 font-mono">No matching securities found for current query parameters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stocks.map((stock) => (
                    <StockCard
                      key={`${stock.exchange}-${stock.symbol}`}
                      stock={stock}
                      onSelect={(sym, exch) => handleSelectStock(sym, exch)}
                    />
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-6">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoadingStocks}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-mono text-slate-400 px-3">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoadingStocks}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: STOCK PROFILE */}
        {viewMode === 'profile' && (
          <div>
            {isLoadingProfile ? (
              <div className="py-24">
                <StateFeedback type="loading" title="Retrieving Company Dossier" message="Compiling exchange profile and metadata..." />
              </div>
            ) : profileError ? (
              <div className="py-16">
                <StateFeedback
                  type="error"
                  title="Profile Retrieval Error"
                  message={profileError}
                  onRetry={() => selectedStock && handleSelectStock(selectedStock.symbol, selectedStock.exchange)}
                />
              </div>
            ) : selectedStock && (
              <StockProfile
                stock={selectedStock}
                onBack={handleGoHome}
                onGenerateReport={handleGenerateReport}
                isGeneratingReport={isGeneratingReport}
                dhanProActive={dhanProActive}
              />
            )}
          </div>
        )}

        {/* VIEW 3: RESEARCH REPORT */}
        {viewMode === 'report' && (
          <div>
            {currentReport ? (
              <ReportView
                report={currentReport}
                onBack={handleBackToProfile}
              />
            ) : (
              <StateFeedback
                type="error"
                title="No Report Active"
                message="Report data not found."
                onRetry={handleGoHome}
              />
            )}
          </div>
        )}

        {/* VIEW 4: MY REPORTS ARCHIVE */}
        {viewMode === 'history' && (
          <ReportHistoryView
            isAuthenticated={!!user}
            onOpenReport={handleOpenPastReport}
            onBackToCatalog={handleGoHome}
            onRequireAuth={() => setIsAuthModalOpen(true)}
          />
        )}

        {/* Real-Time Agent Deliberation Modal */}
        <AgentExecutionModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false);
            if (currentReport) {
              setViewMode('report');
            }
          }}
          symbol={modalStock.symbol}
          companyName={modalStock.companyName}
          exchange={modalStock.exchange}
          agents={agentProgress}
          currentStage={currentStage}
          isComplete={isDeliberationComplete}
          error={reportError}
          dataSourceTier={streamTier || (dhanProActive ? 'DHAN_PRO_VERIFIED' : 'STANDARD_FREE_FALLBACK')}
        />

        {/* Authentication Modal */}
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => {
            setIsAuthModalOpen(false);
            setAuthPromptMessage(null);
          }}
          onAuthSuccess={handleAuthSuccess}
          actionPrompt={authPromptMessage}
        />
      </main>

      {/* Footer */}
      <footer className="no-print border-t border-white/10 bg-[#04060b] py-6 text-center text-xs text-slate-400 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="font-display font-medium text-slate-300">
            EquiAgentic Research Platform • Institutional Equity Intelligence &amp; Multi-Agent Consensus
          </p>
          <p className="font-mono text-[11px] text-slate-500">
            National Stock Exchange (NSE) &amp; Bombay Stock Exchange (BSE) Coverage
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
