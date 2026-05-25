
import React, { useState, useEffect } from 'react';
import { X, Shield, AlertTriangle, Zap, Flame, CheckCircle2, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RiskProfile, RiskProfileType } from '../types';
import { useFirebase } from '../contexts/FirebaseContext';

interface RiskAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (profile: RiskProfile) => void;
}

const QUESTIONS = [
  {
    id: 1,
    question: "What is your primary investment goal?",
    options: [
      { text: "Capital Preservation (Protect my money)", score: 10 },
      { text: "Regular Income (Dividends/Interest)", score: 20 },
      { text: "Balanced Growth & Income", score: 30 },
      { text: "Long-term Capital Appreciation", score: 40 },
    ]
  },
  {
    id: 2,
    question: "How would you react if your portfolio dropped 20% in a month?",
    options: [
      { text: "Sell everything immediately", score: 5 },
      { text: "Sell some to protect remaining capital", score: 15 },
      { text: "Do nothing and wait for recovery", score: 30 },
      { text: "Buy more at lower prices", score: 50 },
    ]
  },
  {
    id: 3,
    question: "What is your investment time horizon?",
    options: [
      { text: "Less than 2 years", score: 5 },
      { text: "2 to 5 years", score: 15 },
      { text: "5 to 10 years", score: 30 },
      { text: "More than 10 years", score: 45 },
    ]
  }
];

const RiskAssessmentModal: React.FC<RiskAssessmentModalProps> = ({ isOpen, onClose, onSave }) => {
  const { portfolio } = useFirebase();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [isFinished, setIsFinished] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(portfolio.selectedMemberId === 'family' ? (portfolio.familyMembers[0]?.id || 'self') : portfolio.selectedMemberId);

  useEffect(() => {
    if (isOpen) {
      setSelectedMemberId(portfolio.selectedMemberId === 'family' ? (portfolio.familyMembers[0]?.id || 'self') : portfolio.selectedMemberId);
    }
  }, [isOpen, portfolio.selectedMemberId, portfolio.familyMembers]);

  const handleAnswer = (score: number) => {
    const newAnswers = [...answers, score];
    setAnswers(newAnswers);
    
    if (currentQuestion < QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setIsFinished(true);
    }
  };

  const calculateProfile = (): RiskProfile => {
    const totalScore = answers.reduce((a, b) => a + b, 0);
    const maxScore = QUESTIONS.reduce((acc, q) => acc + Math.max(...q.options.map(o => o.score)), 0);
    const percentage = (totalScore / maxScore) * 100;

    let type: RiskProfileType = 'Moderate';
    if (percentage < 25) type = 'Conservative';
    else if (percentage < 50) type = 'Moderate';
    else if (percentage < 75) type = 'Aggressive';
    else type = 'Very Aggressive';

    return {
      type,
      score: Math.round(percentage),
      lastAssessed: new Date().toISOString(),
      memberId: selectedMemberId
    };
  };

  const reset = () => {
    setCurrentQuestion(0);
    setAnswers([]);
    setIsFinished(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-lg text-slate-900">Risk Profile Assessment</h3>
          <button onClick={() => { onClose(); reset(); }} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8">
          {portfolio.selectedMemberId === 'family' && !isFinished && currentQuestion === 0 && (
            <div className="mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                <User size={16} className="text-slate-400" />
                Assessing Risk For
              </label>
              <select 
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                value={selectedMemberId}
                onChange={(e) => setSelectedMemberId(e.target.value)}
              >
                {portfolio.familyMembers.map(member => (
                  <option key={member.id} value={member.id}>{member.name} ({member.relationship})</option>
                ))}
              </select>
            </div>
          )}
          <AnimatePresence mode="wait">
            {!isFinished ? (
              <motion.div 
                key={currentQuestion}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Question {currentQuestion + 1} of {QUESTIONS.length}</span>
                  <div className="flex gap-1">
                    {QUESTIONS.map((_, i) => (
                      <div key={i} className={`h-1.5 w-8 rounded-full ${i <= currentQuestion ? 'bg-emerald-500' : 'bg-slate-100'}`} />
                    ))}
                  </div>
                </div>
                
                <h4 className="text-xl font-bold text-slate-900 leading-tight">
                  {QUESTIONS[currentQuestion].question}
                </h4>

                <div className="space-y-3">
                  {QUESTIONS[currentQuestion].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option.score)}
                      className="w-full p-4 text-left border border-slate-200 rounded-2xl hover:border-emerald-500 hover:bg-emerald-50 transition-all group"
                    >
                      <span className="text-sm font-medium text-slate-700 group-hover:text-emerald-700">{option.text}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle2 size={40} />
                </div>
                
                <div>
                  <h4 className="text-2xl font-bold text-slate-900">Assessment Complete!</h4>
                  <p className="text-slate-500">Based on your answers, we've determined your risk profile.</p>
                </div>

                <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    {calculateProfile().type === 'Conservative' && <Shield className="text-blue-500" />}
                    {calculateProfile().type === 'Moderate' && <Zap className="text-emerald-500" />}
                    {calculateProfile().type === 'Aggressive' && <AlertTriangle className="text-amber-500" />}
                    {calculateProfile().type === 'Very Aggressive' && <Flame className="text-rose-500" />}
                    <span className="text-2xl font-black text-slate-900 uppercase tracking-tight">
                      {calculateProfile().type}
                    </span>
                  </div>
                  <p className="text-sm text-slate-500">Risk Score: {calculateProfile().score}/100</p>
                </div>

                <div className="flex gap-3 pt-4">
                  <button 
                    onClick={reset}
                    className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Retake
                  </button>
                  <button 
                    onClick={() => { onSave(calculateProfile()); onClose(); reset(); }}
                    className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                  >
                    Save Profile
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

export default RiskAssessmentModal;
