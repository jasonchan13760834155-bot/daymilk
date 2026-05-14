import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { generatePlanTimes, findNearestPlan, formatTimeDiff } from './plan'

describe('generatePlanTimes', () => {
  it('generates evenly spaced times between start and end', () => {
    const result = generatePlanTimes('06:00', '22:00', 5)
    expect(result).toEqual(['06:00', '10:00', '14:00', '18:00', '22:00'])
  })

  it('handles count=1 (just start time)', () => {
    expect(generatePlanTimes('08:00', '20:00', 1)).toEqual(['08:00'])
  })

  it('handles count=2 (start and end only)', () => {
    expect(generatePlanTimes('07:00', '21:00', 2)).toEqual(['07:00', '21:00'])
  })

  it('handles count=3 with 12h range', () => {
    expect(generatePlanTimes('06:00', '18:00', 3)).toEqual(['06:00', '12:00', '18:00'])
  })

  it('handles non-divisible intervals by rounding', () => {
    const result = generatePlanTimes('06:00', '22:00', 4)
    expect(result).toEqual(['06:00', '11:20', '16:40', '22:00'])
  })
})

describe('findNearestPlan', () => {
  const plans = [
    { id: '1', planned_time: '06:00', actual_time: '2026-05-14T06:02:00Z', sort_order: 1 },
    { id: '2', planned_time: '10:00', actual_time: null, sort_order: 2 },
    { id: '3', planned_time: '14:00', actual_time: null, sort_order: 3 },
    { id: '4', planned_time: '18:00', actual_time: null, sort_order: 4 },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 4, 14, 14, 8, 0))
  })

  afterEach(() => vi.useRealTimers())

  it('finds nearest incomplete plan to current time', () => {
    const result = findNearestPlan(plans)
    expect(result?.id).toBe('3')
    expect(result?.planned_time).toBe('14:00')
  })

  it('returns null when all plans are completed', () => {
    const allDone = plans.map(p => ({ ...p, actual_time: p.actual_time || '2026-05-14T12:00:00Z' }))
    expect(findNearestPlan(allDone)).toBeNull()
  })

  it('returns only remaining plan when one left', () => {
    const oneLeft = plans.map(p => ({ ...p, actual_time: p.id === '4' ? null : '2026-05-14T12:00:00Z' }))
    const result = findNearestPlan(oneLeft)
    expect(result?.id).toBe('4')
  })
})

describe('formatTimeDiff', () => {
  it('formats positive diff', () => {
    expect(formatTimeDiff('14:00', new Date(2026, 4, 14, 14, 8, 0).toISOString())).toBe('+8min')
  })

  it('formats negative diff (early)', () => {
    expect(formatTimeDiff('14:00', new Date(2026, 4, 14, 13, 55, 0).toISOString())).toBe('-5min')
  })

  it('formats exact on time', () => {
    expect(formatTimeDiff('14:00', new Date(2026, 4, 14, 14, 0, 0).toISOString())).toBe('+0min')
  })
})
