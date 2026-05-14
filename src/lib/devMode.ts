// Development mode data store — all mutations happen in memory
const today = new Date().toISOString().slice(0, 10)

export const devUser = {
  id: 'dev-user-0000-0000-0000-000000000000',
  email: 'mom@daymilk.app',
  created_at: new Date('2026-01-15').toISOString(),
  aud: 'authenticated',
  role: 'authenticated',
}

export const devPreset = {
  id: 'dev-preset-0000-0000-0000-000000000000',
  user_id: devUser.id,
  start_time: '06:00',
  end_time: '22:00',
  daily_count: 5,
  updated_at: new Date().toISOString(),
}

// In-memory store for today's plans (mutable)
export let devPlans = [
  { id: 'plan-1', user_id: devUser.id, date: today, planned_time: '06:00', actual_time: `${today}T06:02:00Z`, sort_order: 1 },
  { id: 'plan-2', user_id: devUser.id, date: today, planned_time: '10:00', actual_time: `${today}T10:10:00Z`, sort_order: 2 },
  { id: 'plan-3', user_id: devUser.id, date: today, planned_time: '14:00', actual_time: null, sort_order: 3 },
  { id: 'plan-4', user_id: devUser.id, date: today, planned_time: '18:00', actual_time: null, sort_order: 4 },
  { id: 'plan-5', user_id: devUser.id, date: today, planned_time: '22:00', actual_time: null, sort_order: 5 },
]

// In-memory store for history (some past days with data)
function generateHistoryPlans() {
  const plans: typeof devPlans = []
  for (let dayOffset = 1; dayOffset <= 14; dayOffset++) {
    const d = new Date()
    d.setDate(d.getDate() - dayOffset)
    const dateStr = d.toISOString().slice(0, 10)
    for (let i = 0; i < 5; i++) {
      const [h, m] = [6 + i * 4, 0]
      const planned = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
      const done = dayOffset > 1 || i < 3 // today minus 1 has 3 done, rest all done
      const offset = Math.round((Math.random() - 0.5) * 30)
      const actualMin = h * 60 + m + offset
      const ah = Math.floor(actualMin / 60)
      const am = actualMin % 60
      plans.push({
        id: `hist-${dateStr}-${i}`,
        user_id: devUser.id,
        date: dateStr,
        planned_time: planned,
        actual_time: done ? `${dateStr}T${String(ah).padStart(2, '0')}:${String(am).padStart(2, '0')}:00Z` : null,
        sort_order: i + 1,
      })
    }
  }
  return plans
}

export const devHistoryPlans = generateHistoryPlans()

export function resetDevPlans() {
  devPlans = [
    { id: 'plan-1', user_id: devUser.id, date: today, planned_time: '06:00', actual_time: `${today}T06:02:00Z`, sort_order: 1 },
    { id: 'plan-2', user_id: devUser.id, date: today, planned_time: '10:00', actual_time: `${today}T10:10:00Z`, sort_order: 2 },
    { id: 'plan-3', user_id: devUser.id, date: today, planned_time: '14:00', actual_time: null, sort_order: 3 },
    { id: 'plan-4', user_id: devUser.id, date: today, planned_time: '18:00', actual_time: null, sort_order: 4 },
    { id: 'plan-5', user_id: devUser.id, date: today, planned_time: '22:00', actual_time: null, sort_order: 5 },
  ]
}

let nextId = 100
export function nextPlanId() {
  return `plan-${nextId++}`
}
