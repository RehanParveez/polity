import { Outlet, NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Home, Map, Landmark, Vote, ShieldCheck, LogOut, Building2, FileText } from 'lucide-react'
import { useAuthStore } from '../app/store'
import { RequirePermission } from '../components/permissions/RequirePermission'
import { LanguageSwitcher } from '../components/ui/LanguageSwitcher'
import { Banknote } from 'lucide-react'
import { Factory } from 'lucide-react'

const navItems = [
  { to: '/', labelKey: 'nav.dashboard', icon: Home, end: true },
  { to: '/geography', labelKey: 'nav.geography', icon: Map, end: false },
  { to: '/institutions', labelKey: 'nav.institutions', icon: Landmark, end: false },
  { to: '/elections', labelKey: 'nav.elections', icon: Vote, end: false },
  { to: '/governments', labelKey: 'nav.government', icon: Building2, end: false },
  { to: '/finance', labelKey: 'nav.finance', icon: Banknote, end: false },
  { to: '/sectors', labelKey: 'Sectors', icon: Factory, end: false },
  { to: '/policies', labelKey: 'Policies', icon: FileText, end: false },
]

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
    isActive
      ? 'bg-teal-500/10 text-teal-400 border-l-2 border-teal-400'
      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-100'
  }`

export function GovernmentLayout() {
  const { t } = useTranslation()
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
          {navItems.map(({ to, labelKey, icon: Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={navLinkClass}>
              <Icon size={18} />
              {t(labelKey)}
            </NavLink>
          ))}
          <RequirePermission perm="authorization.role.manage">
            <NavLink to="/admin/ping" className={navLinkClass}>
              <ShieldCheck size={18} />
              {t('nav.adminCheck')}
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
            {t('logout')}
          </button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-y-auto">
        <div className="flex justify-end px-8 pt-6">
          <LanguageSwitcher />
        </div>
        <div className="flex-1 p-8 pt-4">
          <Outlet />
        </div>
      </main>
    </div>
  )
}