import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const isDevMode = import.meta.env.VITE_DEV_MODE === 'true'

function createSupabaseClient(): SupabaseClient {
  if (isDevMode) {
    console.log('🛠️  Dev mode active — using in-memory mock client')
    return createDevMockClient()
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

  if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://') && supabaseAnonKey.startsWith('eyJ')) {
    return createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false,
      },
    })
  }

  console.warn('Supabase credentials not configured. Using mock client for UI preview.')
  return createDevMockClient()
}

function createDevMockClient(): SupabaseClient {
  const noop = () => {}
  const today = new Date().toISOString().slice(0, 10)

  // Simple in-memory store
  const store = new Map<string, any[]>()
  store.set('presets', [{
    id: 'dev-preset-0000-0000-0000-000000000000',
    user_id: 'dev-user-0000-0000-0000-000000000000',
    slots: [
      { start: '06:00', end: '07:00' },
      { start: '11:00', end: '12:00' },
      { start: '13:00', end: '14:00' },
      { start: '19:00', end: '20:00' },
      { start: '22:00', end: '23:00' },
    ],
    updated_at: new Date().toISOString(),
  }])

  const todaySlots = [
    { start: '06:00', end: '07:00' },
    { start: '11:00', end: '12:00' },
    { start: '13:00', end: '14:00' },
    { start: '19:00', end: '20:00' },
    { start: '22:00', end: '23:00' },
  ]

  store.set('daily_plans', todaySlots.map((slot, index) => ({
    id: `plan-${index + 1}`,
    user_id: 'dev-user-0000-0000-0000-000000000000',
    date: today,
    planned_start_time: slot.start,
    planned_end_time: slot.end,
    actual_start_time: null,
    actual_end_time: null,
    sort_order: index + 1,
  })))

  // Generate past history data
  for (let d = 1; d <= 14; d++) {
    const date = new Date()
    date.setDate(date.getDate() - d)
    const ds = date.toISOString().slice(0, 10)
    const historySlots = [
      { start: '06:00', end: '07:00' },
      { start: '11:00', end: '12:00' },
      { start: '13:00', end: '14:00' },
      { start: '19:00', end: '20:00' },
      { start: '22:00', end: '23:00' },
    ]
    historySlots.forEach((slot, i) => {
      const allDone = d > 1 || i < 3
      const offset = Math.round((Math.random() - 0.5) * 40)
      const startH = parseInt(slot.start.split(':')[0])
      const startM = parseInt(slot.start.split(':')[1]) + offset
      const endH = parseInt(slot.end.split(':')[0])
      const endM = parseInt(slot.end.split(':')[1]) + offset
      const existing = store.get('daily_plans') || []
      existing.push({
        id: `hist-${ds}-${i}`,
        user_id: 'dev-user-0000-0000-0000-000000000000',
        date: ds,
        planned_start_time: slot.start,
        planned_end_time: slot.end,
        actual_start_time: allDone ? `${ds}T${String(Math.min(23, Math.max(0, startH))).padStart(2, '0')}:${String(Math.min(59, Math.max(0, startM))).padStart(2, '0')}:00Z` : null,
        actual_end_time: allDone ? `${ds}T${String(Math.min(23, Math.max(0, endH))).padStart(2, '0')}:${String(Math.min(59, Math.max(0, endM))).padStart(2, '0')}:00Z` : null,
        sort_order: i + 1,
      })
    })
  }

  let nextId = 200

  // Build a query builder that chains and returns promises
  function queryBuilder(table: string) {
    let filters: Array<(row: any) => boolean> = []
    let sortField = ''
    let sortDir: 'asc' | 'desc' = 'asc'
    let selectColumns = '*'
    let limitCount: number | null = null

    const builder: any = {}
    const tableData = store.get(table) || []

    builder.select = (cols?: string) => {
      if (cols) selectColumns = cols
      return builder
    }

    builder.eq = (field: string, value: any) => {
      filters.push((row: any) => row[field] === value)
      return builder
    }

    builder.gte = (field: string, value: any) => {
      filters.push((row: any) => row[field] >= value)
      return builder
    }

    builder.lte = (field: string, value: any) => {
      filters.push((row: any) => row[field] <= value)
      return builder
    }

    builder.order = (field: string, opts?: { ascending?: boolean }) => {
      sortField = field
      sortDir = opts?.ascending === false ? 'desc' : 'asc'
      return builder
    }

    builder.single = () => {
      let rows = tableData.filter(row => filters.every(f => f(row)))
      if (sortField) {
        rows.sort((a: any, b: any) => {
          const cmp = a[sortField] < b[sortField] ? -1 : a[sortField] > b[sortField] ? 1 : 0
          return sortDir === 'asc' ? cmp : -cmp
        })
      }
      if (limitCount) rows = rows.slice(0, limitCount)
      return Promise.resolve({ data: rows[0] || null, error: null })
    }

    builder.maybeSingle = () => builder.single()

    // execute query (for select that returns array)
    builder.then = (resolve: any) => {
      let rows = tableData.filter(row => filters.every(f => f(row)))
      if (sortField) {
        rows.sort((a: any, b: any) => {
          const cmp = a[sortField] < b[sortField] ? -1 : a[sortField] > b[sortField] ? 1 : 0
          return sortDir === 'asc' ? cmp : -cmp
        })
      }
      if (limitCount) rows = rows.slice(0, limitCount)
      if (selectColumns !== '*') {
        const cols = selectColumns.split(',').map(c => c.trim())
        rows = rows.map(r => {
          const out: any = {}
          cols.forEach(c => { out[c] = r[c] })
          return out
        })
      }
      resolve({ data: rows, error: null })
    }

    // Make builder thenable
    return builder
  }

  function mutationBuilder(table: string, action: 'insert' | 'update' | 'upsert' | 'delete', payload?: any) {
    const builder: any = {}
    let eqField = ''
    let eqValue: any = null

    builder.eq = (field: string, value: any) => {
      eqField = field
      eqValue = value
      return builder
    }

    builder.select = () => builder

    builder.single = () => {
      return Promise.resolve().then(() => {
        const rows = store.get(table) || []
        if (action === 'insert' && payload) {
          const newRow = { id: `${table}-${nextId++}`, ...payload }
          rows.push(newRow)
          return { data: newRow, error: null }
        }
        if (action === 'update' && eqField) {
          const idx = rows.findIndex((r: any) => r[eqField] === eqValue)
          if (idx >= 0) {
            rows[idx] = { ...rows[idx], ...payload }
            return { data: rows[idx], error: null }
          }
          return { data: null, error: null }
        }
        if (action === 'upsert' && payload) {
          const idx = rows.findIndex((r: any) => r.user_id === payload.user_id)
          if (idx >= 0) {
            rows[idx] = { ...rows[idx], ...payload }
            return { data: rows[idx], error: null }
          }
          const newRow = { id: `${table}-${nextId++}`, ...payload }
          rows.push(newRow)
          return { data: newRow, error: null }
        }
        if (action === 'delete' && eqField) {
          const idx = rows.findIndex((r: any) => r[eqField] === eqValue)
          if (idx >= 0) rows.splice(idx, 1)
          return { error: null }
        }
        return { data: null, error: null }
      })
    }

    builder.maybeSingle = () => builder.single()

    // Make thenable for direct resolution
    builder.then = (resolve: any) => {
      Promise.resolve().then(() => {
        const rows = store.get(table) || []
        if (action === 'insert' && payload) {
          const newRows = payload.map((r: any) => ({ id: `${table}-${nextId++}`, ...r }))
          rows.push(...newRows)
          resolve({ data: newRows, error: null })
        } else if (action === 'insert') {
          const newRow = { id: `${table}-${nextId++}`, ...payload }
          rows.push(newRow)
          resolve({ data: [newRow], error: null })
        } else if (action === 'update' && eqField) {
          const idx = rows.findIndex((r: any) => r[eqField] === eqValue)
          if (idx >= 0) {
            rows[idx] = { ...rows[idx], ...payload }
          }
          resolve({ error: null })
        } else if (action === 'delete' && eqField) {
          const idx = rows.findIndex((r: any) => r[eqField] === eqValue)
          if (idx >= 0) rows.splice(idx, 1)
          resolve({ error: null })
        } else {
          resolve({ error: null })
        }
      })
    }

    return builder
  }

  return {
    auth: {
      getSession: () => Promise.resolve({
        data: {
          session: {
            user: {
              id: 'dev-user-0000-0000-0000-000000000000',
              email: 'mom@daymilk.app',
              created_at: '2026-01-15T00:00:00Z',
              aud: 'authenticated',
              role: 'authenticated',
            },
            access_token: 'dev-token',
            refresh_token: 'dev-refresh',
            expires_at: Date.now() + 86400000,
          },
        },
        error: null,
      }),
      onAuthStateChange: (cb: any) => {
        // Simulate an initial session
        setTimeout(() => {
          cb('SIGNED_IN', {
            user: {
              id: 'dev-user-0000-0000-0000-000000000000',
              email: 'mom@daymilk.app',
              created_at: '2026-01-15T00:00:00Z',
              aud: 'authenticated',
              role: 'authenticated',
            },
            access_token: 'dev-token',
            refresh_token: 'dev-refresh',
            expires_at: Date.now() + 86400000,
          })
        }, 50)
        return { data: { subscription: { unsubscribe: noop } } }
      },
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: null }),
      signOut: () => Promise.resolve({ error: null }),
    },
    from: (table: string) => ({
      select: (cols?: string) => queryBuilder(table).select(cols),
      insert: (payload: any) => mutationBuilder(table, 'insert', payload),
      update: (payload: any) => mutationBuilder(table, 'update', payload),
      delete: () => mutationBuilder(table, 'delete'),
      upsert: (payload: any) => mutationBuilder(table, 'upsert', payload),
    }),
  } as unknown as SupabaseClient
}

export const supabase = createSupabaseClient()

export type Database = {
  public: {
    Tables: {
      presets: {
        Row: { id: string; user_id: string; slots: Array<{ start: string; end: string }>; updated_at: string }
        Insert: { user_id: string; slots: Array<{ start: string; end: string }> }
        Update: { slots?: Array<{ start: string; end: string }> }
      }
      daily_plans: {
        Row: { id: string; user_id: string; date: string; planned_start_time: string; planned_end_time: string; actual_start_time: string | null; actual_end_time: string | null; sort_order: number; created_at: string }
        Insert: { user_id: string; date: string; planned_start_time: string; planned_end_time: string; sort_order: number }
        Update: { planned_start_time?: string; planned_end_time?: string; actual_start_time?: string | null; actual_end_time?: string | null }
      }
    }
  }
}
