import { useState } from 'react'
import { usePreset } from '../hooks/usePreset'
import { useAuth } from '../hooks/useAuth'

export default function Settings() {
  const { preset, loading, updatePreset } = usePreset()
  const { user, signOut } = useAuth()
  const [start, setStart] = useState('06:00')
  const [end, setEnd] = useState('22:00')
  const [count, setCount] = useState(5)
  const [saved, setSaved] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Sync local state from loaded preset (once)
  if (!loading && preset && !initialized) {
    setStart(preset.start_time)
    setEnd(preset.end_time)
    setCount(preset.daily_count)
    setInitialized(true)
  }

  const handleSave = async () => {
    await updatePreset({ start_time: start, end_time: end, daily_count: count })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="p-4 pt-8">
      <h1 className="text-2xl font-heading text-foreground mb-6">设置</h1>

      <div className="bg-card rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="text-lg font-heading text-foreground mb-1">每日预设</h2>
        <p className="text-xs text-muted-foreground mb-4">修改预设仅影响明天及以后的计划</p>

        <div className="flex gap-3 mb-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-foreground block mb-1">起始时间</label>
            <input type="time" value={start} onChange={e => setStart(e.target.value)}
              className="w-full h-12 rounded-xl border border-border bg-bg px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
          <div className="flex-1">
            <label className="text-xs font-medium text-foreground block mb-1">结束时间</label>
            <input type="time" value={end} onChange={e => setEnd(e.target.value)}
              className="w-full h-12 rounded-xl border border-border bg-bg px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
          </div>
        </div>

        <div className="mb-4">
          <label className="text-xs font-medium text-foreground block mb-1">每日次数: {count}</label>
          <input type="range" min={1} max={12} value={count} onChange={e => setCount(Number(e.target.value))}
            className="w-full accent-primary" />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>1</span><span>12</span>
          </div>
        </div>

        <button onClick={handleSave}
          className="w-full h-12 bg-primary text-white font-heading rounded-2xl">
          {saved ? '已保存 ✓' : '保存预设'}
        </button>
      </div>

      <div className="bg-card rounded-2xl p-5 shadow-sm mb-4">
        <h2 className="text-lg font-heading text-foreground mb-3">账号</h2>
        <div className="text-sm text-muted-foreground mb-1">邮箱: {user?.email}</div>
        <div className="text-sm text-muted-foreground">注册时间: {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}</div>
      </div>

      <button onClick={signOut}
        className="w-full h-12 border border-border text-muted-foreground font-heading rounded-2xl">
        退出登录
      </button>
    </div>
  )
}
