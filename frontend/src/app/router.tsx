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
import { SectorsDashboardPage } from '../modules/sectors/pages/SectorsDashboardPage'
import { EducationPage } from '../modules/sectors/pages/EducationPage'
import { HealthcarePage } from '../modules/sectors/pages/HealthcarePage'
import { AgriculturePage } from '../modules/sectors/pages/AgriculturePage'
import { InfrastructurePage } from '../modules/sectors/pages/InfrastructurePage'
import { LaborPage } from '../modules/sectors/pages/LaborPage'
import { DefensePage } from '../modules/sectors/pages/DefensePage'
import { PoliciesPage } from '../modules/policies/pages/PoliciesPage'
import { PolicyCreatePage } from '../modules/policies/pages/PolicyCreatePage'
import { PolicyDetailPage } from '../modules/policies/pages/PolicyDetailPage'
import { ScenariosPage } from '../modules/process/pages/ScenariosPage'
import { ScenarioCreatePage } from '../modules/process/pages/ScenarioCreatePage'
import { ScenarioDetailPage } from '../modules/process/pages/ScenarioDetailPage'
import { ComparisonsPage } from '../modules/process/pages/ComparisonsPage'
import { AssistantPage } from '../modules/assistant/pages/AssistantPage'
import { SessionsPage } from '../modules/sessions/pages/SessionsPage'
import { SessionDetailPage } from '../modules/sessions/pages/SessionDetailPage'
import { SessionCreatePage } from '../modules/sessions/pages/SessionCreatePage'

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
      { path: '/sectors', element: <SectorsDashboardPage /> },
      { path: '/sectors/education', element: <EducationPage /> },
      { path: '/sectors/healthcare', element: <HealthcarePage /> },
      { path: '/sectors/agriculture', element: <AgriculturePage /> },
      { path: '/sectors/infrastructure', element: <InfrastructurePage /> },
      { path: '/sectors/labor', element: <LaborPage /> },
      { path: '/sectors/defense', element: <DefensePage /> },
      { path: '/policies', element: <PoliciesPage /> },
      { path: '/policies/new', element: <PolicyCreatePage /> },
      { path: '/policies/:policyId', element: <PolicyDetailPage /> },
      { path: '/process', element: <ScenariosPage /> },
      { path: '/process/new', element: <ScenarioCreatePage /> },
      { path: '/process/:scenarioId', element: <ScenarioDetailPage /> },
      { path: '/process/comparisons', element: <ComparisonsPage /> },
      { path: '/assistant', element: <AssistantPage /> },
      { path: '/sessions', element: <SessionsPage /> },
      { path: '/sessions/new', element: <SessionCreatePage /> },
      { path: '/sessions/:sessionId', element: <SessionDetailPage /> },
    ],
  },
])