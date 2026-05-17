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

const statusStyles: Record<Status, { dot: string; border: string; label: string; labelClass: string; timeClass: string }> = {
  incomplete: {
    dot: 'bg-[#E05555] ring-[#FDE8E8]',
    border: 'border-l-[#E05555]',
    label: '未完成',
    labelClass: 'bg-red-50/80 text-[#D14343] border-red-200',
    timeClass: 'text-muted-foreground',
  },
  onTime: {
    dot: 'bg-success ring-[#D7EAD7]',
    border: 'border-l-success',
    label: '准时完成',
    labelClass: 'bg-green-50/80 text-success border-green-200',
    timeClass: 'text-foreground',
  },
  late: {
    dot: 'bg-[#F0AD4E] ring-[#FEF3E0]',
    border: 'border-l-[#F0AD4E]',
    label: '未准时',
    labelClass: 'bg-amber-50/80 text-[#C2780A] border-amber-200',
    timeClass: 'text-foreground',
  },
}

export default function PlanItem({ plan, isActive, onEdit, onDelete }: Props) {
  const status = getStatus(plan)
  const s = statusStyles[status]
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
        <div className="w-7 flex flex-col items-center">
          <div className={`w-5 h-5 rounded-full ring-4 flex items-center justify-center shadow-[0_5px_12px_rgba(80,61,50,0.14)] ${s.dot}`} aria-hidden="true">
            {status === 'onTime' ? <span className="text-white text-[10px] leading-none font-bold ml-[1px]">✓</span> : null}
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

  const dotExtra = isActive
    ? 'bg-pink-400 ring-pink-100'
    : status === 'onTime'
      ? 'bg-success ring-[#D7EAD7]'
      : status === 'late'
        ? 'bg-[#F0AD4E] ring-[#FEF3E0]'
        : 'bg-[#E05555] ring-[#FDE8E8]'

  const cardExtra = isActive
    ? 'border-pink-200 bg-pink-50/40 border-l-pink-300'
    : `${s.border} border-l-[4px] ${status === 'incomplete' ? 'bg-red-50/20' : ''}`

  const timeExtra = isActive ? 'text-pink-500' : s.timeClass

  return (
    <div className="relative flex items-start gap-3">
      <div className="w-7 flex flex-col items-center">
        {isActive && <div className="absolute left-[22px] top-[10px] w-5 border-t border-dashed border-pink-200" aria-hidden="true" />}
        <div
          className={`w-5 h-5 rounded-full ring-4 flex items-center justify-center shadow-[0_5px_12px_rgba(80,61,50,0.14)] ${dotExtra}`}
          aria-hidden="true"
        >
          {status === 'onTime' ? <span className="text-white text-[10px] leading-none font-bold ml-[1px]">✓</span> : null}
        </div>
      </div>

      <div className={`flex-1 rounded-[18px] border shadow-[0_8px_20px_rgba(68,52,44,0.10),inset_0_1px_0_rgba(255,255,255,0.85)] px-4 py-2.5 ${cardExtra}`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <div className={`text-xl font-extrabold tracking-wide ${timeExtra}`}>
              {formatTimeRange(plan.planned_start_time, plan.planned_end_time)}
            </div>
            <span className={`inline-flex items-center text-[11px] font-semibold rounded-md px-2 py-[1px] border w-fit ${isActive ? 'bg-pink-50 text-pink-500 border-pink-200' : s.labelClass}`}>
              {isActive ? '进行中' : s.label}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              type="button"
              className={`p-1 ${isActive ? 'text-pink-400' : 'text-[#9B9590]'}`}
              aria-label={`编辑 ${plan.planned_start_time} 的计划`}
              onClick={() => {
                setEditPlannedStart(plan.planned_start_time)
                setEditPlannedEnd(plan.planned_end_time)
                setEditActualStart(plan.actual_start_time ? isoToHHMM(plan.actual_start_time) : '')
                setEditActualEnd(plan.actual_end_time ? isoToHHMM(plan.actual_end_time) : '')
                setEditing(true)
              }}
            >
              <img src={iconEditOutline} alt="" className="w-5 h-5" />
            </button>
            <button
              type="button"
              className={`p-1 ${isActive ? 'text-pink-400' : 'text-[#9B9590]'}`}
              aria-label={`删除 ${plan.planned_start_time} 的计划`}
              onClick={() => onDelete(plan.id)}
            >
              <img src={iconTrashOutline} alt="" className="w-5 h-5" />
            </button>
          </div>
        </div>

        {status !== 'incomplete' && plan.actual_start_time && plan.actual_end_time ? (
          <div className="mt-2 flex items-center gap-3">
            <span className="text-[12px] font-semibold text-[#8E8A86]">
              实际 {isoToHHMM(plan.actual_start_time)} - {isoToHHMM(plan.actual_end_time)}
            </span>
          </div>
        ) : (
          <div className="mt-1" />
        )}
      </div>
    </div>
  )
}
