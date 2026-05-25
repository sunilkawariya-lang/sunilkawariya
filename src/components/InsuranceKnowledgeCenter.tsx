
import React, { useState } from 'react';
import { 
  Shield, Info, AlertTriangle, Heart, Home, 
  Plane, Zap, CheckCircle2, ChevronRight, 
  HelpCircle, Sparkles, Activity, ShieldAlert,
  Stethoscope, Flame, Umbrella
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface KnowledgeItem {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  whyNeeded: string;
  keyFeatures: string[];
  whoShouldBuy: string;
  color: string;
}

const KNOWLEDGE_ITEMS: KnowledgeItem[] = [
  {
    id: 'accidental',
    title: 'Personal Accidental & Disability',
    icon: <ShieldAlert className="text-amber-500" />,
    description: 'Provides financial support in case of accidental death or permanent/partial disability. Unlike term insurance, it pays out for life-altering injuries.',
    whyNeeded: 'Accidents can lead to loss of income and high medical/rehabilitation costs. This cover ensures your lifestyle is maintained even if you cannot work.',
    keyFeatures: [
      'Accidental Death Benefit (100% Sum Assured)',
      'Permanent Total Disability (up to 150% payout)',
      'Partial Disability coverage',
      'Education fund for children',
      'Weekly income benefit during recovery'
    ],
    whoShouldBuy: 'Every earning individual, especially those who travel frequently or work in high-risk environments.',
    color: 'amber'
  },
  {
    id: 'critical',
    title: 'Critical Illness Cover',
    icon: <Stethoscope className="text-rose-500" />,
    description: 'A fixed-benefit plan that pays a lump sum upon diagnosis of a specified life-threatening illness (e.g., Cancer, Heart Attack, Stroke).',
    whyNeeded: 'Standard health insurance covers hospital bills. Critical illness cover provides funds for lifestyle changes, specialized treatment, and income loss during long recovery periods.',
    keyFeatures: [
      'Lump sum payout on diagnosis',
      'Covers 30+ major illnesses',
      'Tax benefits under Section 80D',
      'Survival period clause (usually 30 days)',
      'Can be a rider or a standalone policy'
    ],
    whoShouldBuy: 'Individuals with a family history of lifestyle diseases or those who are the primary breadwinners.',
    color: 'rose'
  },
  {
    id: 'home',
    title: 'Home & Fire Insurance',
    icon: <Home className="text-indigo-500" />,
    description: 'Protects your most valuable physical asset against natural calamities, fire, theft, and man-made disasters.',
    whyNeeded: 'A home is often a lifetime investment. Fire or structural damage can be financially devastating. This cover helps rebuild or repair without depleting savings.',
    keyFeatures: [
      'Structure cover (Fire, Earthquake, Floods)',
      'Content cover (Electronics, Jewelry, Furniture)',
      'Burglary and Theft protection',
      'Public liability cover',
      'Alternate accommodation expenses'
    ],
    whoShouldBuy: 'Homeowners and even tenants (for content insurance).',
    color: 'indigo'
  },
  {
    id: 'travel',
    title: 'Travel Insurance',
    icon: <Plane className="text-blue-500" />,
    description: 'Comprehensive protection for international and domestic trips, covering medical emergencies and travel-related inconveniences.',
    whyNeeded: 'Medical costs abroad can be 10x higher than in India. Flight cancellations or lost baggage can ruin a trip financially.',
    keyFeatures: [
      'Emergency Medical & Dental expenses',
      'Trip Cancellation or Curtailment',
      'Loss of Passport and Baggage',
      'Personal Liability abroad',
      'Hijack distress allowance'
    ],
    whoShouldBuy: 'Anyone traveling abroad (often mandatory for visas) or frequent domestic travelers.',
    color: 'blue'
  },
  {
    id: 'riders',
    title: 'Essential Policy Riders',
    icon: <Umbrella className="text-emerald-500" />,
    description: 'Add-on covers that enhance your base policy (Term or Health) for a small additional premium.',
    whyNeeded: 'Riders allow you to customize a generic policy to your specific life situation without buying multiple standalone plans.',
    keyFeatures: [
      'Waiver of Premium: Policy continues if you become disabled',
      'Accidental Death Benefit: Extra payout for accidents',
      'Hospital Cash: Daily allowance during hospitalization',
      'Restoration Benefit: Refills health cover if exhausted',
      'OPD Cover: For doctor visits and pharmacy bills'
    ],
    whoShouldBuy: 'Anyone looking to plug specific gaps in their primary insurance at a lower cost.',
    color: 'emerald'
  }
];

const InsuranceKnowledgeCenter: React.FC = () => {
  const [activeId, setActiveId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-indigo-50 rounded-xl">
          <Sparkles className="text-indigo-600" size={20} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Protection Knowledge Center</h3>
          <p className="text-sm text-slate-500">Master the art of risk management with our expert guides.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {KNOWLEDGE_ITEMS.map((item) => (
          <motion.div
            key={item.id}
            layout
            onClick={() => setActiveId(activeId === item.id ? null : item.id)}
            className={`bg-white rounded-3xl border transition-all cursor-pointer overflow-hidden flex flex-col ${
              activeId === item.id 
                ? 'border-indigo-500 ring-4 ring-indigo-500/5 shadow-xl md:col-span-2 lg:col-span-2' 
                : 'border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300'
            }`}
          >
            <div className="p-6 flex-1">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-${item.color}-50`}>
                  {item.icon}
                </div>
                <ChevronRight 
                  size={20} 
                  className={`text-slate-300 transition-transform ${activeId === item.id ? 'rotate-90' : ''}`} 
                />
              </div>

              <h4 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h4>
              <p className={`text-sm text-slate-500 leading-relaxed ${activeId === item.id ? '' : 'line-clamp-2'}`}>
                {item.description}
              </p>

              <AnimatePresence>
                {activeId === item.id && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-6 pt-6 border-t border-slate-100 space-y-6"
                  >
                    <div className="space-y-2">
                      <h5 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <HelpCircle size={14} className="text-indigo-500" />
                        Why is this needed?
                      </h5>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        {item.whyNeeded}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <h5 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                        <Zap size={14} className="text-amber-500" />
                        Key Features & Benefits
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {item.keyFeatures.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-2 text-xs text-slate-600">
                            <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className={`p-4 rounded-2xl bg-${item.color}-50 border border-${item.color}-100`}>
                      <h5 className={`text-xs font-bold text-${item.color}-900 uppercase tracking-widest mb-1`}>
                        Who should consider this?
                      </h5>
                      <p className={`text-xs text-${item.color}-700 font-medium`}>
                        {item.whoShouldBuy}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            {!activeId && (
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Learn More</span>
                <ArrowRight size={14} className="text-slate-400" />
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Pro Tip Banner */}
      <div className="bg-indigo-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-32 -mt-32" />
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="p-4 bg-indigo-800 rounded-2xl">
            <Sparkles size={32} className="text-wealth-gold" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="text-xl font-bold mb-1">Expert Strategy: The Protection Pyramid</h4>
            <p className="text-indigo-100/80 text-sm">
              Always build your foundation with <strong>Term Life</strong> and <strong>Comprehensive Health</strong> insurance first. Add Personal Accident and Critical Illness as the next layer, followed by asset protection like Home Insurance.
            </p>
          </div>
          <button className="px-6 py-3 bg-wealth-gold text-wealth-navy font-bold rounded-xl hover:scale-105 transition-all shadow-lg shadow-wealth-gold/20">
            Talk to Advisor
          </button>
        </div>
      </div>
    </div>
  );
};

const ArrowRight = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export default InsuranceKnowledgeCenter;
