import { formatTimeDiff } from '../utils/plan'

interface DayPlan {
  id: string
  planned_time: string
  actual_time: string | null
}

function formatUTCTime(isoString: string) {
  const d = new Date(isoString)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function isOnTime(planned: string, actual: string) {
  const [ph, pm] = planned.split(':').map(Number)
  const plannedMin = ph * 60 + pm
  const d = new Date(actual)
  const actualMin = d.getHours() * 60 + d.getMinutes()
  return Math.abs(actualMin - plannedMin) <= 10
}

export default function DayDetail({ plans, date }: { plans: DayPlan[]; date: string }) {
  if (!date) return null

  return (
    <div className="px-4 pb-4">
      <h3 className="text-base font-heading text-foreground mb-2">{date} 详情</h3>
      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">当天无记录</p>
      ) : (
        <div className="space-y-2">
          {plans.map(plan => {
            const done = !!plan.actual_time
            return (
              <div key={plan.id} className="flex items-center justify-between bg-card rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${done ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    {done ? '✓' : '○'}
                  </div>
                  <span className={`font-heading ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{plan.planned_time}</span>
                </div>
                {done && plan.actual_time && (
                  <span className={`text-xs px-2 py-1 rounded-lg ${isOnTime(plan.planned_time, plan.actual_time) ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                    实际 {formatUTCTime(plan.actual_time)}
                    {' '}{formatTimeDiff(plan.planned_time, plan.actual_time)}
                  </span>
                )}
                {!done && <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-lg">未完成</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
