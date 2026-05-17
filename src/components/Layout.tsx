import { NavLink, Outlet } from 'react-router-dom'
import iconCalendarOutline from '../assets/ui/icon-calendar-outline.png'
import iconHomeActive from '../assets/ui/icon-home-active.png'
import iconSettingsOutline from '../assets/ui/icon-settings-outline.png'

export default function Layout() {
  return (
    <div className="min-h-screen w-full bg-[#F7F3F0]">
      <div className="w-full min-h-screen bg-[#F7F3F0] flex flex-col">
        <main className="app-main">
          <Outlet />
        </main>
        <nav className="fixed left-1/2 -translate-x-1/2 bottom-0 w-full max-w-[390px]" aria-label="主导航">
          <div className="px-5 pb-4">
            <div className="rounded-[24px] bg-white/94 border border-white/90 shadow-[0_12px_28px_rgba(76,58,50,0.14)] px-2 py-2 flex items-center justify-between">
          <NavLink to="/" className={({ isActive }) =>
            `w-[112px] rounded-[26px] py-2 flex flex-col items-center gap-0.5 text-[12px] font-semibold ${
              isActive ? 'bg-pink-50 text-pink-500' : 'text-[#8D8782]'
            }`
          }>
            <div className="w-9 h-9 rounded-xl bg-transparent flex items-center justify-center">
              <img src={iconHomeActive} alt="" className="w-6 h-6 object-contain" />
            </div>
            <span>今天</span>
          </NavLink>
          <NavLink to="/history" className={({ isActive }) =>
            `w-[112px] py-2 flex flex-col items-center gap-0.5 text-[12px] font-semibold ${
              isActive ? 'bg-pink-50 text-pink-500 rounded-[26px]' : 'text-[#8D8782]'
            }`
          }>
            <div className="w-9 h-9 rounded-xl bg-transparent flex items-center justify-center">
              <img src={iconCalendarOutline} alt="" className="w-6 h-6 object-contain" />
            </div>
            <span>历史</span>
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) =>
            `w-[112px] py-2 flex flex-col items-center gap-0.5 text-[12px] font-semibold ${
              isActive ? 'bg-pink-50 text-pink-500 rounded-[26px]' : 'text-[#8D8782]'
            }`
          }>
            <div className="w-9 h-9 rounded-xl bg-transparent flex items-center justify-center">
              <img src={iconSettingsOutline} alt="" className="w-6 h-6 object-contain" />
            </div>
            <span>设置</span>
          </NavLink>
            </div>
          </div>
        </nav>
      </div>
    </div>
  )
}
