import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Target, ShieldCheck, Calculator, TrendingUp, X, ChevronRight } from 'lucide-react';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCompleteProfile: () => void;
  userName?: string;
}

export default function WelcomeModal({ isOpen, onClose, onCompleteProfile, userName }: WelcomeModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white rounded-[40px] shadow-2xl max-w-2xl w-full overflow-hidden relative"
          >
            {/* Close Button */}
            <button 
              onClick={onClose}
              className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors z-10"
            >
              <X size={24} className="text-slate-400" />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              {/* Left Side: Visual/Branding */}
              <div className="bg-indigo-600 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                <div className="relative z-10">
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mb-8">
                    <Sparkles size={32} className="text-white" />
                  </div>
                  <h2 className="text-4xl font-black leading-tight mb-4">Welcome, {userName || 'Investor'}</h2>
                  <p className="text-indigo-100 text-lg">Here's update for your investment journey</p>
                </div>
                
                {/* Decorative Circles */}
                <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-400/20 rounded-full blur-3xl"></div>
              </div>

              {/* Right Side: Features & Action */}
              <div className="p-12 space-y-8">
                <div className="space-y-6">
                  <h3 className="text-xl font-bold text-slate-900">Core Features</h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                        <TrendingUp size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Portfolio Tracking</p>
                        <p className="text-xs text-slate-500">Real-time tracking of all your investments in one place.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                        <Target size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Goal Planning</p>
                        <p className="text-xs text-slate-500">Define and track your financial milestones with precision.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
                        <Sparkles size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">AI Financial Advisor</p>
                        <p className="text-xs text-slate-500">Get personalized insights and recommendations from RH AI.</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                        <Calculator size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 text-sm">Financial Calculators</p>
                        <p className="text-xs text-slate-500">Powerful tools for EPF, NPS, PPF, and more.</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-4 space-y-4">
                  <button
                    onClick={onCompleteProfile}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2 group"
                  >
                    Complete Profile Setup
                    <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full py-2 text-slate-400 text-sm font-medium hover:text-slate-600 transition-colors"
                  >
                    I'll do it later
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
