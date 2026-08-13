import { useTranslation } from 'react-i18next'
import { useQuery } from '@tanstack/react-query'
import { useMemo, useState } from 'react'
import {GraduationCap, Users, UserCheck, BookOpen, MapPin, Filter, TrendingUp, Award, Building2, ChevronRight,
} from 'lucide-react'
import {BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { sectorsService } from '../../../services/sectorsService'

const TYPE_COLORS = ['#6366f1', '#8b5cf6', '#0ea5e9', '#f59e0b', '#ef4444', '#10b981']

export function EducationPage() {
  const { t } = useTranslation(['sectors', 'common'])
  const { data, isLoading } = useQuery({
    queryKey: ['sectors-education'],
    queryFn: sectorsService.listEducation,
  })

  const [typeFilter, setTypeFilter] = useState<string>('all')

  const totalInstitutions = data?.length ?? 0
  const totalStudents = useMemo(
    () => data?.reduce((s: number, i: any) => s + Number(i.enrollment_count), 0) ?? 0,
    [data]
  )
  const totalTeachers = useMemo(
    () => data?.reduce((s: number, i: any) => s + Number(i.teacher_count), 0) ?? 0,
    [data]
  )
  const avgStudentTeacherRatio = totalTeachers > 0 ? totalStudents / totalTeachers : 0
  const activeCount = useMemo(
    () => data?.filter((i: any) => i.status === 'active').length ?? 0,
    [data]
  )
  const activePct = totalInstitutions > 0 ? (activeCount / totalInstitutions) * 100 : 0

  const typeSummary = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { students: number; teachers: number; count: number }>()
    data.forEach((i: any) => {
      const instType = i.institution_type.replace('_', ' ')
      const existing = map.get(instType) ?? { students: 0, teachers: 0, count: 0 }
      map.set(instType, {
        students: existing.students + Number(i.enrollment_count),
        teachers: existing.teachers + Number(i.teacher_count),
        count: existing.count + 1,
      })
    })
    return Array.from(map.entries())
      .map(([name, stats]) => ({
        name,
        students: Math.round(stats.students),
        teachers: Math.round(stats.teachers),
        count: stats.count,
        ratio: stats.teachers > 0 ? +(stats.students / stats.teachers).toFixed(1) : 0,
      }))
      .sort((a, b) => b.students - a.students)
  }, [data])

  const districtSummary = useMemo(() => {
    if (!data) return []
    const map = new Map<string, { count: number; students: number; teachers: number }>()
    data.forEach((i: any) => {
      const d = i.district?.name ?? t('sectors:education.unknownDistrict')
      const existing = map.get(d) ?? { count: 0, students: 0, teachers: 0 }
      map.set(d, {
        count: existing.count + 1,
        students: existing.students + Number(i.enrollment_count),
        teachers: existing.teachers + Number(i.teacher_count),
      })
    })
    return Array.from(map.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 4)
  }, [data, t])

  const uniqueTypes = useMemo(
    () => (data ? [...new Set(data.map((i: any) => i.institution_type.replace('_', ' ')))] : []),
    [data]
  )

  const filteredInstitutions = useMemo(() => {
    if (!data) return []
    return typeFilter === 'all'
      ? data
      : data.filter((i: any) => i.institution_type.replace('_', ' ') === typeFilter)
  }, [data, typeFilter])

  if (isLoading) return <p className="text-slate-400">{t('common:loading')}</p>
  if (!data || data.length === 0) return <p className="text-red-400">{t('common:couldNotLoad', { resource: t('sectors:education.title') })}</p>

  return (
    <div>
      <PageHeader
        title={t('sectors:education.title')}
        subtitle={`${totalInstitutions.toLocaleString()} ${t('sectors:education.institutions')} · ${totalStudents.toLocaleString()} ${t('sectors:education.students')} · ${activePct.toFixed(0)}% ${t('sectors:education.active')}`}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard
          label={t('sectors:education.totalInstitutions')}
          value={totalInstitutions.toLocaleString()}
        />
        <StatCard
          label={t('sectors:education.totalEnrollment')}
          value={`${(totalStudents / 1000).toFixed(1)}K`}
          trend={{ value: t('sectors:education.yoy'), direction: 'up' }}
        />
        <StatCard
          label={t('sectors:education.teachingStaff')}
          value={totalTeachers.toLocaleString()}
        />
        <StatCard
          label={t('sectors:education.studentTeacherRatio')}
          value={avgStudentTeacherRatio.toFixed(1)}
        />
      </div>

      <Card className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
            <TrendingUp size={16} className="text-slate-500" />
            {t('sectors:education.enrollmentByType')}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">{t('sectors:education.students')}</span>
            <div className="w-3 h-3 rounded-sm bg-indigo-500" />
            <span className="text-xs text-slate-500 ml-2">{t('sectors:education.teachers')}</span>
            <div className="w-3 h-3 rounded-sm bg-violet-500/60" />
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={typeSummary} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 12 }}
              axisLine={{ stroke: '#1e293b' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#0f172a',
                border: '1px solid #1e293b',
                borderRadius: 8,
              }}
              cursor={{ fill: '#1e293b', opacity: 0.4 }}
              formatter={(value: any) => {
                const num = typeof value === 'number' ? value : Number(value)
                return [num.toLocaleString(), '']
              }}
            />
            <Bar dataKey="students" fill="#6366f1" radius={[4, 4, 0, 0]} name={t('sectors:education.students')} />
            <Bar dataKey="teachers" fill="#8b5cf6" radius={[4, 4, 0, 0]} opacity={0.6} name={t('sectors:education.teachers')} />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-slate-500" />
            {t('sectors:education.districtOverview')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {districtSummary.map((d) => (
              <Card key={d.name} className="relative overflow-hidden group hover:border-indigo-900/50 transition-colors">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                  <Building2 size={48} className="text-indigo-500" />
                </div>
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-100">{d.name}</p>
                    <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400">
                      {d.count} {t('sectors:education.institutions')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    <div>
                      <p className="text-xs text-slate-500">{t('sectors:education.students')}</p>
                      <p className="text-lg font-semibold text-slate-200">
                        {d.students.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">{t('sectors:education.teachers')}</p>
                      <p className="text-lg font-semibold text-slate-200">
                        {d.teachers.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {t('sectors:education.ratio')}: {(d.students / d.teachers).toFixed(1)} : 1
                    </span>
                    <ChevronRight size={14} className="text-slate-600 group-hover:text-indigo-500 transition-colors" />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            {t('sectors:education.institutionType')}
          </h3>
          <Card className="mb-4">
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setTypeFilter('all')}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  typeFilter === 'all'
                    ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                    : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              >
                {t('sectors:education.allTypes')}
              </button>
              {uniqueTypes.map((type: string) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                    typeFilter === type
                      ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <h4 className="text-xs font-medium text-slate-400 mb-3 uppercase tracking-wider">{t('sectors:education.institutionsByType')}</h4>
            <ResponsiveContainer width="100%" height={180}>
              <PieChart>
                <Pie
                  data={typeSummary}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="count"
                >
                  {typeSummary.map((_, i) => (
                    <Cell key={i} fill={TYPE_COLORS[i % TYPE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: 8,
                  }}
                  formatter={(value: any) => {
                    const num = typeof value === 'number' ? value : Number(value)
                    return [`${num.toLocaleString()} ${t('sectors:education.institutions')}`, t('common:total')]
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-1">
              {typeSummary.slice(0, 4).map((typeItem, i) => (
                <div key={typeItem.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: TYPE_COLORS[i % TYPE_COLORS.length] }} />
                    <span className="text-slate-400">{typeItem.name}</span>
                  </div>
                  <span className="text-slate-300">{typeItem.count}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
          <BookOpen size={16} className="text-slate-500" />
          {t('sectors:education.institutionDirectory')}
          {typeFilter !== 'all' && (
            <span className="text-xs text-slate-500">{t('sectors:education.filteredBy', { type: typeFilter })}</span>
          )}
        </h3>
        <span className="text-xs text-slate-500">{filteredInstitutions.length} {t('sectors:education.results')}</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredInstitutions.map((inst: any) => {
          const ratio = Number(inst.teacher_count) > 0
            ? Number(inst.enrollment_count) / Number(inst.teacher_count)
            : 0
          const isGoodRatio = ratio > 0 && ratio <= 30

          return (
            <Card key={inst.id} className="group hover:border-indigo-900/40 transition-all">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-100">{inst.name}</p>
                    {isGoodRatio && <Award size={14} className="text-indigo-400" />}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                    <MapPin size={10} />
                    {inst.district?.name ?? t('sectors:education.unknownDistrict')}
                  </p>
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full ${
                  inst.status === 'active'
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}>
                  {t(`common:statuses.${inst.status}` as any) || inst.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <Users size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:education.students')}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {Number(inst.enrollment_count).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <UserCheck size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:education.teachers')}</span>
                  </div>
                  <p className="text-sm font-semibold text-slate-200">
                    {Number(inst.teacher_count).toLocaleString()}
                  </p>
                </div>
                <div className="bg-slate-900/50 rounded-lg p-2.5">
                  <div className="flex items-center gap-1 mb-1">
                    <GraduationCap size={10} className="text-slate-500" />
                    <span className="text-[10px] text-slate-500 uppercase">{t('sectors:education.ratio')}</span>
                  </div>
                  <p className={`text-sm font-semibold ${isGoodRatio ? 'text-indigo-400' : 'text-amber-400'}`}>
                    {ratio.toFixed(1)}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] uppercase tracking-wider font-medium px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400">
                    {inst.institution_type.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-[10px] text-slate-600">{inst.confidence}</span>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}