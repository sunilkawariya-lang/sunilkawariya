import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, 
  ChevronRight, 
  ChevronLeft, 
  CheckCircle2, 
  AlertCircle, 
  Info,
  RefreshCw,
  Trophy,
  ShieldCheck,
  Target,
  FileText,
  Clock
} from 'lucide-react';
import { generateRetirementReadinessPDF } from '../services/pdfService';
import ExportButtons from './ExportButtons';
import { handleDownloadCalculatorReport } from '../utils/exportUtils';

interface Question {
  id: number;
  text: string;
  recommendation: string;
  strength: string;
  options: {
    label: string;
    value: string;
    score: number;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Have you calculated your required retirement corpus considering inflation?",
    recommendation: "Use a retirement calculator to estimate your future expenses considering at least 6% inflation to determine your target corpus.",
    strength: "You have a clear target for your retirement corpus, which is essential for focused planning.",
    options: [
      { label: "Yes, I have a clear target", value: "a", score: 10 },
      { label: "I have a rough idea", value: "b", score: 5 },
      { label: "No, I haven't calculated it yet", value: "c", score: 0 }
    ]
  },
  {
    id: 2,
    text: "What percentage of your current income are you saving specifically for retirement?",
    recommendation: "Aim to save at least 15-20% of your monthly income specifically for retirement to ensure a comfortable post-work life.",
    strength: "Your retirement savings rate is excellent, building a strong foundation for your future.",
    options: [
      { label: "Over 20%", value: "a", score: 10 },
      { label: "10% - 20%", value: "b", score: 7 },
      { label: "Less than 10%", value: "c", score: 4 },
      { label: "None at the moment", value: "d", score: 0 }
    ]
  },
  {
    id: 3,
    text: "Do you have a diversified retirement portfolio (Equity, Debt, Gold, etc.)?",
    recommendation: "Diversify your retirement assets across different classes. Equity is crucial for growth, while debt provides stability.",
    strength: "Your retirement portfolio is well-diversified, reducing risk and improving long-term stability.",
    options: [
      { label: "Yes, well-diversified", value: "a", score: 10 },
      { label: "Mostly in one asset (e.g., only Real Estate or FD)", value: "b", score: 5 },
      { label: "No diversification", value: "c", score: 0 }
    ]
  },
  {
    id: 4,
    text: "Are you contributing to mandatory retirement schemes like EPF or NPS?",
    recommendation: "Maximize your contributions to EPF and NPS as they provide tax benefits and a disciplined way to build a retirement corpus.",
    strength: "You are actively contributing to mandatory retirement schemes, ensuring disciplined corpus building.",
    options: [
      { label: "Yes, contributing to both", value: "a", score: 10 },
      { label: "Contributing to only one", value: "b", score: 7 },
      { label: "No, not contributing to any", value: "c", score: 0 }
    ]
  },
  {
    id: 5,
    text: "Do you have a separate health insurance policy for your post-retirement years?",
    recommendation: "Get a personal health insurance policy early. Employer-provided insurance usually ends with retirement, leaving you vulnerable when you need it most.",
    strength: "You have a personal health insurance policy, protecting your retirement savings from medical inflation.",
    options: [
      { label: "Yes, adequate personal cover", value: "a", score: 10 },
      { label: "Only employer-provided cover", value: "b", score: 4 },
      { label: "No health insurance", value: "c", score: 0 }
    ]
  },
  {
    id: 6,
    text: "Will you be debt-free (Home loan, personal loan) before you retire?",
    recommendation: "Prioritize clearing all high-interest debts and home loans at least 2-3 years before your planned retirement date.",
    strength: "You are on track to be debt-free by retirement, which will significantly reduce your post-retirement expenses.",
    options: [
      { label: "Yes, definitely", value: "a", score: 10 },
      { label: "Likely, but not certain", value: "b", score: 6 },
      { label: "No, I will have significant debt", value: "c", score: 0 }
    ]
  },
  {
    id: 7,
    text: "Have you accounted for increasing healthcare costs in your retirement planning?",
    recommendation: "Medical inflation is typically higher than general inflation. Factor in a separate medical buffer in your retirement corpus.",
    strength: "You have factored in healthcare costs, ensuring your retirement plan is realistic and robust.",
    options: [
      { label: "Yes, factored in", value: "a", score: 10 },
      { label: "No, haven't considered it", value: "b", score: 0 }
    ]
  },
  {
    id: 8,
    text: "Do you have an emergency fund that can cover at least 1-2 years of expenses post-retirement?",
    recommendation: "A larger emergency fund is needed post-retirement to manage market volatility and unexpected medical emergencies without touching your core corpus.",
    strength: "You have a solid emergency fund for retirement, providing a crucial safety net.",
    options: [
      { label: "Yes, fully funded", value: "a", score: 10 },
      { label: "Partially funded", value: "b", score: 5 },
      { label: "No emergency fund", value: "c", score: 0 }
    ]
  },
  {
    id: 9,
    text: "Have you discussed your retirement lifestyle and financial plan with your spouse/family?",
    recommendation: "Ensure your spouse and family are aligned with your retirement goals and understand the financial roadmap to avoid future conflicts.",
    strength: "You have a shared retirement plan with your family, ensuring emotional and financial alignment.",
    options: [
      { label: "Yes, we have a shared plan", value: "a", score: 10 },
      { label: "Partially discussed", value: "b", score: 5 },
      { label: "No discussion yet", value: "c", score: 0 }
    ]
  },
  {
    id: 10,
    text: "Do you have a secondary source of income planned for retirement (Rent, Dividends)?",
    recommendation: "Building passive income streams like rental income or dividend-paying stocks can provide a safety net beyond your retirement corpus.",
    strength: "You have secondary income sources planned, which will provide additional security during retirement.",
    options: [
      { label: "Yes, multiple sources", value: "a", score: 10 },
      { label: "One source planned", value: "b", score: 7 },
      { label: "No secondary income planned", value: "c", score: 0 }
    ]
  }
];

