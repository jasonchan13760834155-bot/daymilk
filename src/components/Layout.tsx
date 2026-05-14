import { NavLink, Outlet } from 'react-router-dom'

function TodayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

function HistoryIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

function SettingsIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

export default function Layout() {
  const linkClass = (isActive: boolean) =>
    `flex flex-col items-center gap-0.5 px-3 py-1 ${isActive ? 'text-primary' : 'text-muted-foreground'}`

  return (
    <div className="min-h-screen bg-bg flex flex-col max-w-lg mx-auto relative">
      <main className="flex-1 pb-16">
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-0 right-0 max-w-lg mx-auto bg-white border-t border-border/50 flex justify-around py-2 z-10">
        <NavLink to="/" className={({ isActive }) => linkClass(isActive)}>
          <TodayIcon />
          <span className="text-[10px] font-medium">今天</span>
        </NavLink>
        <NavLink to="/history" className={({ isActive }) => linkClass(isActive)}>
          <HistoryIcon />
          <span className="text-[10px] font-medium">历史</span>
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => linkClass(isActive)}>
          <SettingsIcon />
          <span className="text-[10px] font-medium">设置</span>
        </NavLink>
      </nav>
    </div>
  )
}
