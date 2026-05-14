# Daily Plan Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor daily plans from single time points to time slots, add custom preset slots, replace auto-record with manual dialog, and update stats to 2-card ±30min on-time check.

**Architecture:** Data model first (types + mock client), then utilities, hooks, components, pages, CSS, tests. Each task builds on previous. TypeScript compilation must pass after each task.

**Tech Stack:** React 19, TypeScript, Supabase, Vite, Vitest, Tailwind CSS 4

---

### Task 1: Update Database Types and Mock Client

**Files:**
- Modify: `src/lib/supabase.ts`

- [ ] **Step 1: Update Database type and Plan/Preset interfaces**

Replace the `Database` type at the bottom of `src/lib/supabase.ts`:

```ts
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
```

- [ ] **Step 2: Update mock preset data**

In `createDevMockClient()`, replace the preset store entry:

```ts
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
```

- [ ] **Step 3: Update mock daily_plans data for today**

Replace the today plans generation:

```ts
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
```

- [ ] **Step 4: Update mock history data generation**

Replace the history generation loop to use new fields. Each history day uses 5 slots based on the preset slots, with some marked complete:

```ts
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
```

- [ ] **Step 5: Update mutation builder for daily_plans insert to accept new fields**

The `mutationBuilder` for insert already spreads payload, so no change needed — but verify the default `planned_time` references in the builder are removed. Remove any old `planned_time` field references if they exist in the insert payload construction.

Run: `npx tsc --noEmit` to verify types compile. Expect errors in other files (they still use old types) — this is expected, those will be fixed in subsequent tasks.

- [ ] **Step 6: Commit**

```bash
git add src/lib/supabase.ts
git commit -m "refactor: update database types and mock client for time-slot model"
```

---

### Task 2: Rewrite Utility Functions

**Files:**
- Modify: `src/utils/plan.ts`

- [ ] **Step 1: Replace the entire file content**

```ts
export interface Plan {
  id: string
  planned_start_time: string
  planned_end_time: string
  actual_start_time: string | null
  actual_end_time: string | null
  sort_order: number
}

export function isOnTime(plan: Plan): boolean {
  if (!plan.actual_start_time || !plan.actual_end_time) return false

  const [psH, psM] = plan.planned_start_time.split(':').map(Number)
  const [peH, peM] = plan.planned_end_time.split(':').map(Number)
  const plannedStartMin = psH * 60 + psM
  const plannedEndMin = peH * 60 + peM

  const actualStart = new Date(plan.actual_start_time)
  const actualEnd = new Date(plan.actual_end_time)
  const actualStartMin = actualStart.getHours() * 60 + actualStart.getMinutes()
  const actualEndMin = actualEnd.getHours() * 60 + actualEnd.getMinutes()

  // Within ±30 minutes of the planned slot boundaries
  return actualStartMin >= plannedStartMin - 30 && actualEndMin <= plannedEndMin + 30
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} - ${end}`
}

