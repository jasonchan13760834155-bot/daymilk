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
