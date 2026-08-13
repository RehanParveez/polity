import { apiClient } from './apiClient'

export type Indicator = {
  id: string
  name: string
  code: string
  category: string
  unit: string
  description: string | null
  is_higher_better: boolean
}

export type IndicatorValue = {
  id: string
  indicator_id: string
  district_id: string | null
  value: string
  as_of_date: string
  source: string
  confidence: string
}

export type SimulationRule = {
  id: string
  rule_name: string
  description: string | null
  version: number
  is_active: boolean
  rule_config: Record<string, any>
  affected_indicator_codes: string[]
}

export type ScenarioInput = {
  id: string
  scenario_id: string
  rule_name: string
  parameter_name: string
  parameter_value: string
}

export type SimulationRunList = {
  id: string
  scenario_id: string
  status: string
  started_at: string | null
  completed_at: string | null
  error_message: string | null
  created_at: string
}

export type SimulationResult = {
  id: string
  simulation_run_id: string
  indicator_id: string
  indicator_name: string | null
  indicator_unit: string | null
  indicator_category: string | null
  district_id: string | null
  baseline_value: string
  simulated_value: string
  absolute_change: string
  percent_change: string
  rule_applied: string
  is_higher_better: boolean
}

export type SimulationRunDetail = SimulationRunList & {
  results: SimulationResult[]
}

export type ScenarioListItem = {
  id: string
  title: string
  description: string | null
  status: string
  visibility: string
  created_at: string
  updated_at: string
}

export type ScenarioDetail = ScenarioListItem & {
  inputs: ScenarioInput[]
  simulation_runs: SimulationRunList[]
}

export type SimulationResultChartRow = {
  indicator_name: string
  indicator_code: string
  category: string
  unit: string
  baseline: string
  simulated: string
  change_pct: string
  color: string
}

export type ComparisonDiffItem = {
  indicator_id: string
  indicator_name: string
  indicator_unit: string
  baseline_value: string
  comparison_value: string
  absolute_diff: string
  percent_diff: string
  is_higher_better: boolean
}

export type ScenarioComparison = {
  id: string
  title: string
  baseline_run_id: string
  comparison_run_id: string
  diff_summary: Record<string, any>
  created_at: string
}

export type ScenarioComparisonDetail = ScenarioComparison & {
  diffs: ComparisonDiffItem[]
}

export const simulationService = {
  listIndicators: async (category?: string): Promise<Indicator[]> =>
    (await apiClient.get('/simulations/indicators', { params: { category } })).data,

  listRules: async (): Promise<SimulationRule[]> =>
    (await apiClient.get('/simulations/rules')).data,

  listScenarios: async (status?: string): Promise<ScenarioListItem[]> =>
    (await apiClient.get('/simulations/scenarios', { params: { status } })).data,

  getScenario: async (id: string): Promise<ScenarioDetail> =>
    (await apiClient.get(`/simulations/scenarios/${id}`)).data,

  createScenario: async (payload: {
    title: string
    description?: string | null
    visibility?: string
  }): Promise<ScenarioDetail> =>
    (await apiClient.post('/simulations/scenarios', payload)).data,

  updateScenario: async (id: string, payload: {
    title?: string
    description?: string | null
    status?: string
    visibility?: string
  }): Promise<ScenarioDetail> =>
    (await apiClient.patch(`/simulations/scenarios/${id}`, payload)).data,

  deleteScenario: async (id: string): Promise<void> =>
    (await apiClient.delete(`/simulations/scenarios/${id}`)).data,

  addInput: async (scenarioId: string, payload: {
    rule_name: string
    parameter_name: string
    parameter_value: string
  }): Promise<ScenarioInput> =>
    (await apiClient.post(`/simulations/scenarios/${scenarioId}/inputs`, payload)).data,

  removeInput: async (scenarioId: string, inputId: string): Promise<void> =>
    (await apiClient.delete(`/simulations/scenarios/${scenarioId}/inputs/${inputId}`)).data,

  triggerRun: async (scenarioId: string): Promise<SimulationRunList> =>
    (await apiClient.post(`/simulations/scenarios/${scenarioId}/run`)).data,

  getRun: async (runId: string): Promise<SimulationRunDetail> =>
    (await apiClient.get(`/simulations/runs/${runId}`)).data,

  getRunChart: async (runId: string): Promise<SimulationResultChartRow[]> =>
    (await apiClient.get(`/simulations/runs/${runId}/chart`)).data,

  listComparisons: async (): Promise<ScenarioComparison[]> =>
    (await apiClient.get('/simulations/comparisons')).data,

  createComparison: async (payload: {
    title: string
    baseline_run_id: string
    comparison_run_id: string
  }): Promise<ScenarioComparison> =>
    (await apiClient.post('/simulations/comparisons', payload)).data,

  getComparison: async (id: string): Promise<ScenarioComparisonDetail> =>
    (await apiClient.get(`/simulations/comparisons/${id}`)).data,
}