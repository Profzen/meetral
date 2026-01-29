import { describe, it, expect } from 'vitest';
import formatCurrency from '@/utils/formatCurrency';

describe('formatCurrency', () => {
  it('formats integers as XOF without decimals', () => {
    expect(formatCurrency(25000)).toMatch(/25\s?000\s?XOF|25\u00A0000\s?XOF/);
  });

  it('returns empty string for null/undefined', () => {
    expect(formatCurrency(null)).toBe('');
    expect(formatCurrency(undefined)).toBe('');
  });

  it('handles non-numeric gracefully', () => {
    expect(formatCurrency('abc')).toBe('abc XOF');
  });
});
