import { useState } from 'react'
import { useHistory } from '../hooks/useHistory'
import CalendarGrid from '../components/CalendarGrid'
import DayDetail from '../components/DayDetail'

export default function History() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const { summary, selectedPlans, selectedDate, selectDate, updatePlan } = useHistory(year, month)

  const changeMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setMonth(m)
    setYear(y)
  }

  return (
    <div className="pb-2">
      <div className="px-5 pt-10 pb-2">
        <p className="text-sm text-subtle font-medium">回看记录</p>
        <h1 className="text-[28px] font-heading text-foreground leading-tight mt-0.5 font-bold">历史</h1>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => changeMonth(-1)}
          className="w-10 h-10 flex items-center justify-center text-subtle hover:text-foreground hover:bg-muted rounded-xl transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span className="font-heading text-foreground text-base font-bold">{year}年{month}月</span>
        <button onClick={() => changeMonth(1)}
          className="w-10 h-10 flex items-center justify-center text-subtle hover:text-foreground hover:bg-muted rounded-xl transition-colors">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      </div>

      <CalendarGrid year={year} month={month} summary={summary} selectedDate={selectedDate} onSelect={selectDate} />

      <div className="mt-4">
        <DayDetail plans={selectedPlans} date={selectedDate || ''} onUpdate={updatePlan} />
      </div>
    </div>
  )
}
