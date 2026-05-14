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
      <div className="bg-card rounded-2xl card px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[15px] font-heading text-foreground">记录吸奶</span>
          {nextPlanTime && (
            <div className="flex items-center gap-1 text-xs text-subtle">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>下一个计划 {nextPlanTime}</span>
            </div>
          )}
        </div>

        <div className="flex justify-center">
          <button onClick={handleClick} disabled={recording}
            className="relative flex items-center justify-center active:scale-95 transition-transform duration-150"
            style={{ width: 96, height: 96 }}>
            <div className="absolute w-24 h-24 rounded-full border-[1.5px] border-primary/10" />
            <div className="absolute w-[72px] h-[72px] rounded-full border-[1.5px] border-primary/20" />
            <div className="absolute w-[56px] h-[56px] rounded-full border-[1.5px] border-primary/30" />
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-[#D48B8B] flex items-center justify-center shadow-[0_3px_12px_rgba(236,72,153,0.35)]">
              <span className="text-white text-xs font-heading">{recording ? '...' : '记录'}</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  )
}
