import React from 'react';
import { Layers, MessageSquareDiff, ShieldCheck } from 'lucide-react';

export const FeatureGrid: React.FC = () => {
  const features = [
    {
      icon: Layers,
      title: 'Comprehensive Financial Evidence',
      description:
        'Deterministic financial ratios, multi-year margin trends, BSE corporate filings, and live price structure analyzed systematically by 7 specialist analysts.'
    },
    {
      icon: MessageSquareDiff,
      title: 'Bull vs. Bear Thesis Debate',
      description:
        'Independent analysts formulate upside and downside cases separately, then stress-test each thesis in a structured rebuttal round to uncover key swing factors.'
    },
    {
      icon: ShieldCheck,
      title: 'Risk-Audited Conviction',
      description:
        'The Risk Analyst stress-tests debt solvency and tail risks, enabling the Portfolio Manager to assign definitive conviction (OVERWEIGHT / NEUTRAL / UNDERWEIGHT).'
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto mb-16">
      <div className="text-center mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight font-display">
          13-Point Institutional Research Framework
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Single-analyst research creates blind spots. EquiAgentic deploys 13 specialized analytical perspectives to stress-test every angle before capital deployment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              className="rounded-2xl bg-[#0c101c]/80 border border-white/10 p-6 flex flex-col justify-between hover:border-fuchsia-500/40 transition-all duration-300 shadow-xl shadow-black/40 hover:-translate-y-1 backdrop-blur-md group"
            >
              <div>
                <div className="w-11 h-11 rounded-xl border flex items-center justify-center mb-4 text-fuchsia-400 bg-fuchsia-500/10 border-fuchsia-500/30 shadow-[0_0_15px_rgba(217,70,239,0.15)] group-hover:scale-105 transition-transform">
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
