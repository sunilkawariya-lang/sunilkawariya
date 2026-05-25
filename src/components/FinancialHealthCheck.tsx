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
  HeartPulse,
  FileText
} from 'lucide-react';
import { generateFinancialHealthPDF } from '../services/pdfService';
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
    text: "How many are Financially dependent on you?",
    recommendation: "Consider increasing your life and health insurance coverage to account for the higher number of dependents.",
    strength: "You have a manageable number of financial dependents, allowing for more flexible wealth planning.",
    options: [
      { label: "0", value: "a", score: 10 },
      { label: "1 – 3", value: "b", score: 7 },
      { label: "Over 3", value: "c", score: 4 }
    ]
  },
  {
    id: 2,
    text: "Is your life insurance cover atleast 10 times your annual income?",
    recommendation: "Secure a term life insurance policy with a sum assured of at least 10x your annual income to protect your family's future.",
    strength: "Your life insurance coverage is adequate, providing a strong safety net for your family.",
    options: [
      { label: "Yes", value: "a", score: 10 },
      { label: "No", value: "b", score: 0 }
    ]
  },
  {
    id: 3,
    text: "Do you have Health Insurance cover?",
    recommendation: "Ensure you have a personal health insurance policy of at least 5 Lakh (family floater) with a 50 Lakh super top-up cover for comprehensive protection.",
    strength: "You have comprehensive health insurance coverage, protecting you from significant medical expenses.",
    options: [
      { label: "I do not have Health Cover", value: "a", score: 0 },
      { label: "I have only employer-provided health insurance", value: "b", score: 5 },
      { label: "I have a personal health cover (less than 5L + 50L top-up)", value: "c", score: 7 },
      { label: "I have personal cover (min. 5L + 50L top-up) independent of employer", value: "d", score: 10 }
    ]
  },
  {
    id: 4,
    text: "How many months of your monthly expenses you have saved as emergency corpus?",
    recommendation: "Prioritize building an emergency fund covering at least 6 months of expenses in a liquid savings account.",
    strength: "You have a solid emergency fund, ensuring financial stability during unexpected situations.",
    options: [
      { label: "0", value: "a", score: 0 },
      { label: "1 – 3", value: "b", score: 4 },
      { label: "3 – 6", value: "c", score: 7 },
      { label: "6 – 12", value: "d", score: 10 }
    ]
  },
  {
    id: 5,
    text: "Do you have any personal loans or high-interest loans?",
    recommendation: "Create a debt repayment plan focusing on high-interest personal loans first to reduce your interest burden.",
    strength: "You are free from high-interest personal loans, which is excellent for long-term wealth creation.",
    options: [
      { label: "Yes", value: "a", score: 0 },
      { label: "No", value: "b", score: 10 }
    ]
  },
  {
    id: 6,
    text: "What % of your monthly net take home goes towards repayment of loans?",
    recommendation: "Aim to keep your total EMI outflow below 30% of your net income. Avoid taking new high-interest loans.",
    strength: "Your debt-to-income ratio is well-managed, leaving plenty of room for investments.",
    options: [
      { label: "0 – 20%", value: "a", score: 10 },
      { label: "20% - 40%", value: "b", score: 5 },
      { label: "Over 40%", value: "c", score: 0 }
    ]
  },
  {
    id: 7,
    text: "Have you determined the corpus requirement for your key financial goals?",
    recommendation: "Use our Goal Planner tool to calculate the exact corpus needed for your major life goals like retirement.",
    strength: "You have clearly defined your financial goals, which is the first step towards achieving them.",
    options: [
      { label: "Yes", value: "a", score: 10 },
      { label: "No", value: "b", score: 0 }
    ]
  },
  {
    id: 8,
    text: "What % of your net take home is being invested?",
    recommendation: "Aim to invest 30-40% of your net take-home pay. If you are at an early career stage without home loan EMIs, target a 50% investment rate.",
    strength: "You have a healthy investment rate, which will accelerate your journey towards financial independence.",
    options: [
      { label: "0 - 30%", value: "a", score: 4 },
      { label: "30 - 50%", value: "b", score: 7 },
      { label: "Over 50%", value: "c", score: 10 }
    ]
  },
  {
    id: 9,
    text: "Have you evaluated your returns on overall asset allocation?",
    recommendation: "Review your portfolio's mix of equity, debt, and gold to ensure it aligns with your risk profile and goals.",
    strength: "You regularly review your asset allocation, ensuring your portfolio stays aligned with your goals.",
    options: [
      { label: "Yes", value: "a", score: 10 },
      { label: "No", value: "b", score: 0 }
    ]
  },
  {
    id: 10,
    text: "Have you registered your WILL?",
    recommendation: "Draft and register a WILL to ensure smooth transfer of your assets to your loved ones and avoid legal disputes.",
    strength: "You have a registered WILL, ensuring a smooth and clear transition of your legacy.",
    options: [
      { label: "Yes", value: "a", score: 10 },
      { label: "No", value: "b", score: 0 }
    ]
  }
];

