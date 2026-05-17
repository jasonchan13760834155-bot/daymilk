import { useState } from 'react'
import iconEditOutline from '../assets/ui/icon-edit-outline.png'
import iconTrashOutline from '../assets/ui/icon-trash-outline.png'
import { isoToHHMM, hhmmToISO, formatTimeRange, isOnTime } from '../utils/plan'
import type { Plan } from '../utils/plan'

interface Props {
  plan: Plan
  isActive: boolean
  onEdit: (id: string, planned_start_time: string, planned_end_time: string, actual_start_time?: string | null, actual_end_time?: string | null) => void
  onDelete: (id: string) => void
}

type Status = 'incomplete' | 'onTime' | 'late'

function getStatus(plan: Plan): Status {
  if (!plan.actual_start_time) return 'incomplete'
  return isOnTime(plan) ? 'onTime' : 'late'
}

const statusConfig: Record<Status, { dot: string; label: string; labelClass: string }> = {
  incomplete: {
    dot: 'bg-[#E05555]',
    label: '未完成',
    labelClass: 'text-[#D14343]',
  },
  onTime: {
    dot: 'bg-[#5FA04E]',
    label: '准时完成',
    labelClass: 'text-[#5FA04E]',
  },
  late: {
    dot: 'bg-[#DA8A20]',
    label: '未准时',
    labelClass: 'text-[#B8751A]',
  },
}

export default function PlanItem({ plan, isActive, onEdit, onDelete }: Props) {
  const status = getStatus(plan)
  const cfg = statusConfig[status]
  const today = new Date().toISOString().slice(0, 10)
  const [editing, setEditing] = useState(false)
  const [editPlannedStart, setEditPlannedStart] = useState(plan.planned_start_time)
  const [editPlannedEnd, setEditPlannedEnd] = useState(plan.planned_end_time)
  const [editActualStart, setEditActualStart] = useState(
    plan.actual_start_time ? isoToHHMM(plan.actual_start_time) : ''
  )
  const [editActualEnd, setEditActualEnd] = useState(
    plan.actual_end_time ? isoToHHMM(plan.actual_end_time) : ''
  )

  if (editing) {
    return (
      <div className="relative flex items-start gap-3">
        <div className="w-6 flex flex-col items-center pt-3">
          <div className={`w-[9px] h-[9px] rounded-full ${cfg.dot}`} aria-hidden="true">
            {status === 'onTime' ? <span className="block text-white text-[8px] leading-none font-bold text-center">✓</span> : null}
          </div>
        </div>
        <div className="plan-edit-card flex-1">
        <div className="plan-edit-fields">
          <div className="plan-edit-row">
            <span className="plan-edit-tag">计划</span>
            <input
              type="time"
              value={editPlannedStart}
              onChange={e => setEditPlannedStart(e.target.value)}
              className="plan-time-input"
            />
            <span className="plan-edit-sep">-</span>
            <input
              type="time"
              value={editPlannedEnd}
              onChange={e => setEditPlannedEnd(e.target.value)}
              className="plan-time-input"
            />
          </div>
          {status !== 'incomplete' && (
            <div className="plan-edit-row">
              <span className="plan-edit-tag">实际</span>
              <input
                type="time"
                value={editActualStart}
                onChange={e => setEditActualStart(e.target.value)}
                className="plan-time-input"
              />
              <span className="plan-edit-sep">-</span>
              <input
                type="time"
                value={editActualEnd}
                onChange={e => setEditActualEnd(e.target.value)}
                className="plan-time-input"
              />
            </div>
          )}
          <div className="plan-edit-actions">
            <button onClick={() => setEditing(false)} className="plan-cancel-button">取消</button>
            <button
              onClick={() => {
                const newActualStart = status !== 'incomplete' && editActualStart
                  ? hhmmToISO(today, editActualStart)
                  : plan.actual_start_time
                const newActualEnd = status !== 'incomplete' && editActualEnd
                  ? hhmmToISO(today, editActualEnd)
                  : plan.actual_end_time
                onEdit(plan.id, editPlannedStart, editPlannedEnd, newActualStart, newActualEnd)
                setEditing(false)
              }}
              className="plan-save-button"
            >
              保存
            </button>
          </div>
        </div>
        </div>
      </div>
    )
  }

  const dotColor = isActive ? 'bg-pink-400' : cfg.dot
  const timeColor = isActive ? 'text-pink-500' : 'text-foreground'
  const rowBg = isActive ? 'bg-pink-50/50' : 'bg-transparent'

  return (
    <div className={`relative flex items-center gap-4 rounded-2xl py-3 px-4 ${rowBg} transition-colors duration-200`}>
      {/* Timeline connector */}
      <div className="w-6 flex flex-col items-center self-stretch">
        <div className={`w-[9px] h-[9px] rounded-full mt-[6px] ${dotColor}`} aria-hidden="true">
          {status === 'onTime' ? <span className="block text-white text-[7px] leading-tight font-bold text-center">✓</span> : null}
        </div>
        {isActive && (
          <div className="absolute left-[25px] top-[22px] h-full border-l border-dashed border-pink-200/60" aria-hidden="true" />
        )}
      </div>

      {/* Card body */}
      <div className="flex-1 min-w-0 flex items-center justify-between gap-3">
        <div className="flex flex-col min-w-0">
          <div className={`text-[20px] font-extrabold tracking-tight leading-tight ${timeColor}`}>
            {formatTimeRange(plan.planned_start_time, plan.planned_end_time)}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className={`text-[13px] font-semibold ${isActive ? 'text-pink-400' : cfg.labelClass}`}>
              {isActive ? '进行中' : cfg.label}
            </span>
            {status !== 'incomplete' && plan.actual_start_time && plan.actual_end_time && (
              <span className="text-[13px] text-[#8A807A] tabular-nums">
                {isoToHHMM(plan.actual_start_time)} – {isoToHHMM(plan.actual_end_time)}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
            aria-label={`编辑 ${plan.planned_start_time} 的计划`}
            onClick={() => {
              setEditPlannedStart(plan.planned_start_time)
              setEditPlannedEnd(plan.planned_end_time)
              setEditActualStart(plan.actual_start_time ? isoToHHMM(plan.actual_start_time) : '')
              setEditActualEnd(plan.actual_end_time ? isoToHHMM(plan.actual_end_time) : '')
              setEditing(true)
            }}
          >
            <img src={iconEditOutline} alt="" className="w-[18px] h-[18px] opacity-60" />
          </button>
          <button
            type="button"
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-black/5 transition-colors"
            aria-label={`删除 ${plan.planned_start_time} 的计划`}
            onClick={() => onDelete(plan.id)}
          >
            <img src={iconTrashOutline} alt="" className="w-[18px] h-[18px] opacity-50" />
          </button>
        </div>
      </div>
    </div>
  )
}
