import { useState, useEffect } from 'react'
import { addMinutes } from '../utils/plan'

interface Props {
  open: boolean
  recording: boolean
  onConfirm: (startISO: string, endISO: string) => void
  onCancel: () => void
}

function nowHHMM(offsetMinutes: number = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60 * 1000)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function todayDateStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function hhmmToLocalISO(hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.toISOString()
}

export default function RecordDialog({ open, recording, onConfirm, onCancel }: Props) {
  const [startTime, setStartTime] = useState(() => nowHHMM(0))
  const [endTime, setEndTime] = useState(() => nowHHMM(20))
  const [error, setError] = useState('')

  useEffect(() => {
    if (open) {
      setStartTime(nowHHMM(0))
      setEndTime(nowHHMM(20))
      setError('')
    }
  }, [open])

  if (!open) return null

  const handleConfirm = () => {
    const startISO = hhmmToLocalISO(startTime)
    const endISO = hhmmToLocalISO(endTime)
    if (new Date(startISO) >= new Date(endISO)) {
      setError('开始时间不能晚于结束时间')
      return
    }
    setError('')
    onConfirm(startISO, endISO)
  }

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-card" onClick={e => e.stopPropagation()}>
        <h2 className="dialog-title">记录吸奶时间</h2>
        <p className="dialog-subtitle">{todayDateStr()}</p>
        <div className="dialog-fields">
          <div className="dialog-field">
            <label className="dialog-label">开始时间</label>
            <input
              type="time"
              value={startTime}
              onChange={e => { const v = e.target.value; setStartTime(v); setEndTime(addMinutes(v, 20)) }}
              className="dialog-input"
            />
          </div>
          <div className="dialog-field">
            <label className="dialog-label">结束时间</label>
            <input
              type="time"
              value={endTime}
              onChange={e => setEndTime(e.target.value)}
              className="dialog-input"
            />
          </div>
        </div>
        {error && <p className="dialog-error">{error}</p>}
        <div className="dialog-actions">
          <button onClick={onCancel} className="dialog-cancel-btn">取消</button>
          <button onClick={handleConfirm} disabled={recording} className="dialog-confirm-btn">
            {recording ? '记录中...' : '确认记录'}
          </button>
        </div>
      </div>
    </div>
  )
}
