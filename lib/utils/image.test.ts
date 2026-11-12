import { describe, expect, it } from 'vitest'
import { fitWithin } from './image'

describe('fitWithin', () => {
  it('scales a large landscape photo down to the longest edge', () => {
    expect(fitWithin(4032, 3024, 1600)).toEqual({ width: 1600, height: 1200 })
  })
  it('scales a portrait photo by its height', () => {
    expect(fitWithin(3024, 4032, 1600)).toEqual({ width: 1200, height: 1600 })
  })
  it('never upscales a small image', () => {
    expect(fitWithin(800, 600, 1600)).toEqual({ width: 800, height: 600 })
    expect(fitWithin(1600, 1600, 1600)).toEqual({ width: 1600, height: 1600 })
  })
  it('keeps at least one pixel on extreme aspect ratios', () => {
    const r = fitWithin(10000, 1, 1600)
    expect(r.width).toBe(1600)
    expect(r.height).toBe(1)
  })
  it('handles an empty image without dividing by zero', () => {
    expect(fitWithin(0, 0, 1600)).toEqual({ width: 0, height: 0 })
  })
})
