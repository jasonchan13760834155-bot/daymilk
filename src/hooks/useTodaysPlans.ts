import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { usePreset } from './usePreset'
import type { Plan } from '../utils/plan'
import { toHHMM } from '../utils/plan'

const generatedDates = new Set<string>()

const normalize = (rows: any[] | null): Plan[] =>
  (rows ?? []).map(r => ({
    ...r,
    planned_start_time: toHHMM(r.planned_start_time),
    planned_end_time: toHHMM(r.planned_end_time),
  })) as Plan[]

export function useTodaysPlans() {
  const { user } = useAuth()
  const { preset } = usePreset()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const generatedRef = useRef(false)
  const todayRef = useRef(new Date().toISOString().slice(0, 10))

  const today = new Date().toISOString().slice(0, 10)

  const fetchPlans = useCallback(async () => {
    if (!user) return
    const { data } = await supabase
      .from('daily_plans')
      .select('id, planned_start_time, planned_end_time, actual_start_time, actual_end_time, sort_order')
      .eq('user_id', user.id)
      .eq('date', today)
      .order('sort_order')

    if (data && data.length > 0) {
      setPlans(normalize(data))
      generatedRef.current = true
    } else if (preset && !generatedRef.current && !generatedDates.has(today)) {
      generatedRef.current = true
      generatedDates.add(today)
      const rows = preset.slots.map((slot, i) => ({
        user_id: user.id,
        date: today,
        planned_start_time: slot.start,
        planned_end_time: slot.end,
        sort_order: i + 1
      }))
      const { data: inserted } = await supabase
        .from('daily_plans')
        .insert(rows)
        .select('id, planned_start_time, planned_end_time, actual_start_time, actual_end_time, sort_order')
      if (inserted) setPlans(normalize(inserted))
    }
    setLoading(false)
  }, [user?.id, preset, today])

  useEffect(() => { fetchPlans() }, [fetchPlans])

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        const currentDate = new Date().toISOString().slice(0, 10)
        if (currentDate !== todayRef.current) {
          todayRef.current = currentDate
          generatedRef.current = false
          setLoading(true)
        }
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const record = useCallback(async (startISO: string, endISO: string) => {
    const incomplete = plans.filter(p => !p.actual_start_time)
    if (!incomplete.length) return { error: '今日计划已全部完成' }

    const target = incomplete.sort((a, b) => a.sort_order - b.sort_order)[0]

    setRecording(true)
    const { error } = await supabase
      .from('daily_plans')
      .update({ actual_start_time: startISO, actual_end_time: endISO })
      .eq('id', target.id)
    setRecording(false)

    if (!error) {
      setPlans(prev => prev.map(p =>
        p.id === target.id ? { ...p, actual_start_time: startISO, actual_end_time: endISO } : p
      ))
      return { success: true }
    }
    return { error: '记录失败，请重试' }
  }, [plans])

  const updatePlan = async (id: string, planned_start_time: string, planned_end_time: string, actual_start_time?: string | null, actual_end_time?: string | null) => {
    const update: Record<string, string | null> = { planned_start_time, planned_end_time }
    if (actual_start_time !== undefined) update.actual_start_time = actual_start_time
    if (actual_end_time !== undefined) update.actual_end_time = actual_end_time
    await supabase.from('daily_plans').update(update).eq('id', id)
    setPlans(prev => prev.map(p => {
      if (p.id !== id) return p
      return {
        ...p,
        planned_start_time,
        planned_end_time,
        ...(actual_start_time !== undefined ? { actual_start_time } : {}),
        ...(actual_end_time !== undefined ? { actual_end_time } : {}),
      }
    }))
  }

  const deletePlan = async (id: string) => {
    await supabase.from('daily_plans').delete().eq('id', id)
    setPlans(prev => prev.filter(p => p.id !== id))
  }

  const resetToday = async () => {
    if (!user || !preset) return { error: '无法重置' }
    await supabase.from('daily_plans').delete().eq('user_id', user.id).eq('date', today)
    const rows = preset.slots.map((slot, i) => ({
      user_id: user.id,
      date: today,
      planned_start_time: slot.start,
      planned_end_time: slot.end,
      sort_order: i + 1
    }))
    const { data: inserted } = await supabase
      .from('daily_plans')
      .insert(rows)
      .select('id, planned_start_time, planned_end_time, actual_start_time, actual_end_time, sort_order')
    if (inserted) {
      setPlans(normalize(inserted))
      return { success: true }
    }
    return { error: '重置失败' }
  }

  return { plans, loading, recording, record, updatePlan, deletePlan, resetToday }
}
