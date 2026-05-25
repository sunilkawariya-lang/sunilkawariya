
export const stripMarkdown = (text: string) => {
  if (!text) return '';
  return text
    .replace(/[#*`_~]/g, '') // Remove basic markdown symbols
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Remove links but keep text
    .replace(/₹/g, 'Rs. ') // Replace Rupee symbol with Rs.
    .replace(/[^\x00-\x7F]/g, '') // Remove any other non-ASCII characters that break PDF
    .replace(/\n\s*\n/g, '\n\n') // Normalize multiple newlines
    .trim();
};
