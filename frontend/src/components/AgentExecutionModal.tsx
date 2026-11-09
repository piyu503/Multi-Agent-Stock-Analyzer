import React from 'react';
import { Check, Loader2, X, ShieldAlert } from 'lucide-react';
import logoImg from '../assets/logo.png';

export interface AgentProgressItem {
  id: string;
  role: string;
  name: string;
  stage: number;
  status: 'pending' | 'running' | 'completed';
  summary?: string;
  duration?: number;
}

interface AgentExecutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
  companyName: string;
  exchange: string;
  agents: AgentProgressItem[];
  currentStage: number;
  isComplete: boolean;
  error?: string | null;
  dataSourceTier?: string;
  feedNotice?: string | null;
  isQuotaExhausted?: boolean;
}

export const AgentExecutionModal: React.FC<AgentExecutionModalProps> = ({
  isOpen,
  onClose,
  symbol,
  companyName,
  exchange,
  agents,
  currentStage,
  isComplete,
  error,
  dataSourceTier,
  feedNotice,
  isQuotaExhausted
}) => {
  if (!isOpen) return null;

  const totalAgents = agents.length || 13;
  const completedCount = agents.filter((a) => a.status === 'completed').length;
  const progressPct = Math.round((completedCount / totalAgents) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl sm:max-w-3xl bg-white dark:bg-[#16181c] border border-[#dee1e6] dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[88vh] transition-colors duration-200">
        {/* Header - Coinbase Calm Editorial */}
        <div className="px-6 py-5 border-b border-[#dee1e6] dark:border-white/10 flex items-center justify-between bg-[#f7f7f7] dark:bg-[#0a0b0d]">
          <div className="flex items-center gap-3.5">
            <img
              src={logoImg}
              alt="Logo"
              className="w-10 h-10 rounded-xl object-contain bg-white dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 p-1 shrink-0 shadow-sm"
            />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-[#0a0b0d] dark:text-white font-display">
                  Evaluating {symbol}
                </h3>
                <span className="text-xs font-mono font-semibold px-2.5 py-0.5 rounded-full bg-[#0052ff]/10 text-[#0052ff] border border-[#0052ff]/20">
                  {exchange}
                </span>
                {dataSourceTier === 'DHAN_PRO_VERIFIED' ? (
                  <span className="text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full bg-[#0052ff]/10 text-[#0052ff] border border-[#0052ff]/20 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0052ff] animate-pulse" />
                    DHAN PRO FEED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#eef0f3] dark:bg-white/5 text-[#7c828a] border border-[#dee1e6] dark:border-white/5">
                    STANDARD FEED
                  </span>
                )}
              </div>
              <p className="text-xs text-[#5b616e] dark:text-[#a8acb3] font-medium truncate max-w-md mt-0.5">
                {companyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-mono font-bold text-[#0052ff]">
                {completedCount} / {totalAgents} Roles Complete
              </div>
              <div className="text-xs text-[#7c828a] font-mono">Research Committee</div>
            </div>
            {isComplete && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-full text-[#7c828a] hover:text-[#0a0b0d] dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar - Coinbase Blue */}
        <div className="w-full bg-[#eef0f3] dark:bg-white/5 h-1.5">
          <div
            className="bg-[#0052ff] h-1.5 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Agent Step-by-Step List */}
        <div className="p-5 overflow-y-auto divide-y divide-[#dee1e6] dark:divide-white/5 space-y-1">
          {feedNotice && (
            <div className="p-3.5 mb-3 rounded-2xl bg-[#f4b000]/10 border border-[#f4b000]/25 text-[#f4b000] text-xs font-medium flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#f4b000]" />
                <span>{feedNotice}</span>
              </div>
              <span className="text-[10px] uppercase font-mono px-2.5 py-0.5 rounded-full bg-[#f4b000]/20 font-bold">
                Standard Feed
              </span>
            </div>
          )}

          {isQuotaExhausted && (
            <div className="p-4 mb-3 rounded-2xl bg-[#cf202f]/10 border border-[#cf202f]/30 text-[#cf202f] text-xs font-medium space-y-2">
              <div className="flex items-center gap-2 font-semibold text-sm">
                <ShieldAlert className="w-4 h-4 shrink-0" />
                <span>Cloud model request limit reached</span>
              </div>
              <p className="text-[#5b616e] dark:text-[#a8acb3] leading-relaxed">
                The Gemini free tier request or token limit has been reached. Please wait 45-60 seconds before triggering the next report, or check your backend API key.
              </p>
              <div className="pt-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-full bg-[#cf202f]/15 hover:bg-[#cf202f]/25 text-[#cf202f] font-semibold text-xs transition cursor-pointer"
                >
                  Close &amp; Retry in 60s
                </button>
              </div>
            </div>
          )}

          {error && !isQuotaExhausted && (
            <div className="p-4 mb-3 rounded-2xl bg-[#cf202f]/10 border border-[#cf202f]/30 text-[#cf202f] text-xs font-medium flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {agents.map((agent) => {
            const isDone = agent.status === 'completed';
            const isRunning = agent.status === 'running';

            return (
              <React.Fragment key={agent.id}>
                <div
                  className={`py-3 px-3.5 rounded-2xl flex items-start justify-between gap-3 transition-colors duration-150 ${
                    isRunning
                      ? 'bg-[#0052ff]/5 border border-[#0052ff]/30 shadow-sm'
                      : isDone
                      ? 'hover:bg-[#f7f7f7] dark:hover:bg-white/[0.02]'
                      : 'opacity-40'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 flex-shrink-0">
                      {isDone ? (
                        <div className="w-5 h-5 rounded-full bg-[#05b169]/15 border border-[#05b169]/30 flex items-center justify-center text-[#05b169]">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : isRunning ? (
                        <div className="w-5 h-5 rounded-full bg-[#0052ff]/15 border border-[#0052ff]/30 flex items-center justify-center text-[#0052ff]">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full bg-[#eef0f3] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 flex items-center justify-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#7c828a]"></span>
                        </div>
                      )}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#0a0b0d] dark:text-white font-display">
                          {agent.name}
                        </span>
                        <span className="text-xs text-[#7c828a] font-mono">
                          [{agent.role}]
                        </span>
                      </div>

                      {isDone && agent.summary && (
                        <p className="mt-1 text-xs sm:text-sm text-[#5b616e] dark:text-[#a8acb3] line-clamp-1 leading-relaxed">
                          {agent.summary}
                        </p>
                      )}

                      {isRunning && (
                        <p className="mt-1 text-xs sm:text-sm text-[#0052ff] font-medium animate-pulse flex items-center gap-1.5 font-mono">
                          <span>
                            {currentStage === 3 && (agent.id === 'bull' || agent.id === 'bear')
                              ? 'Cross-examining opposing thesis in rebuttal round...'
                              : 'Evaluating financial metrics and filing data...'}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right flex-shrink-0 font-mono text-xs">
                    {isDone ? (
                      <span className="text-[#05b169] font-medium">
                        {agent.duration !== undefined && agent.duration > 0
                          ? `${Number(agent.duration).toFixed(1)}s`
                          : '0.8s'}
                      </span>
                    ) : isRunning ? (
                      <span className="text-[#0052ff] font-bold tracking-wider">ACTIVE</span>
                    ) : (
                      <span className="text-[#7c828a]">PENDING</span>
                    )}
                  </div>
                </div>

                {agent.id === 'bear' && currentStage === 3 && (
                  <div className="my-2 py-2 px-3.5 rounded-full bg-[#0052ff]/10 border border-[#0052ff]/20 flex items-center justify-between text-xs font-mono animate-pulse shadow-sm">
                    <span className="text-[#0052ff] font-semibold tracking-wide">
                      Adversarial Rebuttal in Progress: Bull and Bear researchers cross-examining opposing theses...
                    </span>
                    <span className="text-[#0052ff] font-bold px-2 py-0.5 rounded-full bg-[#0052ff]/20 text-[10px] tracking-wider uppercase">
                      Debate Round
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-4 border-t border-[#dee1e6] dark:border-white/10 bg-[#f7f7f7] dark:bg-[#0a0b0d] flex items-center justify-between gap-3 sm:gap-4">
          <div className="text-xs sm:text-sm text-[#5b616e] dark:text-[#a8acb3] font-mono whitespace-nowrap">
            {isComplete ? (
              <span className="text-[#05b169] font-semibold flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[2.5] shrink-0 text-[#05b169]" />
                <span>All 13 Research Perspectives Completed</span>
              </span>
            ) : (
              <span>Processing multi-analyst research stages...</span>
            )}
          </div>

          {isComplete && (
            <button
              type="button"
              onClick={onClose}
              className="cb-pill-btn-primary shrink-0 whitespace-nowrap inline-flex items-center gap-1.5 px-5 py-2.5 text-xs sm:text-sm font-semibold shadow-sm cursor-pointer"
            >
              <span>Open Institutional Report</span>
              <span>&rarr;</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
