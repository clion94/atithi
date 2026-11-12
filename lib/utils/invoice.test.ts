import { describe, expect, it } from 'vitest'
import { computeInvoice, invoiceNumber } from './invoice'

describe('computeInvoice', () => {
  it('adds tax to the room charge and the lines add up exactly', () => {
    const inv = computeInvoice({ nights: 3, ratePerNight: 89.99, taxRate: 8.25 })
    expect(inv.subtotal).toBe(269.97)
    expect(inv.tax).toBe(22.27) // 26997 * 8.25% = 2227.25 cents
    expect(inv.total).toBe(292.24)
    expect(inv.total).toBe(Math.round((inv.subtotal + inv.tax) * 100) / 100)
  })

  it('handles floating point rates without drift', () => {
    expect(computeInvoice({ nights: 3, ratePerNight: 19.99, taxRate: 0 }).subtotal).toBe(59.97)
    expect(computeInvoice({ nights: 10, ratePerNight: 0.1, taxRate: 0 }).subtotal).toBe(1)
  })

  it('rounds tax half-up to the cent', () => {
    // 5 x $0.10 = $0.50; 5% of 50 cents = 2.5 cents -> 3 cents
    expect(computeInvoice({ nights: 5, ratePerNight: 0.1, taxRate: 5 }).tax).toBe(0.03)
  })

  it('has no tax line value when the rate is zero', () => {
    const inv = computeInvoice({ nights: 2, ratePerNight: 100, taxRate: 0 })
    expect(inv.tax).toBe(0)
    expect(inv.total).toBe(200)
  })

  it('returns zeros for no nights and clamps nonsense input', () => {
    expect(computeInvoice({ nights: 0, ratePerNight: 100, taxRate: 10 }).total).toBe(0)
    expect(computeInvoice({ nights: -2, ratePerNight: 100, taxRate: 10 }).total).toBe(0)
    expect(computeInvoice({ nights: 1, ratePerNight: 100, taxRate: 250 }).tax).toBe(100) // clamped to 100%
    expect(computeInvoice({ nights: 1, ratePerNight: 100, taxRate: -5 }).tax).toBe(0)
  })

  it('handles a long stay at a typical occupancy tax', () => {
    const inv = computeInvoice({ nights: 30, ratePerNight: 64, taxRate: 13 })
    expect(inv.subtotal).toBe(1920)
    expect(inv.tax).toBe(249.6)
    expect(inv.total).toBe(2169.6)
  })
})

describe('invoiceNumber', () => {
  it('is derived from the reservation id and stable', () => {
    const id = '3f2a9c1e-7b44-4d0e-9a55-0c1d2e3f4a5b'
    expect(invoiceNumber(id)).toBe('INV-3F2A9C1E')
    expect(invoiceNumber(id)).toBe(invoiceNumber(id))
  })
})
