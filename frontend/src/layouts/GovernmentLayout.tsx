import { Outlet, NavLink } from 'react-router-dom'
import { Home, Map, Landmark, ShieldCheck, LogOut } from 'lucide-react'
import { useAuthStore } from '../app/store'
import { RequirePermission } from '../components/permissions/RequirePermission'

const navItems = [
  { to: '/', label: 'Dashboard', icon: Home, end: true },
  { to: '/geography', label: 'Geography', icon: Map, end: false },
  { to: '/institutions', label: 'Institutions', icon: Landmark, end: false },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-teal-500/10 text-teal-400 border-l-2 border-teal-400'
      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
  }`

export function GovernmentLayout() {
  const user = useAuthStore((s) => s.user)
  const clearAuth = useAuthStore((s) => s.clearAuth)

  const handleLogout = () => {
    localStorage.removeItem('refresh_token')
    clearAuth()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      <aside className="w-64 shrink-0 border-r border-slate-800 flex flex-col">
        <div className="px-6 py-5 border-b border-slate-800">
          <span className="text-lg font-semibold tracking-tight">Polity</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
          <RequirePermission perm="authorization.role.manage">
            <NavLink to="/admin/ping" className={navLinkClass}>
              <ShieldCheck size={18} />
              Admin check
            </NavLink>
          </RequirePermission>
        </nav>
        <div className="px-3 py-4 border-t border-slate-800">
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-slate-100">{user?.full_name}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:bg-slate-900 hover:text-red-400 w-full transition-colors"
          >
            <LogOut size={18} />
            Log out
          </button>
        </div>
      </aside>
      <main className="flex-1 p-8 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}