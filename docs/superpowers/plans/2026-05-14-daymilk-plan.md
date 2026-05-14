# DayMilk Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a PWA mobile web app for tracking daily breast pumping sessions with auto-generated plans and one-tap recording.

**Architecture:** React SPA with Supabase backend. Public pages (login/register) redirect to protected 3-tab layout (Today/History/Settings). Pure utility functions handle plan math; custom hooks manage Supabase data fetching.

**Tech Stack:** React 18 + TypeScript + Vite + Tailwind CSS 4 + React Router v7 + Supabase JS SDK + vite-plugin-pwa

---

## File Map

```
src/
├── main.tsx                          # Entry point
├── App.tsx                           # Router: public vs protected routes
├── index.css                         # Tailwind directives + Varela Round/Nunito Sans import
├── lib/
│   └── supabase.ts                   # createClient singleton + type exports
├── utils/
│   └── plan.ts                       # generatePlanTimes, findNearestPlan, formatTimeDiff (pure)
├── hooks/
│   ├── useAuth.tsx                   # AuthProvider + useAuth context hook
│   ├── usePreset.ts                  # Fetch/upsert user preset
│   ├── useTodaysPlans.ts            # Fetch today's plans, record, edit, delete
│   └── useHistory.ts                 # Fetch calendar month data + day detail
├── components/
│   ├── Layout.tsx                    # Bottom tab nav shell
│   ├── StatsCards.tsx                # 3 stats cards (progress, avg deviation, on-time)
│   ├── RecordButton.tsx              # Full-width gradient record button
│   ├── PlanItem.tsx                  # Single plan row (done/active/pending states)
│   ├── PlanList.tsx                  # Today's plan list + edit modal
│   ├── CalendarGrid.tsx              # Month calendar with completion dots
│   └── DayDetail.tsx                 # Single day's plan vs actual list
├── pages/
│   ├── Login.tsx                     # Email + password login
│   ├── Register.tsx                  # Email + password register
│   ├── Today.tsx                     # Main page: stats + record + plan list
│   ├── History.tsx                   # Calendar + selected day detail
│   └── Settings.tsx                  # Preset config + account info
└── supabase/
    └── migrations/
        └── 001_schema.sql            # presets + daily_plans tables + RLS policies
```

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`, `index.html`, `vite.config.ts`, `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json`, `tailwind.config.ts`, `src/main.tsx`, `src/App.tsx`, `src/index.css`, `src/lib/supabase.ts`, `.gitignore`

- [ ] **Step 1: Create Vite React TypeScript project**

```bash
cd /Users/jason/DailyMilk
npm create vite@latest . -- --template react-ts
npm install
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/jason/DailyMilk
npm install react-router-dom @supabase/supabase-js vite-plugin-pwa
npm install -D tailwindcss @tailwindcss/vite vitest
```

- [ ] **Step 3: Configure vite.config.ts**

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'DayMilk',
        short_name: 'DayMilk',
        description: '每日吸奶记录追踪',
        theme_color: '#EC4899',
        background_color: '#FDF2F8',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

- [ ] **Step 4: Configure Tailwind — replace src/index.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;500;600;700&family=Varela+Round&display=swap');
@import "tailwindcss";

@theme {
  --color-primary: #EC4899;
  --color-primary-light: #F9A8D4;
  --color-accent: #8B5CF6;
  --color-bg: #FDF2F8;
  --color-foreground: #831843;
  --color-card: #FFFFFF;
  --color-border: #FBCFE8;
  --color-muted: #F1EEF5;
  --color-muted-foreground: #9CA3AF;
  --font-heading: 'Varela Round', sans-serif;
  --font-body: 'Nunito Sans', sans-serif;
}

* { font-family: var(--font-body); }
h1, h2, h3, h4, .font-heading { font-family: var(--font-heading); }
body { background-color: var(--color-bg); color: var(--color-foreground); }
```

- [ ] **Step 5: Supabase client — create src/lib/supabase.ts**

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY env vars')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      presets: {
        Row: { id: string; user_id: string; start_time: string; end_time: string; daily_count: number; updated_at: string }
        Insert: { user_id: string; start_time: string; end_time: string; daily_count: number }
        Update: { start_time?: string; end_time?: string; daily_count?: number }
      }
      daily_plans: {
        Row: { id: string; user_id: string; date: string; planned_time: string; actual_time: string | null; sort_order: number; created_at: string }
        Insert: { user_id: string; date: string; planned_time: string; sort_order: number }
        Update: { planned_time?: string; actual_time?: string | null }
      }
    }
  }
}
```

- [ ] **Step 6: Create .env file**

Create `src/main.tsx` minimal entry:

```typescript
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
```

- [ ] **Step 7: Create .gitignore with necessary entries**

```bash
cat > /Users/jason/DailyMilk/.gitignore << 'GITIGNORE'
node_modules/
dist/
.env
.env.local
*.log
.DS_Store
.superpowers/
GITIGNORE
git init && git add -A && git ci -m "chore: scaffold Vite + React + Tailwind + Supabase project"
```

Expected: `vite dev` starts without errors.

---

### Task 2: Database Schema & Supabase Setup

**Files:**
- Create: `supabase/migrations/001_schema.sql`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/001_schema.sql`:

