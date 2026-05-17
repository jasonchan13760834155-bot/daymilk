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

interface EditRow {
  actualStart: string
  actualEnd: string
  error: string
}

export default function DayDetail({ plans, date, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [edits, setEdits] = useState<Record<string, EditRow>>({})

  if (!date) return null

  const enterEdit = () => {
    const init: Record<string, EditRow> = {}
    plans.forEach(p => {
      init[p.id] = {
        actualStart: p.actual_start_time ? isoToHHMM(p.actual_start_time) : '',
        actualEnd: p.actual_end_time ? isoToHHMM(p.actual_end_time) : '',
        error: '',
      }
    })
    setEdits(init)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEdits({})
  }

  const handleStartChange = (id: string, value: string) => {
    setEdits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        actualStart: value,
        actualEnd: value ? addMinutes(value, 20) : '',
        error: '',
      },
    }))
  }

  const handleEndChange = (id: string, value: string) => {
    setEdits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        actualEnd: value,
        actualStart: value ? addMinutes(value, -20) : '',
        error: '',
      },
    }))
  }

  const saveAll = async () => {
    const newEdits = { ...edits }
    let hasError = false

    for (const plan of plans) {
      const e = newEdits[plan.id]
      if (!e.actualStart && !e.actualEnd) continue
      if (!e.actualStart || !e.actualEnd) {
        e.error = '请填写完整时间'
        hasError = true
        continue
      }
      if (e.actualStart >= e.actualEnd) {
        e.error = '开始时间不能晚于结束时间'
        hasError = true
        continue
      }
    }

    if (hasError) {
      setEdits({ ...newEdits })
      return
    }

    for (const plan of plans) {
      const e = newEdits[plan.id]
      if (e.actualStart && e.actualEnd) {
        const startISO = hhmmToISO(date, e.actualStart)
        const endISO = hhmmToISO(date, e.actualEnd)
        await onUpdate(plan.id, startISO, endISO)
      }
    }

    setEditing(false)
    setEdits({})
  }

  if (editing) {
    return (
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-heading text-foreground font-bold">{date} 编辑</h3>
          <button
            onClick={cancelEdit}
            className="text-[13px] font-semibold text-subtle hover:text-foreground"
          >
            取消
          </button>
        </div>
        {plans.length === 0 ? (
          <p className="text-sm text-subtle">当天无记录</p>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => {
              const e = edits[plan.id]
              if (!e) return null
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
                        value={e.actualStart}
                        onChange={ev => handleStartChange(plan.id, ev.target.value)}
                        className="plan-time-input"
                      />
                      <span className="text-[12px] text-subtle">-</span>
                      <input
                        type="time"
                        value={e.actualEnd}
                        onChange={ev => handleEndChange(plan.id, ev.target.value)}
                        className="plan-time-input"
                      />
                    </div>
                    {e.error && (
                      <p className="text-[12px] text-[#E66D79] mt-1">{e.error}</p>
                    )}
                  </div>
                </div>
              )
            })}
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={cancelEdit} className="plan-cancel-button">取消</button>
              <button onClick={saveAll} className="plan-save-button">保存全部</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-heading text-foreground font-bold">{date} 详情</h3>
        <button
          onClick={enterEdit}
          className="text-[13px] font-semibold text-primary hover:opacity-80"
        >
          编辑
        </button>
      </div>
      {plans.length === 0 ? (
        <p className="text-sm text-subtle">当天无记录</p>
      ) : (
        <div className="space-y-2">
          {plans.map(plan => {
            const done = !!plan.actual_start_time
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
                  <span className="text-[12px] text-foreground/80 font-semibold mr-3 font-mono">
                    {isoToHHMM(plan.actual_start_time)} - {isoToHHMM(plan.actual_end_time)}
                  </span>
                ) : (
                  <span className="text-[11px] text-muted-foreground mr-3">-</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
