interface Plan {
  id: string
  planned_time: string
  actual_time: string | null
  sort_order: number
}

export default function StatsCards({ plans }: { plans: Plan[] }) {
  const total = plans.length
  const completed = plans.filter(p => p.actual_time).length
  const hasActual = plans.filter(p => p.actual_time)

  const avgDeviation = hasActual.length
    ? Math.round(hasActual.reduce((sum, p) => {
        const [ph, pm] = p.planned_time!.split(':').map(Number)
        const plannedMin = ph * 60 + pm
        const d = new Date(p.actual_time!)
        const actualMin = d.getHours() * 60 + d.getMinutes()
        return sum + (actualMin - plannedMin)
      }, 0) / hasActual.length)
    : 0

  const onTimeRate = hasActual.length
    ? Math.round(hasActual.filter(p => {
        const [ph, pm] = p.planned_time!.split(':').map(Number)
        const plannedMin = ph * 60 + pm
        const d = new Date(p.actual_time!)
        const actualMin = d.getHours() * 60 + d.getMinutes()
        return Math.abs(actualMin - plannedMin) <= 10
      }).length / hasActual.length * 100)
    : 0

  return (
    <div className="flex gap-3 px-4">
      <div className="flex-1 bg-card rounded-2xl p-3 text-center shadow-sm">
        <div className="text-xl font-heading text-foreground">{completed}/{total}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">完成度</div>
      </div>
      <div className="flex-1 bg-card rounded-2xl p-3 text-center shadow-sm">
        <div className="text-xl font-heading text-foreground">{avgDeviation > 0 ? '+' : ''}{avgDeviation}<span className="text-xs text-muted-foreground">min</span></div>
        <div className="text-[11px] text-muted-foreground mt-0.5">平均偏差</div>
      </div>
      <div className="flex-1 bg-card rounded-2xl p-3 text-center shadow-sm">
        <div className="text-xl font-heading text-foreground">{onTimeRate}<span className="text-xs text-muted-foreground">%</span></div>
        <div className="text-[11px] text-muted-foreground mt-0.5">按时完成率</div>
      </div>
    </div>
  )
}
