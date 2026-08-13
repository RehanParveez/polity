import { apiClient } from './apiClient'

export type PolicyListItem = {
  id: string
  title: string
  ministry_id: string | null
  status: string
  current_approval_step: number
  version: number
  created_at: string
  updated_at: string
}

export type PolicyReview = {
  id: string
  policy_id: string
  reviewer_id: string | null
  review_round: number
  status: string
  comments: string | null
  created_at: string
}

export type PolicyApproval = {
  id: string
  policy_id: string
  approver_id: string | null
  approval_step: number
  step_name: string
  status: string
  comments: string | null
  decided_at: string | null
  created_at: string
  approver?: string | null
}

export type PolicyIndicator = {
  id: string
  policy_id: string
  indicator_name: string
  target_value: string
  current_value: string
  unit: string
  as_of_date: string
  source: string
  confidence: string
}

export type PolicyImplementation = {
  id: string
  policy_id: string
  milestone: string
  target_date: string
  completion_date: string | null
  status: string
  budget_utilized: string | null
  notes: string | null
  created_at: string
}

export type PolicyEvaluation = {
  id: string
  policy_id: string
  evaluator_id: string | null
  effectiveness_score: number | null
  efficiency_score: number | null
  impact_summary: string | null
  recommendations: string | null
  evaluated_at: string
}

export type PolicyDetail = PolicyListItem & {
  description: string | null
  source: string
  as_of_date: string
  confidence: string
  created_by: string | null
  updated_by: string | null
  reviews: PolicyReview[]
  approvals: PolicyApproval[]
  indicators: PolicyIndicator[]
  implementations: PolicyImplementation[]
  evaluations: PolicyEvaluation[]
}

export type PolicyCreatePayload = {
  title: string
  description?: string | null
  ministry_id?: string | null
  jurisdiction_id?: string | null
  institution_id?: string | null
}

export type PolicyUpdatePayload = {
  title?: string | null
  description?: string | null
  ministry_id?: string | null
}

export type PolicyStatusTransitionPayload = {
  new_status: string
  comment?: string | null
}

export type PolicyReviewCreatePayload = {
  review_round?: number
  status?: string
  comments?: string | null
}

export type PolicyApprovalDecidePayload = {
  status: string
  comments?: string | null
}

export type PolicyIndicatorCreatePayload = {
  indicator_name: string
  target_value: string
  current_value?: string
  unit: string
  as_of_date: string
  source?: string
  confidence?: string
}

export type PolicyIndicatorUpdatePayload = {
  current_value?: string
  as_of_date?: string | null
  source?: string | null
  confidence?: string | null
}

export type PolicyImplementationCreatePayload = {
  milestone: string
  target_date: string
  budget_utilized?: string | null
  notes?: string | null
}

export type PolicyImplementationUpdatePayload = {
  status?: string | null
  completion_date?: string | null
  budget_utilized?: string | null
  notes?: string | null
}

export type PolicyEvaluationCreatePayload = {
  effectiveness_score?: number | null
  efficiency_score?: number | null
  impact_summary?: string | null
  recommendations?: string | null
}

export const policyService = {
  listPolicies: async (status?: string, ministryId?: string): Promise<PolicyListItem[]> =>
    (await apiClient.get('/policies', { params: { status, ministry_id: ministryId } })).data,

  getPolicy: async (id: string): Promise<PolicyDetail> =>
    (await apiClient.get(`/policies/${id}`)).data,

  createPolicy: async (payload: PolicyCreatePayload): Promise<PolicyListItem> =>
    (await apiClient.post('/policies', payload)).data,

  updatePolicy: async (id: string, payload: PolicyUpdatePayload): Promise<PolicyListItem> =>
    (await apiClient.patch(`/policies/${id}`, payload)).data,

  deletePolicy: async (id: string): Promise<void> =>
    (await apiClient.delete(`/policies/${id}`)).data,

  transitionStatus: async (id: string, payload: PolicyStatusTransitionPayload): Promise<PolicyListItem> =>
    (await apiClient.post(`/policies/${id}/transition`, payload)).data,

  submitReview: async (id: string, payload: PolicyReviewCreatePayload): Promise<PolicyReview> =>
    (await apiClient.post(`/policies/${id}/reviews`, payload)).data,

  listReviews: async (id: string): Promise<PolicyReview[]> =>
    (await apiClient.get(`/policies/${id}/reviews`)).data,

  listApprovals: async (id: string): Promise<PolicyApproval[]> =>
    (await apiClient.get(`/policies/${id}/approvals`)).data,

  decideApproval: async (policyId: string, stepId: string, payload: PolicyApprovalDecidePayload): Promise<PolicyListItem> =>
    (await apiClient.post(`/policies/${policyId}/approvals/${stepId}/decide`, payload)).data,

  createIndicator: async (id: string, payload: PolicyIndicatorCreatePayload): Promise<PolicyIndicator> =>
    (await apiClient.post(`/policies/${id}/indicators`, payload)).data,

  updateIndicator: async (policyId: string, indicatorId: string, payload: PolicyIndicatorUpdatePayload): Promise<PolicyIndicator> =>
    (await apiClient.patch(`/policies/${policyId}/indicators/${indicatorId}`, payload)).data,

  createImplementation: async (id: string, payload: PolicyImplementationCreatePayload): Promise<PolicyImplementation> =>
    (await apiClient.post(`/policies/${id}/implementations`, payload)).data,

  updateImplementation: async (policyId: string, implId: string, payload: PolicyImplementationUpdatePayload): Promise<PolicyImplementation> =>
    (await apiClient.patch(`/policies/${policyId}/implementations/${implId}`, payload)).data,

  createEvaluation: async (id: string, payload: PolicyEvaluationCreatePayload): Promise<PolicyEvaluation> =>
    (await apiClient.post(`/policies/${id}/evaluations`, payload)).data,
}