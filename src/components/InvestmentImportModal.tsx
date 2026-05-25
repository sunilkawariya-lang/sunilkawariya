
import React, { useState } from 'react';
import { X, Upload, FileText, CheckCircle2, Loader2, AlertCircle, ShieldCheck, FileSpreadsheet, FileCode, Zap, Link as LinkIcon, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Investment, Transaction } from '../types';
import { parseInvestmentFile, parseTransactionFile } from '../services/geminiService';
import * as XLSX from 'xlsx';

import { connectToBroker } from '../services/brokerService';

import * as pdfjs from 'pdfjs-dist/legacy/build/pdf.mjs';
// @ts-ignore - Vite asset import
import pdfWorker from 'pdfjs-dist/legacy/build/pdf.worker.mjs?url';

// Configure PDF.js worker with cache buster
pdfjs.GlobalWorkerOptions.workerSrc = `${pdfWorker}${pdfWorker.includes('?') ? '&' : '?'}v=${Date.now()}`;

interface InvestmentImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (newInvestments: Investment[], clearExisting?: boolean) => void;
  onImportTransactions: (newTransactions: Transaction[]) => void;
  onImportBankAccounts?: (newAccounts: any[]) => void;
  onImportInsurance?: (newPolicies: any[]) => void;
  selectedMemberId: string;
  familyMembers: any[];
}

