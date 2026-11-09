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
      <div className="text-center mb-10">
        <h2 className="text-2xl sm:text-4xl font-normal text-[#0a0b0d] dark:text-white tracking-tight font-display">
          13-Point Institutional Research Framework
        </h2>
        <p className="mt-3 text-sm sm:text-base text-[#5b616e] dark:text-[#a8acb3] max-w-xl mx-auto leading-relaxed">
          Single-analyst research creates blind spots. EquiAgentic deploys 13 specialized analytical perspectives to stress-test every angle before capital deployment.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {features.map((f, idx) => {
          const Icon = f.icon;
          return (
            <div
              key={idx}
              className="cb-card cb-card-hover p-8 rounded-[24px] flex flex-col justify-between group transition-all duration-200"
            >
              <div>
                <div className="w-12 h-12 rounded-full flex items-center justify-center mb-6 text-[#0052ff] dark:text-white bg-[#f7f7f7] dark:bg-white/5 border border-[#dee1e6] dark:border-white/10 group-hover:bg-[#0052ff] group-hover:text-white group-hover:border-[#0052ff] transition-all duration-200 shadow-sm">
                  <Icon className="w-6 h-6 stroke-[1.75]" />
                </div>
                <h3 className="text-xl font-normal text-[#0a0b0d] dark:text-white mb-2.5 font-display tracking-tight">{f.title}</h3>
                <p className="text-sm font-normal text-[#5b616e] dark:text-[#a8acb3] leading-relaxed">{f.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
