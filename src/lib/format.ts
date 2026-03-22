/**
 * Format a number as USD currency: $1,234,567
 * Negative values shown in parentheses: ($5,040)
 */
export function formatCurrency(value: number | null | undefined): string {
  if (value == null) return '—'
  const abs = Math.abs(value)
  const formatted = abs.toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return value < 0 ? `(${formatted})` : formatted
}

/**
 * Format a percentage: +4.5% or (3.2%)
 */
export function formatPercent(value: number | null | undefined): string {
  if (value == null) return '—'
  const abs = Math.abs(value)
  const formatted = abs.toFixed(1) + '%'
  if (value < 0) return `(${formatted})`
  if (value > 0) return `+${formatted}`
  return formatted
}

/**
 * Get CSS class for variance coloring
 * For expenses: increase = red (bad), decrease = green (good)
 * For income: increase = green (good), decrease = red (bad)
 */
export function varianceColor(value: number, isExpense: boolean = true): string {
  if (value === 0) return 'text-gray-500'
  if (isExpense) {
    return value > 0 ? 'text-red-600' : 'text-green-600'
  }
  return value > 0 ? 'text-green-600' : 'text-red-600'
}

/**
 * Calculate variance between two values
 */
export function calcVariance(current: number, prior: number): number {
  return current - prior
}

/**
 * Calculate percent change
 */
export function calcPctChange(current: number, prior: number): number {
  if (prior === 0) return current === 0 ? 0 : 100
  return ((current - prior) / Math.abs(prior)) * 100
}
