import React, { useState } from 'react';
import { useFirebase } from '../contexts/FirebaseContext';
import { IPSPolicy as IPSPolicyType } from '../types';
import { motion } from 'motion/react';
import { 
  Shield, 
  Target, 
  Scale, 
  Clock, 
  FileText, 
  Save, 
  RefreshCw, 
  AlertCircle,
  CheckCircle2,
  Info,
  Sparkles,
  ChevronRight,
  ChevronDown
} from 'lucide-react';
import { generateIPSAnalysis } from '../services/analysisService';

const IPSPolicy: React.FC = () => {
  const { portfolio, updateIPSPolicy } = useFirebase();
  const { ipsPolicy } = portfolio;
  const [isEditing, setIsEditing] = useState(false);
  const [editedPolicy, setEditedPolicy] = useState<IPSPolicyType>(ipsPolicy);
  const [isSaving, setIsSaving] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('objectives');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Ensure all required fields are present for the new interface
      const policyToSave: IPSPolicyType = {
        ...editedPolicy,
        governance: {
          ...editedPolicy.governance,
          reportingRequirements: editedPolicy.governance.reportingRequirements || 'Monthly portfolio performance reports and quarterly asset allocation reviews.'
        },
        objectives: {
          ...editedPolicy.objectives,
          investmentPhilosophy: editedPolicy.objectives.investmentPhilosophy || 'Core-Satellite approach. Core portfolio in low-cost index funds and high-quality debt. Satellite portfolio in high-growth stocks and tactical opportunities.'
        },
        assetAllocationPolicy: editedPolicy.assetAllocationPolicy || {
          targetEquity: 60,
          targetDebt: 30,
          targetGold: 5,
          targetCash: 5,
          rebalancingThresholds: editedPolicy.assetAllocationPolicy?.rebalancingThresholds || 'Rebalancing is triggered when any major asset class (Equity, Debt, Gold) deviates by more than +/- 5% from its target allocation.',
          permittedAssetClasses: ['Domestic Equity', 'International Equity', 'Government Bonds', 'Corporate Debt', 'Gold ETFs/SGBs', 'Liquid Funds'],
          prohibitedAssetClasses: ['Unregulated crypto assets', 'Highly leveraged derivatives', 'Unlisted private equity without due diligence']
        },
        riskManagement: {
          ...editedPolicy.riskManagement,
          benchmarks: editedPolicy.riskManagement.benchmarks || '60% Nifty 50 + 30% Nifty 10yr G-Sec + 10% Gold/Cash',
          rebalancingPolicy: editedPolicy.riskManagement.rebalancingPolicy || '1. Monitor asset allocation quarterly. 2. If deviation > 5% from target, sell overweight assets and buy underweight assets to restore target weights. 3. Use incremental cash flows (SIPs, bonuses) to rebalance first before selling to minimize tax impact. 4. Consider tax implications (LTCG/STCG) and exit loads before execution.'
        },
        lastUpdated: new Date().toISOString()
      };

      await updateIPSPolicy(policyToSave);
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to save IPS Policy:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAiReview = async () => {
    setIsAnalyzing(true);
    try {
      const result = await generateIPSAnalysis(portfolio);
      setAiSuggestions(result);
    } catch (error) {
      console.error("AI Analysis failed:", error);
      setAiSuggestions("Failed to generate AI suggestions. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const SectionHeader = ({ id, title, icon: Icon }: { id: string, title: string, icon: any }) => (
    <button 
      onClick={() => setExpandedSection(expandedSection === id ? null : id)}
      className="w-full flex items-center justify-between p-4 bg-white border-b border-gray-100 hover:bg-gray-50 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          <Icon size={20} />
        </div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
      </div>
      {expandedSection === id ? <ChevronDown size={20} className="text-gray-400" /> : <ChevronRight size={20} className="text-gray-400" />}
    </button>
  );

  const InputField = ({ label, value, onChange, multiline = false }: { label: string, value: string, onChange: (val: string) => void, multiline?: boolean }) => (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</label>
      {isEditing ? (
        multiline ? (
          <textarea 
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all min-h-[100px] text-sm"
          />
        ) : (
          <input 
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all text-sm"
          />
        )
      ) : (
        <p className="text-sm text-gray-700 leading-relaxed bg-white p-3 rounded-lg border border-transparent">
          {value || <span className="text-gray-400 italic">Not specified</span>}
        </p>
      )}
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="text-indigo-600" />
            Investment Policy Statement (IPS)
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Your strategic blueprint for long-term wealth management and governance.
          </p>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <Clock size={14} />
            Last Updated: {new Date(ipsPolicy.lastUpdated).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleAiReview}
            disabled={isAnalyzing}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-medium hover:bg-indigo-100 transition-colors disabled:opacity-50"
          >
            {isAnalyzing ? <RefreshCw className="animate-spin" size={18} /> : <Sparkles size={18} />}
            AI Review
          </button>
          
          {isEditing ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedPolicy(ipsPolicy);
                }}
                className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:opacity-50"
              >
                {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
                Save Policy
              </button>
            </div>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-6 py-2 bg-gray-900 text-white rounded-xl font-medium hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
            >
              Edit Policy
            </button>
          )}
        </div>
      </div>

      {/* AI Suggestions Panel */}
      {aiSuggestions && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-indigo-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Sparkles size={120} />
          </div>
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="text-indigo-300" />
                AI Strategic Insights
              </h2>
              <button 
                onClick={() => setAiSuggestions(null)}
                className="text-indigo-300 hover:text-white transition-colors"
              >
                Dismiss
              </button>
            </div>
            <div className="prose prose-invert max-w-none text-indigo-100 text-sm leading-relaxed">
              <div dangerouslySetInnerHTML={{ __html: aiSuggestions.replace(/\n/g, '<br/>') }} />
            </div>
          </div>
        </motion.div>
      )}

      {/* Main Content Sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Core Strategy */}
        <div className="lg:col-span-2 space-y-6">
          {/* Objectives Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <SectionHeader id="objectives" title="Investment Objectives & Risk" icon={Target} />
            {expandedSection === 'objectives' && (
              <div className="p-6 space-y-6 bg-gray-50/30">
                <InputField 
                  label="Investment Objective" 
                  value={isEditing ? editedPolicy.objectives.investmentObjective : ipsPolicy.objectives.investmentObjective}
                  onChange={(val) => setEditedPolicy(prev => ({ ...prev, objectives: { ...prev.objectives, investmentObjective: val } }))}
                  multiline
                />
                <InputField 
                  label="Investment Philosophy" 
                  value={isEditing ? editedPolicy.objectives.investmentPhilosophy : ipsPolicy.objectives.investmentPhilosophy}
                  onChange={(val) => setEditedPolicy(prev => ({ ...prev, objectives: { ...prev.objectives, investmentPhilosophy: val } }))}
                  multiline
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField 
                    label="Return Requirements" 
                    value={isEditing ? editedPolicy.objectives.returnRequirements : ipsPolicy.objectives.returnRequirements}
                    onChange={(val) => setEditedPolicy(prev => ({ ...prev, objectives: { ...prev.objectives, returnRequirements: val } }))}
                    multiline
                  />
                  <InputField 
                    label="Risk Tolerance" 
                    value={isEditing ? editedPolicy.objectives.riskTolerance : ipsPolicy.objectives.riskTolerance}
                    onChange={(val) => setEditedPolicy(prev => ({ ...prev, objectives: { ...prev.objectives, riskTolerance: val } }))}
                    multiline
                  />
                </div>
              </div>
            )}
          </div>

          {/* Asset Allocation Strategy Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <SectionHeader id="allocation" title="Asset Allocation Strategy" icon={Scale} />
            {expandedSection === 'allocation' && (
              <div className="p-6 space-y-6 bg-gray-50/30">
                {/* Visual Representation */}
                <div className="space-y-3">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Target Allocation Visual</label>
                  <div className="h-4 w-full flex rounded-full overflow-hidden shadow-inner bg-gray-200">
                    <div 
                      className="h-full bg-indigo-600 transition-all duration-1000" 
                      style={{ width: `${ipsPolicy.assetAllocationPolicy?.targetEquity || 0}%` }}
                      title={`Equity: ${ipsPolicy.assetAllocationPolicy?.targetEquity || 0}%`}
                    />
                    <div 
                      className="h-full bg-blue-500 transition-all duration-1000" 
                      style={{ width: `${ipsPolicy.assetAllocationPolicy?.targetDebt || 0}%` }}
                      title={`Debt: ${ipsPolicy.assetAllocationPolicy?.targetDebt || 0}%`}
                    />
                    <div 
                      className="h-full bg-amber-500 transition-all duration-1000" 
                      style={{ width: `${ipsPolicy.assetAllocationPolicy?.targetGold || 0}%` }}
                      title={`Gold: ${ipsPolicy.assetAllocationPolicy?.targetGold || 0}%`}
                    />
                    <div 
                      className="h-full bg-emerald-500 transition-all duration-1000" 
                      style={{ width: `${ipsPolicy.assetAllocationPolicy?.targetCash || 0}%` }}
                      title={`Cash: ${ipsPolicy.assetAllocationPolicy?.targetCash || 0}%`}
                    />
                  </div>
                  <div className="flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider">
                    <div className="flex items-center gap-1.5 text-indigo-600">
                      <div className="w-2 h-2 rounded-full bg-indigo-600" />
                      Equity ({ipsPolicy.assetAllocationPolicy?.targetEquity || 0}%)
                    </div>
                    <div className="flex items-center gap-1.5 text-blue-500">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      Debt ({ipsPolicy.assetAllocationPolicy?.targetDebt || 0}%)
                    </div>
                    <div className="flex items-center gap-1.5 text-amber-500">
                      <div className="w-2 h-2 rounded-full bg-amber-500" />
                      Gold ({ipsPolicy.assetAllocationPolicy?.targetGold || 0}%)
                    </div>
                    <div className="flex items-center gap-1.5 text-emerald-500">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      Cash ({ipsPolicy.assetAllocationPolicy?.targetCash || 0}%)
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Target Equity %</label>
                    {isEditing ? (
                      <input 
                        type="number"
                        value={editedPolicy.assetAllocationPolicy?.targetEquity || 0}
                        onChange={(e) => setEditedPolicy(prev => ({ ...prev, assetAllocationPolicy: { ...prev.assetAllocationPolicy, targetEquity: parseFloat(e.target.value) } }))}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                    ) : (
                      <p className="text-lg font-bold text-indigo-600 bg-white p-3 rounded-lg border border-transparent">
                        {ipsPolicy.assetAllocationPolicy?.targetEquity || 0}%
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Target Debt %</label>
                    {isEditing ? (
                      <input 
                        type="number"
                        value={editedPolicy.assetAllocationPolicy?.targetDebt || 0}
                        onChange={(e) => setEditedPolicy(prev => ({ ...prev, assetAllocationPolicy: { ...prev.assetAllocationPolicy, targetDebt: parseFloat(e.target.value) } }))}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                    ) : (
                      <p className="text-lg font-bold text-indigo-600 bg-white p-3 rounded-lg border border-transparent">
                        {ipsPolicy.assetAllocationPolicy?.targetDebt || 0}%
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Target Gold %</label>
                    {isEditing ? (
                      <input 
                        type="number"
                        value={editedPolicy.assetAllocationPolicy?.targetGold || 0}
                        onChange={(e) => setEditedPolicy(prev => ({ ...prev, assetAllocationPolicy: { ...prev.assetAllocationPolicy, targetGold: parseFloat(e.target.value) } }))}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                    ) : (
                      <p className="text-lg font-bold text-indigo-600 bg-white p-3 rounded-lg border border-transparent">
                        {ipsPolicy.assetAllocationPolicy?.targetGold || 0}%
                      </p>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Target Cash %</label>
                    {isEditing ? (
                      <input 
                        type="number"
                        value={editedPolicy.assetAllocationPolicy?.targetCash || 0}
                        onChange={(e) => setEditedPolicy(prev => ({ ...prev, assetAllocationPolicy: { ...prev.assetAllocationPolicy, targetCash: parseFloat(e.target.value) } }))}
                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 transition-all text-sm"
                      />
                    ) : (
                      <p className="text-lg font-bold text-indigo-600 bg-white p-3 rounded-lg border border-transparent">
                        {ipsPolicy.assetAllocationPolicy?.targetCash || 0}%
                      </p>
                    )}
                  </div>
                </div>
                <InputField 
                  label="Rebalancing Thresholds" 
                  value={isEditing ? editedPolicy.assetAllocationPolicy?.rebalancingThresholds : ipsPolicy.assetAllocationPolicy?.rebalancingThresholds}
                  onChange={(val) => setEditedPolicy(prev => ({ ...prev, assetAllocationPolicy: { ...prev.assetAllocationPolicy, rebalancingThresholds: val } }))}
                  multiline
                />

                {/* Rebalancing Trigger Info Box */}
                {!isEditing && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-blue-800">
                      <RefreshCw size={16} className="text-blue-600" />
                      <span className="font-bold text-xs uppercase tracking-wider">Rebalancing Protocol</span>
                    </div>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      <strong>Trigger:</strong> Rebalance when any asset class deviates by more than <strong>5%</strong> from its target allocation.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
                      <div className="bg-white/50 p-2 rounded-lg border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-800 mb-1">If Overweight ({'>'} +5%)</p>
                        <p className="text-[10px] text-blue-600">Sell excess and reallocate to underweight classes. Consider tax-loss harvesting if available.</p>
                      </div>
                      <div className="bg-white/50 p-2 rounded-lg border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-800 mb-1">If Underweight ({'<'} -5%)</p>
                        <p className="text-[10px] text-blue-600">Reallocate from overweight classes or use fresh capital (SIPs/Bonuses) to top up.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField 
                    label="Permitted Asset Classes" 
                    value={isEditing ? (editedPolicy.assetAllocationPolicy?.permittedAssetClasses || []).join(', ') : (ipsPolicy.assetAllocationPolicy?.permittedAssetClasses || []).join(', ')}
                    onChange={(val) => setEditedPolicy(prev => ({ ...prev, assetAllocationPolicy: { ...prev.assetAllocationPolicy, permittedAssetClasses: val.split(',').map(s => s.trim()) } }))}
                    multiline
                  />
                  <InputField 
                    label="Prohibited Asset Classes" 
                    value={isEditing ? (editedPolicy.assetAllocationPolicy?.prohibitedAssetClasses || []).join(', ') : (ipsPolicy.assetAllocationPolicy?.prohibitedAssetClasses || []).join(', ')}
                    onChange={(val) => setEditedPolicy(prev => ({ ...prev, assetAllocationPolicy: { ...prev.assetAllocationPolicy, prohibitedAssetClasses: val.split(',').map(s => s.trim()) } }))}
                    multiline
                  />
                </div>
              </div>
            )}
          </div>

          {/* Constraints Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <SectionHeader id="constraints" title="Investment Constraints" icon={Scale} />
            {expandedSection === 'constraints' && (
              <div className="p-6 space-y-6 bg-gray-50/30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <InputField 
                    label="Liquidity Needs" 
                    value={isEditing ? editedPolicy.objectives.constraints.liquidity : ipsPolicy.objectives.constraints.liquidity}
                    onChange={(val) => setEditedPolicy(prev => ({ ...prev, objectives: { ...prev.objectives, constraints: { ...prev.objectives.constraints, liquidity: val } } }))}
                    multiline
                  />
                  <InputField 
                    label="Tax Considerations (India)" 
                    value={isEditing ? editedPolicy.objectives.constraints.tax : ipsPolicy.objectives.constraints.tax}
                    onChange={(val) => setEditedPolicy(prev => ({ ...prev, objectives: { ...prev.objectives, constraints: { ...prev.objectives.constraints, tax: val } } }))}
                    multiline
                  />
                  <InputField 
                    label="Legal & Regulatory" 
                    value={isEditing ? editedPolicy.objectives.constraints.legal : ipsPolicy.objectives.constraints.legal}
                    onChange={(val) => setEditedPolicy(prev => ({ ...prev, objectives: { ...prev.objectives, constraints: { ...prev.objectives.constraints, legal: val } } }))}
                    multiline
                  />
                  <InputField 
                    label="Time Horizon" 
                    value={isEditing ? editedPolicy.objectives.constraints.timeHorizon : ipsPolicy.objectives.constraints.timeHorizon}
                    onChange={(val) => setEditedPolicy(prev => ({ ...prev, objectives: { ...prev.objectives, constraints: { ...prev.objectives.constraints, timeHorizon: val } } }))}
                    multiline
                  />
                </div>
                <InputField 
                  label="Unique Circumstances" 
                  value={isEditing ? editedPolicy.objectives.constraints.uniqueCircumstances : ipsPolicy.objectives.constraints.uniqueCircumstances}
                  onChange={(val) => setEditedPolicy(prev => ({ ...prev, objectives: { ...prev.objectives, constraints: { ...prev.objectives.constraints, uniqueCircumstances: val } } }))}
                  multiline
                />
              </div>
            )}
          </div>

          {/* Risk Management Section */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <SectionHeader id="risk" title="Risk Management & Monitoring" icon={Shield} />
            {expandedSection === 'risk' && (
              <div className="p-6 space-y-6 bg-gray-50/30">
                <InputField 
                  label="Performance Measurement" 
                  value={isEditing ? editedPolicy.riskManagement.performanceMeasurement : ipsPolicy.riskManagement.performanceMeasurement}
                  onChange={(val) => setEditedPolicy(prev => ({ ...prev, riskManagement: { ...prev.riskManagement, performanceMeasurement: val } }))}
                  multiline
                />
                <InputField 
                  label="Benchmarks" 
                  value={isEditing ? editedPolicy.riskManagement.benchmarks : ipsPolicy.riskManagement.benchmarks}
                  onChange={(val) => setEditedPolicy(prev => ({ ...prev, riskManagement: { ...prev.riskManagement, benchmarks: val } }))}
                  multiline
                />
                <InputField 
                  label="Rebalancing Policy" 
                  value={isEditing ? editedPolicy.riskManagement.rebalancingPolicy : ipsPolicy.riskManagement.rebalancingPolicy}
                  onChange={(val) => setEditedPolicy(prev => ({ ...prev, riskManagement: { ...prev.riskManagement, rebalancingPolicy: val } }))}
                  multiline
                />
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Governance & Context */}
        <div className="space-y-6">
          {/* Scope & Purpose */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="text-indigo-600" size={20} />
              <h3 className="font-bold text-gray-900">Scope & Purpose</h3>
            </div>
            <InputField 
              label="Context" 
              value={isEditing ? editedPolicy.scopeAndPurpose.context : ipsPolicy.scopeAndPurpose.context}
              onChange={(val) => setEditedPolicy(prev => ({ ...prev, scopeAndPurpose: { ...prev.scopeAndPurpose, context: val } }))}
              multiline
            />
            <InputField 
              label="Investor Profile" 
              value={isEditing ? editedPolicy.scopeAndPurpose.investor : ipsPolicy.scopeAndPurpose.investor}
              onChange={(val) => setEditedPolicy(prev => ({ ...prev, scopeAndPurpose: { ...prev.scopeAndPurpose, investor: val } }))}
            />
          </div>

          {/* Governance */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <Scale className="text-indigo-600" size={20} />
              <h3 className="font-bold text-gray-900">Governance</h3>
            </div>
            <InputField 
              label="Responsibilities" 
              value={isEditing ? editedPolicy.governance.responsibilities : ipsPolicy.governance.responsibilities}
              onChange={(val) => setEditedPolicy(prev => ({ ...prev, governance: { ...prev.governance, responsibilities: val } }))}
              multiline
            />
            <InputField 
              label="Review Process" 
              value={isEditing ? editedPolicy.governance.reviewProcess : ipsPolicy.governance.reviewProcess}
              onChange={(val) => setEditedPolicy(prev => ({ ...prev, governance: { ...prev.governance, reviewProcess: val } }))}
              multiline
            />
            <InputField 
              label="Reporting Requirements" 
              value={isEditing ? editedPolicy.governance.reportingRequirements : ipsPolicy.governance.reportingRequirements}
              onChange={(val) => setEditedPolicy(prev => ({ ...prev, governance: { ...prev.governance, reportingRequirements: val } }))}
              multiline
            />
          </div>

          {/* CFA Best Practices Tip */}
          <div className="bg-amber-50 border border-amber-100 p-6 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-800">
              <Info size={18} />
              <span className="font-bold text-sm">CFA Best Practices</span>
            </div>
            <p className="text-xs text-amber-700 leading-relaxed">
              A well-defined IPS should be <strong>dynamic</strong>. It acts as a contract between you and your future self, ensuring emotional biases don't derail your long-term strategy during market volatility.
            </p>
            <ul className="space-y-2">
              {[
                "Quantify risk tolerance",
                "Define clear benchmarks",
                "Specify rebalancing triggers",
                "Document tax constraints"
              ].map((tip, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-amber-700">
                  <CheckCircle2 size={12} className="text-amber-500" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IPSPolicy;