```sql
-- Presets: one per user
CREATE TABLE public.presets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  start_time TIME NOT NULL DEFAULT '06:00',
  end_time TIME NOT NULL DEFAULT '22:00',
  daily_count INT NOT NULL DEFAULT 5 CHECK (daily_count >= 1 AND daily_count <= 12),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Daily plans: one row per planned session
CREATE TABLE public.daily_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  planned_time TIME NOT NULL,
  actual_time TIMESTAMPTZ,
  sort_order INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_plans_user_date ON public.daily_plans(user_id, date);

-- RLS
ALTER TABLE public.presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own presets" ON public.presets
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users manage own plans" ON public.daily_plans
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Apply migration in Supabase dashboard**

Go to Supabase SQL Editor > paste and run the migration.

- [ ] **Step 3: Verify schema**

```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- Expected: presets, daily_plans
```

---

### Task 3: Plan Generation Utilities (TDD)

**Files:**
- Create: `src/utils/plan.ts`
- Create: `src/utils/plan.test.ts`

- [ ] **Step 1: Write failing tests for generatePlanTimes**

Create `src/utils/plan.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'
import { generatePlanTimes } from './plan'

describe('generatePlanTimes', () => {
  it('generates evenly spaced times between start and end', () => {
    const result = generatePlanTimes('06:00', '22:00', 5)
    expect(result).toEqual(['06:00', '10:00', '14:00', '18:00', '22:00'])
  })

  it('handles count=1 (just start time)', () => {
    expect(generatePlanTimes('08:00', '20:00', 1)).toEqual(['08:00'])
  })

  it('handles count=2 (start and end only)', () => {
    expect(generatePlanTimes('07:00', '21:00', 2)).toEqual(['07:00', '21:00'])
  })

  it('handles count=3 with 12h range', () => {
    expect(generatePlanTimes('06:00', '18:00', 3)).toEqual(['06:00', '12:00', '18:00'])
  })

  it('handles non-divisible intervals by rounding', () => {
    const result = generatePlanTimes('06:00', '22:00', 4)
    expect(result).toEqual(['06:00', '11:20', '16:40', '22:00'])
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx vitest run
```
Expected: FAIL — module not found or function not exported.

- [ ] **Step 3: Implement generatePlanTimes**

Create `src/utils/plan.ts`:

```typescript
export function generatePlanTimes(start: string, end: string, count: number): string[] {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const startMin = sh * 60 + sm
  const endMin = eh * 60 + em

  if (count === 1) return [start]

  const interval = (endMin - startMin) / (count - 1)
  const times: string[] = []
  for (let i = 0; i < count; i++) {
    const totalMin = Math.round(startMin + i * interval)
    const h = Math.floor(totalMin / 60)
    const m = totalMin % 60
    times.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
  }
  return times
}
```

- [ ] **Step 4: Run tests to verify pass**

```bash
npx vitest run
```
Expected: 5 tests PASS.

- [ ] **Step 5: Add tests for findNearestPlan**

Add to `src/utils/plan.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { findNearestPlan, formatTimeDiff } from './plan'

describe('findNearestPlan', () => {
  const plans = [
    { id: '1', planned_time: '06:00', actual_time: '2026-05-14T06:02:00Z', sort_order: 1 },
    { id: '2', planned_time: '10:00', actual_time: null, sort_order: 2 },
    { id: '3', planned_time: '14:00', actual_time: null, sort_order: 3 },
    { id: '4', planned_time: '18:00', actual_time: null, sort_order: 4 },
  ]

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-14T14:08:00Z'))
  })

  afterEach(() => vi.useRealTimers())

  it('finds nearest incomplete plan to current time', () => {
    const result = findNearestPlan(plans)
    expect(result?.id).toBe('3')
    expect(result?.planned_time).toBe('14:00')
  })

  it('returns null when all plans are completed', () => {
    const allDone = plans.map(p => ({ ...p, actual_time: p.actual_time || '2026-05-14T12:00:00Z' }))
    expect(findNearestPlan(allDone)).toBeNull()
  })

  it('returns only remaining plan when one left', () => {
    const oneLeft = plans.map(p => ({ ...p, actual_time: p.id === '4' ? null : '2026-05-14T12:00:00Z' }))
    const result = findNearestPlan(oneLeft)
    expect(result?.id).toBe('4')
  })
})
```

- [ ] **Step 6: Run tests to verify fail for new functions**

```bash
npx vitest run
```
Expected: FAIL for findNearestPlan, formatTimeDiff not defined.

- [ ] **Step 7: Implement findNearestPlan and formatTimeDiff**

Add to `src/utils/plan.ts`:

```typescript
export interface Plan {
  id: string
  planned_time: string
  actual_time: string | null
  sort_order: number
}

export function findNearestPlan(plans: Plan[]): Plan | null {
  const incomplete = plans.filter(p => !p.actual_time)
  if (!incomplete.length) return null

  const now = new Date()
  const nowMinutes = now.getHours() * 60 + now.getMinutes()

  return incomplete.reduce((nearest, plan) => {
    const [ph, pm] = plan.planned_time.split(':').map(Number)
    const planMinutes = ph * 60 + pm
    const [nh, nm] = nearest.planned_time.split(':').map(Number)
    const nearestMinutes = nh * 60 + nm
    return Math.abs(planMinutes - nowMinutes) < Math.abs(nearestMinutes - nowMinutes)
      ? plan : nearest
  })
}

export function formatTimeDiff(planned: string, actual: string): string {
  const [ph, pm] = planned.split(':').map(Number)
  const plannedMin = ph * 60 + pm
  const actualDate = new Date(actual)
  const actualMin = actualDate.getHours() * 60 + actualDate.getMinutes()
  const diff = actualMin - plannedMin
  const sign = diff >= 0 ? '+' : ''
  return `${sign}${diff}min`
}
```

- [ ] **Step 8: Run all tests, verify pass**

```bash
npx vitest run
```
Expected: All 8 tests PASS.

- [ ] **Step 9: Commit**

```bash
git add src/utils/plan.ts src/utils/plan.test.ts
git ci -m "feat: add plan generation & nearest-match utilities with tests"
```

---

### Task 4: Auth — Login & Register Pages

**Files:**
- Create: `src/pages/Login.tsx`, `src/pages/Register.tsx`, `src/hooks/useAuth.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Create AuthProvider hook**

Create `src/hooks/useAuth.tsx`:

```typescript
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error?: string }>
  signUp: (email: string, password: string) => Promise<{ error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return error ? { error: error.message } : {}
  }

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    return error ? { error: error.message } : {}
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be within AuthProvider')
  return ctx
}
```

- [ ] **Step 2: Create Login page**

Create `src/pages/Login.tsx`:

```typescript
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signIn(email, password)
    if (err) setError(err)
    else navigate('/')
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center px-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🤱</div>
        <h1 className="text-3xl font-heading text-foreground">DayMilk</h1>
        <p className="text-muted-foreground mt-1">每日吸奶记录</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-sm space-y-4">
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">邮箱</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-bg px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="your@email.com" required />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-bg px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="••••••" required />
        </div>
        <button type="submit" disabled={loading}
          className="w-full h-12 bg-primary text-white font-heading text-lg rounded-2xl disabled:opacity-50">
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-4">
        还没有账号？<Link to="/register" className="text-primary font-medium">注册</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Create Register page**

Create `src/pages/Register.tsx`:

```typescript
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function Register() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await signUp(email, password)
    if (err) setError(err)
    else {
      setSuccess(true)
      setTimeout(() => navigate('/'), 2000)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <div className="min-h-screen bg-bg flex flex-col justify-center items-center px-6">
        <div className="text-6xl mb-4">🎉</div>
        <h1 className="text-2xl font-heading text-foreground">注册成功！</h1>
        <p className="text-muted-foreground mt-2 text-center">正在跳转...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg flex flex-col justify-center px-6">
      <div className="text-center mb-8">
        <div className="text-5xl mb-3">🤱</div>
        <h1 className="text-3xl font-heading text-foreground">创建账号</h1>
        <p className="text-muted-foreground mt-1">开始记录你的吸奶计划</p>
      </div>
      <form onSubmit={handleSubmit} className="bg-card rounded-2xl p-6 shadow-sm space-y-4">
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">{error}</div>}
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">邮箱</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-bg px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="your@email.com" required />
        </div>
        <div>
          <label className="text-sm font-medium text-foreground block mb-1">密码</label>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            className="w-full h-12 rounded-xl border border-border bg-bg px-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="至少6位字符" required minLength={6} />
        </div>
        <button type="submit" disabled={loading}
          className="w-full h-12 bg-primary text-white font-heading text-lg rounded-2xl disabled:opacity-50">
          {loading ? '注册中...' : '注册'}
        </button>
      </form>
      <p className="text-center text-sm text-muted-foreground mt-4">
        已有账号？<Link to="/login" className="text-primary font-medium">登录</Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 4: Wire up App.tsx with router + auth guard**

Write `src/App.tsx`:

```typescript
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import Login from './pages/Login'
import Register from './pages/Register'
import Today from './pages/Today'
import History from './pages/History'
import Settings from './pages/Settings'
import Layout from './components/Layout'

function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
  if (!user) return <Navigate to="/login" />
  return (
    <Layout>
      <Outlet />
    </Layout>
  )
}

function PublicRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="min-h-screen bg-bg flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
  if (user) return <Navigate to="/" />
  return <Outlet />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Today />} />
            <Route path="/history" element={<History />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

- [ ] **Step 5: Create placeholder pages + Layout stub (for compilation)**

Create minimal stubs so the app compiles:

`src/components/Layout.tsx`:
```typescript
import { Outlet } from 'react-router-dom'
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
```

`src/pages/Today.tsx`:
```typescript
export default function Today() {
  return <div className="p-4 text-foreground">Today</div>
}
```

`src/pages/History.tsx`:
```typescript
export default function History() {
  return <div className="p-4 text-foreground">History</div>
}
```

`src/pages/Settings.tsx`:
```typescript
export default function Settings() {
  return <div className="p-4 text-foreground">Settings</div>
}
```

- [ ] **Step 6: Verify app compiles and renders login page**

```bash
npx vite build
```
Expected: Build succeeds.

- [ ] **Step 7: Commit**

```bash
git add src/hooks/useAuth.tsx src/pages/Login.tsx src/pages/Register.tsx src/pages/Today.tsx src/pages/History.tsx src/pages/Settings.tsx src/components/Layout.tsx src/App.tsx
git ci -m "feat: add auth flow with login/register pages and protected routing"
```

---

### Task 5: Layout — Bottom Tab Navigation

**Files:**
- Modify: `src/components/Layout.tsx`

- [ ] **Step 1: Implement the layout shell**

Rewrite `src/components/Layout.tsx`:

```typescript
import { NavLink, Outlet } from 'react-router-dom'

export default function Layout() {
  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-lg mx-auto relative">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-card border-t border-border flex justify-around py-3 z-10">
        <NavLink to="/" className={({ isActive }) =>
          `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`
        }>
          <span className="text-xl">🏠</span>
          <span className="text-[10px] font-medium">今天</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) =>
          `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`
        }>
          <span className="text-xl">📅</span>
          <span className="text-[10px] font-medium">历史</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) =>
          `flex flex-col items-center gap-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`
        }>
          <span className="text-xl">⚙️</span>
          <span className="text-[10px] font-medium">设置</span>
        </NavLink>
      </nav>
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
npx vite build
```
Expected: Build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/Layout.tsx
git ci -m "feat: add bottom tab navigation layout"
```

