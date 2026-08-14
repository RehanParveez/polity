import { useTranslation } from 'react-i18next'
import { useState, useRef, useEffect, useMemo } from 'react'
import type { ElementType, KeyboardEvent } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import {BrainCircuit, MessageSquare, ScrollText, Landmark, Languages, FileText, BarChart3, Send, Sparkles, History, Bot, User, Loader2, Trash2, Lightbulb,
} from 'lucide-react'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { Button } from '../../../components/ui/Button'
import { AIResponseCard } from '../components/AIResponseCard'
import { aiService, type AIOutputContract } from '../../../services/aiService'
import { financeService } from '../../../services/financeService'
import { institutionsService } from '../../../services/institutionsService'

type Language = 'en' | 'ur'

type AgentMode =
  | 'citizen'
  | 'policy'
  | 'budget'
  | 'translate'
  | 'report'
  | 'simulation'

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  output?: AIOutputContract
  translatedText?: string
  usedFallback?: boolean
  latencyMs?: number | null
  agentMode: AgentMode
  timestamp: Date
}

type AgentConfig = {
  key: AgentMode
  labelKey: string
  icon: ElementType
  descKey: string
}

const AGENTS: AgentConfig[] = [
  {
    key: 'citizen',
    labelKey: 'agents.citizen',
    icon: MessageSquare,
    descKey: 'agents.citizenDesc',
  },
  {
    key: 'policy',
    labelKey: 'agents.policy',
    icon: ScrollText,
    descKey: 'agents.policyDesc',
  },
  {
    key: 'budget',
    labelKey: 'agents.budget',
    icon: Landmark,
    descKey: 'agents.budgetDesc',
  },
  {
    key: 'translate',
    labelKey: 'agents.translate',
    icon: Languages,
    descKey: 'agents.translateDesc',
  },
  {
    key: 'report',
    labelKey: 'agents.report',
    icon: FileText,
    descKey: 'agents.reportDesc',
  },
  {
    key: 'simulation',
    labelKey: 'agents.simulation',
    icon: BarChart3,
    descKey: 'agents.simulationDesc',
  },
]

const REPORT_TYPES = ['summary', 'sector', 'budget', 'policy'] as const

type ReportType = (typeof REPORT_TYPES)[number]

