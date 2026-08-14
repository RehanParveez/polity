import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { Bot, AlertTriangle, ShieldCheck, ChevronDown, ChevronUp, Clock, Sparkles, List, AlertCircle } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import type { AIOutputContract } from '../../../services/aiService'

type Props = {
  output: AIOutputContract
  usedFallback: boolean
  latencyMs: number | null
  agentLabel: string
}

export function AIResponseCard({ output, usedFallback, latencyMs, agentLabel }: Props) {
  const { t } = useTranslation(['assistant', 'common'])
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const toggle = (key: string) => setExpanded((p) => ({ ...p, [key]: !p[key] }))

  const confidenceColor =
    output.confidence === 'high'
      ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
      : output.confidence === 'medium'
      ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
      : 'text-red-400 bg-red-500/10 border-red-500/20'

  const sections = [
    { key: 'evidence', items: output.evidence, icon: List },
    { key: 'assumptions', items: output.assumptions, icon: Sparkles },
    { key: 'risks', items: output.risks, icon: AlertCircle },
  ].filter((s) => s.items && s.items.length > 0)

  return (
    <div className="space-y-3">
      {usedFallback && (
        <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
          <AlertTriangle size={14} />
          <span>{t('fallbackMessage')}</span>
        </div>
      )}

      <Card
        className={`border-violet-500/20 bg-violet-500/5 ${
          output.requires_human_review ? 'border-amber-500/30' : ''
        }`}
      >

        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center shrink-0">
              <Bot size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-200">{agentLabel}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span
                  className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full border ${confidenceColor}`}
                >
                  {t(`confidence.${output.confidence}`)}
                </span>
                {output.requires_human_review && (
                  <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
                    <ShieldCheck size={10} />
                    {t('humanReview')}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <Clock size={10} />
            {latencyMs ? t('latencyMs', { ms: latencyMs }) : '—'}
          </div>
        </div>

        <div className="text-sm text-slate-100 leading-relaxed whitespace-pre-wrap">{output.summary}</div>

        {sections.length > 0 && (
          <div className="mt-4 space-y-2">
            {sections.map((section) => {
              const isOpen = expanded[section.key]
              const Icon = section.icon
              return (
                <div
                  key={section.key}
                  className="border border-slate-800 rounded-lg overflow-hidden"
                >
                  <button
                    onClick={() => toggle(section.key)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-slate-900/50 transition-colors"
                  >
                    <span className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                      <Icon size={12} />
                      {t(`sections.${section.key}`)}
                      <span className="text-slate-600">({section.items.length})</span>
                    </span>
                    {isOpen ? (
                      <ChevronUp size={12} className="text-slate-500" />
                    ) : (
                      <ChevronDown size={12} className="text-slate-500" />
                    )}
                  </button>
                  {isOpen && (
                    <ul className="px-3 pb-3 space-y-1.5">
                      {section.items.map((item, i) => (
                        <li key={i} className="text-xs text-slate-400 flex items-start gap-2">
                          <span className="text-violet-500/60 mt-0.5">•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </Card>
    </div>
  )
}