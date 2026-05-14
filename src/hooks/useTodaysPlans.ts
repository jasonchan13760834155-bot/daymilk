import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { generatePlanTimes } from '../utils/plan'
import { usePreset } from './usePreset'

interface Plan {
  id: string
  planned_time: string
  actual_time: string | null
  sort_order: number
}

export function useTodaysPlans() {
  const { user } = useAuth()
  const { preset } = usePreset()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)

  const today = new Date().toISOString().slice(0, 10)

  const fetchPlans = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('daily_plans')
      .select('id, planned_time, actual_time, sort_order')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('sort_order')

    if (data && data.length > 0) {
      setPlans(data)
    } else if (preset) {
      const times = generatePlanTimes(preset.start_time, preset.end_time, preset.daily_count)
      const rows = times.map((time, i) => ({
        user_id: user.id,
        date: today,
        planned_time: time,
        sort_order: i + 1
      }))
      const { data: inserted } = await supabase.from('daily_plans').insert(rows).select('id, planned_time, actual_time, sort_order')
      if (inserted) setPlans(inserted)
    }
    setLoading(false)
  }, [user, preset, today])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  const record = useCallback(async () => {
    const incomplete = plans.filter(p => !p.actual_time)
    if (!incomplete.length) return { error: '今日计划已全部完成' }

    const now = new Date()
    const nowMin = now.getUTCHours() * 60 + now.getUTCMinutes()

    const nearest = incomplete.reduce((a, b) => {
      const [ah, am] = a.planned_time.split(':').map(Number)
      const [bh, bm] = b.planned_time.split(':').map(Number)
      return Math.abs(ah * 60 + am - nowMin) < Math.abs(bh * 60 + bm - nowMin) ? a : b
    })

    setRecording(true)
    const { error } = await supabase
      .from('daily_plans')
      .update({ actual_time: now.toISOString() })
      .eq('id', nearest.id)
    setRecording(false)

    if (!error) {
      setPlans(prev => prev.map(p => p.id === nearest.id ? { ...p, actual_time: now.toISOString() } : p))
      return { success: true, planned: nearest.planned_time }
    }
    return { error: '记录失败，请重试' }
  }, [plans])

  const updatePlan = async (id: string, planned_time: string, actual_time?: string | null) => {
    const update: Record<string, string | null> = { planned_time }
    if (actual_time !== undefined) {
      update.actual_time = actual_time
    }
    await supabase.from('daily_plans').update(update).eq('id', id)
    setPlans(prev => prev.map(p => {
      if (p.id !== id) return p
      return { ...p, planned_time, ...(actual_time !== undefined ? { actual_time } : {}) }
    }))
  }

  const deletePlan = async (id: string) => {
    await supabase.from('daily_plans').delete().eq('id', id)
    setPlans(prev => prev.filter(p => p.id !== id))
  }

  return { plans, loading, recording, record, updatePlan, deletePlan }
}
