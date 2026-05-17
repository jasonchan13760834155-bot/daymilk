interface DaySummary {
  date: string
  completed: boolean
  total: number
  done: number
}

interface Props {
  year: number
  month: number
  summary: DaySummary[]
  selectedDate: string | null
  onSelect: (date: string) => void
}

export default function CalendarGrid({ year, month, summary, selectedDate, onSelect }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay() || 7

  const summaryMap = new Map(summary.map(s => [s.date, s]))

  const days: (number | null)[] = [
    ...Array(firstDayOfWeek - 1).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]

  const headers = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div className="px-4">
      <div className="grid grid-cols-7 text-center">
        {headers.map(h => (
          <div key={h} className="text-[11px] text-muted-foreground py-2.5 font-semibold">{h}</div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const info = summaryMap.get(dateStr)
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate
          const isPast = dateStr < today
          const hasRecords = info && info.total > 0
          const allDone = info?.completed
          const partialDone = hasRecords && !allDone && (info?.done ?? 0) > 0
          const dotColor = !hasRecords
            ? 'bg-[#E05555]'
            : allDone
              ? 'bg-success'
              : partialDone
                ? 'bg-[#F0AD4E]'
                : 'bg-[#E05555]'

          return (
            <button key={dateStr} onClick={() => onSelect(dateStr)}
              className={`relative py-2.5 text-sm rounded-full w-10 h-10 mx-auto flex items-center justify-center font-medium transition-colors ${
                isSelected
                  ? 'bg-primary text-white font-bold shadow-button'
                  : isToday
                    ? 'text-primary font-bold bg-primary-bg'
                    : 'text-foreground hover:bg-muted'
              }`}>
              {day}
              {isPast && (
                <span className={`absolute bottom-[2px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full ${isSelected ? 'bg-white/60' : dotColor}`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
