import React from 'react';
import { Users, User, ChevronDown, Plus, Edit2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { FamilyMember } from '../types';

interface MemberSelectorProps {
  members: FamilyMember[];
  selectedId: string | 'family';
  onSelect: (id: string | 'family') => void;
  onAddMember: () => void;
  onEditMember: (member: FamilyMember) => void;
}

export default function MemberSelector({ members, selectedId, onSelect, onAddMember, onEditMember }: MemberSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedMember = members.find(m => m.id === selectedId);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm"
      >
        <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
          {selectedId === 'family' ? <Users size={16} /> : <User size={16} />}
        </div>
        <div className="text-left hidden sm:block">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none mb-1">Portfolio View</p>
          <p className="text-sm font-bold text-slate-900 leading-none">
            {selectedId === 'family' ? 'Family Consolidated' : selectedMember?.name}
          </p>
        </div>
        <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 overflow-hidden"
          >
            <div className="space-y-1">
              <button
                onClick={() => { onSelect('family'); setIsOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  selectedId === 'family' ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'
                }`}
              >
                <div className={`p-1.5 rounded-lg ${selectedId === 'family' ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  <Users size={16} />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Family Consolidated</p>
                  <p className="text-[10px] opacity-70">All members combined</p>
                </div>
              </button>

              <div className="h-px bg-slate-100 my-1 mx-2" />

              {members.map(member => (
                <div
                  key={member.id}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                    selectedId === member.id ? 'bg-emerald-50 text-emerald-700' : 'hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <button
                    onClick={() => { onSelect(member.id); setIsOpen(false); }}
                    className="flex-1 flex items-center gap-3 text-left"
                  >
                    <div className={`p-1.5 rounded-lg ${selectedId === member.id ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                      <User size={16} />
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-bold">{member.name}</p>
                      <p className="text-[10px] opacity-70">
                        {member.relationship}{member.age ? ` • ${member.age} yrs` : ''}
                      </p>
                    </div>
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); onEditMember(member); setIsOpen(false); }}
                    className="p-1.5 hover:bg-white rounded-lg text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-all"
                    title="Edit Member"
                  >
                    <Edit2 size={14} />
                  </button>
                </div>
              ))}

              <div className="h-px bg-slate-100 my-1 mx-2" />

              <button
                onClick={() => { onAddMember(); setIsOpen(false); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-emerald-600 hover:bg-emerald-50 transition-all"
              >
                <div className="p-1.5 bg-emerald-100 rounded-lg">
                  <Plus size={16} />
                </div>
                <span className="text-sm font-bold">Add Family Member</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
