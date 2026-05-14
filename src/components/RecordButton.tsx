interface Props {
  onRecord: () => Promise<{ success?: boolean; error?: string; planned?: string }>
  recording: boolean
}

export default function RecordButton({ onRecord, recording }: Props) {
  const handleClick = async () => {
    if (recording) return
    await onRecord()
  }

  return (
    <div className="px-4 py-4">
      <button onClick={handleClick} disabled={recording}
        className="w-full bg-gradient-to-br from-primary to-accent rounded-2xl p-5 text-center shadow-lg shadow-primary/20 relative overflow-hidden active:scale-[0.98] transition-transform">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/8 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-14 h-14 bg-white/6 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="text-2xl mb-1">⏺️</div>
          <div className="text-lg font-heading text-white">{recording ? '记录中...' : '记录吸奶时间'}</div>
          <div className="text-xs text-white/70 mt-1">点击记录当前时间</div>
        </div>
      </button>
    </div>
  )
}
