import PlanItem from './PlanItem'
import type { Plan } from '../utils/plan'

interface Props {
  plans: Plan[]
  onEdit: (id: string, planned_start_time: string, planned_end_time: string, actual_start_time?: string | null, actual_end_time?: string | null) => void
  onDelete: (id: string) => void
}

export default function PlanList({ plans, onEdit, onDelete }: Props) {
  const activeIndex = plans.findIndex(p => !p.actual_start_time)

  return (
    <section className="px-5 mt-5 pb-4">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-xl bg-pink-50/80 flex items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] text-pink-400" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 3v3M17 3v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M4 7h16" stroke="currentColor" strokeWidth="2" />
            <path d="M6 5h12a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M8 11h3M8 15h3M13 11h3M13 15h3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </div>
        <span className="text-[20px] font-extrabold text-[#3A3433] tracking-tight">今日计划</span>
      </div>

      <div className="relative pl-[calc(24px+1rem)]">
        <div className="absolute left-[25px] top-[6px] bottom-0 w-px border-l border-dashed border-[#E0D9D3]" aria-hidden="true" />

        <div className="flex flex-col gap-1">
        {plans.map((plan, i) => (
          <PlanItem key={plan.id} plan={plan} isActive={i === activeIndex} onEdit={onEdit} onDelete={onDelete} />
        ))}
        </div>
      </div>
    </section>
  )
}
