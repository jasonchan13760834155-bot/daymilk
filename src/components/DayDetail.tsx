import { formatTimeDiff } from '../utils/plan'

interface DayPlan {
  id: string
  planned_time: string
  actual_time: string | null
}

function formatTime(isoString: string) {
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
      <h3 className="text-sm font-heading text-foreground mb-2">{date} 详情</h3>
      {plans.length === 0 ? (
        <p className="text-sm text-subtle">当天无记录</p>
      ) : (
        <div className="space-y-1.5">
          {plans.map(plan => {
            const done = !!plan.actual_time
            return (
              <div key={plan.id}
                className={`flex items-center bg-card rounded-xl card overflow-hidden ${
                  done ? 'border-l-[3px] border-l-success' : 'border-l-[3px] border-l-muted-foreground/20'
                }`}>
                <div className="pl-3 pr-2 py-2.5 w-[72px] shrink-0">
                  <div className={`text-[15px] font-heading leading-tight ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {plan.planned_time}
                  </div>
                  <div className={`text-[11px] mt-0.5 ${done ? 'text-success' : 'text-muted-foreground'}`}>
                    {done ? '已完成' : '未完成'}
                  </div>
                </div>
                <div className="flex-1" />
                {done && plan.actual_time && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium mr-3 ${
                    isOnTime(plan.planned_time, plan.actual_time) ? 'bg-success-light text-success' : 'bg-danger-light text-danger'
                  }`}>
                    实际 {formatTime(plan.actual_time)} {formatTimeDiff(plan.planned_time, plan.actual_time)}
                  </span>
                )}
                {!done && (
                  <span className="text-[10px] text-muted-foreground mr-3">-</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
