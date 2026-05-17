# Midnight Refresh & History Edit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add visibility-based date-change detection to auto-refresh daily plans, and add actual-time editing to the History page with ±20min auto-link.

**Architecture:** Extract `addMinutes` into a shared utility, then add a `visibilitychange` listener in `useTodaysPlans` that resets the generation guard when the date changes. Add `updatePlan` to `useHistory` for persisting edits, and build an edit-mode UI in `DayDetail` with start⇔end time linking.

**Tech Stack:** React, TypeScript, Supabase, Vitest

---

## File Structure

| File | Responsibility |
|------|---------------|
| `src/utils/plan.ts` | Pure utility functions: time math, formatting. Gains `addMinutes`. |
| `src/utils/plan.test.ts` | Unit tests for plan utils. Gains `addMinutes` tests. |
| `src/components/RecordDialog.tsx` | Record dialog. Drops local `addMinutes`, imports shared. |
| `src/hooks/useTodaysPlans.ts` | Today's plans + generation. Gains visibility listener for date-change detection. |
| `src/hooks/useHistory.ts` | History summary + selected day detail. Gains `updatePlan` for persisting actual-time edits. |
| `src/components/DayDetail.tsx` | History day detail card. Gains edit-mode toggle, time inputs, save/cancel. |

---

### Task 1: Extract `addMinutes` to shared utility

**Files:**
- Modify: `src/utils/plan.ts`
- Modify: `src/utils/plan.test.ts`
- Modify: `src/components/RecordDialog.tsx`

- [ ] **Step 1: Write tests for `addMinutes`**

In `src/utils/plan.test.ts`, add after the last `describe` block:

```typescript
import { describe, it, expect } from 'vitest'
import { isOnTime, formatTimeRange, isoToHHMM, hhmmToISO, nowToISOTime, addMinutes } from './plan'

describe('addMinutes', () => {
  it('adds minutes within the same hour', () => {
    expect(addMinutes('11:00', 20)).toBe('11:20')
  })

  it('adds minutes crossing hour boundary', () => {
    expect(addMinutes('11:50', 20)).toBe('12:10')
  })

  it('subtracts minutes', () => {
    expect(addMinutes('12:10', -20)).toBe('11:50')
  })

  it('wraps around midnight', () => {
    expect(addMinutes('23:50', 20)).toBe('00:10')
  })

  it('handles negative wrapping midnight', () => {
    expect(addMinutes('00:10', -20)).toBe('23:50')
  })
})
```

Don't forget to add `addMinutes` to the import line at the top of the test file — change:
```typescript
import { isOnTime, formatTimeRange, isoToHHMM, hhmmToISO, nowToISOTime } from './plan'
```
to:
```typescript
import { isOnTime, formatTimeRange, isoToHHMM, hhmmToISO, nowToISOTime, addMinutes } from './plan'
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run src/utils/plan.test.ts`
Expected: FAIL — `addMinutes` is not exported from './plan'

- [ ] **Step 3: Implement `addMinutes` in `src/utils/plan.ts`**

Add this function after the `nowToISOTime` function (after line 51):

```typescript
export function addMinutes(hhmm: string, minutes: number): string {
  const [h, m] = hhmm.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = String(((total % 1440) + 1440) % 1440 / 60 | 0).padStart(2, '0')
  const mm = String(((total % 60) + 60) % 60).padStart(2, '0')
  return `${hh}:${mm}`
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run src/utils/plan.test.ts`
Expected: PASS — all tests including `addMinutes`

- [ ] **Step 5: Update `RecordDialog.tsx` to use shared `addMinutes`**

In `src/components/RecordDialog.tsx`:
- Add `addMinutes` to the import from `../utils/plan` (line 5): change `import { toHHMM } from '../utils/plan'` to `import { addMinutes } from '../utils/plan'`
- Delete the local `addMinutes` function (lines 27-33)

- [ ] **Step 6: Verify the app still compiles**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 7: Run full test suite**

Run: `npx vitest run`
Expected: All tests pass

- [ ] **Step 8: Commit**

```bash
git add src/utils/plan.ts src/utils/plan.test.ts src/components/RecordDialog.tsx
git commit -m "refactor: extract addMinutes to shared plan utils"
```

---

### Task 2: Add visibility-based midnight refresh to useTodaysPlans

**Files:**
- Modify: `src/hooks/useTodaysPlans.ts`

