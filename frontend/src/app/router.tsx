import type { ReactElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { GovernmentLayout } from '../layouts/GovernmentLayout'
import { LoginPage } from '../modules/auth/pages/LoginPage'
import { RegisterPage } from '../modules/auth/pages/RegisterPage'
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { AdminPingPage } from '../modules/authorization/pages/AdminPingPage'
import { useAuthStore } from './store'
import { ProvincesPage } from '../modules/geography/pages/ProvincesPage'
import { ProvinceDistrictsPage } from '../modules/geography/pages/ProvinceDistrictsPage'
import { DistrictDetailPage } from '../modules/geography/pages/DistrictDetailPage'

function ProtectedRoute({ children }: { children: ReactElement }) {
  const accessToken = useAuthStore((s) => s.accessToken)
  if (!accessToken) return <Navigate to="/login" replace />
  return children
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <LoginPage /> },
      { path: '/register', element: <RegisterPage /> },
    ],
  },
  {
    element: (
      <ProtectedRoute>
        <GovernmentLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: '/', element: <DashboardPage /> },
      { path: '/admin/ping', element: <AdminPingPage /> },
      { path: '/geography', element: <ProvincesPage /> },
      { path: '/geography/provinces/:provinceId', element: <ProvinceDistrictsPage /> },
      { path: '/geography/districts/:districtId', element: <DistrictDetailPage /> },
    ],
  },
])