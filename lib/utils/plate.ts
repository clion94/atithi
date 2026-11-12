/**
 * Licence plates are typed in a hurry at the front desk: trim, upper-case and collapse
 * repeated spaces so "tx  1234 " and "TX 1234" are the same plate. Empty becomes null.
 */
export function normalizePlate(input: string | null | undefined): string | null {
  const cleaned = (input ?? '').replace(/\s+/g, ' ').trim().toUpperCase()
  return cleaned.length > 0 ? cleaned : null
}
