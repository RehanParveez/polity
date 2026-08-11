import type { ReactElement } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AuthLayout } from '../layouts/AuthLayout'
import { ForgotPasswordPage } from '../modules/auth/pages/ForgotPasswordPage'
import { ResetPasswordPage } from '../modules/auth/pages/ResetPasswordPage'
import { GovernmentLayout } from '../layouts/GovernmentLayout'
import { LoginPage } from '../modules/auth/pages/LoginPage'
import { RegisterPage } from '../modules/auth/pages/RegisterPage'
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage'
import { AdminPingPage } from '../modules/authorization/pages/AdminPingPage'
import { useAuthStore } from './store'
import { ProvincesPage } from '../modules/geography/pages/ProvincesPage'
import { ProvinceDistrictsPage } from '../modules/geography/pages/ProvinceDistrictsPage'
import { DistrictDetailPage } from '../modules/geography/pages/DistrictDetailPage'
import { MinistriesPage } from '../modules/institutions/pages/MinistriesPage'
import { MinistryOrgChartPage } from '../modules/institutions/pages/MinistryOrgChartPage'
import { ElectionsPage } from '../modules/elections/pages/ElectionsPage'
import { ElectionCreatePage } from '../modules/elections/pages/ElectionCreatePage'
import { ElectionResultsPage } from '../modules/elections/pages/ElectionResultsPage'
import { GovernmentCreatePage } from '../modules/government/pages/GovernmentCreatePage'
import { GovernmentDetailPage } from '../modules/government/pages/GovernmentDetailPage'
import { GovernmentsPage } from '../modules/government/pages/GovernmentsPage'
import { FinanceDashboardPage } from '../modules/finance/pages/FinanceDashboardPage'
import { BudgetsPage } from '../modules/finance/pages/BudgetsPage'
import { BudgetDetailPage } from '../modules/finance/pages/BudgetDetailPage'
import { ProcurementPage } from '../modules/finance/pages/ProcurementPage'

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
      { path: '/forgot-password', element: <ForgotPasswordPage /> },
      { path: '/reset-password', element: <ResetPasswordPage /> },
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
      { path: '/institutions', element: <MinistriesPage /> },
      { path: '/institutions/ministries/:ministryId', element: <MinistryOrgChartPage /> },
      { path: '/elections', element: <ElectionsPage /> },
      { path: '/elections/new', element: <ElectionCreatePage /> },
      { path: '/elections/:electionId', element: <ElectionResultsPage /> },
      { path: '/governments', element: <GovernmentsPage /> },
      { path: '/governments/new', element: <GovernmentCreatePage /> },
      { path: '/governments/:governmentId', element: <GovernmentDetailPage /> },
      { path: '/finance', element: <FinanceDashboardPage /> },
      { path: '/finance/budgets', element: <BudgetsPage /> },
      { path: '/finance/budgets/:budgetId', element: <BudgetDetailPage /> },
      { path: '/finance/procurement', element: <ProcurementPage /> },
    ],
  },
])