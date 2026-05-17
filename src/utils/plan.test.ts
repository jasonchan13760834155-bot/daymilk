import { describe, it, expect } from 'vitest'
import { isOnTime, formatTimeRange, isoToHHMM, hhmmToISO, nowToISOTime, addMinutes } from './plan'

const makePlan = (
  start: string,
  end: string,
  actualStart: string | null,
  actualEnd: string | null,
) => ({
  id: '1',
  planned_start_time: start,
  planned_end_time: end,
  actual_start_time: actualStart,
  actual_end_time: actualEnd,
  sort_order: 1,
})

describe('isOnTime', () => {
  it('marks plan inside the slot as on time', () => {
    const plan = makePlan(
      '11:00',
      '12:00',
      new Date(2026, 4, 14, 11, 5, 0).toISOString(),
      new Date(2026, 4, 14, 11, 55, 0).toISOString(),
    )
    expect(isOnTime(plan)).toBe(true)
  })

  it('marks plan within ±30min of slot boundaries as on time', () => {
    const plan = makePlan(
      '11:00',
      '12:00',
      new Date(2026, 4, 14, 10, 31, 0).toISOString(),
      new Date(2026, 4, 14, 12, 29, 0).toISOString(),
    )
    expect(isOnTime(plan)).toBe(true)
  })

  it('marks plan starting more than 30min early as off', () => {
    const plan = makePlan(
      '11:00',
      '12:00',
      new Date(2026, 4, 14, 10, 29, 0).toISOString(),
      new Date(2026, 4, 14, 11, 50, 0).toISOString(),
    )
    expect(isOnTime(plan)).toBe(false)
  })

  it('marks plan ending more than 30min late as off', () => {
    const plan = makePlan(
      '11:00',
      '12:00',
      new Date(2026, 4, 14, 11, 0, 0).toISOString(),
      new Date(2026, 4, 14, 12, 31, 0).toISOString(),
    )
    expect(isOnTime(plan)).toBe(false)
  })

  it('returns false for incomplete plan', () => {
    const plan = makePlan('11:00', '12:00', null, null)
    expect(isOnTime(plan)).toBe(false)
  })
})

describe('formatTimeRange', () => {
  it('joins start and end with separator', () => {
    expect(formatTimeRange('11:00', '12:00')).toBe('11:00 - 12:00')
  })
})

describe('isoToHHMM', () => {
  it('extracts HH:MM from ISO timestamp', () => {
    const iso = new Date(2026, 4, 14, 13, 7, 0).toISOString()
    expect(isoToHHMM(iso)).toBe('13:07')
  })
})

describe('hhmmToISO', () => {
  it('builds ISO string representing local date+time', () => {
    const iso = hhmmToISO('2026-05-14', '11:00')
    const d = new Date(iso)
    expect(d.getFullYear()).toBe(2026)
    expect(d.getMonth()).toBe(4)
    expect(d.getDate()).toBe(14)
    expect(d.getHours()).toBe(11)
    expect(d.getMinutes()).toBe(0)
  })
})

describe('nowToISOTime', () => {
  it('returns now when offset is zero', () => {
    const before = Date.now()
    const result = new Date(nowToISOTime(0)).getTime()
    const after = Date.now()
    expect(result).toBeGreaterThanOrEqual(before)
    expect(result).toBeLessThanOrEqual(after)
  })

  it('returns 20 minutes ago when offset is -20', () => {
    const result = new Date(nowToISOTime(-20)).getTime()
    const expected = Date.now() - 20 * 60 * 1000
    expect(Math.abs(result - expected)).toBeLessThan(1000)
  })
})

describe('addMinutes', () => {
  it('adds minutes within the same hour', () => {
    expect(addMinutes('11:00', 20)).toBe('11:20')
  })

  it('adds minutes crossing hour boundary', () => {
    expect(addMinutes('11:50', 20)).toBe('12:10')
  })

  it('subtracts minutes', () => {
    expect(addMinutes('12:10', -20)).toBe('11:50')
  })

  it('wraps around midnight', () => {
    expect(addMinutes('23:50', 20)).toBe('00:10')
  })

  it('handles negative wrapping midnight', () => {
    expect(addMinutes('00:10', -20)).toBe('23:50')
  })
})