const FinancialHealthCheck: React.FC = () => {
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

  const getHealthStatus = (score: number) => {
    if (score >= 80) return { label: "Excellent", color: "text-emerald-600", bg: "bg-emerald-50", icon: Trophy, description: "Your financial foundation is rock solid. You're following global best practices in risk management, goal planning, and wealth creation." };
    if (score >= 60) return { label: "Good", color: "text-blue-600", bg: "bg-blue-50", icon: ShieldCheck, description: "You have a strong start, but there are specific areas where optimization can significantly improve your long-term wealth security." };
    if (score >= 40) return { label: "Fair", color: "text-amber-600", bg: "bg-amber-50", icon: Info, description: "Your financial health needs attention. Several key pillars like insurance or emergency funds might be under-provisioned." };
    return { label: "Critical", color: "text-rose-600", bg: "bg-rose-50", icon: AlertCircle, description: "Immediate action is required to secure your financial future. Focus on building an emergency fund and getting adequate insurance first." };
  };

  const status = getHealthStatus(totalScore);

  const reset = () => {
    setCurrentStep(0);
    setAnswers({});
    setShowResults(false);
    setIsDownloading(false);
  };

  const handleDownloadPDF = async () => {
    setIsDownloading(true);
    try {
      const doc = generateFinancialHealthPDF(totalScore, status, QUESTIONS, answers);
      doc.save(`Financial_Health_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-rose-50 rounded-xl text-rose-600">
          <HeartPulse size={24} />
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-900">Financial Health Check</h3>
          <p className="text-sm text-slate-500">Assess your financial resilience and roadmap</p>
        </div>
      </div>

      {!showResults ? (
        <div className="max-w-2xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-12">
            <div className="flex justify-between items-end mb-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Question {currentStep + 1} of {QUESTIONS.length}</span>
              <span className="text-sm font-bold text-rose-600">{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-rose-500"
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
                        ? 'border-rose-500 bg-rose-50 ring-4 ring-rose-50'
                        : 'border-slate-100 hover:border-rose-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className={`font-semibold ${
                      answers[QUESTIONS[currentStep].id] === option.value ? 'text-rose-700' : 'text-slate-700'
                    }`}>
                      {option.label}
                    </span>
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      answers[QUESTIONS[currentStep].id] === option.value
                        ? 'bg-rose-500 border-rose-500'
                        : 'border-slate-200 group-hover:border-rose-300'
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
                className="px-8 py-3 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-200 flex items-center gap-2"
              >
                View Results
                <Activity size={18} />
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(prev => Math.min(QUESTIONS.length - 1, prev + 1))}
                disabled={!answers[QUESTIONS[currentStep].id]}
                className="flex items-center gap-2 text-rose-600 hover:text-rose-700 disabled:opacity-30 transition-all font-bold text-sm"
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
            
            <h4 className="text-sm font-bold text-slate-400 uppercase tracking-[0.3em] mb-2">Financial Health Score</h4>
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
              title="Financial Health Scorecard"
              onDownload={handleDownloadCalculatorReport}
              inputs={Object.entries(answers).map(([id, val]) => {
                const q = QUESTIONS.find(q => q.id === parseInt(id));
                const opt = q?.options.find(o => o.value === val);
                return [q?.text || '', opt?.label || ''];
              })}
              results={[
                ['Health Score', `${totalScore}/100`],
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

export default FinancialHealthCheck;
