interface Props {
  onRecord: () => Promise<{ success?: boolean; error?: string; planned?: string }>
  recording: boolean
  nextPlanTime?: string
}

export default function RecordButton({ onRecord, recording, nextPlanTime }: Props) {
  const handleClick = async () => {
    if (recording) return
    await onRecord()
  }

  return (
    <div className="px-4 py-3">
      <div className="bg-card rounded-2xl shadow-sm p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-base font-heading text-foreground">记录吸奶</span>
          {nextPlanTime && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>下一个计划 {nextPlanTime}</span>
            </div>
          )}
        </div>

        {/* Circular Ripple Button */}
        <div className="flex justify-center">
          <button onClick={handleClick} disabled={recording}
            className="relative flex items-center justify-center active:scale-95 transition-transform">
            {/* Outer ring */}
            <div className="absolute w-36 h-36 rounded-full border-2 border-primary/10" />
            {/* Middle ring */}
            <div className="absolute w-28 h-28 rounded-full border-2 border-primary/20" />
            {/* Inner ring */}
            <div className="absolute w-20 h-20 rounded-full border-2 border-primary/30" />
            {/* Center button */}
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-[#D48B8B] flex items-center justify-center shadow-lg shadow-primary/30">
              <span className="text-white text-sm font-heading">{recording ? '...' : '记录'}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