---

### Task 6: Preset Hook & Settings Page

**Files:**
- Create: `src/hooks/usePreset.ts`
- Modify: `src/pages/Settings.tsx`

- [ ] **Step 1: Create usePreset hook**

Create `src/hooks/usePreset.ts`:

```typescript
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
      .upsert({ user_id: user.id, ...preset, ...updates })
      .select()
      .single()
    if (data) setPreset(data)
  }

  return { preset, loading, updatePreset }
}
```

- [ ] **Step 2: Implement Settings page**

Rewrite `src/pages/Settings.tsx`:

```typescript
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

  if (!loading && preset) {
    if (start === '06:00') { setStart(preset.start_time); setEnd(preset.end_time); setCount(preset.daily_count) }
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
```

- [ ] **Step 3: Verify build**

```bash
npx vite build
```
Expected: Build succeeds.

- [ ] **Step 4: Commit**

```bash
git add src/hooks/usePreset.ts src/pages/Settings.tsx
git ci -m "feat: add preset hook and settings page"
```

---

### Task 7: Today Page — Plans, Stats, and Record

**Files:**
- Create: `src/hooks/useTodaysPlans.ts`
- Create: `src/components/StatsCards.tsx`
- Create: `src/components/RecordButton.tsx`
- Create: `src/components/PlanItem.tsx`
- Create: `src/components/PlanList.tsx`
- Modify: `src/pages/Today.tsx`

