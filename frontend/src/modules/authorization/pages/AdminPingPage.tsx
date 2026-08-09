import {useEffect, useState} from 'react'
import { apiClient } from '../../../services/apiClient'
import { RequirePermission } from '../../../components/permissions/RequirePermission'

function PingContent() {
  const [result, setResult] = useState<string | null>(null)
  useEffect(() => {
    apiClient.get('/authorization/ping').then((res) => setResult(JSON.stringify(res.data)))
  }, [])
  return <p className="text-emerald-600">{result ?? 'Calling /authorization/ping…'}</p>
}

export function AdminPingPage() {
  return (
    <div>
      <h2 className="text-slate-100 / text-red-400">Admin check</h2>
      <RequirePermission
        perm="authorization.role.manage"
        fallback={<p className="text-slate-100 / text-red-400">You don't have permission to see this.</p>}
      >
        <PingContent />
      </RequirePermission>
    </div>
  )
}