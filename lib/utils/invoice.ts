export interface InvoiceAmounts {
  nights: number
  ratePerNight: number
  subtotal: number
  /** Tax percentage used (0-100). */
  taxRate: number
  tax: number
  total: number
}

/**
 * Room charges for a stay, in whole cents internally so the printed lines always add up
 * (0.1 + 0.2 style float drift on money is how invoices end up one cent off).
 * Tax is rounded half-up to the cent on the subtotal.
 */
export function computeInvoice(input: { nights: number; ratePerNight: number; taxRate: number }): InvoiceAmounts {
  const nights = Math.max(0, Math.trunc(input.nights))
  const rateCents = Math.round(input.ratePerNight * 100)
  const subtotalCents = rateCents * nights
  // Tax rate has at most two decimals, so work in hundredths of a percent as an integer.
  const taxRateBasisPoints = Math.round(Math.min(Math.max(input.taxRate, 0), 100) * 100)
  const taxCents = Math.round((subtotalCents * taxRateBasisPoints) / 10000)

  return {
    nights,
    ratePerNight: rateCents / 100,
    subtotal: subtotalCents / 100,
    taxRate: taxRateBasisPoints / 100,
    tax: taxCents / 100,
    total: (subtotalCents + taxCents) / 100,
  }
}

/** A short, stable, human-quotable invoice number derived from the reservation id. */
export function invoiceNumber(reservationId: string): string {
  return `INV-${reservationId.replace(/-/g, '').slice(0, 8).toUpperCase()}`
}
