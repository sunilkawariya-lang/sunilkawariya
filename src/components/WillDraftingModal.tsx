
import React, { useState, useEffect } from 'react';
import { X, FileText, Sparkles, Loader2, Save, Download, Printer, User, Users, Briefcase, Info, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PortfolioState, EstatePlanning, Nominee } from '../types';
import { generateWillDraft } from '../services/analysisService';
import Markdown from 'react-markdown';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';
import { stripMarkdown } from '../utils/text';

interface WillDraftingModalProps {
  isOpen: boolean;
  onClose: () => void;
  portfolio: PortfolioState;
  estatePlanning: EstatePlanning;
  onSave: (draft: string) => void;
}

const WillDraftingModal: React.FC<WillDraftingModalProps> = ({ isOpen, onClose, portfolio, estatePlanning, onSave }) => {
  const [step, setStep] = useState<'details' | 'draft'>('details');
  const [executor, setExecutor] = useState({ name: '', relationship: '', address: '' });
  const [bequests, setBequests] = useState<{ asset: string; beneficiary: string; percentage: number }[]>([]);
  const [guardians, setGuardians] = useState<{ name: string; relationship: string }[]>([]);
  const [digitalAssets, setDigitalAssets] = useState('');
  const [funeralInstructions, setFuneralInstructions] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [draft, setDraft] = useState<string | null>(estatePlanning.willDraft || null);

  useEffect(() => {
    if (isOpen && !estatePlanning.willDraft) {
      // Pre-fill bequests from nominees if available
      if (estatePlanning.nominees && estatePlanning.nominees.length > 0) {
        setBequests(estatePlanning.nominees.map(n => ({
          asset: 'General Estate (All Assets)',
          beneficiary: n.name,
          percentage: n.share
        })));
      }
    }
  }, [isOpen, estatePlanning]);

  const handleGenerate = async () => {
    if (!executor.name) {
      toast.error("Please provide the Executor's name.");
      return;
    }

    setIsGenerating(true);
    try {
      const generatedDraft = await generateWillDraft(portfolio, estatePlanning, executor, bequests, {
        guardians,
        digitalAssets,
        funeralInstructions
      });
      if (generatedDraft.startsWith("Error") || generatedDraft.startsWith("Failed")) {
        toast.error(generatedDraft);
      } else {
        setDraft(generatedDraft);
        setStep('draft');
        toast.success("Will draft generated successfully!");
      }
    } catch (error) {
      console.error("Failed to generate will draft:", error);
      toast.error("An unexpected error occurred while generating the will draft.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    if (draft) {
      onSave(draft);
      onClose();
    }
  };

  const handleDownloadPDF = () => {
    if (!draft) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxLineWidth = pageWidth - margin * 2;

    // Use shared utility for cleaning
    let cleanText = stripMarkdown(draft)
      .replace(/\[Testator's Current Address\]/g, '________________________________');

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("LAST WILL AND TESTAMENT", pageWidth / 2, 20, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(11);
    
    const lines = doc.splitTextToSize(cleanText, maxLineWidth);
    let cursorY = 35;

    lines.forEach((line: string) => {
      if (cursorY > 280) {
        doc.addPage();
        cursorY = 20;
      }
      doc.text(line, margin, cursorY);
      cursorY += 7;
    });

    // Signature section
    doc.setFontSize(12);
    if (cursorY > 240) {
      doc.addPage();
      cursorY = 20;
    }
    doc.text("__________________________", 20, cursorY + 20);
    doc.text("Testator's Signature", 20, cursorY + 25);
    
    doc.text("Witness 1: ________________", 20, cursorY + 45);
    doc.text("Witness 2: ________________", 20, cursorY + 60);

    doc.save("Last_Will_and_Testament.pdf");
    toast.success("Will downloaded successfully as PDF");
  };

  const handleAddGuardian = () => {
    setGuardians([...guardians, { name: '', relationship: '' }]);
  };

  const handleRemoveGuardian = (index: number) => {
    setGuardians(guardians.filter((_, i) => i !== index));
  };

  const handleUpdateGuardian = (index: number, field: string, value: string) => {
    const updated = [...guardians];
    updated[index] = { ...updated[index], [field]: value };
    setGuardians(updated);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Last Will and Testament</title>
            <style>
              body { font-family: 'Times New Roman', serif; padding: 40px; line-height: 1.6; }
              h1 { text-align: center; text-decoration: underline; }
              pre { white-space: pre-wrap; font-family: inherit; }
            </style>
          </head>
          <body>
            <h1>LAST WILL AND TESTAMENT</h1>
            <pre>${draft?.replace(/#/g, '').replace(/\*\*/g, '').replace(/\*/g, '')}</pre>
            <script>window.print(); window.close();</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  const handleAddBequest = () => {
    setBequests([...bequests, { asset: '', beneficiary: '', percentage: 0 }]);
  };

  const handleRemoveBequest = (index: number) => {
    setBequests(bequests.filter((_, i) => i !== index));
  };

  const handleUpdateBequest = (index: number, field: string, value: any) => {
    const updated = [...bequests];
    updated[index] = { ...updated[index], [field]: value };
    setBequests(updated);
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-4xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <FileText size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Will Drafting Assistant</h3>
              <p className="text-slate-500 text-sm">Create a legal draft of your last will and testament.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
            <X size={24} className="text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {step === 'details' ? (
            <div className="space-y-8">
              <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex items-start gap-3">
                <Info className="text-amber-600 shrink-0 mt-0.5" size={18} />
                <p className="text-sm text-amber-800">
                  <strong>Disclaimer:</strong> This is an AI-generated draft intended for informational purposes only. It is not a substitute for professional legal advice. Please have the final document reviewed by a qualified legal professional in your jurisdiction.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-8">
                  <div className="space-y-6">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Briefcase size={18} className="text-indigo-600" />
                      Executor Details
                    </h4>
                    <p className="text-xs text-slate-500">The person responsible for carrying out your wishes.</p>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                          Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={executor.name}
                          onChange={(e) => setExecutor({ ...executor, name: e.target.value })}
                          placeholder="e.g. John Doe"
                          className={`w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium`}
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Relationship</label>
                        <input
                          type="text"
                          value={executor.relationship}
                          onChange={(e) => setExecutor({ ...executor, relationship: e.target.value })}
                          placeholder="e.g. Brother, Trusted Friend"
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Address</label>
                        <textarea
                          value={executor.address}
                          onChange={(e) => setExecutor({ ...executor, address: e.target.value })}
                          placeholder="Residential address"
                          rows={3}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium resize-none"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Users size={18} className="text-indigo-600" />
                        Guardianship (Optional)
                      </h4>
                      <button
                        onClick={handleAddGuardian}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus size={14} />
                        Add Guardian
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Appoint guardians for minor children or dependents.</p>
                    <div className="space-y-4">
                      {guardians.map((guardian, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 relative group">
                          <button
                            onClick={() => handleRemoveGuardian(index)}
                            className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Name</label>
                              <input
                                type="text"
                                value={guardian.name}
                                onChange={(e) => handleUpdateGuardian(index, 'name', e.target.value)}
                                placeholder="Full Name"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Relationship</label>
                              <input
                                type="text"
                                value={guardian.relationship}
                                onChange={(e) => handleUpdateGuardian(index, 'relationship', e.target.value)}
                                placeholder="e.g. Aunt"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <Users size={18} className="text-indigo-600" />
                        Asset Distribution
                      </h4>
                      <button
                        onClick={handleAddBequest}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                      >
                        <Plus size={14} />
                        Add Bequest
                      </button>
                    </div>
                    <p className="text-xs text-slate-500">Specify how you want your assets to be distributed.</p>
                    
                    <div className="space-y-4">
                      {bequests.map((bequest, index) => (
                        <div key={index} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3 relative group">
                          <button
                            onClick={() => handleRemoveBequest(index)}
                            className="absolute top-2 right-2 p-1 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Trash2 size={14} />
                          </button>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Asset / Description</label>
                            <input
                              type="text"
                              value={bequest.asset}
                              onChange={(e) => handleUpdateBequest(index, 'asset', e.target.value)}
                              placeholder="e.g. All Assets, House at Mumbai, etc."
                              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Beneficiary</label>
                              <input
                                type="text"
                                value={bequest.beneficiary}
                                onChange={(e) => handleUpdateBequest(index, 'beneficiary', e.target.value)}
                                placeholder="Name"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Share (%)</label>
                              <input
                                type="number"
                                value={bequest.percentage}
                                onChange={(e) => handleUpdateBequest(index, 'percentage', parseFloat(e.target.value))}
                                placeholder="e.g. 100"
                                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm outline-none"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles size={18} className="text-indigo-600" />
                      Additional Instructions
                    </h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Digital Assets</label>
                        <textarea
                          value={digitalAssets}
                          onChange={(e) => setDigitalAssets(e.target.value)}
                          placeholder="Instructions for social media, crypto, etc."
                          rows={2}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium resize-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Funeral Instructions</label>
                        <textarea
                          value={funeralInstructions}
                          onChange={(e) => setFuneralInstructions(e.target.value)}
                          placeholder="Preferences for funeral, cremation, etc."
                          rows={2}
                          className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium resize-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-900">Generated Will Draft</h4>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={handlePrint}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" 
                    title="Print"
                  >
                    <Printer size={18} />
                  </button>
                  <button 
                    onClick={handleDownloadPDF}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" 
                    title="Download PDF"
                  >
                    <Download size={18} />
                  </button>
                </div>
              </div>
              <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-200 font-serif leading-relaxed text-slate-800 prose prose-slate max-w-none">
                <Markdown>{draft || ''}</Markdown>
              </div>
              <div className="flex justify-center gap-4">
                <button
                  onClick={() => setStep('details')}
                  className="px-8 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Edit Details
                </button>
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 transition-all flex items-center gap-2"
                >
                  {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <RefreshCw size={18} />}
                  Regenerate
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="p-8 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-6 py-3 text-slate-500 font-bold hover:text-slate-700 transition-colors"
          >
            Cancel
          </button>
          {step === 'details' ? (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !executor.name}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Generating Draft...
                </>
              ) : (
                <>
                  <Sparkles size={20} />
                  Generate Will Draft
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSave}
              className="px-8 py-4 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 flex items-center gap-2"
            >
              <Save size={20} />
              Save Draft to Profile
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

const RefreshCw = ({ size, className }: { size?: number; className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size || 24}
    height={size || 24}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

export default WillDraftingModal;