- [ ] **Step 1: Create useTodaysPlans hook**

Create `src/hooks/useTodaysPlans.ts`:

```typescript
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
      // Generate plans for today
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
    const nowMin = now.getHours() * 60 + now.getMinutes()

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

  const updatePlan = async (id: string, planned_time: string) => {
    await supabase.from('daily_plans').update({ planned_time }).eq('id', id)
    setPlans(prev => prev.map(p => p.id === id ? { ...p, planned_time } : p))
  }

  const deletePlan = async (id: string) => {
    await supabase.from('daily_plans').delete().eq('id', id)
    setPlans(prev => prev.filter(p => p.id !== id))
  }

  return { plans, loading, recording, record, updatePlan, deletePlan }
}
```

- [ ] **Step 2: Create StatsCards**

Create `src/components/StatsCards.tsx`:

```typescript
import { formatTimeDiff } from '../utils/plan'

interface Plan {
  id: string
  planned_time: string
  actual_time: string | null
  sort_order: number
}

export default function StatsCards({ plans }: { plans: Plan[] }) {
  const total = plans.length
  const completed = plans.filter(p => p.actual_time).length
  const hasActual = plans.filter(p => p.actual_time)

  const avgDeviation = hasActual.length
    ? Math.round(hasActual.reduce((sum, p) => {
        const diff = new Date(p.actual_time!).getTime() - new Date(`1970-01-01T${p.planned_time}:00`).getTime()
        return sum + diff / 60000
      }, 0) / hasActual.length)
    : 0

  const onTime = hasActual.filter(p => {
    const diff = Math.abs(new Date(p.actual_time!).getTime() - new Date(`1970-01-01T${p.planned_time}:00`).getTime()) / 60000
    return diff <= 15
  }).length

  return (
    <div className="flex gap-2 px-4">
      <div className="flex-1 bg-card rounded-2xl p-3 text-center shadow-sm">
        <div className="text-2xl font-heading text-primary">{completed}<span className="text-base text-primary-light">/{total}</span></div>
        <div className="text-[11px] text-muted-foreground mt-0.5">今日进度</div>
      </div>
      <div className="flex-1 bg-card rounded-2xl p-3 text-center shadow-sm">
        <div className="text-2xl font-heading text-accent">{avgDeviation > 0 ? '+' : ''}{avgDeviation}<span className="text-sm text-muted-foreground">min</span></div>
        <div className="text-[11px] text-muted-foreground mt-0.5">平均偏差</div>
      </div>
      <div className="flex-1 bg-card rounded-2xl p-3 text-center shadow-sm">
        <div className="text-2xl font-heading text-green-500">{onTime}/{completed || '-'}</div>
        <div className="text-[11px] text-muted-foreground mt-0.5">按时完成</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create RecordButton**

Create `src/components/RecordButton.tsx`:

```typescript
interface Props {
  onRecord: () => Promise<{ success?: boolean; error?: string; planned?: string }>
  recording: boolean
}

