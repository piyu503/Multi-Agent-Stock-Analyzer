import React from 'react';
import { Check, Loader2, Sparkles, X, ShieldAlert } from 'lucide-react';

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
  dataSourceTier
}) => {
  if (!isOpen) return null;

  const totalAgents = agents.length || 13;
  const completedCount = agents.filter((a) => a.status === 'completed').length;
  const progressPct = Math.round((completedCount / totalAgents) * 100);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#090d18] border border-white/15 rounded-3xl shadow-2xl shadow-fuchsia-950/40 overflow-hidden flex flex-col max-h-[88vh]">
        {/* Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between bg-[#060912]">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-500/20 to-purple-500/20 border border-fuchsia-500/40 flex items-center justify-center text-fuchsia-300 shadow-lg shadow-fuchsia-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-display">
                  Evaluating {symbol}
                </h3>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/10 text-cyan-300 border border-white/10">
                  {exchange}
                </span>
                {dataSourceTier === 'DHAN_PRO_VERIFIED' ? (
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    ⚡ DHAN PRO FEED
                  </span>
                ) : (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/5 text-slate-400 border border-white/10">
                    STANDARD FEED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300 font-medium truncate max-w-md mt-0.5">
                {companyName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-mono font-bold text-fuchsia-400">
                {completedCount} / {totalAgents} Roles Complete
              </div>
              <div className="text-xs text-slate-400 font-mono">Research Committee</div>
            </div>
            {isComplete && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar with glowing neon gradient */}
        <div className="w-full bg-[#050810] h-1.5">
          <div
            className="bg-gradient-to-r from-fuchsia-500 via-purple-500 to-cyan-400 h-1.5 transition-all duration-300 shadow-[0_0_12px_rgba(217,70,239,0.7)]"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Agent Step-by-Step List with Clean Ticks */}
        <div className="p-5 overflow-y-auto divide-y divide-white/5 space-y-1">
          {error && (
            <div className="p-4 mb-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2.5">
              <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {agents.map((agent) => {
            const isDone = agent.status === 'completed';
            const isRunning = agent.status === 'running';

            return (
              <React.Fragment key={agent.id}>
              <div
                className={`py-3 px-3.5 rounded-xl flex items-start justify-between gap-3 transition-all ${
                  isRunning
                    ? 'bg-fuchsia-500/10 border border-fuchsia-500/40 shadow-[0_0_15px_rgba(217,70,239,0.15)]'
                    : isDone
                    ? 'hover:bg-white/[0.02]'
                    : 'opacity-40'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 flex-shrink-0">
                    {isDone ? (
                      <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-300 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </div>
                    ) : isRunning ? (
                      <div className="w-5 h-5 rounded-full bg-fuchsia-500/20 border border-fuchsia-500/50 flex items-center justify-center text-fuchsia-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white font-display">
                        {agent.name}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono">
                        [{agent.role}]
                      </span>
                    </div>

                    {isDone && agent.summary && (
                      <p className="mt-1 text-xs text-slate-300 line-clamp-1 leading-relaxed">
                        {agent.summary}
                      </p>
                    )}

                    {isRunning && (
                      <p className="mt-1 text-xs text-fuchsia-300 font-medium animate-pulse flex items-center gap-1.5 font-mono">
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
                    <span className="text-slate-300 font-medium">
                      {agent.duration !== undefined && agent.duration > 0
                        ? `${Number(agent.duration).toFixed(1)}s`
                        : '0.8s'}
                    </span>
                  ) : isRunning ? (
                    <span className="text-fuchsia-400 font-bold tracking-wider">ACTIVE</span>
                  ) : (
                    <span className="text-slate-500">PENDING</span>
                  )}
                </div>
              </div>
              {agent.id === 'bear' && currentStage === 3 && (
                <div className="my-2 py-2 px-3 rounded-lg bg-gradient-to-r from-purple-500/10 via-fuchsia-500/15 to-purple-500/10 border border-fuchsia-500/30 flex items-center justify-between text-xs font-mono animate-pulse shadow-[0_0_12px_rgba(217,70,239,0.15)]">
                  <span className="text-fuchsia-300 font-semibold tracking-wide">
                    Adversarial Rebuttal in Progress: Bull and Bear researchers cross-examining opposing theses...
                  </span>
                  <span className="text-purple-300 font-bold px-2 py-0.5 rounded bg-purple-500/20 text-[10px] tracking-wider uppercase">
                    Debate Round
                  </span>
                </div>
              )}
              </React.Fragment>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 bg-[#060912] flex items-center justify-between">
          <div className="text-xs text-slate-300 font-mono">
            {isComplete ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <Check className="w-4 h-4 stroke-[2.5]" />
                All 13 Research Perspectives Completed Successfully
              </span>
            ) : (
              <span className="text-slate-400 font-medium">
                Processing multi-analyst research stages...
              </span>
            )}
          </div>

          {isComplete && (
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-fuchsia-600 via-purple-600 to-cyan-500 hover:from-fuchsia-500 hover:to-cyan-400 text-white text-xs font-bold transition-all shadow-lg shadow-fuchsia-950/50 cursor-pointer hover:scale-[1.02]"
            >
              Open Institutional Report →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
