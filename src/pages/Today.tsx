import { useTodaysPlans } from '../hooks/useTodaysPlans'
import StatsCards from '../components/StatsCards'
import RecordButton from '../components/RecordButton'
import PlanList from '../components/PlanList'

export default function Today() {
  const { plans, loading, recording, record, updatePlan } = useTodaysPlans()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  const today = new Date()
  const weekDay = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()]
  const nextPlan = plans.filter(p => !p.actual_time)[0]?.planned_time

  return (
    <div className="pb-2">
      <div className="px-4 pt-8 pb-2 flex items-center justify-between">
        <div>
          <h1 className="text-[26px] font-heading text-foreground leading-tight">今天</h1>
          <p className="text-sm text-subtle mt-0.5">
            {today.getMonth() + 1}月{today.getDate()}日 周{weekDay}
          </p>
        </div>
        <div className="w-10 h-10 rounded-full bg-white card flex items-center justify-center text-lg">
          🤱
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-4">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-foreground font-heading text-lg mb-2">还没有计划</p>
          <p className="text-subtle text-sm text-center">请先去设置页面配置每日预设</p>
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
