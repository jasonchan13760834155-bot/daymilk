# Midnight Refresh & History Edit

## 1. Midnight Refresh

**Goal**: When date changes (e.g., user foregrounds the app the next day), auto-generate new daily plans from preset, regardless of whether yesterday's tasks were completed.

### Problem

Current `useTodaysPlans` has two gaps:
- `generatedRef` stays `true` across date changes, blocking regeneration
- On mobile, backgrounding then foregrounding the next day may not remount the component, so `today` never updates and no re-fetch happens

### Solution

Add a `visibilitychange` event listener in `useTodaysPlans`:

1. On mount, add `document.addEventListener('visibilitychange', handler)`
2. Handler checks: if document becomes visible AND `new Date().toISOString().slice(0, 10)` differs from the previous `today`:
   - Reset `generatedRef.current = false`
   - Remove previous date from `generatedDates` (optional cleanup, not critical)
   - Trigger `fetchPlans()` — which will see no records for the new date and generate from preset
3. Remove listener on unmount

No new files. Changes only in `src/hooks/useTodaysPlans.ts`.

### Edge cases
- App stays in foreground at midnight: timer-based re-render isn't strictly needed since the user would need to trigger a re-render anyway (navigation, etc.); the visibility handler covers the common mobile case
- Network error on regeneration: the existing Supabase error handling applies; plans stay empty until successful fetch, user sees loading/empty state

---

## 2. History Page Editing

**Goal**: In the History page, allow editing actual pump times for past days. Editing start time auto-sets end time to start +20 min. Editing end time auto-sets start time to end -20 min.

### Solution

#### `src/utils/plan.ts`
- Extract `addMinutes(hhmm, minutes)` utility (currently duplicated in `RecordDialog`)

#### `src/hooks/useHistory.ts`
- Add `updateActualTime(id, actual_start_time, actual_end_time)` method
- Updates `daily_plans` row via Supabase
- Refreshes `selectedPlans` in local state

#### `src/components/DayDetail.tsx`
- Add `editing` state, toggleable via an "Edit" button in the header
- When editing, each plan row becomes an edit card with time inputs:
  - Planned times (read-only in this view — not the focus, but could be editable)
  - Actual times (start/end) — always shown and editable regardless of completion status
- Start time change → auto-set end = start + 20 min
- End time change → auto-set start = end - 20 min
- "Cancel" and "Save All" buttons at the bottom
- Reuses existing CSS classes: `.plan-edit-card`, `.plan-edit-fields`, `.plan-time-input`, etc.

### Edge cases
- Editing an incomplete item: actual_start_time/actual_end_time are null → inputs start empty
- Start > end validation: prevent saving if end <= start
- Cross-midnight: if end time is 00:XX, the ISO date part should be the same day (dates are date-only strings in DB)

---

## Files Changed
1. `src/hooks/useTodaysPlans.ts` — visibility listener, date change detection
2. `src/utils/plan.ts` — extract `addMinutes`
3. `src/hooks/useHistory.ts` — add `updateActualTime`
4. `src/components/DayDetail.tsx` — edit mode UI
5. `src/components/RecordDialog.tsx` — use shared `addMinutes` from utils