export function isoToHHMM(iso: string): string {
  const d = new Date(iso)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export function hhmmToISO(dateStr: string, hhmm: string): string {
  const [h, m] = hhmm.split(':').map(Number)
  return `${dateStr}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00Z`
}

export function nowToISOTime(minutesOffset: number = 0): string {
  const d = new Date(Date.now() + minutesOffset * 60 * 1000)
  return d.toISOString()
}
```

Removes: `generatePlanTimes`, `findNearestPlan`, `formatTimeDiff`.  
Adds: `isOnTime` (replaces inline logic), `formatTimeRange`, `nowToISOTime` (for record dialog defaults).

- [ ] **Step 2: Verify**

```bash
npx tsc --noEmit
```

Expect errors only in files not yet updated (hooks, components). No errors from `plan.ts` itself.

- [ ] **Step 3: Commit**

```bash
git add src/utils/plan.ts
git commit -m "refactor: rewrite plan utils for time-slot model with ±30min on-time check"
```

---

### Task 3: Adapt usePreset Hook

**Files:**
- Modify: `src/hooks/usePreset.ts`

- [ ] **Step 1: Rewrite usePreset.ts**

```ts
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface Preset {
  id: string
  slots: Array<{ start: string; end: string }>
}

export function usePreset() {
  const { user } = useAuth()
  const [preset, setPreset] = useState<Preset | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchPreset = useCallback(async () => {
    if (!user) return
    const { data } = await supabase.from('presets').select('*').eq('user_id', user.id).maybeSingle()
    setPreset(data)
    setLoading(false)
  }, [user])

  useEffect(() => { fetchPreset() }, [fetchPreset])

  const updatePreset = async (slots: Array<{ start: string; end: string }>) => {
    if (!user) return
    const { data } = await supabase
      .from('presets')
      .upsert({ user_id: user.id, slots, updated_at: new Date().toISOString() })
      .select()
      .maybeSingle()
    if (data) setPreset(data)
  }

  return { preset, loading, updatePreset }
}
```

Changes: `updatePreset` now takes `slots` array directly instead of partial updates object.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/usePreset.ts
git commit -m "refactor: adapt usePreset to slots-based preset model"
```

---

### Task 4: Rewrite useTodaysPlans Hook

**Files:**
- Modify: `src/hooks/useTodaysPlans.ts`

- [ ] **Step 1: Rewrite useTodaysPlans.ts**

```ts
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { usePreset } from './usePreset'
import type { Plan } from '../utils/plan'

export function useTodaysPlans() {
  const { user } = useAuth()
  const { preset } = usePreset()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [recording, setRecording] = useState(false)
  const generatedRef = useRef(false)

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
      setPlans(data as Plan[])
      generatedRef.current = true
    } else if (preset && !generatedRef.current) {
      generatedRef.current = true
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
      if (inserted) setPlans(inserted as Plan[])
    }
    setLoading(false)
  }, [user, preset, today])

  useEffect(() => { fetchPlans() }, [fetchPlans])

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

    // Delete all today's plans
    await supabase.from('daily_plans').delete().eq('user_id', user.id).eq('date', today)

    // Regenerate from preset slots
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
      setPlans(inserted as Plan[])
      generatedRef.current = true
      return { success: true }
    }
    return { error: '重置失败' }
  }

  return { plans, loading, recording, record, updatePlan, deletePlan, resetToday }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useTodaysPlans.ts
git commit -m "refactor: rewrite useTodaysPlans for time slots, sequential recording, and reset"
```

---

### Task 5: Adapt useHistory Hook

**Files:**
- Modify: `src/hooks/useHistory.ts`

- [ ] **Step 1: Update useHistory.ts to use new fields**

Replace the `DayPlan` interface and all references from `planned_time`/`actual_time` to `planned_start_time`/`actual_start_time`:

```ts
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

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
    setSelectedPlans(data || [])
  }

  return { summary, selectedPlans, selectedDate, selectDate, loading }
}
```

Key change: select columns use new field names.

- [ ] **Step 2: Commit**

```bash
git add src/hooks/useHistory.ts
git commit -m "refactor: adapt useHistory to new plan fields"
```

---

### Task 6: Rewrite StatsCards Component

**Files:**
- Modify: `src/components/StatsCards.tsx`
- Modify: `src/components/StatsCards.test.tsx`

- [ ] **Step 1: Rewrite StatsCards.tsx**

```tsx
import { isOnTime } from '../utils/plan'
import type { Plan } from '../utils/plan'

const ProgressIcon = ({ completed, total }: { completed: number; total: number }) => {
  const progress = total ? completed / total : 0
  const circumference = 2 * Math.PI * 26
  const offset = circumference * (1 - progress)

  return (
    <div className="stat-progress-mark" aria-hidden="true">
      <svg viewBox="0 0 72 72">
        <circle cx="36" cy="36" r="26" className="stat-progress-track" />
        <circle
          cx="36"
          cy="36"
          r="26"
          className="stat-progress-ring"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <span className="stat-progress-heart">♥</span>
    </div>
  )
}

const CheckIcon = () => (
  <div className="stat-round-mark stat-round-mark-green" aria-hidden="true">
    <svg viewBox="0 0 48 48">
      <circle cx="24" cy="24" r="16" fill="currentColor" opacity="0.86" />
      <path d="M16 24.5l5.5 5.5L33 18.5" fill="none" stroke="#fbfff9" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
)

export default function StatsCards({ plans }: { plans: Plan[] }) {
  const total = plans.length
  const completed = plans.filter(p => p.actual_start_time).length
  const hasActual = plans.filter(p => p.actual_start_time)

  const onTimeCount = hasActual.filter(p => isOnTime(p)).length

  return (
    <section className="stats-panel" aria-label="今日统计">
      <div className="stat-cell stat-cell-progress">
        <ProgressIcon completed={completed} total={total} />
        <div className="stat-text">
          <div className="stat-number stat-number-pink">
            {completed}<span>/{total}</span>
          </div>
          <div className="stat-label">今日进度</div>
        </div>
      </div>
      <div className="stat-cell">
        <CheckIcon />
        <div className="stat-text">
          <div className="stat-number stat-number-green">
            {onTimeCount}<span>/{hasActual.length || '-'}</span>
          </div>
          <div className="stat-label">按时完成</div>
        </div>
      </div>
    </section>
  )
}
```

Changes:
- Import `Plan` and `isOnTime` from utils
- Remove `StopwatchIcon`, average deviation calculation, and the third card
- Change grid to `repeat(2, 1fr)` via CSS (handled in Task 13)
- On-time uses `isOnTime()` which checks ±30min

- [ ] **Step 2: Update the test file**

```tsx
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import StatsCards from './StatsCards'

const samplePlans = [
  { id: '1', planned_start_time: '06:00', planned_end_time: '07:00', actual_start_time: '2026-05-14T06:01:00Z', actual_end_time: '2026-05-14T06:58:00Z', sort_order: 1 },
  { id: '2', planned_start_time: '11:00', planned_end_time: '12:00', actual_start_time: '2026-05-14T11:25:00Z', actual_end_time: '2026-05-14T12:10:00Z', sort_order: 2 },
  { id: '3', planned_start_time: '13:00', planned_end_time: '14:00', actual_start_time: null, actual_end_time: null, sort_order: 3 },
]

describe('StatsCards', () => {
  it('renders progress and on-time stats with 2-card layout', () => {
    const html = renderToStaticMarkup(<StatsCards plans={samplePlans} />)

    expect(html).toContain('今日进度')
    expect(html).toContain('按时完成')
    expect(html).toMatch(/stat-number-pink">2<span>/)
    expect(html).not.toContain('平均偏差')
  })

  it('marks plan within ±30min as on time', () => {
    // Plan 1: 06:01-06:58 is within ±30min of 06:00-07:00 → on time
    // Plan 2: 11:25-12:10 — start is 25min late (within 30), end is 10min late (within 30) → on time
    // Both should be on time
    const html = renderToStaticMarkup(<StatsCards plans={samplePlans} />)
    // Since both completed plans are on time, on-time count should be 2
    expect(html).toContain('>2</span>')
  })
})
```

- [ ] **Step 3: Run tests**

```bash
npx vitest run src/components/StatsCards.test.tsx
```

Expected: 2 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/StatsCards.tsx src/components/StatsCards.test.tsx
git commit -m "refactor: 2-card stats with ±30min on-time check, remove average deviation"
```

---

### Task 7: Create RecordDialog Component

**Files:**
- Create: `src/components/RecordDialog.tsx`

- [ ] **Step 1: Write RecordDialog.tsx**

```tsx
import { useState } from 'react'
import { nowToISOTime, isoToHHMM } from '../utils/plan'

interface Props {
  open: boolean
  recording: boolean
  onConfirm: (startISO: string, endISO: string) => void
  onCancel: () => void
}

export default function RecordDialog({ open, recording, onConfirm, onCancel }: Props) {
  const now = new Date()
  const defaultEnd = nowToISOTime(0)
  const defaultStart = nowToISOTime(-20)
  const [startISO, setStartISO] = useState(defaultStart)
  const [endISO, setEndISO] = useState(defaultEnd)
  const [error, setError] = useState('')

  if (!open) return null

  const handleConfirm = () => {
    if (new Date(startISO) >= new Date(endISO)) {
      setError('开始时间不能晚于结束时间')
      return
    }
    setError('')
    onConfirm(startISO, endISO)
  }

  return (
    <div className="dialog-overlay" onClick={onCancel}>
      <div className="dialog-card" onClick={e => e.stopPropagation()}>
        <h2 className="dialog-title">记录吸奶时间</h2>

        <div className="dialog-fields">
          <div className="dialog-field">
            <label className="dialog-label">开始时间</label>
            <input
              type="datetime-local"
              value={startISO.slice(0, 16)}
              onChange={e => setStartISO(new Date(e.target.value).toISOString())}
              className="dialog-input"
            />
          </div>
          <div className="dialog-field">
            <label className="dialog-label">结束时间</label>
            <input
              type="datetime-local"
              value={endISO.slice(0, 16)}
              onChange={e => setEndISO(new Date(e.target.value).toISOString())}
              className="dialog-input"
            />
          </div>
        </div>

        {error && <p className="dialog-error">{error}</p>}

        <div className="dialog-actions">
          <button onClick={onCancel} className="dialog-cancel-btn">取消</button>
          <button onClick={handleConfirm} disabled={recording} className="dialog-confirm-btn">
            {recording ? '记录中...' : '确认记录'}
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Remove old RecordButton.tsx**

```bash
rm src/components/RecordButton.tsx
```

- [ ] **Step 3: Commit**

```bash
git add src/components/RecordDialog.tsx
git rm src/components/RecordButton.tsx
git commit -m "refactor: replace RecordButton with RecordDialog for manual time entry"
```

---

### Task 8: Rewrite PlanItem Component

**Files:**
- Modify: `src/components/PlanItem.tsx`

- [ ] **Step 1: Rewrite PlanItem.tsx**

```tsx
import { useState } from 'react'
import { isoToHHMM, hhmmToISO, formatTimeRange, isOnTime } from '../utils/plan'
import type { Plan } from '../utils/plan'

interface Props {
  plan: Plan
  isActive: boolean
  onEdit: (id: string, planned_start_time: string, planned_end_time: string, actual_start_time?: string | null, actual_end_time?: string | null) => void
  onDelete: (id: string) => void
}

const EditIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 20h16" />
    <path d="M6.5 16.5l2.2-.3 9.7-9.7a2.1 2.1 0 0 0-3-3L5.7 13.2l-.3 2.2a1 1 0 0 0 1.1 1.1z" />
  </svg>
)

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" aria-hidden="true">
    <path d="M4 7h16" />
    <path d="M9 7V5.4A1.4 1.4 0 0 1 10.4 4h3.2A1.4 1.4 0 0 1 15 5.4V7" />
    <path d="M7 7l.8 13h8.4L17 7" />
    <path d="M10.5 11v5.5M13.5 11v5.5" />
  </svg>
)

export default function PlanItem({ plan, isActive, onEdit, onDelete }: Props) {
  const done = !!plan.actual_start_time
  const today = new Date().toISOString().slice(0, 10)
  const [editing, setEditing] = useState(false)
  const [editPlannedStart, setEditPlannedStart] = useState(plan.planned_start_time)
  const [editPlannedEnd, setEditPlannedEnd] = useState(plan.planned_end_time)
  const [editActualStart, setEditActualStart] = useState(plan.actual_start_time ? isoToHHMM(plan.actual_start_time) : '')
  const [editActualEnd, setEditActualEnd] = useState(plan.actual_end_time ? isoToHHMM(plan.actual_end_time) : '')

  if (editing) {
    return (
      <div className="plan-edit-card">
        <div className="plan-edit-fields">
          <div className="plan-edit-row">
            <span>计划</span>
            <input type="time" value={editPlannedStart} onChange={e => setEditPlannedStart(e.target.value)} className="plan-time-input" />
            <span className="plan-edit-sep">-</span>
            <input type="time" value={editPlannedEnd} onChange={e => setEditPlannedEnd(e.target.value)} className="plan-time-input" />
          </div>
          {done && (
            <div className="plan-edit-row">
              <span>实际</span>
              <input type="time" value={editActualStart} onChange={e => setEditActualStart(e.target.value)} className="plan-time-input" />
              <span className="plan-edit-sep">-</span>
              <input type="time" value={editActualEnd} onChange={e => setEditActualEnd(e.target.value)} className="plan-time-input" />
            </div>
          )}
          <div className="plan-edit-actions">
            <button onClick={() => setEditing(false)} className="plan-cancel-button">取消</button>
            <button onClick={() => {
              const newActualStart = done && editActualStart ? hhmmToISO(today, editActualStart) : plan.actual_start_time
              const newActualEnd = done && editActualEnd ? hhmmToISO(today, editActualEnd) : plan.actual_end_time
              onEdit(plan.id, editPlannedStart, editPlannedEnd, newActualStart, newActualEnd)
              setEditing(false)
            }} className="plan-save-button">保存</button>
          </div>
        </div>
      </div>
    )
  }

  const onTime = done ? isOnTime(plan) : false

  return (
    <div className={`plan-row ${isActive ? 'plan-row-active' : ''} ${done ? 'plan-row-done' : ''}`}>
      <div className={`plan-dot ${isActive ? 'plan-dot-active' : ''} ${done ? 'plan-dot-done' : ''}`} aria-hidden="true" />

      <div className={`plan-card ${isActive ? 'plan-card-active' : ''}`}>
        <div className="plan-time">
          {formatTimeRange(plan.planned_start_time, plan.planned_end_time)}
        </div>
        {done && plan.actual_start_time && plan.actual_end_time && (
          <span className={`plan-diff ${onTime ? 'plan-diff-good' : 'plan-diff-late'}`}>
            {isoToHHMM(plan.actual_start_time)} - {isoToHHMM(plan.actual_end_time)} · {onTime ? '准点' : '偏差'}
          </span>
        )}

        <div className="plan-actions">
          <button
            type="button"
            aria-label={`编辑 ${plan.planned_start_time} 的计划`}
            onClick={() => {
              setEditPlannedStart(plan.planned_start_time)
              setEditPlannedEnd(plan.planned_end_time)
              setEditActualStart(plan.actual_start_time ? isoToHHMM(plan.actual_start_time) : '')
              setEditActualEnd(plan.actual_end_time ? isoToHHMM(plan.actual_end_time) : '')
              setEditing(true)
            }}
          >
            <EditIcon />
          </button>
          <button
            type="button"
            aria-label={`删除 ${plan.planned_start_time} 的计划`}
            onClick={() => onDelete(plan.id)}
          >
            <TrashIcon />
          </button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PlanItem.tsx
git commit -m "refactor: PlanItem with time-slot display, 4-field edit, on-time labels"
```

---

### Task 9: Update PlanList Component

**Files:**
- Modify: `src/components/PlanList.tsx`

- [ ] **Step 1: Update active index detection**

```tsx
import PlanItem from './PlanItem'
import type { Plan } from '../utils/plan'

interface Props {
  plans: Plan[]
  onEdit: (id: string, planned_start_time: string, planned_end_time: string, actual_start_time?: string | null, actual_end_time?: string | null) => void
  onDelete: (id: string) => void
}

export default function PlanList({ plans, onEdit, onDelete }: Props) {
  const activeIndex = plans.findIndex(p => !p.actual_start_time)

  return (
    <section className="plan-section">
      <div className="plan-heading">
        <span aria-hidden="true" />
        <h2>今日计划</h2>
      </div>
      <div className="plan-timeline">
        {plans.map((plan, i) => (
          <PlanItem key={plan.id} plan={plan} isActive={i === activeIndex} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </section>
  )
}
```

Only change: import Plan from utils, active detection uses `actual_start_time`.

- [ ] **Step 2: Commit**

```bash
git add src/components/PlanList.tsx
git commit -m "refactor: PlanList uses new Plan type and actual_start_time for active detection"
```

---

### Task 10: Update Today Page

**Files:**
- Modify: `src/pages/Today.tsx`

- [ ] **Step 1: Replace RecordButton with RecordDialog**

```tsx
import { useState } from 'react'
import { useTodaysPlans } from '../hooks/useTodaysPlans'
import StatsCards from '../components/StatsCards'
import RecordDialog from '../components/RecordDialog'
import PlanList from '../components/PlanList'

function MotherAvatar() {
  return (
    <svg viewBox="0 0 96 96" role="img" aria-label="妈妈和宝宝头像">
      <circle cx="48" cy="48" r="48" fill="#fffafa" />
      <path d="M31 41c-5-16 5-28 18-28s23 12 18 28c-3 10-11 18-18 18s-15-8-18-18z" fill="#67423d" />
      <path d="M28 73c2-16 11-25 22-25s20 9 22 25c-9 7-34 7-44 0z" fill="#f7b6b9" />
      <path d="M36 34c3 7 8 11 14 11 5 0 10-4 13-11v12c0 8-6 15-14 15s-13-7-13-15V34z" fill="#ffd7cb" />
      <path d="M57 63c2-10 9-15 17-12 8 4 10 15 3 23-6 5-16 6-24 1 2-4 3-8 4-12z" fill="#b8d3e4" />
      <circle cx="69" cy="59" r="8" fill="#ffd5c8" />
      <path d="M40 67c6 7 18 8 29 2" stroke="#fff5f2" strokeWidth="5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

export default function Today() {
  const { plans, loading, recording, record, updatePlan, deletePlan } = useTodaysPlans()
  const [dialogOpen, setDialogOpen] = useState(false)

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

  const handleConfirm = async (startISO: string, endISO: string) => {
    const result = await record(startISO, endISO)
    if (result.success) {
      setDialogOpen(false)
    } else if (result.error) {
      alert(result.error)
    }
  }

  const hasIncomplete = plans.some(p => !p.actual_start_time)

  return (
    <div className="today-screen">
      <header className="today-hero">
        <div className="today-hero-art" />
        <div className="today-hero-copy">
          <p className="today-date">
            {month}月{day}日 周{weekDay}
          </p>
          <h1 className="today-title">今天</h1>
        </div>
        <div className="today-avatar">
          <MotherAvatar />
        </div>
      </header>

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
        <div className="today-stack">
          <StatsCards plans={plans} />
          <section className="record-panel">
            <div className="record-dial" aria-hidden="true">
              <div className="record-dial-face">
                <div className="record-dial-ticks" />
                <div className="record-dial-orbit">
                  <span />
                </div>
                <svg viewBox="0 0 80 80" className="record-clock">
                  <circle cx="40" cy="40" r="27" fill="none" stroke="currentColor" strokeWidth="6" />
                  <path d="M40 27v16h14" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </div>
            <div className="record-copy">
              <h2>记录吸奶时间</h2>
              <p>点击记录当前时间</p>
              <button
                onClick={() => setDialogOpen(true)}
                disabled={!hasIncomplete}
                className="record-action"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 5v14M5 12h14" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" />
                </svg>
                记录当前时间
              </button>
            </div>
          </section>
          <PlanList plans={plans} onEdit={updatePlan} onDelete={deletePlan} />
        </div>
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
```

Key changes: RecordButton replaced with inline record-panel + RecordDialog. The record panel visual stays on Today page, clicking the button opens the dialog.

- [ ] **Step 2: Commit**

```bash
git add src/pages/Today.tsx
git commit -m "refactor: Today page uses RecordDialog for manual time entry"
```

---

### Task 11: Update DayDetail Component

**Files:**
- Modify: `src/components/DayDetail.tsx`

- [ ] **Step 1: Rewrite DayDetail.tsx**

```tsx
import { isOnTime, isoToHHMM, formatTimeRange } from '../utils/plan'

interface DayPlan {
  id: string
  planned_start_time: string
  planned_end_time: string
  actual_start_time: string | null
  actual_end_time: string | null
}

export default function DayDetail({ plans, date }: { plans: DayPlan[]; date: string }) {
  if (!date) return null

  return (
    <div className="px-4 pb-4">
      <h3 className="text-sm font-heading text-foreground mb-3 font-bold">{date} 详情</h3>
      {plans.length === 0 ? (
        <p className="text-sm text-subtle">当天无记录</p>
      ) : (
        <div className="space-y-2">
          {plans.map(plan => {
            const done = !!plan.actual_start_time
            return (
              <div key={plan.id}
                className={`flex items-center bg-card rounded-xl card overflow-hidden ${
                  done ? 'border-l-[4px] border-l-success' : 'border-l-[4px] border-l-muted-foreground/15'
                }`}>
                <div className="pl-4 pr-2 py-3 w-[110px] shrink-0">
                  <div className={`text-sm font-heading font-bold leading-tight ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {formatTimeRange(plan.planned_start_time, plan.planned_end_time)}
                  </div>
                  <div className={`text-[11px] mt-1 font-medium ${done ? 'text-success' : 'text-muted-foreground'}`}>
                    {done ? '已完成' : '未完成'}
                  </div>
                </div>
                <div className="flex-1" />
                {done && plan.actual_start_time && plan.actual_end_time && (
                  <span className={`text-[11px] px-2 py-1 rounded-full font-semibold mr-3 ${
                    isOnTime(plan) ? 'bg-success-light text-success' : 'bg-danger-light text-danger'
                  }`}>
                    实际 {isoToHHMM(plan.actual_start_time)} - {isoToHHMM(plan.actual_end_time)} · {isOnTime(plan) ? '准点' : '偏差'}
                  </span>
                )}
                {!done && (
                  <span className="text-[11px] text-muted-foreground mr-3">-</span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/DayDetail.tsx
git commit -m "refactor: DayDetail uses time-slot fields and ±30min on-time check"
```

---

### Task 12: Rewrite Settings Page

**Files:**
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Rewrite Settings.tsx**

```tsx
import { useState } from 'react'
import { usePreset } from '../hooks/usePreset'
import { useAuth } from '../hooks/useAuth'
import { useTodaysPlans } from '../hooks/useTodaysPlans'

export default function Settings() {
  const { preset, loading, updatePreset } = usePreset()
  const { user, signOut } = useAuth()
  const { plans, resetToday } = useTodaysPlans()
  const [slots, setSlots] = useState<Array<{ start: string; end: string }>>([])
  const [saved, setSaved] = useState(false)
  const [initialized, setInitialized] = useState(false)
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false)
  const [resetResult, setResetResult] = useState('')

  if (!loading && preset && !initialized) {
    setSlots(preset.slots.map(s => ({ ...s })))
    setInitialized(true)
  }

  const handleSave = async () => {
    if (slots.length === 0) {
      alert('请至少添加一个时间段')
      return
    }
    await updatePreset(slots)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const addSlot = () => {
    setSlots([...slots, { start: '06:00', end: '07:00' }])
  }

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index))
  }

  const updateSlot = (index: number, field: 'start' | 'end', value: string) => {
    setSlots(slots.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const handleReset = async () => {
    const result = await resetToday()
    if (result.success) {
      setResetResult('今日任务已重置')
    } else {
      setResetResult(result.error || '重置失败')
    }
    setResetConfirmOpen(false)
    setTimeout(() => setResetResult(''), 2000)
  }

  return (
    <div className="pb-2">
      <div className="px-5 pt-10 pb-4">
        <h1 className="text-[28px] font-heading text-foreground leading-tight font-bold">设置</h1>
      </div>

      <div className="px-4 space-y-4">
        <div className="bg-card rounded-2xl card p-5">
          <h2 className="text-base font-heading text-foreground mb-1 font-bold">每日预设</h2>
          <p className="text-xs text-subtle mb-2">修改预设仅影响明天及以后的计划</p>
          <p className="text-xs text-subtle mb-5">共 {slots.length} 个时间段</p>

          <div className="space-y-3 mb-5">
            {slots.map((slot, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="time"
                  value={slot.start}
                  onChange={e => updateSlot(i, 'start', e.target.value)}
                  className="flex-1 h-12 rounded-xl border border-border bg-bg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                />
                <span className="text-subtle text-sm font-semibold">-</span>
                <input
                  type="time"
                  value={slot.end}
                  onChange={e => updateSlot(i, 'end', e.target.value)}
                  className="flex-1 h-12 rounded-xl border border-border bg-bg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-shadow"
                />
                <button
                  onClick={() => removeSlot(i)}
                  className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:text-danger rounded-xl transition-colors shrink-0"
                  aria-label="删除时间段"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6" />
                  </svg>
                </button>
              </div>
            ))}
          </div>

          <button onClick={addSlot}
            className="w-full h-12 border-2 border-dashed border-border text-subtle font-heading text-sm rounded-2xl active:scale-[0.98] transition-transform mb-5 font-bold">
            + 添加时间段
          </button>

          <button onClick={handleSave}
            className="w-full h-12 bg-primary text-white font-heading text-base rounded-2xl active:scale-[0.98] transition-transform shadow-button font-bold">
            {saved ? '已保存 ✓' : '保存预设'}
          </button>

          <div className="mt-5 pt-5 border-t border-border">
            <h3 className="text-sm font-heading text-foreground mb-1 font-bold">重置今日任务</h3>
            <p className="text-xs text-subtle mb-3">清空今日任务并基于当前预设重新生成，已有记录会丢失</p>
            <button onClick={() => setResetConfirmOpen(true)}
              className="w-full h-12 border border-danger/30 text-danger font-heading text-sm rounded-2xl active:scale-[0.98] transition-transform font-bold">
              重置今日任务
            </button>
            {resetResult && <p className="text-xs text-success mt-2 text-center font-semibold">{resetResult}</p>}
          </div>
        </div>

        {/* Reset confirmation modal */}
        {resetConfirmOpen && (
          <div className="dialog-overlay" onClick={() => setResetConfirmOpen(false)}>
            <div className="dialog-card" onClick={e => e.stopPropagation()}>
              <h2 className="dialog-title">重置今日任务</h2>
              <p className="dialog-message">确定要清空今日所有任务及记录吗？此操作不可撤销。</p>
              <div className="dialog-actions">
                <button onClick={() => setResetConfirmOpen(false)} className="dialog-cancel-btn">取消</button>
                <button onClick={handleReset} className="dialog-confirm-btn dialog-danger-btn">确定重置</button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-card rounded-2xl card p-5">
          <h2 className="text-base font-heading text-foreground mb-3 font-bold">账号</h2>
          <div className="text-sm text-subtle">邮箱: {user?.email}</div>
          <div className="text-sm text-subtle mt-1.5">
            注册时间: {user?.created_at ? new Date(user.created_at).toLocaleDateString('zh-CN') : '-'}
          </div>
        </div>

        <button onClick={signOut}
          className="w-full h-12 border border-border text-muted-foreground font-heading text-base rounded-2xl active:scale-[0.98] transition-transform font-bold">
          退出登录
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/pages/Settings.tsx
git commit -m "feat: custom preset slot list UI and reset today with confirmation dialog"
```

---

### Task 13: Add CSS for New Components

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Add dialog, 2-card stats, and settings styles**

Append to `src/index.css`:

```css
/* 2-card stats layout */
.stats-panel {
  grid-template-columns: repeat(2, 1fr);
}

/* Dialog overlay */
.dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(86, 48, 61, 0.24);
  backdrop-filter: blur(6px);
}

.dialog-card {
  width: calc(100% - 48px);
  max-width: 380px;
  padding: 24px 22px;
  border-radius: 24px;
  background: var(--color-card);
  box-shadow: var(--shadow-card);
}

.dialog-title {
  margin: 0 0 18px;
  color: var(--color-foreground);
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 0.01em;
}

.dialog-message {
  margin: 0 0 18px;
  color: var(--color-subtle);
  font-size: 15px;
  line-height: 1.5;
  font-weight: 600;
}

.dialog-fields {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-bottom: 8px;
}

.dialog-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.dialog-label {
  color: var(--color-subtle);
  font-size: 12px;
  font-weight: 800;
}

.dialog-input {
  height: 46px;
  border-radius: 14px;
  border: 1px solid var(--color-border);
  outline: 0;
  background: #fff8f4;
  color: var(--color-foreground);
  padding: 0 14px;
  font-size: 15px;
  font-weight: 600;
}

.dialog-input:focus {
  box-shadow: 0 0 0 3px rgba(230, 87, 134, 0.14);
}

.dialog-error {
  margin: 8px 0 0;
  color: var(--color-danger);
  font-size: 12px;
  font-weight: 700;
}

.dialog-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
}

.dialog-cancel-btn {
  min-width: 72px;
  min-height: 40px;
  border: 0;
  border-radius: 14px;
  color: var(--color-subtle);
  background: transparent;
  font-size: 14px;
  font-weight: 800;
}

.dialog-confirm-btn {
  min-width: 88px;
  min-height: 40px;
  border: 0;
  border-radius: 14px;
  color: #fffafa;
  background: var(--color-primary);
  font-size: 14px;
  font-weight: 800;
  box-shadow: 0 8px 18px rgba(230, 87, 134, 0.2);
}

.dialog-confirm-btn:disabled {
  opacity: 0.6;
}

.dialog-danger-btn {
  background: var(--color-danger);
  box-shadow: 0 8px 18px rgba(230, 109, 121, 0.2);
}

/* Plan edit separator */
.plan-edit-sep {
  color: var(--color-subtle);
  font-size: 14px;
  font-weight: 800;
}

/* Wider plan time for time ranges */
.plan-time {
  min-width: 115px;
}
```

- [ ] **Step 2: Remove `.plan-soon` styles** (no longer used) and any leftover `record-button` styles that were in RecordButton but not referenced anywhere.

Find and remove `.plan-soon` block from index.css (lines 647-665).

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "style: add dialog, 2-card stats, and settings slot-list CSS"
```

---

### Task 14: Final Type Check and Integration Test

**Files:**
- Modify: `src/components/StatsCards.test.tsx` (final verification)

- [ ] **Step 1: Run full type check**

```bash
npx tsc --noEmit
```

Expected: zero errors. If there are errors, fix the type mismatches.

- [ ] **Step 2: Run tests**

```bash
npx vitest run
```

Expected: all tests pass.

- [ ] **Step 3: Run dev server and smoke test**

```bash
npx vite --port 5173 &
```

Manual verification checklist:
- [ ] Today page loads with 5 time-slot plans from mock data
- [ ] Stats show 2 cards (progress + on-time)
- [ ] Click "记录当前时间" → dialog opens with pre-filled times
- [ ] Confirm record → first incomplete plan gets actual times
- [ ] Edit a plan → 4 time fields show (2 for incomplete, 4 for completed)
- [ ] Delete a plan works
- [ ] Settings page shows slot list
- [ ] Add/remove/edit slots works
- [ ] Save preset works
- [ ] Reset today works with confirmation dialog
- [ ] History page shows plans with time ranges

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A
git commit -m "chore: final type fixes and integration verification"
```

---

### Task Order Dependency Graph

```
Task 1 (types/mock) ──→ Task 2 (utils) ──→ Task 3 (usePreset) ──→ Task 4 (useTodaysPlans)
                                          └─→ Task 6 (StatsCards)      │
                                          └─→ Task 7 (RecordDialog)    │
                                          └─→ Task 8 (PlanItem)        │
                                          └─→ Task 5 (useHistory)      │
                                                                       ▼
                                          Task 9 (PlanList) ←──────────┘
                                          Task 10 (Today)
                                          Task 11 (DayDetail)
                                          Task 12 (Settings)
                                          Task 13 (CSS)
                                          Task 14 (Final check)
```