- [ ] **Step 1: Add `todayRef` and visibility listener**

In `src/hooks/useTodaysPlans.ts`, replace the hook body (lines 17-57, keeping the return and other methods) with:

```typescript
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

  // Midnight / date-change detection when page becomes visible
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
```

The key additions are:
- `todayRef` — a ref holding the date at last fetch, used by the visibility handler to detect date changes
- A second `useEffect` that listens for `visibilitychange`, and when the page becomes visible with a new date, resets `generatedRef` and sets `loading` (which triggers `fetchPlans` via the existing `useEffect`)

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Manual verification**

Run: `npx vite --host 0.0.0.0`
Navigate to `http://localhost:5173` and verify the Today page loads plans normally.
Open DevTools console, run: `document.dispatchEvent(new Event('visibilitychange'))` — should not cause errors.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useTodaysPlans.ts
git commit -m "feat: add visibility-based midnight refresh to daily plans"
```

---

### Task 3: Add updatePlan to useHistory

**Files:**
- Modify: `src/hooks/useHistory.ts`

- [ ] **Step 1: Add `updatePlan` method and export it**

In `src/hooks/useHistory.ts`, add the `updatePlan` method inside the hook body, before the `return` statement (after line 77):

```typescript
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
```

Then update the return statement (line 79) to include `updatePlan`:

```typescript
  return { summary, selectedPlans, selectedDate, selectDate, loading, updatePlan }
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useHistory.ts
git commit -m "feat: add updatePlan to useHistory for editing actual times"
```

---

### Task 4: Build edit mode UI in DayDetail

**Files:**
- Modify: `src/components/DayDetail.tsx`

- [ ] **Step 1: Rewrite DayDetail with edit mode**

Replace the entire content of `src/components/DayDetail.tsx` with:

```typescript
import { useState } from 'react'
import { isoToHHMM, hhmmToISO, formatTimeRange, addMinutes } from '../utils/plan'

interface DayPlan {
  id: string
  planned_start_time: string
  planned_end_time: string
  actual_start_time: string | null
  actual_end_time: string | null
}

interface Props {
  plans: DayPlan[]
  date: string
  onUpdate: (id: string, actual_start_time: string, actual_end_time: string) => void
}

interface EditRow {
  actualStart: string
  actualEnd: string
  error: string
}

