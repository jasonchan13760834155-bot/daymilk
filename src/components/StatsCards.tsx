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
        const plannedMs = (ph * 60 + pm) * 60000
        const actualMs = new Date(p.actual_time!).getTime()
        const diff = actualMs - plannedMs - new Date('1970-01-01T00:00:00Z').getTime()
        return sum + diff / 60000
      }, 0) / hasActual.length)
    : 0

  const onTime = hasActual.filter(p => {
    const [ph, pm] = p.planned_time!.split(':').map(Number)
    const plannedMs = (ph * 60 + pm) * 60000
    const actualMs = new Date(p.actual_time!).getTime() - new Date('1970-01-01T00:00:00Z').getTime()
    return Math.abs(actualMs - plannedMs) / 60000 <= 15
  }).length

  return (
    <div className="flex gap-2 px-4">
      <div className="flex-1 bg-card rounded-2xl p-3 text-center shadow-sm">
        <div className="text-2xl font-heading text-primary">{completed}<span className="text-base text-primary-light">/{total}</span></div>
        <div className="text-[11px] text-muted-foreground mt-0.5">今日进度</div>
      </div>
      <div className="flex-1 bg-card rounded-2xl p-3 text-center shadow-sm">
        <div className="text-2xl font-heading text-accent">{avgDeviation > 0 ? '+' : ''}{avgDeviation}<span className="text-sm text-muted-foreground">min</span></div>
        <div className="text-[11px] text-muted-foreground mt-0.5">平均偏差</div>
      </div>
      <div className="flex-1 bg-card rounded-2xl p-3 text-center shadow-sm">
        <div className="text-2xl font-heading text-green-500">{onTime}/{completed || '-'}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">按时完成</div>
      </div>
    </div>
  )
}
