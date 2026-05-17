import { useState } from 'react'
import heroBanner from '../assets/generated/today-hero-banner.png'
import recordCardArt from '../assets/generated/today-record-card.png'
import { useTodaysPlans } from '../hooks/useTodaysPlans'
import StatsCards from '../components/StatsCards'
import RecordDialog from '../components/RecordDialog'
import PlanList from '../components/PlanList'

export default function Today() {
  const { plans, loading, recording, record, updatePlan, deletePlan } = useTodaysPlans()
  const [dialogOpen, setDialogOpen] = useState(false)
  const isPreviewBuild = import.meta.env.DEV
  const previewPlans = isPreviewBuild
    ? plans.map((plan, index) => {
        if (index === 0) {
          return {
            ...plan,
            actual_start_time: '2026-05-15T09:05:00+08:00',
            actual_end_time: '2026-05-15T09:25:00+08:00',
          }
        }
        if (index === 1 || index === 2) {
          return {
            ...plan,
            actual_start_time: '2026-05-15T09:15:00+08:00',
            actual_end_time: '2026-05-15T09:35:00+08:00',
          }
        }
        return plan
      })
    : plans

  if (loading) {
    return (
      <div className="today-loading">
        <div className="today-spinner" />
      </div>
    )
  }

  const today = new Date()
  const weekDay = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()]
  const month = today.getMonth() + 1
  const day = today.getDate()

  const hasIncomplete = previewPlans.some(p => !p.actual_start_time)

  const handleConfirm = async (startISO: string, endISO: string) => {
    const result = await record(startISO, endISO)
    if (result.success) {
      setDialogOpen(false)
    } else if (result.error) {
      alert(result.error)
    }
  }

  return (
    <div className="min-h-full w-full bg-[#F7F3F0]">
      {plans.length === 0 ? (
        <div className="today-empty">
          <div className="today-empty-icon">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="5" y="4" width="14" height="17" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" />
              <path d="M9 4.5h6M8.5 10h7M8.5 14h5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </div>
          <p>还没有计划</p>
          <span>请先去设置页面配置每日预设</span>
        </div>
      ) : (
        <>
          <div className="relative">
            <div className="relative w-screen left-1/2 -translate-x-1/2 h-[210px] overflow-hidden">
              <img src={heroBanner} alt="" className="h-full w-full object-cover object-center" aria-hidden="true" />
              <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-[#F7F3F0]" aria-hidden="true" />
            </div>

            <div className="absolute inset-0 px-6 pt-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[16px] font-semibold text-[#3A3433] opacity-90">
                    <span>{month}月{day}日</span>
                    <span>周{weekDay}</span>
                    <span className="inline-flex w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-[#6F6662] translate-y-[1px]" aria-hidden="true" />
                  </div>
                  <div className="mt-2 text-[54px] leading-[1] font-extrabold text-[#3A3433] tracking-wider">今天</div>
                  <div className="mt-3 text-[14px] text-[#6E6662] font-medium">
                    你的坚持，宝宝的营养 <span className="text-pink-400">♥</span>
                  </div>
                </div>

              </div>
            </div>

            <div className="-mt-10 px-5">
              <StatsCards
                plans={previewPlans}
                displayTotal={isPreviewBuild ? 8 : undefined}
                displayOnTimeTotal={isPreviewBuild ? 3 : undefined}
              />
            </div>
          </div>

          <div className="px-5 mt-4">
            <section className="relative overflow-hidden">
              <div className="h-[176px] overflow-hidden rounded-[24px]">
                <img src={recordCardArt} alt="" className="w-full h-full object-cover object-center" aria-hidden="true" />
              </div>
              <button
                onClick={() => setDialogOpen(true)}
                disabled={!hasIncomplete}
                className="absolute right-[18px] bottom-[30px] h-[64px] w-[150px] rounded-full bg-transparent border-0 text-transparent cursor-pointer disabled:cursor-not-allowed"
                aria-label="记录当前时间"
                title={hasIncomplete ? '记录当前时间' : '今日已全部完成'}
              >
                记录当前时间
              </button>
              <div className="sr-only">{hasIncomplete ? '点击记录当前时段' : '今日已全部完成'}</div>
            </section>
          </div>

          <PlanList plans={previewPlans} onEdit={updatePlan} onDelete={deletePlan} />
        </>
      )}

      <RecordDialog
        open={dialogOpen}
        recording={recording}
        onConfirm={handleConfirm}
        onCancel={() => setDialogOpen(false)}
      />
    </div>
  )
}
