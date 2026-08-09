import { Outlet } from 'react-router-dom'
import { ShieldCheck } from 'lucide-react'

export function AuthLayout() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 flex items-center justify-center px-4">
      
      <div
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />
      
      <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-teal-500/20 blur-[120px]" />
      <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-emerald-600/10 blur-[120px]" />
      
      <svg className="absolute bottom-0 left-0 w-full h-64 opacity-[0.10]" viewBox="0 0 1440 320" preserveAspectRatio="none" fill="none">
        <path
          d="M0 320 L0 220 L120 140 L220 210 L340 90 L460 200 L560 130 L680 240 L800 110 L920 220 L1040 150 L1160 230 L1280 100 L1440 210 L1440 320 Z"
          fill="url(#mountainGradient)"
        />
        <defs>
          <linearGradient id="mountainGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#065f46" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
        </defs>
      </svg>

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <div className="h-12 w-12 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center mb-3">
            <ShieldCheck className="text-teal-400" size={24} />
          </div>
          <h1 className="text-2xl font-semibold text-slate-100 tracking-tight">Polity</h1>
          <p className="text-xs text-slate-500 mt-1">Governance · Pakistan</p>
        </div>
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl shadow-black/40 p-8">
          <Outlet />
        </div>
      </div>
    </div>
  )
}