export interface Plan {
  id: string
  planned_start_time: string
  planned_end_time: string
  actual_start_time: string | null
  actual_end_time: string | null
  sort_order: number
}

export function isOnTime(plan: Plan): boolean {
  if (!plan.actual_start_time || !plan.actual_end_time) return false

  const [psH, psM] = plan.planned_start_time.split(':').map(Number)
  const [peH, peM] = plan.planned_end_time.split(':').map(Number)
  const plannedStartMin = psH * 60 + psM
  const plannedEndMin = peH * 60 + peM

  const actualStart = new Date(plan.actual_start_time)
  const actualEnd = new Date(plan.actual_end_time)
  const actualStartMin = actualStart.getHours() * 60 + actualStart.getMinutes()
  const actualEndMin = actualEnd.getHours() * 60 + actualEnd.getMinutes()

  return actualStartMin >= plannedStartMin - 30 && actualEndMin <= plannedEndMin + 30
}

export function formatTimeRange(start: string, end: string): string {
  return `${toHHMM(start)} - ${toHHMM(end)}`
}

export function toHHMM(t: string): string {
  return t.slice(0, 5)
}

export function isoToHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function hhmmToISO(dateStr: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const [y, mo, d] = dateStr.split('-').map(Number)
  const local = new Date()
  local.setFullYear(y, mo - 1, d)
  local.setHours(h, m, 0, 0)
  return local.toISOString()
}

export function nowToISOTime(minutesOffset: number = 0): string {
  const d = new Date(Date.now() + minutesOffset * 60 * 1000)
  return d.toISOString()
}

export function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = String(((total % 1440) + 1440) % 1440 / 60 | 0).padStart(2, '0')
  const mm = String(((total % 60) + 60) % 60).padStart(2, '0')
  return `${hh}:${mm}`
}
