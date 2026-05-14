import { useTodaysPlans } from '../hooks/useTodaysPlans'
import StatsCards from '../components/StatsCards'
import RecordButton from '../components/RecordButton'
import PlanList from '../components/PlanList'

export default function Today() {
  const { plans, loading, recording, record, updatePlan } = useTodaysPlans()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const today = new Date()
  const weekDay = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()]
  const incomplete = plans.filter(p => !p.actual_time)
  const nextPlan = incomplete.length > 0 ? incomplete[0].planned_time : undefined

  return (
    <div>
      {/* Header */}
      <div className="px-4 pt-10 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-foreground">今天</h1>
          <div className="text-sm text-muted-foreground mt-0.5">
            {today.getMonth() + 1}月{today.getDate()}日 周{weekDay}
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">🤱</div>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-foreground font-heading text-lg mb-2">还没有计划</p>
          <p className="text-muted-foreground text-sm text-center">请先去设置页面配置每日预设</p>
        </div>
      ) : (
        <>
          <StatsCards plans={plans} />
          <RecordButton onRecord={record} recording={recording} nextPlanTime={nextPlan} />
          <PlanList plans={plans} onEdit={updatePlan} />
        </>
      )}
    </div>
  )
}
