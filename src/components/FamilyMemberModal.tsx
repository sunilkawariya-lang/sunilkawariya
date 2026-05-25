import React, { useState } from 'react';
import { X, User, Users, Heart, Baby, Home, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FamilyMember } from '../types';

interface FamilyMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (member: FamilyMember) => void;
  initialData?: FamilyMember;
}

export default function FamilyMemberModal({ isOpen, onClose, onSave, initialData }: FamilyMemberModalProps) {
  const [formData, setFormData] = useState<FamilyMember>(
    initialData || {
      id: '',
      name: '',
      relationship: 'Other',
      isDependent: false,
    }
  );

  React.useEffect(() => {
    if (isOpen) {
      setFormData(initialData || {
        id: '',
        name: '',
        relationship: 'Other',
        isDependent: false,
      });
    }
  }, [isOpen, initialData]);

  const relationships: { value: FamilyMember['relationship']; icon: any; label: string }[] = [
    { value: 'Self', icon: User, label: 'Self' },
    { value: 'Spouse', icon: Heart, label: 'Spouse' },
    { value: 'Child', icon: Baby, label: 'Child' },
    { value: 'Parent', icon: Home, label: 'Parent' },
    { value: 'Other', icon: Users, label: 'Other' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-600 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                  <Users size={20} />
                </div>
                <h2 className="text-xl font-bold">{initialData ? 'Edit Member' : 'Add Family Member'}</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-xl transition-all">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Member Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    placeholder="Enter name"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Age</label>
                  <input
                    type="number"
                    required
                    min="0"
                    max="120"
                    value={formData.age ?? ''}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value === '' ? undefined : Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    placeholder="Age"
                  />
                </div>
              </div>

              {(formData.relationship === 'Self' || formData.relationship === 'Spouse') && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 ml-1">Occupation</label>
                  <input
                    type="text"
                    value={formData.occupation || ''}
                    onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-medium"
                    placeholder="e.g. Software Engineer, Doctor"
                  />
                </div>
              )}

              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 ml-1">Relationship</label>
                <div className="grid grid-cols-3 gap-2">
                  {relationships.map((rel) => (
                    <button
                      key={rel.value}
                      type="button"
                      onClick={() => setFormData({ ...formData, relationship: rel.value })}
                      className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all ${
                        formData.relationship === rel.value
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-sm'
                          : 'bg-white border-slate-200 text-slate-500 hover:border-emerald-200'
                      }`}
                    >
                      <rel.icon size={20} />
                      <span className="text-xs font-bold">{rel.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                    <Baby size={18} className="text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900">Financial Dependent</p>
                    <p className="text-[10px] text-slate-500">Is this member dependent on you?</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, isDependent: !formData.isDependent })}
                  className={`w-12 h-6 rounded-full transition-all relative ${
                    formData.isDependent ? 'bg-emerald-600' : 'bg-slate-300'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                      formData.isDependent ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 flex items-center justify-center gap-2"
              >
                <Plus size={20} />
                {initialData ? 'Update Member' : 'Add Member'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
