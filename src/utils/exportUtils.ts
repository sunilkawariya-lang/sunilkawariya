import { generateCalculatorPDF } from '../services/pdfService';
import * as XLSX from 'xlsx';

export const handleDownloadCalculatorReport = async (
  title: string, 
  inputs: [string, string][], 
  results: [string, string][], 
  format: 'pdf' | 'excel' = 'pdf'
) => {
  try {
    const fileName = `${title.replace(/\s+/g, '_')}_Report_${new Date().toISOString().split('T')[0]}`;
    if (format === 'pdf') {
      const doc = generateCalculatorPDF(title, inputs, results);
      doc.save(`${fileName}.pdf`);
    } else {
      const wsData = [
        [`Financial Calculator: ${title}`],
        [],
        ['Input Parameters'],
        ...inputs,
        [],
        ['Calculation Results'],
        ...results,
        [],
        ['Generated on', new Date().toLocaleString()]
      ];
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.aoa_to_sheet(wsData);
      XLSX.utils.book_append_sheet(wb, ws, 'Results');
      XLSX.writeFile(wb, `${fileName}.xlsx`);
    }
  } catch (error) {
    console.error(`Error generating ${format.toUpperCase()}:`, error);
    throw error;
  }
};
