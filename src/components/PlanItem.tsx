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
}

function isoToHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function hhmmToISO(dateStr: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date(dateStr + 'T00:00:00Z')
  return d.toISOString().slice(0, 11) + `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`
}

export default function PlanItem({ plan, isActive, onEdit }: Props) {
  const done = !!plan.actual_time
  const today = new Date().toISOString().slice(0, 10)
  const [editing, setEditing] = useState(false)
  const [editPlanned, setEditPlanned] = useState(plan.planned_time)
  const [editActual, setEditActual] = useState(plan.actual_time ? isoToHHMM(plan.actual_time) : '')

  if (editing) {
    return (
      <div className="bg-card rounded-xl card border border-primary-light overflow-hidden">
        <div className="p-3 space-y-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-8">计划</span>
            <input type="time" value={editPlanned} onChange={e => setEditPlanned(e.target.value)}
              className="flex-1 h-9 rounded-lg border border-border bg-bg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          {done && (
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground w-8">实际</span>
              <input type="time" value={editActual} onChange={e => setEditActual(e.target.value)}
                className="flex-1 h-9 rounded-lg border border-border bg-bg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
            </div>
          )}
          <div className="flex justify-end gap-2 pt-0.5">
            <button onClick={() => setEditing(false)}
              className="text-xs text-muted-foreground px-3 py-1.5">取消</button>
            <button onClick={() => {
              const newActual = done && editActual
                ? hhmmToISO(today, editActual)
                : plan.actual_time
              onEdit(plan.id, editPlanned, newActual)
              setEditing(false)
            }}
              className="text-xs bg-primary text-white font-medium px-4 py-1.5 rounded-lg">保存</button>
          </div>
        </div>
      </div>
    )
  }

  const diffStr = done && plan.actual_time ? formatTimeDiff(plan.planned_time, plan.actual_time) : ''
  const diffNum = done && plan.actual_time ? parseInt(diffStr) : 0
  const isOnTime = Math.abs(diffNum) <= 10

  return (
    <div className={`flex items-center bg-card rounded-xl card overflow-hidden ${
      done ? 'border-l-[3px] border-l-success' :
      isActive ? 'border-l-[3px] border-l-primary ring-1 ring-primary-light' :
      'border-l-[3px] border-l-transparent'
    }`}>
      <div className="pl-3 pr-2 py-3 w-[72px] shrink-0">
        <div className={`text-[15px] font-heading leading-tight ${
          done ? 'text-foreground' : isActive ? 'text-foreground' : 'text-muted-foreground'
        }`}>
          {plan.planned_time}
        </div>
        <div className={`text-[11px] mt-0.5 ${
          done ? 'text-success' :
          isActive ? 'text-primary font-medium' :
          'text-muted-foreground'
        }`}>
          {done ? `已完成 ${isoToHHMM(plan.actual_time!)}` : isActive ? '进行中' : '待吸奶'}
        </div>
      </div>

      <div className="flex-1" />

      {done && plan.actual_time && (
        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium mr-2 ${
          isOnTime ? 'bg-success-light text-success' : 'bg-danger-light text-danger'
        }`}>
          {diffStr}
        </span>
      )}

      <button
        onClick={() => {
          setEditPlanned(plan.planned_time)
          setEditActual(plan.actual_time ? isoToHHMM(plan.actual_time) : '')
          setEditing(true)
        }}
        className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground rounded-lg mr-1"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="12" cy="19" r="1.5"/></svg>
      </button>
    </div>
  )
}
