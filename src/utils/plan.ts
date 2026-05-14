export function generatePlanTimes(start: string, end: string, count: number): string[] {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em

  if (count === 1) return [start]

  const interval = (endMin - startMin) / (count - 1)
  const times: string[] = []
  for (let i = 0; i < count; i++) {
    const totalMin = Math.round(startMin + i * interval)
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return times
}

export interface Plan {
  id: string
  planned_time: string
  actual_time: string | null
  sort_order: number
}

export function findNearestPlan(plans: Plan[]): Plan | null {
  const incomplete = plans.filter(p => !p.actual_time)
  if (!incomplete.length) return null

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  return incomplete.reduce((nearest, plan) => {
    const [ph, pm] = plan.planned_time.split(':').map(Number)
    const planMinutes = ph * 60 + pm
    const [nh, nm] = nearest.planned_time.split(':').map(Number)
    const nearestMinutes = nh * 60 + nm
    return Math.abs(planMinutes - nowMinutes) < Math.abs(nearestMinutes - nowMinutes)
      ? plan : nearest
  })
}

export function formatTimeDiff(planned: string, actual: string): string {
  const [ph, pm] = planned.split(':').map(Number)
  const plannedMin = ph * 60 + pm
  const actualDate = new Date(actual)
  const actualMin = actualDate.getHours() * 60 + actualDate.getMinutes()
  const diff = actualMin - plannedMin
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff}min`
}
