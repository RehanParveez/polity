import { useEffect, useState } from 'react'

type HealthStatus = {
  status: string
  service: string
}

function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const apiUrl = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'
    fetch(`${apiUrl}/health`)
      .then((res) => res.json())
      .then(setHealth)
      .catch(() => setError('Could not reach backend'))
  }, [])

  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-50">
      <h1 className="text-3xl font-semibold text-slate-800">CivicSphere</h1>
      {health && (
        <p className="text-emerald-600">
          Backend status: {health.status} ({health.service})
        </p>
      )}
      {error && <p className="text-red-600">{error}</p>}
      {!health && !error && <p className="text-slate-500">Checking backend…</p>}
    </main>
  )
}

export default App