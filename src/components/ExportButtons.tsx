import React from "react";
import { FileText, FileSpreadsheet, Download } from 'lucide-react';

interface ExportButtonsProps {
  title: string;
  inputs: [string, string][];
  results: [string, string][];
  onDownload: (title: string, inputs: [string, string][], results: [string, string][], format: 'pdf' | 'excel') => void;
  variant?: 'light' | 'dark';
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ title, inputs, results, onDownload, variant = 'light' }) => {
  const [isDownloading, setIsDownloading] = React.useState(false);

  const handleDownload = async (format: 'pdf' | 'excel') => {
    setIsDownloading(true);
    try {
      await onDownload(title, inputs, results, format);
    } finally {
      setIsDownloading(false);
    }
  };

  const baseStyles = variant === 'dark' 
    ? "flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-xl font-bold hover:bg-white/20 transition-all border border-white/10 text-xs"
    : "flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold hover:bg-slate-200 transition-all border border-slate-200 text-xs";

  return (
    <div className="flex gap-2 mt-4">
      <button 
        onClick={() => handleDownload('pdf')}
        disabled={isDownloading}
        className={baseStyles}
      >
        <FileText size={14} />
        PDF
      </button>
      <button 
        onClick={() => handleDownload('excel')}
        disabled={isDownloading}
        className={baseStyles}
      >
        <FileSpreadsheet size={14} />
        Excel
      </button>
    </div>
  );
};

export default ExportButtons;
