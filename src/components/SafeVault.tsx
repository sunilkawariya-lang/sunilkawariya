import React, { useState } from 'react';
import { 
  Shield, Plus, FileText, Trash2, Calendar, User, Search, Filter, 
  Download, ExternalLink, AlertCircle, File, Image, FileArchive, 
  FileSpreadsheet, FileWarning, Eye, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useFirebase } from '../contexts/FirebaseContext';
import { SafeDocument } from '../types';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function SafeVault() {
  const { portfolio, addSafeDocument, deleteSafeDocument, uploadFile } = useFirebase();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [memberFilter, setMemberFilter] = useState<string>('All');

  const [newDoc, setNewDoc] = useState<Partial<SafeDocument>>({
    memberId: portfolio.familyMembers[0]?.id || '',
    category: 'Identity',
    name: '',
    notes: '',
    expiryDate: ''
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const categories = ['Identity', 'Property', 'Investment', 'Insurance', 'Tax', 'Other'];

  const getFileIcon = (mimeType: string) => {
    if (!mimeType) return <FileText size={24} />;
    if (mimeType.includes('image')) return <Image size={24} />;
    if (mimeType.includes('pdf')) return <FileText size={24} className="text-rose-600" />;
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) return <FileSpreadsheet size={24} className="text-emerald-600" />;
    if (mimeType.includes('word') || mimeType.includes('officedocument.wordprocessingml')) return <FileText size={24} className="text-blue-600" />;
    if (mimeType.includes('zip') || mimeType.includes('compressed')) return <FileArchive size={24} />;
    return <File size={24} />;
  };

  const validateFile = (file: File) => {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (file.size > maxSize) {
      toast.error('File too large', { description: 'Maximum file size is 5MB' });
      return false;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Unsupported file type', { description: 'Please upload PDF, JPG, PNG, DOC or Excel files' });
      return false;
    }

    return true;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
        // Auto-fill name if empty
        if (!newDoc.name) {
          setNewDoc(prev => ({ ...prev, name: file.name.split('.')[0] }));
        }
      } else {
        e.target.value = ''; // Reset input
      }
    }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDoc.name || !newDoc.memberId || !selectedFile) {
      toast.error('Incomplete information', { description: 'Please provide document name and select a file' });
      return;
    }

    setIsUploading(true);
    try {
      const fileUrl = await uploadFile(selectedFile, 'vault');
      const mimeType = selectedFile.type;

      await addSafeDocument({
        ...newDoc,
        uploadDate: new Date().toISOString(),
        fileUrl, // Use correct field for URL
        mimeType
      });

      toast.success('Document uploaded successfully');
      setIsAddModalOpen(false);
      setNewDoc({
        memberId: portfolio.familyMembers[0]?.id || '',
        category: 'Identity',
        name: '',
        notes: '',
        expiryDate: ''
      });
      setSelectedFile(null);
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Upload failed', { description: 'There was an error uploading your document. Please try again.' });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = (doc: SafeDocument) => {
    const url = doc.fileUrl || doc.fileData;
    if (!url) return;
    
    // For cloud URLs, we can just open in new tab or use download attribute
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      // Legacy base64 support
      const link = document.createElement('a');
      link.href = url;
      link.download = doc.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleView = (doc: SafeDocument) => {
    const url = doc.fileUrl || doc.fileData;
    if (!url) return;
    
    if (url.startsWith('http')) {
      window.open(url, '_blank');
    } else {
      const win = window.open();
      if (win) {
        win.document.write(`<iframe src="${url}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
      }
    }
  };

  const getMemberName = (id: string) => {
    return portfolio.familyMembers.find(m => m.id === id)?.name || 'Unknown';
  };

  const filteredDocs = portfolio.safeDocuments.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'All' || doc.category === categoryFilter;
    const matchesMember = memberFilter === 'All' || doc.memberId === memberFilter;
    return matchesSearch && matchesCategory && matchesMember;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Shield className="text-emerald-600" />
            Safe Document Vault
          </h2>
          <p className="text-slate-500 text-sm">Securely store and manage your family's important documents using encrypted cloud storage.</p>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 font-bold"
        >
          <Plus size={18} />
          Add Document
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-slate-400" size={18} />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          >
            <option value="All">All Categories</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <User className="text-slate-400" size={18} />
          <select
            value={memberFilter}
            onChange={(e) => setMemberFilter(e.target.value)}
            className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          >
            <option value="All">All Members</option>
            {portfolio.familyMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredDocs.map((doc) => (
            <motion.div
              key={doc.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group overflow-hidden"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-3 rounded-xl ${(doc.fileUrl || doc.fileData)?.startsWith('http') ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}>
                  {getFileIcon(doc.mimeType || '')}
                </div>
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) {
                      deleteSafeDocument(doc.id);
                    }
                  }}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              
              <h3 className="font-bold text-slate-900 mb-1 truncate">{doc.name}</h3>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-4">
                <span className="px-2 py-0.5 bg-slate-100 rounded-full">{doc.category}</span>
                <span>•</span>
                <span>{getMemberName(doc.memberId)}</span>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-[11px] text-slate-500">
                  <Calendar size={12} />
                  Added: {format(new Date(doc.uploadDate), 'dd MMM yyyy')}
                </div>
                {doc.expiryDate && (
                  <div className={`flex items-center gap-2 text-[11px] ${new Date(doc.expiryDate) < new Date() ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
                    <AlertCircle size={12} />
                    Expires: {format(new Date(doc.expiryDate), 'dd MMM yyyy')}
                  </div>
                )}
                {doc.fileUrl?.startsWith('http') && (
                  <div className="flex items-center gap-2 text-[11px] text-emerald-600 font-medium">
                    <CheckCircle2 size={12} />
                    Cloud Storage Secured
                  </div>
                )}
              </div>

              {doc.notes && (
                <p className="text-xs text-slate-500 line-clamp-2 mb-4 bg-slate-50 p-2 rounded-lg">
                  {doc.notes}
                </p>
              )}

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleDownload(doc)}
                  disabled={!doc.fileUrl && !doc.fileData}
                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-slate-200"
                >
                  <Download size={14} />
                  {(doc.fileUrl || doc.fileData)?.startsWith('http') ? 'Open' : 'Download'}
                </button>
                <button 
                  onClick={() => handleView(doc)}
                  disabled={!doc.fileUrl && !doc.fileData}
                  className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  title="View Document"
                >
                  <Eye size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredDocs.length === 0 && (
          <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-slate-200">
            <div className="inline-flex p-4 bg-slate-50 text-slate-400 rounded-2xl mb-4">
              <FileWarning size={32} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No documents found</h3>
            <p className="text-slate-500 max-w-xs mx-auto">
              {searchTerm || categoryFilter !== 'All' || memberFilter !== 'All' 
                ? "Try adjusting your filters to find what you're looking for."
                : "Start by adding your first important document to the vault."}
            </p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-emerald-50/50">
                <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <div className="p-2 bg-emerald-600 rounded-lg text-white">
                    <Shield size={20} />
                  </div>
                  Secure Document Upload
                </h3>
                <button onClick={() => setIsAddModalOpen(false)} className="p-2 hover:bg-white rounded-xl transition-all">
                  <Trash2 size={20} className="text-slate-400" />
                </button>
              </div>

              <form onSubmit={handleAddDoc} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto custom-scrollbar">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Family Member</label>
                    <select
                      required
                      value={newDoc.memberId}
                      onChange={(e) => setNewDoc({ ...newDoc, memberId: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    >
                      {portfolio.familyMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Category</label>
                    <select
                      required
                      value={newDoc.category}
                      onChange={(e) => setNewDoc({ ...newDoc, category: e.target.value as any })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    >
                      {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Document Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g., Passport, Property Deed, Insurance Policy"
                    value={newDoc.name}
                    onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase ml-1">Upload Document</label>
                  <div className="relative">
                    <input
                      type="file"
                      onChange={handleFileChange}
                      className="hidden"
                      id="file-upload"
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.csv"
                    />
                    <label
                      htmlFor="file-upload"
                      className={`flex items-center justify-center gap-2 w-full px-4 py-8 bg-slate-50 border-2 border-dashed rounded-2xl transition-all cursor-pointer group ${selectedFile ? 'border-emerald-500 bg-emerald-50' : 'border-slate-200 hover:border-emerald-500 hover:bg-emerald-50'}`}
                    >
                      <div className="flex flex-col items-center gap-1">
                        {selectedFile ? (
                          <CheckCircle2 size={32} className="text-emerald-600 mb-1" />
                        ) : (
                          <Plus size={32} className="text-slate-400 group-hover:text-emerald-600 mb-1" />
                        )}
                        <span className={`text-sm font-bold ${selectedFile ? 'text-emerald-700' : 'text-slate-600 group-hover:text-emerald-700'}`}>
                          {selectedFile ? selectedFile.name : 'Click to select important file'}
                        </span>
                        <span className="text-[10px] text-slate-400 uppercase tracking-widest text-center">
                          PDF, JPG, PNG, DOC, Excel (MAX 5MB)<br/>
                          Stored securely in encrypted cloud
                        </span>
                      </div>
                    </label>
                    {selectedFile && (
                      <button 
                        type="button"
                        onClick={() => setSelectedFile(null)}
                        className="absolute top-2 right-2 p-1.5 bg-white text-slate-400 hover:text-rose-600 rounded-full shadow-sm border border-slate-100 transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Expiry Date (Optional)</label>
                    <input
                      type="date"
                      value={newDoc.expiryDate}
                      onChange={(e) => setNewDoc({ ...newDoc, expiryDate: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase ml-1">Notes</label>
                    <textarea
                      rows={1}
                      placeholder="Policy #, ID #, etc."
                      value={newDoc.notes}
                      onChange={(e) => setNewDoc({ ...newDoc, notes: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 px-4 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading || !selectedFile}
                    className="flex-1 px-4 py-3 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isUploading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Encrypting & Saving...
                      </>
                    ) : (
                      'Securely Save'
                    )}
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
