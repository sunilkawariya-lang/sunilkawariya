import React, { useState } from 'react';
import { Sparkles, Loader2, ChevronDown, ChevronUp, Lightbulb } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCalculatorRecommendation } from '../services/geminiService';
import { toast } from 'sonner';

interface AIRecommendationProps {
  calculatorType: string;
  inputs: Record<string, any>;
  results: Record<string, any>;
  variant?: 'light' | 'dark';
}

const AIRecommendation: React.FC<AIRecommendationProps> = ({ 
  calculatorType, 
  inputs, 
  results,
  variant = 'light' 
}) => {
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const handleGetRecommendation = async () => {
    setIsLoading(true);
    try {
      const advice = await getCalculatorRecommendation(calculatorType, inputs, results);
      setRecommendation(advice);
      setIsExpanded(true);
    } catch (error) {
      console.error("AI Recommendation Error:", error);
      toast.error("Failed to generate AI analysis. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const bgStyle = variant === 'dark' 
    ? "bg-white/5 border border-white/10" 
    : "bg-indigo-50 border border-indigo-100";
  
  const textColor = variant === 'dark' ? "text-white" : "text-slate-900";
  const mutedColor = variant === 'dark' ? "text-white/60" : "text-slate-500";
  const iconBg = variant === 'dark' ? "bg-white/10 text-indigo-300" : "bg-white text-indigo-600";

  return (
    <div className={`mt-6 rounded-3xl overflow-hidden transition-all duration-300 ${bgStyle}`}>
      <div className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl shadow-sm ${iconBg}`}>
              <Sparkles size={18} />
            </div>
            <div>
              <h4 className={`text-sm font-bold ${textColor}`}>AI Perspective</h4>
              <p className={`text-[10px] uppercase tracking-widest font-bold ${mutedColor}`}>Personalized Insights</p>
            </div>
          </div>
          
          {!recommendation && !isLoading && (
            <button
              onClick={handleGetRecommendation}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-2"
            >
              Analyze with AI
            </button>
          )}

          {recommendation && (
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className={`p-2 rounded-lg hover:bg-black/5 transition-colors ${mutedColor}`}
            >
              {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            </button>
          )}
        </div>

        <AnimatePresence>
          {isLoading && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col items-center justify-center py-8 gap-3"
            >
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
              <p className={`text-xs font-medium animate-pulse ${mutedColor}`}>
                Architecting your custom strategy...
              </p>
            </motion.div>
          )}

          {recommendation && isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="prose prose-sm max-w-none prose-slate"
            >
              <div className={`text-sm leading-relaxed ${textColor} whitespace-pre-wrap`}>
                {recommendation}
              </div>
              <div className="mt-4 pt-4 border-t border-indigo-200/30 flex items-center gap-2">
                <span className={`text-[10px] font-bold uppercase tracking-tighter ${mutedColor}`}>
                  Disclaimer: This is AI-generated advice. Consult with a human advisor for critical decisions.
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AIRecommendation;
