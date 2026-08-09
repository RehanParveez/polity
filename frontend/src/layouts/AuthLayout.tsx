import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-8">
        <h1 className="text-2xl font-semibold text-slate-100 mb-6 text-center">Polity</h1>
        <Outlet />
      </div>
    </div>
  )
}