import React from 'react';
import { Layers, MessageSquareDiff, ShieldCheck } from 'lucide-react';

export const FeatureGrid: React.FC = () => {
  const features = [
    {
      icon: Layers,
      title: 'Parallel Evidence Swarm',
      color: 'cyan',
      iconClass: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30 shadow-[0_0_15px_rgba(6,182,212,0.15)]',
      description:
        'Deterministic financial math, multi-year margin spreads, BSE corporate disclosures, and live price microstructure synthesized concurrently by 7 specialist analysts.'
    },
    {
      icon: MessageSquareDiff,
      title: 'Adversarial Bull vs Bear Arena',
      color: 'magenta',
      iconClass: 'text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.15)]',
      description:
        'Independent researchers build isolated thesis vectors with zero cross-contamination, then clash in an adversarial rebuttal round to identify critical swing factors.'
    },
    {
      icon: ShieldCheck,
      title: 'Risk-Audited Conviction',
      color: 'emerald',
      iconClass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]',
      description:
        'The Risk Analyst stress-tests tail-risk and debt solvency, enabling the Portfolio Manager to assign schema-enforced conviction (OVERWEIGHT / NEUTRAL / UNDERWEIGHT).'
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mb-16">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
          Multi-Perspective Deliberation Engine
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Single-analyst research creates dangerous blind spots. EquiAgentic deploys 13 specialized roles to stress-test every angle before capital deployment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-[#0c101c]/80 border border-white/10 p-6 flex flex-col justify-between hover:border-white/20 transition-all duration-300 shadow-xl shadow-black/40 hover:-translate-y-1 backdrop-blur-md"
            >
              <div>
                <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${f.iconClass}`}>
                  <Icon className="w-5 h-5 stroke-[1.75]" />
                </div>
                <h3 className="text-base font-bold text-white mb-2 font-display">{f.title}</h3>
                <p className="text-xs text-slate-300 leading-relaxed">{f.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
