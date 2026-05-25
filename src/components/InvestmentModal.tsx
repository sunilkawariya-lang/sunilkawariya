
import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Search, Loader2, RefreshCw, Trash2, Plus, Calendar, Sparkles, User, Briefcase, TrendingUp, Target, BarChart3, Upload } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Investment, AssetCategory, Purchase, GoalMapping, RetirementBucket, ESOPVesting } from '../types';
import { searchInvestments, SearchResult } from '../services/searchService';
import { fetchMutualFundNAV, fetchLiveMarketData, fetchHistoricalReturns } from '../services/livePriceService';
import { useFirebase } from '../contexts/FirebaseContext';

interface InvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (investment: Investment) => void;
  initialData?: Investment | null;
  onAnalyze?: (investment: Investment) => void;
}

const InvestmentModal: React.FC<InvestmentModalProps> = ({ isOpen, onClose, onSave, initialData, onAnalyze }) => {
  const { portfolio } = useFirebase();
  const [formData, setFormData] = useState<Partial<Investment>>({
    name: '',
    category: 'Equity',
    subCategory: '',
    fundHouse: '',
    sector: '',
    investedValue: 0,
    currentValue: 0,
    purchases: [],
    goalMappings: [],
    retirementBucket: 'None',
    vestingSchedule: [],
    grantDate: '',
    exercisePrice: 0,
    totalOptions: 0,
    entityName: '',
    composition: {
      debt: 0,
      equity: 0,
      globalEquity: 0,
      gold: 0,
      realEstate: 0,
      other: 0,
    },
    memberId: portfolio.selectedMemberId === 'family' ? (portfolio.familyMembers[0]?.id || 'self') : portfolio.selectedMemberId,
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingPrice, setIsFetchingPrice] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setErrors({});
    if (initialData) {
      setFormData({
        ...initialData,
        fundHouse: initialData.fundHouse || '',
        sector: initialData.sector || '',
        purchases: initialData.purchases || [],
        goalMappings: initialData.goalMappings || [],
        retirementBucket: initialData.retirementBucket || 'None',
        vestingSchedule: initialData.vestingSchedule || [],
        grantDate: initialData.grantDate || '',
        exercisePrice: initialData.exercisePrice || 0,
        totalOptions: initialData.totalOptions || 0,
        sipStartDate: initialData.sipStartDate || '',
        sipNextDate: initialData.sipNextDate || '',
        entityName: initialData.entityName || '',
        composition: initialData.composition || {
          debt: 0,
          equity: 0,
          globalEquity: 0,
          gold: 0,
          realEstate: 0,
          other: 0,
        },
      });
      setSearchQuery(initialData.name || '');
    } else {
      setFormData({
        name: '',
        category: 'Equity',
        subCategory: '',
        fundHouse: '',
        sector: '',
        investedValue: 0,
        currentValue: 0,
        purchases: [],
        goalMappings: [],
        retirementBucket: 'None',
        vestingSchedule: [],
        grantDate: '',
        exercisePrice: 0,
        totalOptions: 0,
        sipStartDate: '',
        sipNextDate: '',
        entityName: '',
        composition: {
          debt: 0,
          equity: 0,
          globalEquity: 0,
          gold: 0,
          realEstate: 0,
          other: 0,
        },
        memberId: portfolio.selectedMemberId === 'family' ? (portfolio.familyMembers[0]?.id || 'self') : portfolio.selectedMemberId,
      });
      setSearchQuery('');
    }
  }, [initialData, isOpen, portfolio.selectedMemberId, portfolio.familyMembers]);

  const updateTotalsFromPurchases = (purchases: Purchase[]) => {
    const totalQty = purchases.reduce((sum, p) => sum + (p.quantity || 0), 0);
    const totalInvested = purchases.reduce((sum, p) => sum + ((p.quantity || 0) * (p.price || 0)), 0);
    const avgBuyPrice = totalQty > 0 ? totalInvested / totalQty : 0;

    setFormData(prev => ({
      ...prev,
      purchases,
      quantity: totalQty,
      investedValue: totalInvested,
      buyPrice: avgBuyPrice,
      currentValue: totalQty * (prev.price || 0)
    }));
  };

  const addPurchase = () => {
    const newPurchase: Purchase = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      quantity: 0,
      price: formData.price || 0,
    };
    const updatedPurchases = [...(formData.purchases || []), newPurchase];
    updateTotalsFromPurchases(updatedPurchases);
  };

  const removePurchase = (id: string) => {
    const updatedPurchases = (formData.purchases || []).filter(p => p.id !== id);
    updateTotalsFromPurchases(updatedPurchases);
  };

  const updatePurchase = (id: string, field: keyof Purchase, value: any) => {
    const updatedPurchases = (formData.purchases || []).map(p => 
      p.id === id ? { ...p, [field]: value } : p
    );
    updateTotalsFromPurchases(updatedPurchases);
  };

  const addVestingEntry = () => {
    const newVesting: ESOPVesting = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      quantity: 0,
      status: 'Unvested',
    };
    setFormData(prev => ({
      ...prev,
      vestingSchedule: [...(prev.vestingSchedule || []), newVesting]
    }));
  };

  const removeVestingEntry = (id: string) => {
    const updatedVesting = (formData.vestingSchedule || []).filter(v => v.id !== id);
    setFormData(prev => ({ ...prev, vestingSchedule: updatedVesting }));
  };

  const updateVestingEntry = (id: string, field: keyof ESOPVesting, value: any) => {
    const updatedVesting = (formData.vestingSchedule || []).map(v => 
      v.id === id ? { ...v, [field]: value } : v
    );
    
    // Calculate totals for ESOP
    const totalVestedAndExercised = updatedVesting
      .filter(v => v.status === 'Vested' || v.status === 'Exercised')
      .reduce((sum, v) => sum + (v.quantity || 0), 0);
    
    setFormData(prev => ({ 
      ...prev, 
      vestingSchedule: updatedVesting,
      quantity: totalVestedAndExercised,
      investedValue: totalVestedAndExercised * (prev.exercisePrice || 0),
      currentValue: totalVestedAndExercised * (prev.price || 0)
    }));
  };

  const addGoalMapping = () => {
    const newMapping: GoalMapping = {
      goalId: '',
      percentage: 0,
    };
    setFormData(prev => ({
      ...prev,
      goalMappings: [...(prev.goalMappings || []), newMapping]
    }));
  };

  const removeGoalMapping = (index: number) => {
    const updatedMappings = (formData.goalMappings || []).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, goalMappings: updatedMappings }));
  };

  const updateGoalMapping = (index: number, field: keyof GoalMapping, value: any) => {
    const updatedMappings = [...(formData.goalMappings || [])];
    updatedMappings[index] = { ...updatedMappings[index], [field]: value };
    setFormData(prev => ({ ...prev, goalMappings: updatedMappings }));
  };

  const handleSearch = useCallback(async (query: string) => {
    if (query.length < 3) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    const results = await searchInvestments(query);
    setSearchResults(results);
    setIsSearching(false);
    setShowResults(true);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery && searchQuery !== formData.name) {
        handleSearch(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch, formData.name]);

  const fetchPrice = async (symbol?: string, schemeCode?: string) => {
    setIsFetchingPrice(true);
    try {
      let price = 0;
      let date = '';
      if (schemeCode) {
        const navData = await fetchMutualFundNAV(schemeCode);
        if (navData) {
          price = navData.price;
          date = navData.date || '';
        }
      } else if (symbol) {
        const data = await fetchLiveMarketData([symbol]);
        if (data[symbol]) {
          price = data[symbol].price;
          date = data[symbol].date || '';
        }
      }

      // Also fetch historical returns
      const dummyInv: Investment = {
        id: 'temp',
        memberId: formData.memberId || 'm1',
        name: formData.name || searchQuery || '',
        category: formData.category || 'Equity',
        subCategory: formData.subCategory || '',
        symbol: symbol || formData.symbol,
        schemeCode: schemeCode || formData.schemeCode,
        investedValue: 0,
        currentValue: 0,
        price: 0,
        purchases: [],
        lastUpdated: new Date().toISOString()
      };

      const returns = await fetchHistoricalReturns([dummyInv]);
      const invReturns = returns['temp'];

      setFormData(prev => ({
        ...prev,
        price: price > 0 ? price : prev.price,
        navDate: date || prev.navDate,
        currentValue: price > 0 ? (prev.quantity || 0) * price : prev.currentValue,
        return1Y: invReturns?.return1Y ?? prev.return1Y,
        return3Y: invReturns?.return3Y ?? prev.return3Y,
        return5Y: invReturns?.return5Y ?? prev.return5Y,
      }));
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsFetchingPrice(false);
    }
  };

  const handleSelectResult = (result: SearchResult) => {
    setFormData(prev => ({
      ...prev,
      name: result.name,
      category: result.category as AssetCategory,
      subCategory: result.subCategory,
      fundHouse: result.fundHouse || prev.fundHouse || '',
      sector: result.sector || prev.sector || '',
      symbol: result.symbol,
      schemeCode: result.schemeCode,
      currency: result.currency || (result.subCategory === 'International Equity' ? 'USD' : 'INR'),
      return1Y: result.return1Y,
      return3Y: result.return3Y,
      return5Y: result.return5Y,
    }));
    setSearchQuery(result.name);
    setShowResults(false);
    
    // Auto-fetch price
    fetchPrice(result.symbol, result.schemeCode);
  };

  // if (!isOpen) return null;

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    const assetName = searchQuery || formData.name;
    if (!assetName?.trim()) newErrors.name = 'Investment name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.subCategory) newErrors.subCategory = 'Sub-category is required';
    
    // Number validations
    if (formData.investedValue === undefined || (typeof formData.investedValue === 'number' && isNaN(formData.investedValue))) {
      newErrors.investedValue = 'Invested value is required';
    } else if (formData.investedValue < 0) {
      newErrors.investedValue = 'Invested value cannot be negative';
    }

    if (formData.currentValue !== undefined && formData.currentValue !== null) {
      if (isNaN(formData.currentValue) || formData.currentValue < 0) {
        newErrors.currentValue = 'Current value cannot be negative';
      }
    }

    if (formData.quantity !== undefined && formData.quantity !== null) {
      if (isNaN(formData.quantity) || formData.quantity < 0) {
        newErrors.quantity = 'Quantity cannot be negative';
      }
    }

    if (formData.price !== undefined && formData.price !== null) {
      if (isNaN(formData.price) || formData.price < 0) {
        newErrors.price = 'Price cannot be negative';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      ...formData,
      name: searchQuery || formData.name,
      lastUpdated: new Date().toISOString(),
      analysis: formData.analysis,
    } as Investment);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="relative bg-white w-full max-w-lg h-full shadow-2xl flex flex-col"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
              <div>
                <h3 className="font-bold text-xl text-slate-900">{initialData ? 'Edit Investment' : 'Add Investment'}</h3>
                <p className="text-xs text-slate-500 mt-1">Enter the details of your asset below</p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                <X size={24} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Section 1: Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Search className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Asset Identification</h4>
                  </div>
                  
                  {portfolio.selectedMemberId === 'family' && (
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Investor</label>
                      <select 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none bg-white text-sm font-medium"
                        value={formData.memberId || ''}
                        onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                      >
                        {portfolio.familyMembers.map(member => (
                          <option key={member.id} value={member.id}>{member.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="relative">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Search Investment Name</label>
                    <div className="relative">
                      <input 
                        required
                        type="text" 
                        className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none transition-all text-sm font-medium ${errors.name ? 'border-rose-500' : 'border-slate-200'}`}
                        value={searchQuery || ''}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          if (errors.name) setErrors(prev => ({ ...prev, name: '' }));
                        }}
                        placeholder="Search Stocks or Mutual Funds..."
                      />
                      <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        {isSearching ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                      </div>
                    </div>
                    {errors.name && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.name}</p>}

                    <AnimatePresence>
                      {showResults && searchResults.length > 0 && (
                        <motion.div 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute z-30 w-full mt-2 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden max-h-64 overflow-y-auto"
                        >
                          {searchResults.map((result, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => handleSelectResult(result)}
                              className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-50 last:border-none flex flex-col"
                            >
                              <span className="font-bold text-slate-900 text-sm">{result.name}</span>
                              <div className="flex items-center justify-between mt-1">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded uppercase tracking-wider">
                                    {result.symbol || result.schemeCode}
                                  </span>
                                  <span className="text-[10px] text-slate-400">{result.category} • {result.subCategory}</span>
                                </div>
                              </div>
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                      <select 
                        className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none bg-white text-sm font-medium ${errors.category ? 'border-rose-500' : 'border-slate-200'}`}
                        value={formData.category || 'Equity'}
                        onChange={(e) => {
                          const newCat = e.target.value as AssetCategory;
                          let defaultSub = '';
                          let defaultComposition = { debt: 0, equity: 0, globalEquity: 0, gold: 0, realEstate: 0, other: 0 };
                          
                          switch(newCat) {
                            case 'Equity': 
                              defaultSub = 'Equity Stocks'; 
                              defaultComposition.equity = 100;
                              break;
                            case 'Debt': 
                              defaultSub = 'Fixed Deposits'; 
                              defaultComposition.debt = 100;
                              break;
                            case 'Gold': 
                              defaultSub = 'Gold ETFs'; 
                              defaultComposition.gold = 100;
                              break;
                            case 'Hybrid': 
                              defaultSub = 'Hybrid Funds'; 
                              defaultComposition.equity = 50;
                              defaultComposition.debt = 50;
                              break;
                            case 'Alternative': defaultSub = 'AIF'; break;
                            case 'Real Estate': 
                              defaultSub = 'Residential'; 
                              defaultComposition.realEstate = 100;
                              break;
                            case 'Cash': 
                              defaultSub = 'Savings Account'; 
                              defaultComposition.debt = 100;
                              break;
                            case 'ESOP': 
                              defaultSub = 'Company ESOP'; 
                              defaultComposition.equity = 100;
                              break;
                            case 'PMS': 
                              defaultSub = 'Discretionary PMS'; 
                              defaultComposition.equity = 100;
                              break;
                            case 'AIF': 
                              defaultSub = 'Category II AIF'; 
                              break;
                            case 'Bonds': 
                              defaultSub = 'Corporate Bonds'; 
                              defaultComposition.debt = 100;
                              break;
                            case 'Fixed Deposit': 
                              defaultSub = 'Bank FD'; 
                              defaultComposition.debt = 100;
                              break;
                            case 'Debenture': 
                              defaultSub = 'NCD'; 
                              defaultComposition.debt = 100;
                              break;
                            case 'PF': 
                              defaultSub = 'EPF'; 
                              defaultComposition.debt = 100;
                              break;
                            case 'PPF': 
                              defaultSub = 'Public Provident Fund'; 
                              defaultComposition.debt = 100;
                              break;
                            case 'NPS': 
                              defaultSub = 'National Pension System'; 
                              defaultComposition.equity = 50;
                              defaultComposition.debt = 50;
                              break;
                            case 'International Fund': 
                              defaultSub = 'US Tech Fund'; 
                              defaultComposition.globalEquity = 100;
                              break;
                            case 'Global Stock': 
                              defaultSub = 'Direct US Stocks'; 
                              defaultComposition.globalEquity = 100;
                              break;
                          }
                          setFormData({ 
                            ...formData, 
                            category: newCat, 
                            subCategory: defaultSub,
                            composition: defaultComposition
                          });
                          if (errors.category) setErrors(prev => ({ ...prev, category: '' }));
                        }}
                      >
                        <option value="Equity">Equity</option>
                        <option value="Hybrid">Hybrid</option>
                        <option value="Debt">Debt</option>
                        <option value="Gold">Gold</option>
                        <option value="Alternative">Alternative</option>
                        <option value="Real Estate">Real Estate</option>
                        <option value="Cash">Cash</option>
                        <option value="ESOP">ESOP</option>
                        <option value="PMS">PMS</option>
                        <option value="AIF">AIF</option>
                        <option value="Bonds">Bonds</option>
                        <option value="Fixed Deposit">Fixed Deposit</option>
                        <option value="Debenture">Debenture</option>
                        <option value="PF">PF</option>
                        <option value="PPF">PPF</option>
                        <option value="NPS">NPS</option>
                        <option value="International Fund">International Fund</option>
                        <option value="Global Stock">Global Stock</option>
                      </select>
                      {errors.category && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.category}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sub-Category</label>
                      {formData.category === 'Equity' ? (
                        <select 
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none bg-white text-sm font-medium ${errors.subCategory ? 'border-rose-500' : 'border-slate-200'}`}
                          value={formData.subCategory || ''}
                          onChange={(e) => {
                            const subCat = e.target.value;
                            setFormData({ 
                              ...formData, 
                              subCategory: subCat,
                              currency: subCat === 'International Equity' ? 'USD' : 'INR'
                            });
                            if (errors.subCategory) setErrors(prev => ({ ...prev, subCategory: '' }));
                          }}
                        >
                          <option value="">Select Category</option>
                          <option value="Equity Stocks">Equity Stocks</option>
                          <option value="Equity Mutual Funds">Equity Mutual Funds</option>
                          <option value="Index Funds">Index Funds</option>
                          <option value="ELSS (Tax Saving)">ELSS (Tax Saving)</option>
                          <option value="International Equity">International Equity</option>
                          <option value="Unlisted Equity">Unlisted Equity</option>
                          <option value="Global Stocks">Global Stocks</option>
                        </select>
                      ) : formData.category === 'Debt' ? (
                        <select 
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none bg-white text-sm font-medium ${errors.subCategory ? 'border-rose-500' : 'border-slate-200'}`}
                          value={formData.subCategory || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, subCategory: e.target.value });
                            if (errors.subCategory) setErrors(prev => ({ ...prev, subCategory: '' }));
                          }}
                        >
                          <option value="">Select Category</option>
                          <option value="Fixed Deposits">Fixed Deposits</option>
                          <option value="Debt Mutual Funds">Debt Mutual Funds</option>
                          <option value="Government Schemes">Government Schemes (PPF/SSY)</option>
                          <option value="Bonds/NCDs">Bonds/NCDs</option>
                          <option value="Corporate Deposits">Corporate Deposits</option>
                          <option value="Debentures">Debentures</option>
                        </select>
                      ) : formData.category === 'Gold' ? (
                        <select 
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none bg-white text-sm font-medium ${errors.subCategory ? 'border-rose-500' : 'border-slate-200'}`}
                          value={formData.subCategory || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, subCategory: e.target.value });
                            if (errors.subCategory) setErrors(prev => ({ ...prev, subCategory: '' }));
                          }}
                        >
                          <option value="">Select Category</option>
                          <option value="Gold ETFs">Gold ETFs</option>
                          <option value="SGB (Sovereign Gold Bonds)">SGB (Sovereign Gold Bonds)</option>
                          <option value="Physical Gold">Physical Gold</option>
                          <option value="Digital Gold">Digital Gold</option>
                        </select>
                      ) : (
                        <input 
                          type="text" 
                          className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none text-sm font-medium ${errors.subCategory ? 'border-rose-500' : 'border-slate-200'}`}
                          value={formData.subCategory || ''}
                          onChange={(e) => {
                            setFormData({ ...formData, subCategory: e.target.value });
                            if (errors.subCategory) setErrors(prev => ({ ...prev, subCategory: '' }));
                          }}
                          placeholder="e.g. Real Estate, ESOP"
                        />
                      )}
                      {errors.subCategory && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.subCategory}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sector</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none text-sm font-medium"
                        value={formData.sector || ''}
                        onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                        placeholder="e.g. IT, Banking"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Entity Name / Provider</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none text-sm font-medium"
                        value={formData.entityName || ''}
                        onChange={(e) => setFormData({ ...formData, entityName: e.target.value })}
                        placeholder="e.g. ICICI Bank, Zerodha"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Fund House (AMC)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none text-sm font-medium"
                        value={formData.fundHouse || ''}
                        onChange={(e) => setFormData({ ...formData, fundHouse: e.target.value })}
                        placeholder="e.g. HDFC Mutual Fund"
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Financial Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Financial Position</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Stock Symbol (NSE)</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none text-sm font-medium"
                        value={formData.symbol || ''}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value.toUpperCase() })}
                        placeholder="e.g. RELIANCE.NS"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">MF Scheme Code</label>
                      <input 
                        type="text" 
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none text-sm font-medium"
                        value={formData.schemeCode || ''}
                        onChange={(e) => setFormData({ ...formData, schemeCode: e.target.value })}
                        placeholder="e.g. 120503"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center justify-between">
                        {formData.category === 'ESOP' ? 'Current Share Price' : 'Current Price / NAV'}
                        {(formData.symbol || formData.schemeCode) && (
                          <button 
                            type="button" 
                            onClick={() => fetchPrice(formData.symbol, formData.schemeCode)}
                            className="text-emerald-600 hover:text-emerald-700 disabled:opacity-50 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest"
                            disabled={isFetchingPrice}
                          >
                            {isFetchingPrice ? <Loader2 size={10} className="animate-spin" /> : <RefreshCw size={10} />}
                            Fetch Live
                          </button>
                        )}
                      </label>
                      <input 
                        type="number" 
                        step="0.01"
                        className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none text-sm font-medium ${errors.price ? 'border-rose-500' : 'border-slate-200'}`}
                        value={formData.price ?? ''}
                        onChange={(e) => {
                          const price = e.target.value === '' ? undefined : Number(e.target.value);
                          setFormData({ 
                            ...formData, 
                            price: price,
                                                      currentValue: (formData.quantity || 0) * (price || 0)
                          });
                          if (errors.price) setErrors(prev => ({ ...prev, price: '' }));
                        }}
                      />
                      {errors.price && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.price}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">NAV / Price Date</label>
                      <div className="relative">
                        <input 
                          type="date" 
                          className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none text-sm font-medium"
                          value={formData.navDate || ''}
                          onChange={(e) => setFormData({ ...formData, navDate: e.target.value })}
                        />
                        <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      </div>
                    </div>
                  </div>
                </div>

                {formData.category === 'ESOP' && (
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Briefcase className="w-4 h-4 text-emerald-500" />
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">ESOP Details</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Grant Date</label>
                        <input
                          type="date"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          value={formData.grantDate || ''}
                          onChange={(e) => setFormData({ ...formData, grantDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Exercise Price</label>
                        <input
                          type="number"
                          step="0.01"
                          className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          value={formData.exercisePrice ?? ''}
                          onChange={(e) => {
                            const price = e.target.value === '' ? undefined : Number(e.target.value);
                            const totalVestedAndExercised = (formData.vestingSchedule || [])
                              .filter(v => v.status === 'Vested' || v.status === 'Exercised')
                              .reduce((sum, v) => sum + (v.quantity || 0), 0);
                            setFormData({ 
                              ...formData, 
                              exercisePrice: price,
                              investedValue: totalVestedAndExercised * (price || 0)
                            });
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Options Granted</label>
                      <input
                        type="number"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        value={formData.totalOptions ?? ''}
                        onChange={(e) => setFormData({ ...formData, totalOptions: e.target.value === '' ? undefined : Number(e.target.value) })}
                      />
                    </div>

                    <div className="pt-2">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Vesting Schedule</h5>
                        <button
                          type="button"
                          onClick={addVestingEntry}
                          className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" />
                          Add Vesting
                        </button>
                      </div>

                      <div className="space-y-2">
                        {(formData.vestingSchedule || []).map((vesting) => (
                          <div key={vesting.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 group">
                            <input
                              type="date"
                              className="flex-1 px-2 py-1 text-xs border border-slate-100 rounded focus:ring-1 focus:ring-emerald-500/20 outline-none"
                              value={vesting.date || ''}
                              onChange={(e) => updateVestingEntry(vesting.id, 'date', e.target.value)}
                            />
                            <input
                              type="number"
                              className="w-20 px-2 py-1 text-xs border border-slate-100 rounded focus:ring-1 focus:ring-emerald-500/20 outline-none"
                              value={vesting.quantity ?? ''}
                              onChange={(e) => updateVestingEntry(vesting.id, 'quantity', e.target.value === '' ? undefined : Number(e.target.value))}
                              placeholder="Qty"
                            />
                            <select
                              className="w-24 px-2 py-1 text-xs border border-slate-100 rounded focus:ring-1 focus:ring-emerald-500/20 outline-none bg-white"
                              value={vesting.status || 'Unvested'}
                              onChange={(e) => updateVestingEntry(vesting.id, 'status', e.target.value as any)}
                            >
                              <option value="Unvested">Unvested</option>
                              <option value="Vested">Vested</option>
                              <option value="Exercised">Exercised</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeVestingEntry(vesting.id)}
                              className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        
                        {(!formData.vestingSchedule || formData.vestingSchedule.length === 0) && (
                          <div className="text-center py-4 border-2 border-dashed border-slate-200 rounded-xl bg-white/50">
                            <p className="text-[10px] text-slate-400 font-medium">No vesting schedule added.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Purchase History Section */}
                {formData.category !== 'ESOP' && (
                  <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-emerald-500" />
                        Purchase History
                      </h4>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => document.getElementById('capital-register-upload')?.click()}
                          className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors shadow-sm"
                        >
                          <Upload className="w-3 h-3" />
                          Upload Data
                        </button>
                        <input 
                          id="capital-register-upload"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              // Mock parsing for now
                              alert(`File "${file.name}" uploaded successfully. In a real app, this would parse your capital register and populate the purchase history.`);
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={addPurchase}
                          className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-emerald-100 transition-colors shadow-sm"
                        >
                          <Plus className="w-3 h-3" />
                          Add Buy
                        </button>
                      </div>
                    </div>

                  <div className="space-y-3">
                    {(formData.purchases || []).map((purchase) => (
                      <div key={purchase.id} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 group shadow-sm">
                        <div className="flex-1 grid grid-cols-3 gap-3">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Date</label>
                            <input
                              type="date"
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                              value={purchase.date || ''}
                              onChange={(e) => updatePurchase(purchase.id, 'date', e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Qty</label>
                            <input
                              type="number"
                              step="0.001"
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                              value={purchase.quantity ?? ''}
                              onChange={(e) => updatePurchase(purchase.id, 'quantity', e.target.value === '' ? undefined : Number(e.target.value))}
                              placeholder="Qty"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Price</label>
                            <input
                              type="number"
                              step="0.01"
                              className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                              value={purchase.price ?? ''}
                              onChange={(e) => updatePurchase(purchase.id, 'price', e.target.value === '' ? undefined : Number(e.target.value))}
                              placeholder="Price"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePurchase(purchase.id)}
                          className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors mt-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                    
                    {(!formData.purchases || formData.purchases.length === 0) && (
                      <div className="text-center py-6 border-2 border-dashed border-slate-200 rounded-2xl bg-white/50">
                        <p className="text-sm text-slate-400 font-medium">No purchase history added yet.</p>
                        <p className="text-[10px] text-slate-400 mt-1">Add your buys to calculate average cost automatically.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Quantity</label>
                    <input 
                      required
                      type="number" 
                      step="0.001"
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none transition-all text-sm font-medium ${errors.quantity ? 'border-rose-500' : 'border-slate-200'} ${(formData.purchases?.length || formData.category === 'ESOP') ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-emerald-500/20 focus:bg-white'}`}
                      value={formData.quantity ?? ''}
                      readOnly={(formData.purchases && formData.purchases.length > 0) || formData.category === 'ESOP'}
                      onChange={(e) => {
                        const qty = e.target.value === '' ? undefined : Number(e.target.value);
                        setFormData({ 
                          ...formData, 
                          quantity: qty,
                          currentValue: (qty || 0) * (formData.price || 0),
                          investedValue: (qty || 0) * (formData.buyPrice || 0)
                        });
                        if (errors.quantity) setErrors(prev => ({ ...prev, quantity: '' }));
                      }}
                    />
                    {errors.quantity && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.quantity}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Avg. Buy Price</label>
                    <input 
                      type="number" 
                      step="0.01"
                      className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none transition-all text-sm font-medium ${(formData.purchases?.length || formData.category === 'ESOP') ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-emerald-500/20 focus:bg-white'}`}
                      value={formData.buyPrice ?? ''}
                      readOnly={(formData.purchases && formData.purchases.length > 0) || formData.category === 'ESOP'}
                      onChange={(e) => {
                        const buyPrice = e.target.value === '' ? undefined : Number(e.target.value);
                        setFormData({ 
                          ...formData, 
                          buyPrice: buyPrice,
                          investedValue: (formData.quantity || 0) * (buyPrice || 0)
                        });
                      }}
                      placeholder="e.g. 2450.50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Total Invested</label>
                    <input 
                      required
                      type="number" 
                      className={`w-full px-4 py-2.5 bg-slate-50 border rounded-xl outline-none transition-all text-sm font-medium ${errors.investedValue ? 'border-rose-500' : 'border-slate-200'} ${(formData.purchases?.length || formData.category === 'ESOP') ? 'opacity-60 cursor-not-allowed' : 'focus:ring-2 focus:ring-emerald-500/20 focus:bg-white'}`}
                      value={formData.investedValue ?? ''}
                      readOnly={(formData.purchases && formData.purchases.length > 0) || formData.category === 'ESOP'}
                      onChange={(e) => {
                        const invested = e.target.value === '' ? undefined : Number(e.target.value);
                        setFormData({ 
                          ...formData, 
                          investedValue: invested,
                          buyPrice: (formData.quantity && formData.quantity > 0) ? (invested || 0) / formData.quantity : 0
                        });
                        if (errors.investedValue) setErrors(prev => ({ ...prev, investedValue: '' }));
                      }}
                    />
                    {errors.investedValue && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.investedValue}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Current Value</label>
                    <input 
                      required
                      type="number" 
                      step="any"
                      className={`w-full px-4 py-2.5 border rounded-xl bg-slate-50 outline-none font-black text-slate-900 text-sm ${errors.currentValue ? 'border-rose-500 shadow-[0_0_0_1px_rgba(244,63,94,0.1)]' : 'border-slate-200 focus:border-wealth-gold'}`}
                      value={formData.currentValue ?? ''}
                      onChange={(e) => {
                        const val = e.target.value === '' ? 0 : Number(e.target.value);
                        setFormData(prev => ({
                          ...prev,
                          currentValue: val,
                          price: (prev.quantity && prev.quantity > 0) ? val / prev.quantity : prev.price
                        }));
                      }}
                    />
                    {errors.currentValue && <p className="text-[10px] font-bold text-rose-500 mt-1 ml-1">{errors.currentValue}</p>}
                  </div>
                </div>

                {/* Section 3: Asset Composition */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Asset Composition (%)</h4>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Equity</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        value={formData.composition?.equity ?? 0}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          composition: { ...formData.composition!, equity: Number(e.target.value) } 
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Debt</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        value={formData.composition?.debt ?? 0}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          composition: { ...formData.composition!, debt: Number(e.target.value) } 
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Global Eq</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        value={formData.composition?.globalEquity ?? 0}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          composition: { ...formData.composition!, globalEquity: Number(e.target.value) } 
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Gold</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        value={formData.composition?.gold ?? 0}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          composition: { ...formData.composition!, gold: Number(e.target.value) } 
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Real Estate</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        value={formData.composition?.realEstate ?? 0}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          composition: { ...formData.composition!, realEstate: Number(e.target.value) } 
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Other</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                        value={formData.composition?.other ?? 0}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          composition: { ...formData.composition!, other: Number(e.target.value) } 
                        })}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-3 py-2 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Composition</span>
                    <span className={`text-xs font-black ${
                      (Object.values(formData.composition || {}).reduce((a, b) => a + b, 0)) !== 100 
                        ? 'text-rose-600' : 'text-emerald-600'
                    }`}>
                      {Object.values(formData.composition || {}).reduce((a, b) => a + b, 0)}%
                    </span>
                  </div>
                </div>

                {/* Section 4: Strategic Allocation */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <Target className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Strategic Allocation</h4>
                  </div>

                  <div className="bg-emerald-50 rounded-2xl p-5 border border-emerald-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600" />
                          Goal Allocation
                        </h4>
                        <p className="text-[10px] text-emerald-600/70 font-medium">
                          {formData.isSIP ? 'Allocate your monthly SIP amount to specific goals' : 'Allocate this investment to specific goals'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={addGoalMapping}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-white px-3 py-1.5 rounded-lg border border-emerald-100 transition-colors shadow-sm"
                      >
                        <Plus className="w-3 h-3" />
                        Map to Goal
                      </button>
                    </div>

                    <div className="space-y-3">
                      {(formData.goalMappings || []).map((mapping, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded-xl border border-emerald-100 group shadow-sm">
                          <div className="flex-1 grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Goal</label>
                              <select
                                className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none bg-white"
                                value={mapping.goalId || ''}
                                onChange={(e) => updateGoalMapping(idx, 'goalId', e.target.value)}
                              >
                                <option value="">Select Goal</option>
                                {portfolio.goals.map(goal => (
                                  <option key={goal.id} value={goal.id}>{goal.name}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Allocation (%)</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 outline-none"
                                  value={mapping.percentage ?? ''}
                                  onChange={(e) => updateGoalMapping(idx, 'percentage', e.target.value === '' ? undefined : Number(e.target.value))}
                                  placeholder="%"
                                />
                                {formData.isSIP && formData.sipAmount && mapping.percentage > 0 && (
                                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] font-bold text-emerald-600">
                                    ₹{((formData.sipAmount * mapping.percentage) / 100).toLocaleString('en-IN')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeGoalMapping(idx)}
                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors mt-4"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      {(formData.goalMappings || []).length > 0 && (
                        <div className="flex items-center justify-between px-3 py-2 bg-white/50 rounded-xl border border-emerald-100/50">
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Allocated</span>
                          <span className={`text-xs font-black ${(formData.goalMappings || []).reduce((sum, m) => sum + (m.percentage || 0), 0) > 100 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {(formData.goalMappings || []).reduce((sum, m) => sum + (m.percentage || 0), 0)}%
                          </span>
                        </div>
                      )}

                      {(!formData.goalMappings || formData.goalMappings.length === 0) && (
                        <div className="text-center py-4 border-2 border-dashed border-emerald-100 rounded-2xl bg-white/50">
                          <p className="text-xs text-emerald-600/60 font-medium">Not mapped to any specific goal yet.</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Retirement Bucket</label>
                    <select 
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none bg-white text-sm font-medium"
                      value={formData.retirementBucket || 'None'}
                      onChange={(e) => setFormData({ ...formData, retirementBucket: e.target.value as RetirementBucket })}
                    >
                      <option value="None">None</option>
                      <option value="Short-term">Short-term (0-3 years)</option>
                      <option value="Medium-term">Medium-term (3-7 years)</option>
                      <option value="Long-term">Long-term (7+ years)</option>
                    </select>
                    <p className="text-[10px] text-slate-400 mt-1 italic">Used for Bucket Strategy in Retirement Planner</p>
                  </div>
                </div>

                {/* Section 4: Performance Metrics */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                    <BarChart3 className="w-4 h-4 text-emerald-500" />
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-widest">Performance Metrics</h4>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">1Y Ret (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none text-sm font-medium"
                        value={formData.return1Y ?? ''}
                        onChange={(e) => setFormData({ ...formData, return1Y: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="e.g. 12.5"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">3Y Ret (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none text-sm font-medium"
                        value={formData.return3Y ?? ''}
                        onChange={(e) => setFormData({ ...formData, return3Y: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="e.g. 15.2"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">5Y Ret (%)</label>
                      <input 
                        type="number" 
                        step="0.1"
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:bg-white outline-none text-sm font-medium"
                        value={formData.return5Y ?? ''}
                        onChange={(e) => setFormData({ ...formData, return5Y: e.target.value === '' ? undefined : Number(e.target.value) })}
                        placeholder="e.g. 18.0"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-t border-slate-100 pt-6">
                  <div className="flex items-center gap-3">
                    <input 
                      type="checkbox" 
                      id="isSIP"
                      className="w-5 h-5 text-emerald-600 rounded-lg border-slate-200 focus:ring-emerald-500 cursor-pointer"
                      checked={formData.isSIP || false}
                      onChange={(e) => setFormData({ ...formData, isSIP: e.target.checked })}
                    />
                    <label htmlFor="isSIP" className="text-sm font-bold text-slate-700 cursor-pointer">Is this an active SIP?</label>
                  </div>
                  
                  {formData.isSIP && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Monthly SIP</label>
                        <input 
                          type="number" 
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          value={formData.sipAmount ?? ''}
                          onChange={(e) => setFormData({ ...formData, sipAmount: e.target.value === '' ? undefined : Number(e.target.value) })}
                          placeholder="e.g. 5000"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Start Date</label>
                        <input 
                          type="date" 
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          value={formData.sipStartDate || ''}
                          onChange={(e) => setFormData({ ...formData, sipStartDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Next Date</label>
                        <input 
                          type="date" 
                          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 outline-none"
                          value={formData.sipNextDate || ''}
                          onChange={(e) => setFormData({ ...formData, sipNextDate: e.target.value })}
                        />
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>

              <div className="p-6 border-t border-slate-100 bg-slate-50 flex gap-3 sticky bottom-0 z-20">
                {onAnalyze && (
                  <button 
                    type="button"
                    onClick={() => {
                      const invToAnalyze: Investment = {
                        ...formData,
                        id: initialData?.id || 'temp',
                        name: formData.name || searchQuery || 'New Investment',
                        category: formData.category || 'Equity',
                        subCategory: formData.subCategory || '',
                        investedValue: formData.investedValue || 0,
                        currentValue: formData.currentValue || 0,
                        price: formData.price || 0,
                        purchases: formData.purchases || [],
                        lastUpdated: new Date().toISOString()
                      } as Investment;
                      onAnalyze(invToAnalyze);
                    }}
                    className="px-6 py-3 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-xl font-bold hover:bg-indigo-100 transition-all shadow-sm flex items-center gap-2"
                  >
                    <Sparkles size={18} />
                    Analyze
                  </button>
                )}
                <button 
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-white transition-all shadow-sm"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  {initialData ? 'Update Investment' : 'Save Investment'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default InvestmentModal;
