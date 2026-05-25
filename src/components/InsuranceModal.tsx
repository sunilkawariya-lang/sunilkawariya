
import React, { useState, useEffect } from 'react';
import { X, Shield, Calendar, IndianRupee, User, Building2, FileText, RefreshCw } from 'lucide-react';
import { InsurancePolicy, InsuranceType, FamilyMember } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface InsuranceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (policy: InsurancePolicy) => void;
  editingPolicy: InsurancePolicy | null;
  familyMembers: FamilyMember[];
}

const InsuranceModal: React.FC<InsuranceModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingPolicy,
  familyMembers
}) => {
  const [formData, setFormData] = useState<Partial<InsurancePolicy>>({
    name: '',
    provider: '',
    type: 'Term',
    sumAssured: 0,
    premium: 0,
    premiumFrequency: 'Yearly',
    startDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nominee: '',
    status: 'Active',
    memberId: familyMembers[0]?.id || ''
  });

  useEffect(() => {
    if (editingPolicy) {
      setFormData(editingPolicy);
    } else {
      setFormData({
        name: '',
        provider: '',
        type: 'Term',
        sumAssured: 0,
        premium: 0,
        premiumFrequency: 'Yearly',
        startDate: new Date().toISOString().split('T')[0],
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nominee: '',
        status: 'Active',
        memberId: familyMembers[0]?.id || ''
      });
    }
  }, [editingPolicy, familyMembers]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: editingPolicy?.id || Math.random().toString(36).substr(2, 9),
      lastUpdated: new Date().toISOString()
    } as InsurancePolicy);
    onClose();
  };

  const insuranceTypes: InsuranceType[] = ['Term', 'Health', 'Motor', 'ULIP', 'Endowment', 'MoneyBack', 'Critical Illness'];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-wealth-emerald/10 text-wealth-emerald rounded-xl">
                <Shield size={24} />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                  {editingPolicy ? 'Edit Policy' : 'Add New Insurance'}
                </h2>
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Insurance Portfolio Management</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-xl transition-colors">
              <X size={20} className="text-slate-400" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} /> Family Member
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.memberId}
                  onChange={(e) => setFormData({ ...formData, memberId: e.target.value })}
                  required
                >
                  {familyMembers.map(member => (
                    <option key={member.id} value={member.id}>{member.name} ({member.relationship})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Shield size={12} /> Policy Name
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  placeholder="e.g. HDFC Life Click 2 Protect"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Building2 size={12} /> Provider
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  placeholder="e.g. HDFC Life, ICICI Prudential"
                  value={formData.provider}
                  onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} /> Policy Type
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as InsuranceType })}
                  required
                >
                  {insuranceTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <IndianRupee size={12} /> Sum Assured
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.sumAssured}
                  onChange={(e) => setFormData({ ...formData, sumAssured: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <IndianRupee size={12} /> Premium Amount
                </label>
                <input
                  type="number"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.premium}
                  onChange={(e) => setFormData({ ...formData, premium: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw size={12} /> Premium Frequency
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.premiumFrequency}
                  onChange={(e) => setFormData({ ...formData, premiumFrequency: e.target.value as any })}
                  required
                >
                  <option value="Monthly">Monthly</option>
                  <option value="Quarterly">Quarterly</option>
                  <option value="Half-Yearly">Half-Yearly</option>
                  <option value="Yearly">Yearly</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <RefreshCw size={12} /> Policy Status
                </label>
                <select
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  required
                >
                  <option value="Active">Active</option>
                  <option value="Lapsed">Lapsed</option>
                  <option value="Matured">Matured</option>
                  <option value="Surrendered">Surrendered</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} /> Nominee
                </label>
                <input
                  type="text"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  placeholder="e.g. Spouse Name"
                  value={formData.nominee}
                  onChange={(e) => setFormData({ ...formData, nominee: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> Start Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={12} /> Expiry Date
                </label>
                <input
                  type="date"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wealth-emerald/10 focus:border-wealth-emerald transition-all text-sm font-bold"
                  value={formData.expiryDate}
                  onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="pt-6 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-[2] px-6 py-4 bg-wealth-emerald text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 shadow-lg shadow-emerald-100 transition-all"
              >
                {editingPolicy ? 'Update Policy' : 'Save Policy'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default InsuranceModal;
