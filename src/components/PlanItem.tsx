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
  onEdit: (id: string, planned_time: string, actual_time?: string | null) => void
  onDelete: (id: string) => void
}

function isoToHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`
}

function hhmmToISO(dateStr: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toISOString().slice(0, 11) + `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`
}

export default function PlanItem({ plan, isActive, onEdit, onDelete }: Props) {
  const done = !!plan.actual_time
  const today = new Date().toISOString().slice(0, 10)
  const [editing, setEditing] = useState(false)
  const [editPlanned, setEditPlanned] = useState(plan.planned_time)
  const [editActual, setEditActual] = useState(plan.actual_time ? isoToHHMM(plan.actual_time) : '')

  if (editing) {
    return (
      <div className="flex flex-col gap-2 bg-card rounded-2xl p-3 shadow-sm border border-primary-light">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground w-12 shrink-0">计划</span>
          <input type="time" value={editPlanned} onChange={e => setEditPlanned(e.target.value)}
            className="flex-1 h-10 rounded-xl border border-border bg-bg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        </div>
        {done && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-12 shrink-0">实际</span>
            <input type="time" value={editActual} onChange={e => setEditActual(e.target.value)}
              className="flex-1 h-10 rounded-xl border border-border bg-bg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={() => {
            const newActual = done && editActual
              ? hhmmToISO(today, editActual)
              : plan.actual_time
            onEdit(plan.id, editPlanned, newActual)
            setEditing(false)
          }}
            className="text-sm text-primary font-medium px-2">保存</button>
          <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground px-2">取消</button>
        </div>
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
            实际 {isoToHHMM(plan.actual_time)} · 偏差 {formatTimeDiff(plan.planned_time, plan.actual_time)}
          </div>
        )}
        {!done && isActive && (
          <div className="text-xs text-primary">即将进行...</div>
        )}
      </div>
      <button onClick={() => { setEditPlanned(plan.planned_time); setEditActual(plan.actual_time ? isoToHHMM(plan.actual_time) : ''); setEditing(true) }} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground text-sm">✏️</button>
      <button onClick={() => onDelete(plan.id)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-500 text-sm">🗑</button>
    </div>
  )
}
