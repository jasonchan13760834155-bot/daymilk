import { useState } from 'react'
import { useHistory } from '../hooks/useHistory'
import CalendarGrid from '../components/CalendarGrid'
import DayDetail from '../components/DayDetail'

export default function History() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const { summary, selectedPlans, selectedDate, selectDate } = useHistory(year, month)

  const changeMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setMonth(m)
    setYear(y)
  }

  return (
    <div>
      <div className="bg-gradient-to-b from-primary-light/30 to-bg pt-8 pb-2 px-4">
        <div className="text-sm text-muted-foreground font-heading">回看记录</div>
        <h1 className="text-2xl font-heading text-foreground">历史</h1>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center text-primary text-lg">◀</button>
        <div className="font-heading text-foreground text-base">{year}年{month}月</div>
        <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center text-primary text-lg">▶</button>
      </div>

      <CalendarGrid year={year} month={month} summary={summary} selectedDate={selectedDate} onSelect={selectDate} />
      <div className="mt-4">
        <DayDetail plans={selectedPlans} date={selectedDate || ''} />
      </div>
    </div>
  )
}
