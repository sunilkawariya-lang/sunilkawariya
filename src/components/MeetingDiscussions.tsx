import React, { useState } from 'react';
import { MessageSquare, Plus, Calendar, Users, Trash2, Edit2, Search, Filter, ChevronRight, CheckSquare, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { MeetingDiscussion } from '../types';
import { format } from 'date-fns';

export default function MeetingDiscussions() {
  const { portfolio, addMeetingDiscussion, updateMeetingDiscussion, deleteMeetingDiscussion } = useFirebase();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('All');

  const [formData, setFormData] = useState<Partial<MeetingDiscussion>>({
    title: '',
    date: new Date().toISOString().split('T')[0],
    summary: '',
    actionItems: [],
    attendees: [],
    nextMeetingDate: ''
  });

  const [newActionItem, setNewActionItem] = useState('');
  const [newAttendee, setNewAttendee] = useState('');

  const filteredDiscussions = portfolio.meetingDiscussions.filter(disc => {
    const matchesSearch = disc.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         disc.summary.toLowerCase().includes(searchTerm.toLowerCase());
    // Simple date filter logic
    if (dateFilter === 'Last 30 Days') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return matchesSearch && new Date(disc.date) >= thirtyDaysAgo;
    }
    return matchesSearch;
  }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleOpenModal = (disc?: MeetingDiscussion) => {
    if (disc) {
      setFormData(disc);
      setEditingId(disc.id);
    } else {
      setFormData({
        title: '',
        date: new Date().toISOString().split('T')[0],
        summary: '',
        actionItems: [],
        attendees: [],
        nextMeetingDate: ''
      });
      setEditingId(null);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.date) return;

    if (editingId) {
      await updateMeetingDiscussion(formData);
    } else {
      await addMeetingDiscussion(formData);
    }
    setIsModalOpen(false);
  };

  const addActionItem = () => {
    if (!newActionItem.trim()) return;
    setFormData({
      ...formData,
      actionItems: [...(formData.actionItems || []), newActionItem.trim()]
    });
    setNewActionItem('');
  };

  const removeActionItem = (index: number) => {
    setFormData({
      ...formData,
      actionItems: formData.actionItems?.filter((_, i) => i !== index)
    });
  };

  const addAttendee = () => {
    if (!newAttendee.trim()) return;
    setFormData({
      ...formData,
      attendees: [...(formData.attendees || []), newAttendee.trim()]
    });
    setNewAttendee('');
  };

  const removeAttendee = (index: number) => {
    setFormData({
      ...formData,
      attendees: formData.attendees?.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <MessageSquare className="text-indigo-600" />
            Meeting Discussions
          </h2>
          <p className="text-slate-500 text-sm">Keep track of financial planning meetings and action items.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-sm"
        >
          <Plus size={18} />
          New Meeting Note
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search discussions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={18} />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
          >
            <option value="All">All Time</option>
            <option value="Last 30 Days">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Discussion List */}
      <div className="space-y-4">
        {filteredDiscussions.map((disc) => (
          <motion.div
            key={disc.id}
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
          >
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-bold text-slate-900">{disc.title}</h3>
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      {format(new Date(disc.date), 'dd MMM yyyy')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      {disc.attendees.join(', ') || 'No attendees listed'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleOpenModal(disc)}
                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button
                    onClick={() => deleteMeetingDiscussion(disc.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {disc.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {disc.actionItems.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                      <CheckSquare size={14} className="text-emerald-500" />
                      Action Items
                    </h4>
                    <ul className="space-y-2">
                      {disc.actionItems.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600">
                          <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 flex-shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {disc.nextMeetingDate && (
                  <div className="flex flex-col justify-end">
                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center gap-3">
                      <div className="p-2 bg-amber-100 text-amber-600 rounded-lg">
                        <Clock size={16} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Next Meeting</p>
                        <p className="text-sm font-bold text-amber-900">
                          {format(new Date(disc.nextMeetingDate), 'EEEE, dd MMM yyyy')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}

        {filteredDiscussions.length === 0 && (
          <div className="py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="inline-flex p-4 bg-slate-50 text-slate-400 rounded-2xl mb-4">
              <MessageSquare size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No meeting notes found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              Start documenting your financial discussions and planning sessions here.
            </p>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-indigo-50/50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  {editingId ? <Edit2 className="text-indigo-600" /> : <Plus className="text-indigo-600" />}
                  {editingId ? 'Edit Meeting Note' : 'New Meeting Note'}
                </h3>
                <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <Trash2 size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Meeting Title</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g., Quarterly Portfolio Review"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Date</label>
                    <input
                      required
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Summary & Discussion</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="What was discussed? Key decisions made..."
                    value={formData.summary}
                    onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Attendees */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Attendees</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add name..."
                        value={newAttendee}
                        onChange={(e) => setNewAttendee(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAttendee())}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={addAttendee}
                        className="p-2 bg-indigo-100 text-indigo-600 rounded-xl hover:bg-indigo-200 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.attendees?.map((name, idx) => (
                        <span key={idx} className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
                          {name}
                          <button type="button" onClick={() => removeAttendee(idx)} className="hover:text-rose-600">
                            <Trash2 size={12} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Items */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Action Items</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Add task..."
                        value={newActionItem}
                        onChange={(e) => setNewActionItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addActionItem())}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-sm"
                      />
                      <button
                        type="button"
                        onClick={addActionItem}
                        className="p-2 bg-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-200 transition-all"
                      >
                        <Plus size={20} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {formData.actionItems?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border border-slate-100 rounded-xl group">
                          <span className="text-xs text-slate-600">{item}</span>
                          <button type="button" onClick={() => removeActionItem(idx)} className="text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-all">
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Next Meeting Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.nextMeetingDate}
                    onChange={(e) => setFormData({ ...formData, nextMeetingDate: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                  >
                    {editingId ? 'Update Note' : 'Save Meeting Note'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
