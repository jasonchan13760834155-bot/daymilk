import PlanItem from './PlanItem'

interface Plan {
  id: string
  planned_time: string
  actual_time: string | null
  sort_order: number
}

interface Props {
  plans: Plan[]
  onEdit: (id: string, planned_time: string, actual_time?: string | null) => void
}

export default function PlanList({ plans, onEdit }: Props) {
  const activeIndex = plans.findIndex(p => !p.actual_time)

  return (
    <div className="px-4 pb-2">
      <div className="flex justify-between items-center mb-2.5">
        <h2 className="text-base font-heading text-foreground">今日计划</h2>
        <span className="text-xs text-primary">编辑</span>
      </div>
      <div className="space-y-1.5">
        {plans.map((plan, i) => (
          <PlanItem key={plan.id} plan={plan} isActive={i === activeIndex} onEdit={onEdit} />
        ))}
      </div>
    </div>
  )
}