const InvestmentImportModal: React.FC<InvestmentImportModalProps> = ({ 
  isOpen, onClose, onImport, onImportTransactions, onImportBankAccounts, onImportInsurance, selectedMemberId, familyMembers 
}) => {
  const [step, setStep] = useState<'upload' | 'processing' | 'preview'>('upload');
  const [importType, setImportType] = useState<'holdings' | 'transactions' | 'bank' | 'insurance' | 'gold' | 'epf'>('holdings');
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [extractedInvestments, setExtractedInvestments] = useState<Investment[]>([]);
  const [extractedTransactions, setExtractedTransactions] = useState<Transaction[]>([]);
  const [extractedBankAccounts, setExtractedBankAccounts] = useState<any[]>([]);
  const [extractedInsurance, setExtractedInsurance] = useState<any[]>([]);
  const [clearExisting, setClearExisting] = useState(false);
  const [showClearConfirmation, setShowClearConfirmation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfPassword, setPdfPassword] = useState<string>('');
  const [showPasswordInput, setShowPasswordInput] = useState(false);
  const [showPasswordText, setShowPasswordText] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [manualText, setManualText] = useState('');
  const [bulkMemberId, setBulkMemberId] = useState('');

  const [activeTab, setActiveTab] = useState<'file' | 'broker' | 'text'>('file');
  const [selectedBroker, setSelectedBroker] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const brokers = [
    { id: 'mfcentral', name: 'MF Central', icon: 'https://www.mfcentral.com/assets/images/logo.svg', color: 'bg-blue-50', available: true, type: 'holdings' },
    { id: 'aa', name: 'Bank Aggregator', icon: 'https://sahamati.org.in/wp-content/uploads/2019/08/Sahamati-Logo-1.png', color: 'bg-indigo-50', available: true, type: 'bank' },
    { id: 'insurance', name: 'Insurance Repository', icon: 'https://www.ndml.in/images/logo.png', color: 'bg-rose-50', available: true, type: 'insurance' },
    { id: 'digigold', name: 'Digital Gold', icon: 'https://www.safegold.com/assets/images/logo.svg', color: 'bg-amber-50', available: true, type: 'gold' },
    { id: 'epf', name: 'EPF Sync', icon: 'https://www.epfindia.gov.in/site_docs/images/logo.png', color: 'bg-blue-50', available: true, type: 'epf' },
    { id: 'zerodha', name: 'Zerodha', icon: 'https://kite.zerodha.com/static/images/kite-logo.svg', color: 'bg-orange-50', available: true, type: 'holdings' },
    { id: 'groww', name: 'Groww', icon: 'https://groww.in/logo-groww.png', color: 'bg-emerald-50', available: true, type: 'holdings' },
    { id: 'upstox', name: 'Upstox', icon: 'https://upstox.com/app/themes/upstox/dist/img/logo/upstox-logo.svg', color: 'bg-blue-50', available: true, type: 'holdings' },
    { id: 'angelone', name: 'Angel One', icon: 'https://www.angelone.in/wp-content/uploads/2021/11/logo.svg', color: 'bg-blue-50', available: true, type: 'holdings' },
  ];

  const findMatchedMemberId = (investorName?: string): string => {
    if (investorName && familyMembers && familyMembers.length > 0) {
      const nameLower = investorName.toLowerCase().replace(/\s+/g, ' ').trim();
      const found = familyMembers.find(m => {
        const mLower = m.name.toLowerCase().replace(/\s+/g, ' ').trim();
        return mLower.includes(nameLower) || nameLower.includes(mLower);
      });
      if (found) return found.id;
    }
    return selectedMemberId === 'family' ? '' : selectedMemberId;
  };

  const processExtractedInvestments = (investments: any[]) => {
    return investments.map((inv: any, i: number) => {
      const currentValue = inv.currentValue || 0;
      const hasInvestedValue = inv.investedValue && inv.investedValue > 0;
      const investedValue = hasInvestedValue ? inv.investedValue : currentValue; // Use currentValue if investedValue is missing
      
      // If we defaulted investedValue to currentValue, and there are no purchases, 
      // add a default purchase for the NAV date (or today) to ensure holding period starts then
      let purchases = inv.purchases || [];
      if (!hasInvestedValue && purchases.length === 0 && currentValue > 0) {
        const purchaseDate = inv.navDate || new Date().toISOString().split('T')[0];
        purchases = [{
          id: `p-${Date.now()}-${i}`,
          date: purchaseDate,
          quantity: inv.quantity || 1,
          price: inv.price || (inv.quantity ? currentValue / inv.quantity : currentValue)
        }];
      }

      return {
        ...inv,
        id: inv.id || `ext-${Date.now()}-${i}`,
        memberId: inv.memberId || findMatchedMemberId(inv.investorName),
        lastUpdated: inv.lastUpdated || (inv.navDate ? new Date(inv.navDate).toISOString() : new Date().toISOString()),
        investedValue: investedValue,
        navDate: inv.navDate,
        purchases: purchases,
        source: inv.source || 'Imported'
      };
    });
  };

  const handleConnectBroker = async (brokerId: string) => {
    const broker = brokers.find(b => b.id === brokerId);
    if (!broker?.available) {
      setError(`${broker?.name} API integration is coming soon!`);
      return;
    }

    setSelectedBroker(brokerId);
    setIsConnecting(true);
    setError(null);
    
    try {
      const data = await connectToBroker(brokerId);

      if (brokerId === 'mfcentral' || brokerId === 'zerodha' || brokerId === 'groww' || brokerId === 'upstox' || brokerId === 'angelone') {
        setImportType('holdings');
        const processed = processExtractedInvestments(Array.isArray(data) ? data : (data.holdings || []));
        setExtractedInvestments(processed);
      } else if (brokerId === 'aa') {
        setImportType('bank');
        const accountsWithMember = (data.accounts || []).map((acc: any) => ({
          ...acc,
          memberId: findMatchedMemberId(acc.investorName || acc.accountHolderName)
        }));
        setExtractedBankAccounts(accountsWithMember);
        
        if (data.transactions) {
          const txWithMember = data.transactions.map((tx: any) => ({
            ...tx,
            memberId: findMatchedMemberId(tx.investorName)
          }));
          setExtractedTransactions(txWithMember);
        }
      } else if (brokerId === 'insurance') {
        setImportType('insurance');
        const policiesWithMember = (Array.isArray(data) ? data : (data.policies || [])).map((ins: any) => ({
          ...ins,
          memberId: findMatchedMemberId(ins.investorName || ins.policyHolder)
        }));
        setExtractedInsurance(policiesWithMember);
      } else if (brokerId === 'digigold') {
        setImportType('gold');
        const processed = processExtractedInvestments(Array.isArray(data) ? data : (data.holdings || []));
        setExtractedInvestments(processed);
      } else if (brokerId === 'epf') {
        setImportType('epf');
        const processed = processExtractedInvestments(Array.isArray(data) ? data : (data.holdings || []));
        setExtractedInvestments(processed);
      }
      
      setStep('preview');
    } catch (err) {
      console.error("Broker Connection Error:", err);
      setError(err instanceof Error ? err.message : "Failed to connect to broker API. Please try again later.");
    } finally {
      setIsConnecting(false);
    }
  };

  const fileToBase64 = (file: File | Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file: File, password?: string) => {
    const trimmedPassword = password?.trim();
    setFileName(file.name);
    setStep('processing');
    setError(null);
    
    try {
      let fileData: string;
      let mimeType = file.type;

      const isPDF = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (isPDF) {
        console.log("Processing PDF using pdf.js engine...");
        const arrayBuffer = await file.arrayBuffer();
        
        const tryExtractWithPdfJs = async (pwd?: string) => {
          console.log(`Attempting PDF extraction ${pwd ? 'with password' : 'without password'}...`);
          const loadingTask = pdfjs.getDocument({
            data: arrayBuffer,
            password: pwd
          });
          
          const pdf = await loadingTask.promise;
          let fullText = "";
          
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(" ");
            fullText += `\n--- Page ${i} ---\n${pageText}`;
          }
          
          return fullText;
        };

        try {
          // Use pdf.js for everything - it's much more robust than pdf-lib for encrypted files
          fileData = await tryExtractWithPdfJs(trimmedPassword);
          mimeType = 'text/plain';
          
          setShowPasswordInput(false);
          setPendingFile(null);
          setPdfPassword('');
        } catch (err: any) {
          if (err.name === 'PasswordException' || err.message?.toLowerCase().includes('password')) {
            setShowPasswordInput(true);
            setPendingFile(file);
            setStep('upload');
            if (trimmedPassword) {
              setError("Incorrect password. For NSDL CAS, use your PAN in CAPITAL letters.");
            } else {
              setError("This PDF is password protected. Please enter the password to continue.");
            }
            return;
          }

          console.error("PDF Processing Error Details:", err);
          console.error("Error Name:", err.name);
          console.error("Error Stack:", err.stack);
          
          let errorMessage = `Failed to process PDF: ${err.message || 'Unknown error'}`;
          const errorString = String(err) + (err.message || '') + (err.stack || '');
          
          if (errorString.includes('hashOriginal.toHex')) {
            errorMessage = "Legacy PDF engine error detected in browser cache. Please hard-refresh your browser (Ctrl+F5 or Cmd+Shift+R) to use the updated Secure Engine v2.2.";
          }
          
          setError(errorMessage);
          setStep('upload');
          return;
        }
      } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        
        // Support files with multiple sheets by concatenating all non-empty sheets
        const fileDataParts: string[] = [];
        for (const sheetName of workbook.SheetNames) {
          const sheet = workbook.Sheets[sheetName];
          const csvData = XLSX.utils.sheet_to_csv(sheet);
          if (csvData && csvData.trim().length > 0) {
            fileDataParts.push(`--- Sheet: ${sheetName} ---\n${csvData}`);
          }
        }
        
        if (fileDataParts.length === 0) {
          const firstSheetName = workbook.SheetNames[0];
          if (firstSheetName) {
            fileData = XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheetName]);
          } else {
            throw new Error("No sheets or data found in the Excel file.");
          }
        } else {
          fileData = fileDataParts.join('\n\n');
        }
        mimeType = 'text/csv';
      } else {
        fileData = await file.text();
        mimeType = file.type || 'text/plain';
      }

      if (importType === 'holdings') {
        const extracted = await parseInvestmentFile(fileData, mimeType);
        setExtractedInvestments(processExtractedInvestments(extracted));
      } else {
        const extracted = await parseTransactionFile(fileData, mimeType);
        
        // Add unique IDs and member ID to extracted transactions
        const withIds = extracted.map((tx: any, i: number) => ({
          ...tx,
          id: `tx-ext-${Date.now()}-${i}`,
          memberId: findMatchedMemberId(tx.investorName),
        }));

        setExtractedTransactions(withIds);
      }
      setStep('preview');
    } catch (err) {
      console.error("Import Error:", err);
      setError("Failed to parse the file. Please ensure it's a valid investment report or statement.");
      setStep('upload');
    }
  };

  const handleManualImport = async () => {
    if (!manualText.trim()) return;
    
    setStep('processing');
    setFileName('Manual Text Import');
    setError(null);
    
    try {
      if (importType === 'holdings') {
        const extracted = await parseInvestmentFile(manualText, 'text/plain');
        setExtractedInvestments(processExtractedInvestments(extracted));
      } else {
        const extracted = await parseTransactionFile(manualText, 'text/plain');
        const withIds = extracted.map((tx: any, i: number) => ({
          ...tx,
          id: `tx-ext-${Date.now()}-${i}`,
          memberId: findMatchedMemberId(tx.investorName),
        }));
        setExtractedTransactions(withIds);
      }
      setStep('preview');
    } catch (err: any) {
      setError(`Failed to parse text: ${err.message}`);
      setStep('upload');
    }
  };

  const handleConfirm = () => {
    if (clearExisting && !showClearConfirmation && (importType === 'holdings' || importType === 'gold' || importType === 'epf')) {
      setShowClearConfirmation(true);
      return;
    }

    if (importType === 'holdings' || importType === 'gold' || importType === 'epf') {
      onImport(extractedInvestments, clearExisting);
    } else if (importType === 'transactions') {
      onImportTransactions(extractedTransactions);
    } else if (importType === 'bank' && onImportBankAccounts) {
      onImportBankAccounts(extractedBankAccounts);
      if (extractedTransactions.length > 0) {
        onImportTransactions(extractedTransactions);
      }
    } else if (importType === 'insurance' && onImportInsurance) {
      onImportInsurance(extractedInsurance);
    }
    onClose();
    setStep('upload');
    setFileName(null);
    setExtractedInvestments([]);
    setExtractedTransactions([]);
    setExtractedBankAccounts([]);
    setExtractedInsurance([]);
    setClearExisting(false);
    setShowClearConfirmation(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-white w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900">Import Data</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Secure Engine v2.2 (Legacy Build)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        {step === 'upload' && (
          <div className="px-8 pt-6 space-y-4">
            <div className="flex p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setImportType('holdings')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  importType === 'holdings' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Current Holdings
              </button>
              <button
                onClick={() => setImportType('transactions')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  importType === 'transactions' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Transactions
              </button>
            </div>
          </div>
        )}

        {step === 'upload' && (
          <div className="flex border-b border-slate-100">
            <button 
              onClick={() => setActiveTab('file')}
              className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'file' ? 'text-emerald-600 border-emerald-600 bg-emerald-50/30' : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Upload size={16} />
                File Upload
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('broker')}
              className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'broker' ? 'text-emerald-600 border-emerald-600 bg-emerald-50/30' : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Zap size={16} />
                Broker Sync
              </div>
            </button>
            <button 
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-4 text-sm font-bold transition-all border-b-2 ${
                activeTab === 'text' ? 'text-emerald-600 border-emerald-600 bg-emerald-50/30' : 'text-slate-400 border-transparent hover:text-slate-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <FileCode size={16} />
                Paste Text
              </div>
            </button>
          </div>
        )}

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex flex-col gap-3 text-rose-800 text-sm">
              <div className="flex gap-3">
                <AlertCircle className="shrink-0" size={18} />
                <p>{error}</p>
              </div>
              {error.includes('Legacy PDF engine') && (
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-2 bg-rose-100 hover:bg-rose-200 text-rose-900 rounded-xl font-bold transition-all self-start flex items-center gap-2"
                >
                  <Zap size={14} />
                  Force Refresh Application
                </button>
              )}
            </div>
          )}

          {step === 'upload' && activeTab === 'file' && (
            <div className="space-y-6">
              {showPasswordInput ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-8 border-2 border-emerald-100 bg-emerald-50/30 rounded-3xl text-center"
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                    <ShieldCheck size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">Password Protected PDF</h4>
                  <p className="text-slate-500 text-sm mb-6">
                    Enter the password for <strong>{pendingFile?.name}</strong> to proceed with the import.
                    <br />
                    <span className="text-[10px] text-slate-400 mt-1 block italic">
                      Tip: Common passwords for CAS are your PAN in CAPS or your registered mobile number.
                    </span>
                  </p>
                  <div className="max-w-xs mx-auto space-y-4">
                    <div className="relative">
                      <input 
                        type={showPasswordText ? "text" : "password"}
                        value={pdfPassword}
                        onChange={(e) => setPdfPassword(e.target.value)}
                        placeholder="Enter PDF Password"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent pr-12"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && pdfPassword && pendingFile) {
                            processFile(pendingFile, pdfPassword);
                          }
                        }}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPasswordText(!showPasswordText)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showPasswordText ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          setShowPasswordInput(false);
                          setPendingFile(null);
                          setPdfPassword('');
                          setError(null);
                        }}
                        className="flex-1 px-4 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        disabled={!pdfPassword}
                        onClick={() => pendingFile && processFile(pendingFile, pdfPassword)}
                        className="flex-1 bg-emerald-600 text-white px-4 py-2.5 rounded-xl font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                      >
                        Unlock & Import
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <div 
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-3xl p-12 text-center transition-all ${
                    isDragging ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-400 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-600">
                    <Upload size={32} />
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 mb-2">
                    Upload your {importType === 'holdings' ? 'Investment Report' : 'Transaction Statement'}
                  </h4>
                  <p className="text-slate-500 text-sm mb-6">
                    {importType === 'holdings' 
                      ? 'Support for CAMS/Karvy/NSDL CAS PDFs, CSV, Excel, and Text files. Drag and drop here, or click to browse.'
                      : 'Upload contract notes, bank statements, or broker transaction exports.'}
                  </p>
                  <input 
                    type="file" 
                    accept=".pdf,.csv,.xlsx,.xls,.txt" 
                    className="hidden" 
                    id="cas-upload" 
                    onChange={(e) => e.target.files?.[0] && processFile(e.target.files[0])}
                  />
                  <label 
                    htmlFor="cas-upload"
                    className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-semibold cursor-pointer hover:bg-slate-800 transition-colors inline-block"
                  >
                    Select File
                  </label>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="p-3 bg-slate-50 rounded-2xl flex flex-col items-center gap-2 text-center">
                  <FileText className="text-blue-500" size={20} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">PDF Statements</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl flex flex-col items-center gap-2 text-center">
                  <FileSpreadsheet className="text-emerald-500" size={20} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Excel/CSV Exports</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl flex flex-col items-center gap-2 text-center">
                  <FileCode className="text-purple-500" size={20} />
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Text Reports</span>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
                <AlertCircle className="text-amber-600 shrink-0" size={20} />
                <div className="text-xs text-amber-800 leading-relaxed">
                  <p className="font-bold mb-1">AI-Powered Import:</p>
                  Our AI analyzes your file to extract holdings. Data is processed securely. Make sure files are not password protected.
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-400 justify-center">
                <ShieldCheck size={14} />
                <span>Secure 256-bit encryption for data processing</span>
              </div>
            </div>
          )}

          {step === 'upload' && activeTab === 'broker' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {brokers.map((broker) => (
                  <button
                    key={broker.id}
                    onClick={() => handleConnectBroker(broker.id)}
                    disabled={isConnecting}
                    className={`flex items-center gap-4 p-4 rounded-2xl border border-slate-100 hover:border-emerald-200 hover:bg-emerald-50 transition-all group ${
                      isConnecting && selectedBroker === broker.id ? 'opacity-50' : ''
                    }`}
                  >
                    <div className={`w-12 h-12 ${broker.color} rounded-xl flex items-center justify-center shrink-0`}>
                      <LinkIcon size={20} className="text-slate-400 group-hover:text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-slate-900">{broker.name}</p>
                      <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                        {broker.available ? 'Direct API Sync' : 'Coming Soon'}
                      </p>
                    </div>
                    {broker.available && isConnecting && selectedBroker === broker.id && (
                      <Loader2 size={16} className="ml-auto animate-spin text-emerald-600" />
                    )}
                    {!broker.available && (
                      <div className="ml-auto px-2 py-0.5 bg-slate-100 text-slate-400 text-[8px] font-bold rounded uppercase">
                        Waitlist
                      </div>
                    )}
                  </button>
                ))}
              </div>

              <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl flex gap-3">
                <ShieldCheck className="text-blue-600 shrink-0" size={20} />
                <div className="text-xs text-blue-800 leading-relaxed">
                  <p className="font-bold mb-1">Secure Integration:</p>
                  We use official broker APIs for secure, read-only access to your portfolio. Your credentials are never stored on our servers.
                </div>
              </div>

              <div className="text-center">
                <p className="text-xs text-slate-400">
                  Don't see your broker? <button className="text-emerald-600 font-bold hover:underline">Request Integration</button>
                </p>
              </div>
            </div>
          )}

          {step === 'upload' && activeTab === 'text' && (
            <div className="space-y-6">
              <div className="p-6 border-2 border-slate-100 rounded-3xl bg-slate-50/30">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center text-emerald-600">
                    <FileCode size={20} />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900">Manual Text Import</h4>
                    <p className="text-xs text-slate-500">Copy and paste text from your statement if the PDF fails.</p>
                  </div>
                </div>
                <textarea 
                  value={manualText}
                  onChange={(e) => setManualText(e.target.value)}
                  placeholder="Paste your statement text here..."
                  className="w-full h-48 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-sm font-mono"
                />
              </div>
              <button 
                disabled={!manualText.trim()}
                onClick={handleManualImport}
                className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                Analyze & Import Text
              </button>
            </div>
          )}

          {step === 'processing' && (
            <div className="py-12 text-center space-y-6">
              <div className="relative w-24 h-24 mx-auto">
                <Loader2 className="w-full h-full text-emerald-600 animate-spin" size={48} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <FileText className="text-emerald-600" size={24} />
                </div>
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Analyzing your {importType === 'holdings' ? 'report' : 'statement'}...</h4>
                <p className="text-slate-500">
                  {importType === 'holdings' 
                    ? `Extracting mutual fund and equity holdings from ${fileName}`
                    : `Extracting buy/sell transactions from ${fileName}`}
                </p>
              </div>
              <div className="max-w-xs mx-auto h-2 bg-slate-100 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 3 }}
                  className="h-full bg-emerald-500"
                />
              </div>
            </div>
          )}

          {step === 'preview' && (() => {
            const unassignedCount = (importType === 'holdings' || importType === 'gold' || importType === 'epf')
              ? extractedInvestments.filter(inv => !inv.memberId).length
              : importType === 'transactions'
                ? extractedTransactions.filter(tx => !tx.memberId).length
                : importType === 'bank'
                  ? extractedBankAccounts.filter(acc => !acc.memberId).length
                  : importType === 'insurance'
                    ? extractedInsurance.filter(ins => !ins.memberId).length
                    : 0;

            const handleBulkAssign = (memberId: string) => {
              if (!memberId) return;
              if (importType === 'holdings' || importType === 'gold' || importType === 'epf') {
                setExtractedInvestments(prev => prev.map(inv => ({ ...inv, memberId })));
              } else if (importType === 'transactions') {
                setExtractedTransactions(prev => prev.map(tx => ({ ...tx, memberId })));
              } else if (importType === 'bank') {
                setExtractedBankAccounts(prev => prev.map(acc => ({ ...acc, memberId })));
              } else if (importType === 'insurance') {
                setExtractedInsurance(prev => prev.map(ins => ({ ...ins, memberId })));
              }
            };

            return (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                  <CheckCircle2 className="text-emerald-600" size={24} />
                  <div>
                    <h4 className="font-bold text-emerald-900">Extraction Successful!</h4>
                    <p className="text-sm text-emerald-700">
                      {importType === 'holdings' || importType === 'gold' || importType === 'epf' ? `Found ${extractedInvestments.length} investments` : 
                       importType === 'transactions' ? `Found ${extractedTransactions.length} transactions` :
                       importType === 'bank' ? `Found ${extractedBankAccounts.length} accounts and ${extractedTransactions.length} transactions` :
                       importType === 'insurance' ? `Found ${extractedInsurance.length} policies` : ''} in your statement.
                    </p>
                  </div>
                </div>

                {unassignedCount > 0 && (
                  <div className="flex gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 items-start">
                    <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={18} />
                    <div className="text-xs">
                      <p className="font-bold">Investor Mapping Needed</p>
                      <p className="opacity-95 mt-0.5">The system could not identify the investor for {unassignedCount} item(s). Please specify the correct family member/investor for each entry using the dropdown list below.</p>
                    </div>
                  </div>
                )}

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600">
                      <Zap size={16} />
                    </div>
                    <div className="text-left">
                      <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider">Bulk Assign Investor</h5>
                      <p className="text-[10px] text-slate-400 font-bold leading-none mt-0.5">Select a single member to apply to all extracted items</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={bulkMemberId}
                      onChange={(e) => setBulkMemberId(e.target.value)}
                      className="text-xs font-bold rounded-xl border border-slate-200 bg-white px-3 py-2 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all text-slate-700 min-w-[160px] flex-1 sm:flex-initial"
                    >
                      <option value="">-- Choose Investor --</option>
                      {familyMembers && familyMembers.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                      ))}
                    </select>
                    <button
                      type="button"
                      disabled={!bulkMemberId}
                      onClick={() => handleBulkAssign(bulkMemberId)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 hover:scale-101 active:scale-99 disabled:opacity-50 disabled:hover:scale-100 text-white font-bold text-xs rounded-xl transition-all shadow-md shadow-emerald-600/10 whitespace-nowrap uppercase tracking-wider h-9"
                    >
                      Apply To All
                    </button>
                  </div>
                </div>

                <div className="border border-slate-100 rounded-2xl overflow-hidden max-h-[400px] overflow-y-auto shadow-sm">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 border-b border-slate-100 sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-3 font-bold text-slate-500 w-[40%]">Asset Details</th>
                        <th className="px-4 py-3 font-bold text-slate-500 w-[20%]">Investor / Owner</th>
                        <th className="px-4 py-3 font-bold text-slate-500 text-right w-[20%]">Market Value</th>
                        <th className="px-4 py-3 font-bold text-slate-500 text-right w-[20%]">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {importType === 'holdings' || importType === 'gold' || importType === 'epf' ? extractedInvestments.map((inv, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="flex flex-col gap-1">
                              <input 
                                type="text"
                                value={inv.name}
                                onChange={(e) => {
                                  const newInv = [...extractedInvestments];
                                  newInv[i].name = e.target.value;
                                  setExtractedInvestments(newInv);
                                }}
                                className="font-bold text-slate-900 border-none p-0 focus:ring-0 bg-transparent w-full text-sm hover:bg-white/50 focus:bg-white transition-all rounded px-1"
                              />
                              <div className="flex items-center gap-2">
                                <select 
                                  value={inv.category}
                                  onChange={(e) => {
                                    const newInv = [...extractedInvestments];
                                    newInv[i].category = e.target.value as any;
                                    setExtractedInvestments(newInv);
                                  }}
                                  className="text-[9px] text-slate-400 font-bold uppercase tracking-wider border-none p-0 focus:ring-0 bg-transparent cursor-pointer hover:text-emerald-600"
                                >
                                  {['Equity', 'Debt', 'Gold', 'Hybrid', 'Alternative', 'Cash', 'Real Estate', 'ESOP'].map(c => (
                                    <option key={c} value={c}>{c}</option>
                                  ))}
                                </select>
                                <span className="text-slate-300">•</span>
                                <input 
                                  type="text"
                                  value={inv.subCategory}
                                  onChange={(e) => {
                                    const newInv = [...extractedInvestments];
                                    newInv[i].subCategory = e.target.value;
                                    setExtractedInvestments(newInv);
                                  }}
                                  className="text-[9px] text-slate-400 font-bold uppercase tracking-wider border-none p-0 focus:ring-0 bg-transparent w-24 hover:text-emerald-600 focus:w-auto transition-all"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <select 
                              value={inv.memberId || ''}
                              onChange={(e) => {
                                const newInv = [...extractedInvestments];
                                newInv[i].memberId = e.target.value;
                                setExtractedInvestments(newInv);
                              }}
                              className={`text-xs font-bold w-full rounded-lg border bg-white px-2 py-1.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all ${
                                !inv.memberId ? 'border-amber-400 text-amber-700 bg-amber-50 animate-pulse' : 'text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="">-- Select Investor --</option>
                              {familyMembers && familyMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <div className="flex items-center justify-end text-slate-900">
                                <span className="text-xs font-bold mr-0.5">₹</span>
                                <input 
                                  type="number"
                                  value={inv.currentValue || 0}
                                  onChange={(e) => {
                                    const newInv = [...extractedInvestments];
                                    newInv[i].currentValue = parseFloat(e.target.value) || 0;
                                    if (newInv[i].quantity > 0) {
                                      newInv[i].price = newInv[i].currentValue / newInv[i].quantity;
                                    }
                                    setExtractedInvestments(newInv);
                                  }}
                                  className={`text-right font-bold w-24 border-none p-0 focus:ring-1 focus:ring-emerald-500 rounded px-1 ${!inv.currentValue ? 'text-amber-600 bg-amber-50' : 'bg-transparent'}`}
                                  placeholder="0.00"
                                />
                              </div>
                              <div className="flex items-center gap-1 text-[9px] text-slate-400 font-bold">
                                <span>Qty:</span>
                                <input 
                                  type="number"
                                  value={inv.quantity || 0}
                                  onChange={(e) => {
                                    const newInv = [...extractedInvestments];
                                    newInv[i].quantity = parseFloat(e.target.value) || 0;
                                    setExtractedInvestments(newInv);
                                  }}
                                  className="w-10 text-right bg-transparent border-none p-0 focus:ring-0"
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-right">
                            <div className="flex items-center justify-end text-slate-500">
                              <span className="text-[10px] font-medium mr-0.5">₹</span>
                              <input 
                                type="number"
                                value={inv.investedValue || 0}
                                onChange={(e) => {
                                  const newInv = [...extractedInvestments];
                                  newInv[i].investedValue = parseFloat(e.target.value) || 0;
                                  setExtractedInvestments(newInv);
                                }}
                                className="text-right font-medium w-20 border-none p-0 focus:ring-1 focus:ring-slate-300 rounded px-1 bg-transparent"
                                placeholder="0"
                              />
                            </div>
                          </td>
                        </tr>
                      )) : importType === 'transactions' ? extractedTransactions.map((tx, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                                tx.type === 'Buy' ? 'bg-emerald-100 text-emerald-700' : 
                                tx.type === 'Sell' ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                              }`}>
                                {tx.type}
                              </span>
                              <p className="font-bold text-slate-900">{tx.investmentName}</p>
                              {tx.needsClarification && (
                                <div className="group relative">
                                  <AlertCircle size={14} className="text-amber-500 cursor-help" />
                                  <div className="absolute left-0 bottom-full mb-2 w-48 p-2 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                    {tx.clarificationMessage || "Category inferred with low confidence. Please verify."}
                                  </div>
                                </div>
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{tx.date} • {tx.quantity} units @ ₹{tx.price}</p>
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={tx.memberId || ''}
                              onChange={(e) => {
                                const newTx = [...extractedTransactions];
                                newTx[i].memberId = e.target.value;
                                setExtractedTransactions(newTx);
                              }}
                              className={`text-xs font-bold w-full rounded-lg border bg-white px-2 py-1.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all ${
                                !tx.memberId ? 'border-amber-400 text-amber-700 bg-amber-50 animate-pulse' : 'text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="">-- Select Investor --</option>
                              {familyMembers && familyMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            ₹{tx.amount?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            -
                          </td>
                        </tr>
                      )) : importType === 'bank' ? extractedBankAccounts.map((acc, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{acc.bankName}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{acc.accountType} • ****{acc.lastFourDigits}</p>
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={acc.memberId || ''}
                              onChange={(e) => {
                                const newAcc = [...extractedBankAccounts];
                                newAcc[i].memberId = e.target.value;
                                setExtractedBankAccounts(newAcc);
                              }}
                              className={`text-xs font-bold w-full rounded-lg border bg-white px-2 py-1.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all ${
                                !acc.memberId ? 'border-amber-400 text-amber-700 bg-amber-50 animate-pulse' : 'text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="">-- Select Investor --</option>
                              {familyMembers && familyMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            ₹{acc.balance?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            -
                          </td>
                        </tr>
                      )) : importType === 'insurance' ? extractedInsurance.map((ins, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-900">{ins.name}</p>
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider">{ins.type} • {ins.provider}</p>
                          </td>
                          <td className="px-4 py-3">
                            <select 
                              value={ins.memberId || ''}
                              onChange={(e) => {
                                const newIns = [...extractedInsurance];
                                newIns[i].memberId = e.target.value;
                                setExtractedInsurance(newIns);
                              }}
                              className={`text-xs font-bold w-full rounded-lg border bg-white px-2 py-1.5 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all ${
                                !ins.memberId ? 'border-amber-400 text-amber-700 bg-amber-50 animate-pulse' : 'text-slate-700 border-slate-200'
                              }`}
                            >
                              <option value="">-- Select Investor --</option>
                              {familyMembers && familyMembers.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            ₹{ins.sumAssured?.toLocaleString('en-IN')}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-500">
                            -
                          </td>
                        </tr>
                      )) : null}
                    </tbody>
                  </table>
                </div>

                {(importType === 'holdings' || importType === 'gold' || importType === 'epf') && (
                  <label className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-100 rounded-2xl cursor-pointer group hover:bg-amber-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={clearExisting}
                      onChange={(e) => setClearExisting(e.target.checked)}
                      className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500"
                    />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-amber-900">Clear existing data before import</span>
                      <span className="text-[11px] text-amber-700">Recommended for a clean portfolio audit. This will remove current investments.</span>
                    </div>
                  </label>
                )}

                <div className="flex gap-3">
                  <button 
                    onClick={() => setStep('upload')}
                    className="flex-1 px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleConfirm}
                    disabled={unassignedCount > 0}
                    className={`flex-1 px-6 py-3 text-white rounded-xl font-bold transition-all ${
                      unassignedCount > 0 ? 'bg-slate-300 cursor-not-allowed shadow-none' : 'bg-emerald-600 hover:bg-emerald-700 shadow-lg shadow-emerald-600/20'
                    }`}
                  >
                    Add to Portfolio
                  </button>
                </div>
              </div>
            );
          })()}
        </div>

        <AnimatePresence>
          {showClearConfirmation && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl"
              >
                <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
                  <AlertCircle size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 mb-2">Are you sure?</h4>
                <p className="text-slate-500 text-sm mb-8">
                  This will <strong>permanently delete</strong> all your current investments before importing the new data. This action cannot be undone.
                </p>
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleConfirm}
                    className="w-full bg-rose-600 text-white py-3 rounded-xl font-bold hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20"
                  >
                    Yes, Clear & Import
                  </button>
                  <button 
                    onClick={() => setShowClearConfirmation(false)}
                    className="w-full bg-slate-100 text-slate-600 py-3 rounded-xl font-bold hover:bg-slate-200 transition-all"
                  >
                    No, Cancel
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default InvestmentImportModal;
