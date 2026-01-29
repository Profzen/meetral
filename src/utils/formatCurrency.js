// Utility to format numbers as XOF currency for display across the app
export default function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '';
  try {
    const num = Number(value);
    if (isNaN(num)) return String(value) + ' XOF';
    // XOF typically has no decimals
    return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XOF', maximumFractionDigits: 0 }).format(num);
  } catch (e) {
    return String(value) + ' XOF';
  }
}