const RetirementReadinessCheck: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResults, setShowResults] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const totalScore = useMemo(() => {
    return Object.entries(answers).reduce((sum, [qId, optionValue]) => {
      const question = QUESTIONS.find(q => q.id === Number(qId));
      const option = question?.options.find(o => o.value === optionValue);
      return sum + (option?.score || 0);
    }, 0);
  }, [answers]);

  const progress = ((currentStep + 1) / QUESTIONS.length) * 100;

  const handleOptionSelect = (qId: number, value: string) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
    if (currentStep < QUESTIONS.length - 1) {
      setTimeout(() => setCurrentStep(prev => prev + 1), 300);
    }
  };

  const getReadinessStatus = (score: number) => {
    if (score >= 80) return { label: "Ready", color: "text-emerald-600", bg: "bg-emerald-50", icon: Trophy, description: "Excellent! You are well-prepared for retirement. Your financial planning and discipline are on the right track for a comfortable life." };
    if (score >= 60) return { label: "On Track", color: "text-blue-600", bg: "bg-blue-50", icon: ShieldCheck, description: "You're doing well, but there's room for improvement. A few adjustments in your savings or insurance could make your retirement even more secure." };
    if (score >= 40) return { label: "Needs Work", color: "text-amber-600", bg: "bg-amber-50", icon: Info, description: "You have a foundation, but significant gaps exist. You need to increase your retirement savings and address debt or insurance issues." };
    return { label: "Not Ready", color: "text-rose-600", bg: "bg-rose-50", icon: AlertCircle, description: "Immediate action is required. Your current planning is insufficient for retirement. Focus on aggressive saving and debt reduction immediately." };
  };

  const status = getReadinessStatus(totalScore);

  const reset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
    setIsDownloading(false);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const doc = generateRetirementReadinessPDF(totalScore, status, QUESTIONS, answers);
      doc.save(`Retirement_Readiness_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-amber-50 rounded-xl text-amber-600">
          <Clock size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Retirement Readiness Score</h3>
          <p className="text-sm text-slate-500">Evaluate how prepared you are for your golden years</p>
        </div>
      </div>

      {!showResults ? (
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {currentStep + 1} of {QUESTIONS.length}</span>
              <span className="text-sm font-bold text-amber-600">{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-amber-500"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <h4 className="text-2xl font-bold text-slate-900 leading-tight">
                {QUESTIONS[currentStep].text}
              </h4>

              <div className="grid grid-cols-1 gap-4">
                {QUESTIONS[currentStep].options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => handleOptionSelect(QUESTIONS[currentStep].id, option.value)}
                    className={`group flex items-center justify-between p-5 rounded-2xl border-2 transition-all text-left ${
                      answers[QUESTIONS[currentStep].id] === option.value
                        ? 'border-amber-500 bg-amber-50 ring-4 ring-amber-50'
                        : 'border-slate-100 hover:border-amber-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`font-semibold ${
                      answers[QUESTIONS[currentStep].id] === option.value ? 'text-amber-700' : 'text-slate-700'
                    }`}>
                      {option.label}
                    </span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      answers[QUESTIONS[currentStep].id] === option.value
                        ? 'bg-amber-500 border-amber-500'
                        : 'border-slate-200 group-hover:border-amber-300'
                    }`}>
                      {answers[QUESTIONS[currentStep].id] === option.value && <CheckCircle2 size={14} className="text-white" />}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-12 flex items-center justify-between pt-8 border-t border-slate-100">
            <button
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
              className="flex items-center gap-2 text-slate-400 hover:text-slate-600 disabled:opacity-0 transition-all font-bold text-sm"
            >
              <ChevronLeft size={18} />
              Previous
            </button>
            
            {Object.keys(answers).length === QUESTIONS.length ? (
              <button
                onClick={() => setShowResults(true)}
                className="px-8 py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-all shadow-lg shadow-amber-200 flex items-center gap-2"
              >
                View Results
                <Activity size={18} />
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(prev => Math.min(QUESTIONS.length - 1, prev + 1))}
                disabled={!answers[QUESTIONS[currentStep].id]}
                className="flex items-center gap-2 text-amber-600 hover:text-amber-700 disabled:opacity-30 transition-all font-bold text-sm"
              >
                Next
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto space-y-8"
        >
          <div className={`${status.bg} rounded-[2.5rem] p-12 text-center border border-white shadow-xl relative overflow-hidden`}>
            {/* Decorative background */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/20 rounded-full blur-3xl -mr-32 -mt-32" />
            
            <div className={`w-24 h-24 ${status.bg} border-4 border-white rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl`}>
              <status.icon size={48} className={status.color} />
            </div>
            
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Retirement Readiness Score</h4>
            <div className="flex items-baseline justify-center gap-2 mb-4">
              <span className={`text-7xl font-black ${status.color}`}>{totalScore}</span>
              <span className="text-2xl font-bold text-slate-400">/ 100</span>
            </div>
            
            <div className={`inline-flex items-center gap-2 px-6 py-2 rounded-full ${status.bg} border border-white shadow-sm mb-6`}>
              <div className={`w-2 h-2 rounded-full animate-pulse ${status.color.replace('text', 'bg')}`} />
              <span className={`font-bold uppercase tracking-widest text-xs ${status.color}`}>{status.label} Status</span>
            </div>
            
            <p className="text-slate-600 max-w-lg mx-auto leading-relaxed">
              {status.description}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h5 className="font-bold text-slate-900 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" />
                Strengths
              </h5>
              <ul className="space-y-3">
                {QUESTIONS.map(q => {
                  const answer = answers[q.id];
                  const option = q.options.find(o => o.value === answer);
                  if (option && option.score >= 7) {
                    return (
                      <li key={q.id} className="text-sm text-slate-600 flex gap-3">
                        <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full mt-1.5 shrink-0" />
                        {q.strength}
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <h5 className="font-bold text-slate-900 flex items-center gap-2">
                <AlertCircle size={18} className="text-rose-500" />
                Recommendations for Improvement
              </h5>
              <ul className="space-y-3">
                {QUESTIONS.map(q => {
                  const answer = answers[q.id];
                  const option = q.options.find(o => o.value === answer);
                  if (option && option.score < 7) {
                    return (
                      <li key={q.id} className="text-sm text-slate-600 flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <div className="w-1.5 h-1.5 bg-rose-400 rounded-full shrink-0" />
                          <span className="font-bold text-slate-800">{q.text}</span>
                        </div>
                        <p className="pl-4.5 text-xs text-slate-500 italic">{q.recommendation}</p>
                      </li>
                    );
                  }
                  return null;
                })}
              </ul>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8">
            <ExportButtons 
              title="Retirement Readiness Scorecard"
              onDownload={handleDownloadCalculatorReport}
              inputs={Object.entries(answers).map(([id, val]) => {
                const q = QUESTIONS.find(q => q.id === parseInt(id));
                const opt = q?.options.find(o => o.value === val);
                return [q?.text || '', opt?.label || ''];
              })}
              results={[
                ['Readiness Score', `${totalScore}/100`],
                ['Financial Standing', totalScore >= 80 ? 'Excellent' : totalScore >= 60 ? 'Good' : totalScore >= 40 ? 'Average' : 'Needs Attention']
              ]}
            />
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl"
            >
              <RefreshCw size={20} />
              Retake Assessment
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RetirementReadinessCheck;
