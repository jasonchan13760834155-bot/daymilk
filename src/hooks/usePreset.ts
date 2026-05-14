import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface Preset {
  id: string
  start_time: string
  end_time: string
  daily_count: number
}

export function usePreset() {
  const { user } = useAuth()
  const [preset, setPreset] = useState<Preset | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPreset = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('presets').select('*').eq('user_id', user.id).single()
    setPreset(data)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchPreset() }, [fetchPreset])

  const updatePreset = async (updates: { start_time?: string; end_time?: string; daily_count?: number }) => {
    if (!user) return
    const { data } = await supabase
      .from('presets')
      .upsert({ user_id: user.id, ...preset, ...updates }, { onConflict: 'user_id' })
      .select()
      .single()
    if (data) setPreset(data)
  }

  return { preset, loading, updatePreset }
}