export default function RecordButton({ onRecord, recording }: Props) {
  const handleClick = async () => {
    if (recording) return
    await onRecord()
  }

  return (
    <div className="px-4 py-4">
      <button onClick={handleClick} disabled={recording}
        className="w-full bg-gradient-to-br from-primary to-accent rounded-2xl p-5 text-center shadow-lg shadow-primary/20 relative overflow-hidden active:scale-[0.98] transition-transform">
        <div className="absolute top-0 right-0 w-20 h-20 bg-white/8 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-14 h-14 bg-white/6 rounded-full translate-y-1/2 -translate-x-1/2" />
        <div className="relative z-10">
          <div className="text-2xl mb-1">⏺️</div>
          <div className="text-lg font-heading text-white">{recording ? '记录中...' : '记录吸奶时间'}</div>
          <div className="text-xs text-white/70 mt-1">点击记录当前时间</div>
        </div>
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Create PlanItem**

Create `src/components/PlanItem.tsx`:

```typescript
import { formatTimeDiff } from '../utils/plan'

interface Plan {
  id: string
  planned_time: string
  actual_time: string | null
  sort_order: number
}

interface Props {
  plan: Plan
  isActive: boolean
  onEdit: (id: string, time: string) => void
  onDelete: (id: string) => void
}

export default function PlanItem({ plan, isActive, onEdit, onDelete }: Props) {
  const done = !!plan.actual_time
  const [editing, setEditing] = useState(false)
  const [editTime, setEditTime] = useState(plan.planned_time)

  if (editing) {
    return (
      <div className="flex items-center gap-3 bg-card rounded-2xl p-3 shadow-sm">
        <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
          className="flex-1 h-10 rounded-xl border border-border bg-bg px-3 text-foreground" />
        <button onClick={() => { onEdit(plan.id, editTime); setEditing(false) }}
          className="text-sm text-primary font-medium">保存</button>
        <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground">取消</button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 bg-card rounded-2xl p-3 shadow-sm ${done ? 'border-l-[3px] border-l-green-500' : isActive ? 'border-l-[3px] border-l-primary border border-primary-light' : 'border-l-[3px] border-l-transparent'}`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
        done ? 'bg-green-100 text-green-600' : isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
      }`}>
        {done ? '✓' : isActive ? '⟳' : '○'}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-base font-heading ${done ? 'text-green-700' : isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
          {plan.planned_time}
        </div>
        {done && plan.actual_time && (
          <div className="text-xs text-green-600">
            实际 {new Date(plan.actual_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} · 偏差 {formatTimeDiff(plan.planned_time, plan.actual_time)}
          </div>
        )}
        {!done && isActive && <div className="text-xs text-primary">即将进行...</div>}
      </div>
      <div className="flex gap-1">
        <button onClick={() => { setEditTime(plan.planned_time); setEditing(true) }} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground text-sm">✏️</button>
        <button onClick={() => onDelete(plan.id)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-500 text-sm">🗑</button>
      </div>
    </div>
  )
}

// Need useState import
import { useState } from 'react'
```

Actually, I need to move the useState import to the top of the file. Let me be careful with the code.

- [ ] **Step 5: Create PlanList**

Create `src/components/PlanList.tsx`:

```typescript
import PlanItem from './PlanItem'

interface Plan {
  id: string
  planned_time: string
  actual_time: string | null
  sort_order: number
}

interface Props {
  plans: Plan[]
  onEdit: (id: string, time: string) => void
  onDelete: (id: string) => void
}

export default function PlanList({ plans, onEdit, onDelete }: Props) {
  // Find the active plan: first incomplete one
  const activeIndex = plans.findIndex(p => !p.actual_time)

  return (
    <div className="px-4 pb-2">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-base font-heading text-foreground">今日计划</h2>
      </div>
      <div className="space-y-2">
        {plans.map((plan, i) => (
          <PlanItem key={plan.id} plan={plan} isActive={i === activeIndex} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Assemble Today page**

Rewrite `src/pages/Today.tsx`:

```typescript
import { useTodaysPlans } from '../hooks/useTodaysPlans'
import StatsCards from '../components/StatsCards'
import RecordButton from '../components/RecordButton'
import PlanList from '../components/PlanList'

export default function Today() {
  const { plans, loading, recording, record, updatePlan, deletePlan } = useTodaysPlans()

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const today = new Date()
  const weekDay = ['日', '一', '二', '三', '四', '五', '六'][today.getDay()]

  return (
    <div>
      {/* Header */}
      <div className="bg-gradient-to-b from-primary-light/30 to-bg pt-8 pb-2 px-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-muted-foreground font-heading">
              {today.getMonth() + 1}月{today.getDate()}日 周{weekDay}
            </div>
            <h1 className="text-2xl font-heading text-foreground">今天</h1>
          </div>
          <div className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center text-lg">🤱</div>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-foreground font-heading text-lg mb-2">还没有计划</p>
          <p className="text-muted-foreground text-sm text-center">请先去设置页面配置每日预设</p>
        </div>
      ) : (
        <>
          <StatsCards plans={plans} />
          <RecordButton onRecord={record} recording={recording} />
          <PlanList plans={plans} onEdit={updatePlan} onDelete={deletePlan} />
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 7: Fix PlanItem.tsx import order**

Make sure `PlanItem.tsx` has `import { useState } from 'react'` at the top before using it.

Rewrite PlanItem.tsx correctly:

```typescript
import { useState } from 'react'
import { formatTimeDiff } from '../utils/plan'

interface Plan {
  id: string
  planned_time: string
  actual_time: string | null
  sort_order: number
}

interface Props {
  plan: Plan
  isActive: boolean
  onEdit: (id: string, time: string) => void
  onDelete: (id: string) => void
}

export default function PlanItem({ plan, isActive, onEdit, onDelete }: Props) {
  const done = !!plan.actual_time
  const [editing, setEditing] = useState(false)
  const [editTime, setEditTime] = useState(plan.planned_time)

  if (editing) {
    return (
      <div className="flex items-center gap-2 bg-card rounded-2xl p-3 shadow-sm">
        <input type="time" value={editTime} onChange={e => setEditTime(e.target.value)}
          className="flex-1 h-10 rounded-xl border border-border bg-bg px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary" />
        <button onClick={() => { onEdit(plan.id, editTime); setEditing(false) }}
          className="text-sm text-primary font-medium px-2">保存</button>
        <button onClick={() => setEditing(false)} className="text-sm text-muted-foreground px-2">取消</button>
      </div>
    )
  }

  return (
    <div className={`flex items-center gap-3 bg-card rounded-2xl p-3 shadow-sm ${
      done ? 'border-l-[3px] border-l-green-500' :
      isActive ? 'border-l-[3px] border-l-primary border border-primary-light' :
      'border-l-[3px] border-l-transparent'
    }`}>
      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 ${
        done ? 'bg-green-100 text-green-600' :
        isActive ? 'bg-primary/10 text-primary' :
        'bg-muted text-muted-foreground'
      }`}>
        {done ? '✓' : isActive ? '⟳' : '○'}
      </div>
      <div className="flex-1 min-w-0">
        <div className={`text-base font-heading ${done ? 'text-green-700' : isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
          {plan.planned_time}
        </div>
        {done && plan.actual_time && (
          <div className="text-xs text-green-600">
            实际 {new Date(plan.actual_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} · 偏差 {formatTimeDiff(plan.planned_time, plan.actual_time)}
          </div>
        )}
        {!done && isActive && (
          <div className="text-xs text-primary">即将进行...</div>
        )}
      </div>
      <button onClick={() => { setEditTime(plan.planned_time); setEditing(true) }} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-foreground text-sm">✏️</button>
      <button onClick={() => onDelete(plan.id)} className="w-8 h-8 flex items-center justify-center text-muted-foreground hover:text-red-500 text-sm">🗑</button>
    </div>
  )
}
```

- [ ] **Step 8: Verify build and dev server**

```bash
npx vite build
```
Expected: Build succeeds.

- [ ] **Step 9: Commit**

```bash
git add src/hooks/useTodaysPlans.ts src/components/StatsCards.tsx src/components/RecordButton.tsx src/components/PlanItem.tsx src/components/PlanList.tsx src/pages/Today.tsx
git ci -m "feat: add today page with stats, record button, and plan list"
```

---

### Task 8: History Page — Calendar + Day Detail

**Files:**
- Create: `src/hooks/useHistory.ts`
- Create: `src/components/CalendarGrid.tsx`
- Create: `src/components/DayDetail.tsx`
- Modify: `src/pages/History.tsx`

- [ ] **Step 1: Create useHistory hook**

Create `src/hooks/useHistory.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

interface DayPlan {
  id: string
  planned_time: string
  actual_time: string | null
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
      .select('date, planned_time, actual_time')
      .eq('user_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date')

    if (data) {
      const byDate = new Map<string, { total: number; done: number }>()
      data.forEach(row => {
        const d = row.date
        if (!byDate.has(d)) byDate.set(d, { total: 0, done: 0 })
        const entry = byDate.get(d)!
        entry.total++
        if (row.actual_time) entry.done++
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
      .select('id, planned_time, actual_time')
      .eq('user_id', user!.id)
      .eq('date', date)
      .order('sort_order')
    setSelectedPlans(data || [])
  }

  return { summary, selectedPlans, selectedDate, selectDate, loading }
}
```

- [ ] **Step 2: Create CalendarGrid**

Create `src/components/CalendarGrid.tsx`:

```typescript
interface DaySummary {
  date: string
  completed: boolean
  total: number
  done: number
}

interface Props {
  year: number
  month: number
  summary: DaySummary[]
  selectedDate: string | null
  onSelect: (date: string) => void
}

export default function CalendarGrid({ year, month, summary, selectedDate, onSelect }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const daysInMonth = new Date(year, month, 0).getDate()
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay() || 7

  const summaryMap = new Map(summary.map(s => [s.date, s]))

  const days: (number | null)[] = [
    ...Array(firstDayOfWeek - 1).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]

  const headers = ['一', '二', '三', '四', '五', '六', '日']

  return (
    <div className="px-4">
      <div className="grid grid-cols-7 gap-1 text-center">
        {headers.map(h => (
          <div key={h} className="text-xs text-muted-foreground py-2">{h}</div>
        ))}
        {days.map((day, i) => {
          if (!day) return <div key={`e${i}`} />
          const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const info = summaryMap.get(dateStr)
          const isToday = dateStr === today
          const isSelected = dateStr === selectedDate

          return (
            <button key={dateStr} onClick={() => onSelect(dateStr)}
              className={`relative py-2 text-sm rounded-full ${
                isSelected ? 'bg-primary text-white' :
                isToday ? 'border-2 border-primary text-primary font-bold' :
                'text-foreground'
              }`}>
              {day}
              {info && !isSelected && (
                <span className={`absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${
                  info.completed ? 'bg-green-500' : info.done > 0 ? 'bg-yellow-400' : 'bg-muted-foreground'
                }`} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create DayDetail**

Create `src/components/DayDetail.tsx`:

```typescript
import { formatTimeDiff } from '../utils/plan'

interface DayPlan {
  id: string
  planned_time: string
  actual_time: string | null
}

export default function DayDetail({ plans, date }: { plans: DayPlan[]; date: string }) {
  if (!date) return null

  return (
    <div className="px-4 pb-4">
      <h3 className="text-base font-heading text-foreground mb-2">{date} 详情</h3>
      {plans.length === 0 ? (
        <p className="text-sm text-muted-foreground">当天无记录</p>
      ) : (
        <div className="space-y-2">
          {plans.map(plan => {
            const done = !!plan.actual_time
            return (
              <div key={plan.id} className="flex items-center justify-between bg-card rounded-xl p-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${done ? 'bg-green-100 text-green-600' : 'bg-muted text-muted-foreground'}`}>
                    {done ? '✓' : '○'}
                  </div>
                  <span className={`font-heading ${done ? 'text-foreground' : 'text-muted-foreground'}`}>{plan.planned_time}</span>
                </div>
                {done && plan.actual_time && (
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    Math.abs(new Date(plan.actual_time).getTime() - new Date(`1970-01-01T${plan.planned_time}:00`).getTime()) / 60000 <= 15
                      ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                  }`}>
                    实际 {new Date(plan.actual_time).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    {' '}{formatTimeDiff(plan.planned_time, plan.actual_time)}
                  </span>
                )}
                {!done && <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded-lg">未完成</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 4: Assemble History page**

Rewrite `src/pages/History.tsx`:

```typescript
import { useState } from 'react'
import { useHistory } from '../hooks/useHistory'
import CalendarGrid from '../components/CalendarGrid'
import DayDetail from '../components/DayDetail'

export default function History() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const { summary, selectedPlans, selectedDate, selectDate } = useHistory(year, month)

  const changeMonth = (delta: number) => {
    let m = month + delta
    let y = year
    if (m > 12) { m = 1; y++ }
    if (m < 1) { m = 12; y-- }
    setMonth(m)
    setYear(y)
  }

  return (
    <div>
      <div className="bg-gradient-to-b from-primary-light/30 to-bg pt-8 pb-2 px-4">
        <div className="text-sm text-muted-foreground font-heading">回看记录</div>
        <h1 className="text-2xl font-heading text-foreground">历史</h1>
      </div>

      <div className="flex items-center justify-between px-4 py-3">
        <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center text-primary text-lg">◀</button>
        <div className="font-heading text-foreground text-base">{year}年{month}月</div>
        <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center text-primary text-lg">▶</button>
      </div>

      <CalendarGrid year={year} month={month} summary={summary} selectedDate={selectedDate} onSelect={selectDate} />
      <div className="mt-4">
        <DayDetail plans={selectedPlans} date={selectedDate || ''} />
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Verify build**

```bash
npx vite build
```
Expected: Build succeeds.

- [ ] **Step 6: Commit**

```bash
git add src/hooks/useHistory.ts src/components/CalendarGrid.tsx src/components/DayDetail.tsx src/pages/History.tsx
git ci -m "feat: add history page with calendar grid and day detail"
```

---

### Task 9: Polish & Dev Server Verification

**Files:** None new; verify all pages render correctly.

- [ ] **Step 1: Start dev server**

```bash
npx vite --host 0.0.0.0
```

- [ ] **Step 2: Verify routes manually**

| Route | Expected |
|---|---|
| `/login` | Login form with email + password, link to register |
| `/register` | Register form |
| `/` (no auth) | Redirect to /login |
| `/` (auth) | Today page: header, stats, record button, plan list |
| `/history` | Calendar with month nav, day detail |
| `/settings` | Preset form, account info, logout |

- [ ] **Step 3: Verify mobile viewport in Chrome DevTools**

Set device to iPhone 14 Pro (390×844) and verify:
- Bottom nav is visible and fixed
- All touch targets ≥ 44px
- Card shadows visible
- Gradient header renders correctly
- No horizontal overflow

- [ ] **Step 4: Commit any final fixes**

```bash
git add -A && git ci -m "chore: final polish and responsive fixes"
```

---

### Task 10: PWA Icons & Final Config

**Files:** Create `public/icon-192.png`, `public/icon-512.png`

- [ ] **Step 1: Generate PWA icons via Node script**

Create `scripts/generate-icons.cjs`:
```javascript
const { createCanvas } = require('canvas')
const fs = require('fs')

function generateIcon(size) {
  const canvas = createCanvas(size, size)
  const ctx = canvas.getContext('2d')

  // Background circle
  ctx.fillStyle = '#FDF2F8'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#EC4899'
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size * 0.42, 0, Math.PI * 2)
  ctx.fill()

  // Text emoji
  ctx.fillStyle = '#FFFFFF'
  ctx.font = `${size * 0.5}px serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🤱', size / 2, size / 2)

  fs.writeFileSync(`public/icon-${size}.png`, canvas.toBuffer('image/png'))
}

generateIcon(192)
generateIcon(512)
```

```bash
npm install -D canvas && node scripts/generate-icons.cjs
```

- [ ] **Step 2: Add viewport meta to index.html**

Ensure `index.html` has:
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#EC4899">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="apple-touch-icon" href="/icon-192.png">
```

- [ ] **Step 3: Final production build**

```bash
npx vite build
```
Expected: dist/ output with service worker.

- [ ] **Step 4: Commit**

```bash
git add -A && git ci -m "chore: add PWA icons and meta tags"
```

---

## Verification Checklist

- [ ] `npx vitest run` — all plan utility tests pass
- [ ] `npx vite build` — production build succeeds
- [ ] Dev server: login flow works
- [ ] Dev server: preset CRUD works
- [ ] Dev server: today plans auto-generate from preset
- [ ] Dev server: record button marks nearest plan
- [ ] Dev server: stats update after recording
- [ ] Dev server: edit/delete plans work
- [ ] Dev server: history calendar navigates months
- [ ] Dev server: history day detail shows plan vs actual
- [ ] Dev server: logout works
- [ ] Mobile viewport: no overflow, touch targets ok
- [ ] PWA manifest loads at /manifest.webmanifest