export default function DayDetail({ plans, date, onUpdate }: Props) {
  const [editing, setEditing] = useState(false)
  const [edits, setEdits] = useState<Record<string, EditRow>>({})

  if (!date) return null

  const enterEdit = () => {
    const init: Record<string, EditRow> = {}
    plans.forEach(p => {
      init[p.id] = {
        actualStart: p.actual_start_time ? isoToHHMM(p.actual_start_time) : '',
        actualEnd: p.actual_end_time ? isoToHHMM(p.actual_end_time) : '',
        error: '',
      }
    })
    setEdits(init)
    setEditing(true)
  }

  const cancelEdit = () => {
    setEditing(false)
    setEdits({})
  }

  const handleStartChange = (id: string, value: string) => {
    setEdits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        actualStart: value,
        actualEnd: value ? addMinutes(value, 20) : '',
        error: '',
      },
    }))
  }

  const handleEndChange = (id: string, value: string) => {
    setEdits(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        actualEnd: value,
        actualStart: value ? addMinutes(value, -20) : '',
        error: '',
      },
    }))
  }

  const saveAll = async () => {
    const newEdits = { ...edits }
    let hasError = false

    for (const plan of plans) {
      const e = newEdits[plan.id]
      if (!e.actualStart && !e.actualEnd) continue
      if (!e.actualStart || !e.actualEnd) {
        e.error = '请填写完整时间'
        hasError = true
        continue
      }
      if (e.actualStart >= e.actualEnd) {
        e.error = '开始时间不能晚于结束时间'
        hasError = true
        continue
      }
    }

    if (hasError) {
      setEdits({ ...newEdits })
      return
    }

    for (const plan of plans) {
      const e = newEdits[plan.id]
      if (e.actualStart && e.actualEnd) {
        const startISO = hhmmToISO(date, e.actualStart)
        const endISO = hhmmToISO(date, e.actualEnd)
        await onUpdate(plan.id, startISO, endISO)
      }
    }

    setEditing(false)
    setEdits({})
  }

  if (editing) {
    return (
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-heading text-foreground font-bold">{date} 编辑</h3>
          <button
            onClick={cancelEdit}
            className="text-[13px] font-semibold text-subtle hover:text-foreground"
          >
            取消
          </button>
        </div>
        {plans.length === 0 ? (
          <p className="text-sm text-subtle">当天无记录</p>
        ) : (
          <div className="space-y-3">
            {plans.map(plan => {
              const e = edits[plan.id]
              if (!e) return null
              return (
                <div key={plan.id} className="plan-edit-card">
                  <div className="plan-edit-fields">
                    <div className="text-[13px] font-semibold text-foreground mb-2">
                      {formatTimeRange(plan.planned_start_time, plan.planned_end_time)}
                    </div>
                    <div className="plan-edit-row">
                      <span className="text-[12px] font-bold text-subtle w-8 shrink-0">开始</span>
                      <input
                        type="time"
                        value={e.actualStart}
                        onChange={ev => handleStartChange(plan.id, ev.target.value)}
                        className="plan-time-input"
                      />
                      <span className="text-[12px] text-subtle">-</span>
                      <input
                        type="time"
                        value={e.actualEnd}
                        onChange={ev => handleEndChange(plan.id, ev.target.value)}
                        className="plan-time-input"
                      />
                    </div>
                    {e.error && (
                      <p className="text-[12px] text-[#E66D79] mt-1">{e.error}</p>
                    )}
                  </div>
                </div>
              )
            })}
            <div className="flex justify-end gap-2 mt-2">
              <button onClick={cancelEdit} className="plan-cancel-button">取消</button>
              <button onClick={saveAll} className="plan-save-button">保存全部</button>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="px-4 pb-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-heading text-foreground font-bold">{date} 详情</h3>
        <button
          onClick={enterEdit}
          className="text-[13px] font-semibold text-primary hover:opacity-80"
        >
          编辑
        </button>
      </div>
      {plans.length === 0 ? (
        <p className="text-sm text-subtle">当天无记录</p>
      ) : (
        <div className="space-y-2">
          {plans.map(plan => {
            const done = !!plan.actual_start_time
            return (
              <div
                key={plan.id}
                className={`flex items-center bg-card rounded-xl card overflow-hidden ${
                  done ? 'border-l-[4px] border-l-success' : 'border-l-[4px] border-l-muted-foreground/15'
                }`}
              >
                <div className="pl-4 pr-2 py-3 w-[120px] shrink-0">
                  <div className={`text-sm font-heading font-bold leading-tight ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {formatTimeRange(plan.planned_start_time, plan.planned_end_time)}
                  </div>
                  <div className={`text-[11px] mt-1 font-medium ${done ? 'text-success' : 'text-muted-foreground'}`}>
                    {done ? '已完成' : '未完成'}
                  </div>
                </div>
                <div className="flex-1" />
                {done && plan.actual_start_time && plan.actual_end_time ? (
                  <span className="text-[12px] text-foreground/80 font-semibold mr-3 font-mono">
                    {isoToHHMM(plan.actual_start_time)} - {isoToHHMM(plan.actual_end_time)}
                  </span>
                ) : (
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

- [ ] **Step 2: Update History.tsx to pass `onUpdate` to DayDetail**

In `src/pages/History.tsx`, update the `useHistory` destructuring (line 10) to include `updatePlan`:

```typescript
const { summary, selectedPlans, selectedDate, selectDate, updatePlan } = useHistory(year, month)
```

Then update the `<DayDetail>` usage (line 43) to pass `onUpdate`:

```typescript
<DayDetail plans={selectedPlans} date={selectedDate || ''} onUpdate={updatePlan} />
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No errors

- [ ] **Step 4: Manual verification**

Run: `npx vite --host 0.0.0.0`
- Navigate to History page
- Click a day with records → see the "Edit" button
- Click "Edit" → verify time inputs appear for all plans
- Change a start time → verify end time auto-sets to +20 min
- Change an end time → verify start time auto-sets to -20 min
- Leave a field empty → click "Save All" → verify error message
- Set start >= end → click "Save All" → verify error message
- Fill valid times → click "Save All" → verify list updates with new times

- [ ] **Step 5: Commit**

```bash
git add src/components/DayDetail.tsx src/pages/History.tsx
git commit -m "feat: add edit mode to history DayDetail with ±20min auto-link"
```
