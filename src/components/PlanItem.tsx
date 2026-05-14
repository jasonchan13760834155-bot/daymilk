import { useState } from 'react'
import { formatTimeDiff } from '../utils/plan'

interface Plan {
  id: string
  planned_time: string
  actual_time: string | null
  sort_order: number
}

interface Props {
  plan: Plan
  isActive: boolean
  onEdit: (id: string, time: string) => void
  onDelete: (id: string) => void
}

export default function PlanItem({ plan, isActive, onEdit, onDelete }: Props) {
  const done = !!plan.actual_time
  const [editing, setEditing] = useState(false)
  const [editTime, setEditTime] = useState(plan.planned_time)

  if (editing) {
    return (
      <div className="flex items-center gap-2 bg-card rounded-2xl p-3 shadow-sm">
        <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
          className="flex-1 h-10 rounded-xl border border-border bg-bg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <button onClick={() => { onEdit(plan.id, editTime); setEditing(false) }}
          className="text-sm text-primary font-medium px-2">保存</button>
        <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground px-2">取消</button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 bg-card rounded-2xl p-3 shadow-sm ${
      done ? 'border-l-[3px] border-l-green-500' :
      isActive ? 'border-l-[3px] border-l-primary border border-primary-light' :
      'border-l-[3px] border-l-transparent'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
        done ? 'bg-green-100 text-green-600' :
        isActive ? 'bg-primary/10 text-primary' :
        'bg-muted text-muted-foreground'
      }`}>
        {done ? '✓' : isActive ? '⟳' : '○'}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-base font-heading ${done ? 'text-green-700' : isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
          {plan.planned_time}
        </div>
        {done && plan.actual_time && (
          <div className="text-xs text-green-600">
            实际 {new Date(plan.actual_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} · 偏差 {formatTimeDiff(plan.planned_time, plan.actual_time)}
          </div>
        )}
        {!done && isActive && (
          <div className="text-xs text-primary">即将进行...</div>
        )}
      </div>
      <button onClick={() => { setEditTime(plan.planned_time); setEditing(true) }} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground text-sm">✏️</button>
      <button onClick={() => onDelete(plan.id)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-500 text-sm">🗑</button>
    </div>
  )
}
