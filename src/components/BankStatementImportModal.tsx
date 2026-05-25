import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Sparkles,
  Clipboard,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { useFirebase } from '../contexts/FirebaseContext';
import { BankTransaction, BankAccount } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { formatCurrency } from '../constants';
import { isCooldownActive, setCooldown, isQuotaExceededError, isMonthlyCapError, callAIWithRetry, setBypassNextCooldown } from '../lib/quotaManager';
import { handleError, ErrorType, safeParse } from '../lib/errorHandler';

interface BankStatementImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankAccounts: BankAccount[];
}

export default function BankStatementImportModal({ isOpen, onClose, bankAccounts }: BankStatementImportModalProps) {
  const { addBankTransaction } = useFirebase();
  const [importMethod, setImportMethod] = useState<'text' | 'file'>('text');
  const [inputText, setInputText] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(bankAccounts[0]?.id || '');
  const [isParsing, setIsParsing] = useState(false);
  const [parsedTransactions, setParsedTransactions] = useState<Partial<BankTransaction>[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'input' | 'preview' | 'success'>('input');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleParse = async (force = false) => {
    if (!inputText.trim()) {
      setError('Please provide some text to parse.');
      return;
    }

    if (force) {
      setBypassNextCooldown();
    }

    setIsParsing(true);
    setError(null);

    if (isCooldownActive()) {
      setError('AI Analysis is currently in cooldown due to rate limits. Would you like to force retry?');
      setIsParsing(false);
      return;
    }

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await callAIWithRetry(() => ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Extract bank transactions from the following text. 
        Return a JSON array of objects with fields: date (YYYY-MM-DD), description, amount (number), type ('Credit' | 'Debit'), category (e.g., Food, Rent, Salary, Shopping, Utilities, etc.).
        
        Text:
        ${inputText}`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                date: { type: Type.STRING },
                description: { type: Type.STRING },
                amount: { type: Type.NUMBER },
                type: { type: Type.STRING, enum: ['Credit', 'Debit'] },
                category: { type: Type.STRING }
              },
              required: ['date', 'description', 'amount', 'type', 'category']
            }
          }
        }
      }));

      const result = safeParse(response.text, []);
      setParsedTransactions(result);
      setStep('preview');
    } catch (err: any) {
      if (isQuotaExceededError(err)) {
        setCooldown(isMonthlyCapError(err));
      }
      handleError(err, { type: ErrorType.API, title: 'Parsing Error', silent: true });
      setError('Failed to parse the text. Please try again or use a clearer format.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    try {
      await Promise.all(parsedTransactions.map(tx => 
        addBankTransaction({
          ...tx,
          bankAccountId: selectedAccountId,
          id: Math.random().toString(36).substr(2, 9)
        })
      ));
      setStep('success');
    } catch (err) {
      setError('Failed to import transactions. Please try again.');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
      setImportMethod('text'); // Switch to text mode to show the content
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">Import Transactions</h3>
              <p className="text-sm text-gray-500">AI-powered statement parsing</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {step === 'input' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Select Bank Account</label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 border-none rounded-lg focus:ring-2 focus:ring-indigo-500"
                >
                  {bankAccounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.bankName} (**** {acc.lastFourDigits})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4 p-1 bg-gray-50 rounded-lg w-fit">
                  <button
                    onClick={() => setImportMethod('text')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      importMethod === 'text' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Paste Text
                  </button>
                  <button
                    onClick={() => setImportMethod('file')}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      importMethod === 'file' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    Upload File
                  </button>
                </div>

                {importMethod === 'text' ? (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Paste Statement Text</label>
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Paste text from your bank email, SMS, or copy-pasted statement here..."
                      className="w-full h-48 px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                    />
                  </div>
                ) : (
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-gray-200 rounded-2xl p-12 text-center hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload}
                      className="hidden" 
                      accept=".csv,.txt,.xlsx"
                    />
                    <Upload className="w-10 h-10 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Click to upload or drag and drop</p>
                    <p className="text-sm text-gray-400 mt-1">Supports CSV, TXT, or Excel files</p>
                  </div>
                )}
              </div>

              {error && (
                <div className="flex flex-col gap-2 p-3 bg-rose-50 text-rose-600 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                  </div>
                  {error.includes('cooldown') && (
                    <button 
                      onClick={() => handleParse(true)}
                      className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 hover:underline text-left w-fit"
                    >
                      Force Retry Now
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {step === 'preview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-semibold text-gray-900">Preview Transactions ({parsedTransactions.length})</h4>
                <button 
                  onClick={() => setStep('input')}
                  className="text-sm text-indigo-600 hover:underline"
                >
                  Back to Edit
                </button>
              </div>

              <div className="space-y-3">
                {parsedTransactions.map((tx, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-gray-900">{tx.description}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-500">{tx.date}</span>
                        <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] font-medium text-gray-600 uppercase">
                          {tx.category}
                        </span>
                      </div>
                    </div>
                    <div className={`text-sm font-bold ${tx.type === 'Credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.type === 'Credit' ? '+' : '-'}{formatCurrency(tx.amount || 0)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Import Successful!</h3>
              <p className="text-gray-500 max-w-xs mx-auto">
                {parsedTransactions.length} transactions have been successfully added to your account.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex items-center justify-end gap-3">
          {step === 'input' && (
            <button
              onClick={() => handleParse()}
              disabled={isParsing || !inputText.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-indigo-200"
            >
              {isParsing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Parsing with AI...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Parse with AI
                </>
              )}
            </button>
          )}

          {step === 'preview' && (
            <button
              onClick={handleImport}
              className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
            >
              Confirm Import
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 'success' && (
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition-all"
            >
              Done
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
