import { useState } from 'react'
import { isoToHHMM, hhmmToISO, formatTimeRange, addMinutes } from '../utils/plan'

interface DayPlan {
  id: string
  planned_start_time: string
  planned_end_time: string
  actual_start_time: string | null
  actual_end_time: string | null
}

interface Props {
  plans: DayPlan[]
  date: string
  onUpdate: (id: string, actual_start_time: string, actual_end_time: string) => void
}

export default function DayDetail({ plans, date, onUpdate }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editError, setEditError] = useState('')

  if (!date) return null

  const enterEdit = (plan: DayPlan) => {
    setEditingId(plan.id)
    setEditStart(plan.actual_start_time ? isoToHHMM(plan.actual_start_time) : '')
    setEditEnd(plan.actual_end_time ? isoToHHMM(plan.actual_end_time) : '')
    setEditError('')
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditError('')
  }

  const handleStartChange = (value: string) => {
    setEditStart(value)
    setEditEnd(value ? addMinutes(value, 20) : '')
    setEditError('')
  }

  const handleEndChange = (value: string) => {
    setEditEnd(value)
    setEditStart(value ? addMinutes(value, -20) : '')
    setEditError('')
  }

  const saveEdit = async () => {
    if (!editingId) return
    if (!editStart || !editEnd) {
      setEditError('请填写完整时间')
      return
    }
    if (editStart >= editEnd) {
      setEditError('开始时间不能晚于结束时间')
      return
    }
    const startISO = hhmmToISO(date, editStart)
    const endISO = hhmmToISO(date, editEnd)
    await onUpdate(editingId, startISO, endISO)
    setEditingId(null)
    setEditError('')
  }

  return (
    <div className="px-4 pb-4">
      <h3 className="text-sm font-heading text-foreground mb-3 font-bold">{date} 详情</h3>
      {plans.length === 0 ? (
        <p className="text-sm text-subtle">当天无记录</p>
      ) : (
        <div className="space-y-2">
          {plans.map(plan => {
            const done = !!plan.actual_start_time
            const isEditing = editingId === plan.id

            if (isEditing) {
              return (
                <div key={plan.id} className="plan-edit-card">
                  <div className="plan-edit-fields">
                    <div className="text-[13px] font-semibold text-foreground mb-2">
                      {formatTimeRange(plan.planned_start_time, plan.planned_end_time)}
                    </div>
                    <div className="plan-edit-row">
                      <span className="text-[12px] font-bold text-subtle w-8 shrink-0">开始</span>
                      <input
                        type="time"
                        value={editStart}
                        onChange={ev => handleStartChange(ev.target.value)}
                        className="plan-time-input"
                      />
                      <span className="text-[12px] text-subtle">-</span>
                      <input
                        type="time"
                        value={editEnd}
                        onChange={ev => handleEndChange(ev.target.value)}
                        className="plan-time-input"
                      />
                    </div>
                    {editError && (
                      <p className="text-[12px] text-[#E66D79] mt-1">{editError}</p>
                    )}
                    <div className="flex justify-end gap-2 mt-2">
                      <button onClick={cancelEdit} className="plan-cancel-button">取消</button>
                      <button onClick={saveEdit} className="plan-save-button">保存</button>
                    </div>
                  </div>
                </div>
              )
            }

            return (
              <div
                key={plan.id}
                className={`flex items-center bg-card rounded-xl card overflow-hidden ${
                  done ? 'border-l-[4px] border-l-success' : 'border-l-[4px] border-l-muted-foreground/15'
                }`}
              >
                <div className="pl-4 pr-2 py-3 w-[120px] shrink-0">
                  <div className={`text-sm font-heading font-bold leading-tight ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {formatTimeRange(plan.planned_start_time, plan.planned_end_time)}
                  </div>
                  <div className={`text-[11px] mt-1 font-medium ${done ? 'text-success' : 'text-muted-foreground'}`}>
                    {done ? '已完成' : '未完成'}
                  </div>
                </div>
                <div className="flex-1" />
                {done && plan.actual_start_time && plan.actual_end_time ? (
                  <span className="text-[12px] text-foreground/80 font-semibold mr-2 font-mono">
                    {isoToHHMM(plan.actual_start_time)} - {isoToHHMM(plan.actual_end_time)}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground mr-2">-</span>
                )}
                <button
                  onClick={() => enterEdit(plan)}
                  className="text-[12px] font-semibold text-primary hover:opacity-80 mr-3 shrink-0"
                >
                  编辑
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