export function AssistantPage() {
  const { t, i18n } = useTranslation(['assistant', 'common'])

  const [agentMode, setAgentMode] = useState<AgentMode>('citizen')
  const [targetLang, setTargetLang] = useState<Language>('ur')
  const [messages, setMessages] = useState<Message[]>([])
  const [inputText, setInputText] = useState('')
  const [contextId, setContextId] = useState('')
  const [reportType, setReportType] = useState<ReportType>('summary')
  const [fiscalYear, setFiscalYear] = useState(2026)
  const [ministryId, setMinistryId] = useState('')
  const [showHistory, setShowHistory] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const language: Language = i18n.language.startsWith('ur') ? 'ur' : 'en'

  const { data: budgets } = useQuery({
    queryKey: ['budgets'],
    queryFn: financeService.listBudgets,
    enabled: agentMode === 'budget',
  })

  const { data: ministries } = useQuery({
    queryKey: ['ministries'],
    queryFn: institutionsService.listMinistries,
    enabled: agentMode === 'report',
  })

  const { data: history, isLoading: historyLoading } = useQuery({
    queryKey: ['ai-history'],
    queryFn: () => aiService.listHistory(20),
  })

  const chatMutation = useMutation({
    mutationFn: ({
      message,
      language,
    }: {
      message: string
      language: Language
    }) => aiService.chat(message, language),
  })

  const policyMutation = useMutation({
    mutationFn: ({
      policyId,
      query,
      language,
    }: {
      policyId: string
      query?: string
      language: Language
    }) => aiService.explainPolicy(policyId, query, language),
  })

  const budgetMutation = useMutation({
    mutationFn: ({
      budgetId,
      query,
      language,
    }: {
      budgetId: string
      query?: string
      language: Language
    }) => aiService.explainBudget(budgetId, query, language),
  })

  const translateMutation = useMutation({
    mutationFn: ({
      text,
      targetLanguage,
    }: {
      text: string
      targetLanguage: Language
    }) => aiService.translate(text, targetLanguage),
  })

  const reportMutation = useMutation({
    mutationFn: (payload: {
      ministry_id?: string | null
      report_type?: string
      fiscal_year?: number | null
      language?: string
    }) => aiService.generateReport(payload),
  })

  const simulationMutation = useMutation({
    mutationFn: ({
      runId,
      language,
    }: {
      runId: string
      language: Language
    }) => aiService.explainSimulation(runId, language),
  })

  const isLoading =
    chatMutation.isPending ||
    policyMutation.isPending ||
    budgetMutation.isPending ||
    translateMutation.isPending ||
    reportMutation.isPending ||
    simulationMutation.isPending

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isLoading])

  const avgLatency = useMemo(() => {
    const latencies = messages
      .filter(
        (message) =>
          message.latencyMs !== null &&
          message.latencyMs !== undefined &&
          message.latencyMs > 0,
      )
      .map((message) => message.latencyMs as number)

    if (latencies.length === 0) {
      return 0
    }

    return Math.round(
      latencies.reduce((total, latency) => total + latency, 0) /
        latencies.length,
    )
  }, [messages])

  const activeAgent = AGENTS.find((agent) => agent.key === agentMode)

  const agentLabel = activeAgent
    ? t(activeAgent.labelKey)
    : t('aiLabel')

  const inputPlaceholder =
    agentMode === 'translate'
      ? t('translatePlaceholder')
      : agentMode === 'citizen'
        ? t('citizenPlaceholder')
        : agentMode === 'policy'
          ? t('policyPlaceholder')
          : agentMode === 'budget'
            ? t('budgetPlaceholder')
            : agentMode === 'simulation'
              ? t('simulationPlaceholder')
              : t('reportPlaceholder')

  const addMessage = (message: Message) => {
    setMessages((previous) => [...previous, message])
  }

  const resetContextForAgent = (nextAgent: AgentMode) => {
    setAgentMode(nextAgent)
    setContextId('')
    setInputText('')
  }

  const handleSend = async () => {
    if (isLoading) {
      return
    }

    const userText = inputText.trim()
    const uid = Date.now().toString()

    if (
      (agentMode === 'citizen' || agentMode === 'translate') &&
      !userText
    ) {
      return
    }

    let displayText = userText

    if (agentMode === 'report') {
      displayText = ministryId
        ? t('displayReportWithMinistry', {
            type: t(`reportTypes.${reportType}`),
          })
        : t('displayReport', {
            type: t(`reportTypes.${reportType}`),
          })
    }

    if (agentMode === 'simulation') {
      displayText = t('displaySimulation', {
        id: contextId,
      })
    }

    if (agentMode === 'policy' && contextId) {
      displayText = userText
        ? t('displayPolicyWithQuery', {
            id: contextId,
            query: userText,
          })
        : t('displayPolicy', {
            id: contextId,
          })
    }

    if (agentMode === 'budget' && contextId) {
      displayText = userText
        ? t('displayBudgetWithQuery', {
            id: contextId,
            query: userText,
          })
        : t('displayBudget', {
            id: contextId,
          })
    }

    const userMessage: Message = {
      id: uid,
      role: 'user',
      text: displayText,
      agentMode,
      timestamp: new Date(),
    }

    addMessage(userMessage)

    try {
      let assistantMessage: Message

      switch (agentMode) {
        case 'citizen': {
          const response = await chatMutation.mutateAsync({
            message: userText,
            language,
          })

          assistantMessage = {
            id: `${uid}-ai`,
            role: 'assistant',
            text: response.output.summary,
            output: response.output,
            usedFallback: response.used_fallback,
            latencyMs: response.latency_ms,
            agentMode,
            timestamp: new Date(),
          }

          break
        }

        case 'policy': {
          if (!contextId.trim()) {
            throw new Error(t('errors.policyIdRequired'))
          }

          const response = await policyMutation.mutateAsync({
            policyId: contextId.trim(),
            query: userText || undefined,
            language,
          })

          assistantMessage = {
            id: `${uid}-ai`,
            role: 'assistant',
            text: response.output.summary,
            output: response.output,
            usedFallback: response.used_fallback,
            latencyMs: response.latency_ms,
            agentMode,
            timestamp: new Date(),
          }

          break
        }

        case 'budget': {
          if (!contextId.trim()) {
            throw new Error(t('errors.budgetIdRequired'))
          }

          const response = await budgetMutation.mutateAsync({
            budgetId: contextId.trim(),
            query: userText || undefined,
            language,
          })

          assistantMessage = {
            id: `${uid}-ai`,
            role: 'assistant',
            text: response.output.summary,
            output: response.output,
            usedFallback: response.used_fallback,
            latencyMs: response.latency_ms,
            agentMode,
            timestamp: new Date(),
          }

          break
        }

        case 'translate': {
          if (!userText) {
            throw new Error(t('errors.textRequired'))
          }

          const response = await translateMutation.mutateAsync({
            text: userText,
            targetLanguage: targetLang,
          })

          assistantMessage = {
            id: `${uid}-ai`,
            role: 'assistant',
            text: response.translated_text,
            translatedText: response.translated_text,
            usedFallback: response.used_fallback,
            latencyMs: response.latency_ms,
            agentMode,
            timestamp: new Date(),
          }

          break
        }

        case 'report': {
          const response = await reportMutation.mutateAsync({
            ministry_id: ministryId || null,
            report_type: reportType,
            fiscal_year: fiscalYear || null,
            language,
          })

          assistantMessage = {
            id: `${uid}-ai`,
            role: 'assistant',
            text: response.output.summary,
            output: response.output,
            usedFallback: response.used_fallback,
            latencyMs: response.latency_ms,
            agentMode,
            timestamp: new Date(),
          }

          break
        }

        case 'simulation': {
          if (!contextId.trim()) {
            throw new Error(t('errors.runIdRequired'))
          }

          const response = await simulationMutation.mutateAsync({
            runId: contextId.trim(),
            language,
          })

          assistantMessage = {
            id: `${uid}-ai`,
            role: 'assistant',
            text: response.output.summary,
            output: response.output,
            usedFallback: response.used_fallback,
            latencyMs: response.latency_ms,
            agentMode,
            timestamp: new Date(),
          }

          break
        }

        default: {
          const exhaustiveCheck: never = agentMode

          throw new Error(
            `${t('errors.unknownAgentMode')}: ${String(exhaustiveCheck)}`,
          )
        }
      }

      addMessage(assistantMessage)
      setInputText('')
    } catch (error: unknown) {
      const errorMessage =
        error &&
        typeof error === 'object' &&
        'response' in error &&
        error.response &&
        typeof error.response === 'object' &&
        'data' in error.response &&
        error.response.data &&
        typeof error.response.data === 'object' &&
        'detail' in error.response.data
          ? String(error.response.data.detail)
          : error instanceof Error
            ? error.message
            : t('errors.genericError')

      addMessage({
        id: `${uid}-err`,
        role: 'assistant',
        text: errorMessage,
        agentMode,
        timestamp: new Date(),
      })
    }
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      (event.metaKey || event.ctrlKey)
    ) {
      event.preventDefault()
      void handleSend()
    }
  }

  const clearChat = () => {
    setMessages([])
  }

  const requiresContext =
    agentMode === 'policy' ||
    agentMode === 'budget' ||
    agentMode === 'simulation'

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <PageHeader
          title={t('title')}
          subtitle={t('subtitle')}
        />

        <div className="flex items-center gap-2">
          {messages.length > 0 && (
            <button
              type="button"
              onClick={clearChat}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-red-400 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 transition-colors"
            >
              <Trash2 size={12} />
              {t('clear')}
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('statMessages')}
          value={messages.length.toString()}
        />

        <StatCard
          label={t('statModel')}
          value="Llama 3.1"
          caption={t('statModelCaption')}
        />

        <StatCard
          label={t('statLatency')}
          value={avgLatency > 0 ? `${avgLatency}ms` : '—'}
        />

        <StatCard
          label={t('statStatus')}
          value={t('statusOnline')}
          trend={{
            value: t('statusReady'),
            direction: 'up',
          }}
        />
      </div>

      <Card className="mb-6">
        <div className="flex flex-wrap gap-2">
          {AGENTS.map((agent) => {
            const Icon = agent.icon
            const isActive = agentMode === agent.key

            return (
              <button
                type="button"
                key={agent.key}
                onClick={() => resetContextForAgent(agent.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-left transition-all ${
                  isActive
                    ? 'bg-violet-500/10 border-violet-500/30 text-violet-400'
                    : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <Icon size={16} />

                <div>
                  <p className="text-sm font-medium">
                    {t(agent.labelKey)}
                  </p>

                  <p className="text-[10px] text-slate-500">
                    {t(agent.descKey)}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="min-h-[520px] flex flex-col">
            <div className="flex-1 overflow-y-auto max-h-[640px] space-y-4 p-1">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="h-16 w-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mb-4">
                    <BrainCircuit
                      size={32}
                      className="text-violet-400"
                    />
                  </div>

                  <h3 className="text-lg font-medium text-slate-200 mb-1">
                    {t('emptyStateTitle')}
                  </h3>

                  <p className="text-sm text-slate-500 max-w-sm mb-6">
                    {t('emptyStateDesc')}
                  </p>

                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        resetContextForAgent('citizen')
                        setInputText(t('quickAskLiteracyText'))
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      {t('quickAskLiteracy')}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        resetContextForAgent('translate')
                        setInputText(
                          t('quickTranslateTextContent'),
                        )
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      {t('quickTranslateText')}
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        resetContextForAgent('budget')
                        setInputText(
                          t('quickAnalyzeBudgetText'),
                        )
                      }}
                      className="text-xs px-3 py-1.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700 transition-colors"
                    >
                      {t('quickAnalyzeBudget')}
                    </button>
                  </div>
                </div>
              )}

              {messages.map((message) => (
                <div key={message.id}>
                  {message.role === 'user' ? (
                    <div className="flex justify-end">
                      <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 max-w-[85%]">
                        <div className="flex items-center gap-2 mb-1">
                          <User
                            size={12}
                            className="text-slate-500"
                          />

                          <span className="text-[10px] uppercase tracking-wider font-medium text-slate-500">
                            {t('userLabel')} ·{' '}
                            {t(
                              `agents.${message.agentMode}`,
                            )}
                          </span>
                        </div>

                        <p className="text-sm text-slate-100">
                          {message.text}
                        </p>
                      </div>
                    </div>
                  ) : message.text && !message.output ? (
                    <div className="mr-12">
                      <Card className="border-red-500/20 bg-red-500/5">
                        <p className="text-sm text-red-300">
                          {message.text}
                        </p>
                      </Card>
                    </div>
                  ) : message.translatedText &&
                    message.agentMode === 'translate' ? (
                    <div className="mr-12">
                      <Card className="border-violet-500/20 bg-violet-500/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
                            <Languages
                              size={16}
                              className="text-violet-400"
                            />
                          </div>

                          <div>
                            <p className="text-sm font-medium text-slate-200">
                              {t('translationCardTitle')}
                            </p>

                            <p className="text-[10px] text-slate-500">
                              {targetLang === 'ur'
                                ? t(
                                    'translationDirectionEnToUr',
                                  )
                                : t(
                                    'translationDirectionUrToEn',
                                  )}
                            </p>
                          </div>
                        </div>

                        <p className="text-sm text-slate-100 leading-relaxed">
                          {message.translatedText}
                        </p>
                      </Card>
                    </div>
                  ) : message.output ? (
                    <div className="mr-12">
                      <AIResponseCard
                        output={message.output}
                        usedFallback={
                          message.usedFallback ?? false
                        }
                        latencyMs={
                          message.latencyMs ?? null
                        }
                        agentLabel={
                          message.agentMode
                            ? t(
                                `agents.${message.agentMode}`,
                              )
                            : agentLabel
                        }
                      />
                    </div>
                  ) : null}
                </div>
              ))}

              {isLoading && (
                <div className="mr-12">
                  <Card className="border-violet-500/20 bg-violet-500/5">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center animate-pulse">
                        <Bot
                          size={16}
                          className="text-violet-400"
                        />
                      </div>

                      <div>
                        <p className="text-sm font-medium text-slate-300">
                          {t('aiThinking')}
                        </p>

                        <p className="text-xs text-slate-500">
                          {t('aiThinkingSub')}
                        </p>
                      </div>

                      <Loader2
                        size={16}
                        className="text-violet-400 animate-spin ml-auto"
                      />
                    </div>
                  </Card>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-slate-800 pt-4 mt-2 space-y-3">
              {agentMode === 'budget' && (
                <div className="flex gap-2">
                  <select
                    value={contextId}
                    onChange={(event) =>
                      setContextId(event.target.value)
                    }
                    className="bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500 appearance-none cursor-pointer min-w-[200px]"
                  >
                    <option value="">
                      {t('selectBudget')}
                    </option>

                    {budgets?.map((budget) => (
                      <option
                        key={budget.id}
                        value={budget.id}
                      >
                        {budget.ministry_name ??
                          t('federal')}{' '}
                        {t('fy', {
                          year: budget.fiscal_year,
                        })}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {agentMode === 'policy' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t(
                      'policyIdPlaceholder',
                    )}
                    value={contextId}
                    onChange={(event) =>
                      setContextId(event.target.value)
                    }
                    className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}

              {agentMode === 'simulation' && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder={t(
                      'simulationRunIdPlaceholder',
                    )}
                    value={contextId}
                    onChange={(event) =>
                      setContextId(event.target.value)
                    }
                    className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}

              {agentMode === 'report' && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={ministryId}
                    onChange={(event) =>
                      setMinistryId(event.target.value)
                    }
                    className="bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                  >
                    <option value="">
                      {t('allMinistries')}
                    </option>

                    {ministries?.map((ministry) => (
                      <option
                        key={ministry.id}
                        value={ministry.id}
                      >
                        {ministry.name}
                      </option>
                    ))}
                  </select>

                  <select
                    value={reportType}
                    onChange={(event) =>
                      setReportType(
                        event.target.value as ReportType,
                      )
                    }
                    className="bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-violet-500 appearance-none cursor-pointer"
                  >
                    {REPORT_TYPES.map((reportTypeOption) => (
                      <option
                        key={reportTypeOption}
                        value={reportTypeOption}
                      >
                        {t(
                          `reportTypes.${reportTypeOption}`,
                        )}
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    placeholder={t(
                      'fiscalYearPlaceholder',
                    )}
                    value={fiscalYear}
                    onChange={(event) =>
                      setFiscalYear(
                        Number(event.target.value),
                      )
                    }
                    className="bg-slate-950/60 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500"
                  />
                </div>
              )}

              {agentMode === 'translate' && (
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-slate-500">
                    {t('sourceLabel')}:{' '}
                    {targetLang === 'ur'
                      ? t('english')
                      : t('urdu')}
                  </span>

                  <button
                    type="button"
                    onClick={() =>
                      setTargetLang((previous) =>
                        previous === 'ur' ? 'en' : 'ur',
                      )
                    }
                    className="text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-md px-2 py-1 transition-colors"
                  >
                    {t('swapButton')}
                  </button>

                  <span className="text-xs text-slate-500">
                    {t('targetLabel')}:{' '}
                    {targetLang === 'ur'
                      ? t('urdu')
                      : t('english')}
                  </span>
                </div>
              )}

              <div className="flex gap-2">
                <textarea
                  value={inputText}
                  onChange={(event) =>
                    setInputText(event.target.value)
                  }
                  onKeyDown={handleKeyDown}
                  placeholder={inputPlaceholder}
                  rows={
                    agentMode === 'citizen' ||
                    agentMode === 'translate'
                      ? 3
                      : 2
                  }
                  className="flex-1 bg-slate-950/60 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50 transition-colors resize-none"
                />

                <div className="flex flex-col justify-end">
                  {agentMode === 'report' ||
                  agentMode === 'simulation' ||
                  agentMode === 'policy' ||
                  agentMode === 'budget' ? (
                    <Button
                      onClick={() => void handleSend()}
                      loading={isLoading}
                      disabled={
                        isLoading ||
                        (requiresContext && !contextId.trim())
                      }
                      className="w-auto px-4 h-fit"
                    >
                      <Sparkles
                        size={16}
                        className="mr-1.5"
                      />

                      {agentMode === 'report'
                        ? t('generateButton')
                        : agentMode === 'simulation'
                          ? t('explainButton')
                          : t('analyzeButton')}
                    </Button>
                  ) : (
                    <Button
                      onClick={() => void handleSend()}
                      loading={isLoading}
                      disabled={
                        isLoading || !inputText.trim()
                      }
                      className="w-auto px-4 h-fit"
                    >
                      <Send
                        size={16}
                        className="mr-1.5"
                      />

                      {t('sendButton')}
                    </Button>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-600">
                {t('submitHint')}
              </p>
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="sticky top-6">
            <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <Sparkles size={12} />
              {t('systemStatus')}
            </h3>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {t('inferenceEngine')}
                </span>

                <span className="flex items-center gap-1.5 text-emerald-400 text-xs font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {t('statusOnline')}
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {t('modelLabel')}
                </span>

                <span className="text-slate-200 text-xs font-mono">
                  llama3.1:8b
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {t('rateLimit')}
                </span>

                <span className="text-slate-200 text-xs">
                  10 / min
                </span>
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">
                  {t('responseFormat')}
                </span>

                <span className="text-slate-200 text-xs">
                  {t('responseFormatValue')}
                </span>
              </div>
            </div>
          </Card>

          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-medium text-slate-400 uppercase tracking-wider flex items-center gap-2">
                <History size={12} />
                {t('recentActivity')}
              </h3>

              <button
                type="button"
                onClick={() =>
                  setShowHistory((previous) => !previous)
                }
                className="lg:hidden text-xs text-slate-500"
              >
                {showHistory
                  ? t('hideHistory')
                  : t('showHistory')}
              </button>
            </div>

            <div
              className={`space-y-2 ${
                showHistory
                  ? 'block'
                  : 'hidden lg:block'
              }`}
            >
              {historyLoading && (
                <p className="text-xs text-slate-500">
                  {t('loadingHistory')}
                </p>
              )}

              {!historyLoading &&
                history?.length === 0 && (
                  <p className="text-xs text-slate-500 text-center py-4">
                    {t('noRecentRequests')}
                  </p>
                )}

              {history?.map((historyItem) => (
                <div
                  key={historyItem.id}
                  className="flex items-center justify-between border border-slate-800 rounded-lg px-3 py-2 hover:bg-slate-900/50 transition-colors"
                >
                  <div>
                    <p className="text-xs font-medium text-slate-300 capitalize">
                      {t(
                        `agents.${historyItem.agent_name}`,
                      )}
                    </p>

                    <p className="text-[10px] text-slate-500">
                      {new Date(
                        historyItem.created_at,
                      ).toLocaleTimeString()}{' '}
                      ·{' '}
                      {t(
                        `historyStatus.${historyItem.status}`,
                      )}
                    </p>
                  </div>

                  {historyItem.latency_ms ? (
                    <span className="text-[10px] text-slate-500">
                      {historyItem.latency_ms}ms
                    </span>
                  ) : (
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        historyItem.status === 'success'
                          ? 'bg-emerald-400'
                          : historyItem.status === 'fallback'
                            ? 'bg-amber-400'
                            : 'bg-red-400'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card className="border-violet-500/10 bg-violet-500/5">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
                <Lightbulb
                  size={16}
                  className="text-violet-400"
                />
              </div>

              <div>
                <p className="text-sm font-medium text-slate-200">
                  {t('howItWorks')}
                </p>

                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  {t('howItWorksDesc')}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}