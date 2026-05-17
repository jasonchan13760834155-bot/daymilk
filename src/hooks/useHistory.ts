import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { toHHMM } from '../utils/plan'

interface DayPlan {
  id: string
  planned_start_time: string
  planned_end_time: string
  actual_start_time: string | null
  actual_end_time: string | null
}

interface DaySummary {
  date: string
  completed: boolean
  total: number
  done: number
}

export function useHistory(year: number, month: number) {
  const { user } = useAuth()
  const [summary, setSummary] = useState<DaySummary[]>([])
  const [selectedPlans, setSelectedPlans] = useState<DayPlan[]>([])
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchSummary = useCallback(async () => {
    if (!user) return
    const start = `${year}-${String(month).padStart(2, '0')}-01`
    const end = `${year}-${String(month).padStart(2, '0')}-31`

    const { data } = await supabase
      .from('daily_plans')
      .select('date, actual_start_time')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date')

    if (data) {
      const byDate = new Map<string, { total: number; done: number }>()
      data.forEach((row: { date: string; actual_start_time: string | null }) => {
        const d = row.date
        if (!byDate.has(d)) byDate.set(d, { total: 0, done: 0 })
        const entry = byDate.get(d)!
        entry.total++
        if (row.actual_start_time) entry.done++
      })
      setSummary(Array.from(byDate.entries()).map(([date, v]) => ({
        date,
        completed: v.total > 0 && v.done === v.total,
        total: v.total,
        done: v.done
      })))
    }
    setLoading(false)
  }, [user, year, month])

  useEffect(() => { fetchSummary() }, [fetchSummary])

  const selectDate = async (date: string) => {
    setSelectedDate(date)
    const { data } = await supabase
      .from('daily_plans')
      .select('id, planned_start_time, planned_end_time, actual_start_time, actual_end_time')
      .eq('user_id', user!.id)
      .eq('date', date)
      .order('sort_order')
    setSelectedPlans(
      (data ?? []).map((r: any) => ({
        ...r,
        planned_start_time: toHHMM(r.planned_start_time),
        planned_end_time: toHHMM(r.planned_end_time),
      })),
    )
  }

  const updatePlan = async (id: string, actual_start_time: string, actual_end_time: string) => {
    await supabase
      .from('daily_plans')
      .update({ actual_start_time, actual_end_time })
      .eq('id', id)
    setSelectedPlans(prev => prev.map(p => {
      if (p.id !== id) return p
      return {
        ...p,
        actual_start_time,
        actual_end_time,
      }
    }))
  }

  return { summary, selectedPlans, selectedDate, selectDate, loading, updatePlan }
}
