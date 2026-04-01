import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { DollarSign, TrendingUp, Calendar, Target } from 'lucide-react'
import { formatCurrency } from '../lib/format'
import type { Building, InsurancePolicy, InsuranceBudget } from '../lib/types'

interface Props {
  building: Building | null
  policies: InsurancePolicy[]
  budget: InsuranceBudget | null
}

/** Clean up raw DB policy type labels */
function formatPolicyType(raw: string): string {
  return raw
    .replace(/_/g, ' ')
    .replace(/\bAND\b/gi, '&')
    .replace(/\b\w/g, c => c.toUpperCase())
    .replace(/\s+/g, ' ')
    .trim()
}

export function InsuranceTab({ building, policies, budget }: Props) {
  const stats = useMemo(() => {
    const totalPremium = policies.reduce((s, p) => s + (p.annual_premium || 0), 0)
    const totalPrior = policies.reduce((s, p) => s + (p.prior_year_premium || 0), 0)

    const carriers = [...new Set(policies.map((p) => p.carrier).filter(Boolean))]

    const nextExpiry = policies
      .filter((p) => p.expiration_date)
      .sort((a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime())[0]

    return { totalPremium, totalPrior, carriers, nextExpiry }
  }, [policies])

  if (!building) {
    return <div className="text-center py-16 text-gray-400">Select a building.</div>
  }

  const budgetYear = budget?.budget_year || building.budget_year || 2027
  const projectedPremium = budget?.projected_premium ?? null
  const escalationRate = budget?.escalation_rate ?? null
  const projectedIncrease = projectedPremium != null ? projectedPremium - stats.totalPremium : null

  // Chart: Current vs Budgeted per policy (or total if no per-policy breakdown)
  const chartData = useMemo(() => {
    if (policies.length === 0) return []
    const rows = policies
      .filter(p => p.annual_premium > 0)
      .map(p => {
        const share = stats.totalPremium > 0 ? p.annual_premium / stats.totalPremium : 0
        return {
          name: formatPolicyType(p.policy_type || 'Unknown'),
          'Current': p.annual_premium,
          'Budgeted': projectedPremium != null ? Math.round(projectedPremium * share) : 0,
        }
      })
    return rows
  }, [policies, projectedPremium, stats.totalPremium])

  return (
    <div>
      <h2 className="font-display text-3xl text-[#1B4332] text-center mb-2">Insurance Summary</h2>
      <p className="text-center text-sm text-gray-500 mb-8">
        {building.building_id} – {building.building_name} · FY {building.budget_year || '2026'}
      </p>

      {/* Budget Projection — always visible */}
      <div className="rounded-lg border-2 border-[#2D7A4F] bg-[#F0FAF4] p-6 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <Target className="h-5 w-5 text-[#2D7A4F]" />
          <h3 className="font-display text-lg text-[#1B4332] font-semibold">FY {budgetYear} Budget Projection</h3>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-6">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Current Premium</p>
            <p className="font-display text-2xl text-[#1B4332]">{formatCurrency(stats.totalPremium)}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Escalation Rate</p>
            <p className="font-display text-2xl text-[#1B4332]">
              {escalationRate != null ? (escalationRate * 100).toFixed(1) + '%' : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Budgeted Premium</p>
            <p className="font-display text-2xl text-[#1B4332] font-bold">
              {projectedPremium != null ? formatCurrency(projectedPremium) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Increase</p>
            <p className={'font-display text-2xl ' + (projectedIncrease != null && projectedIncrease > 0 ? 'text-red-600' : 'text-[#1B4332]')}>
              {projectedIncrease != null ? formatCurrency(projectedIncrease) : '—'}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Policies</p>
            <p className="font-display text-2xl text-[#1B4332]">{budget?.policy_count ?? policies.length}</p>
          </div>
        </div>
        {budget && (
          <p className="text-[11px] text-gray-500 mt-4">
            Calculated {new Date(budget.calculation_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
        {!budget && (
          <p className="text-[11px] text-amber-600 mt-4">
            No budget calculation saved. Run "Calculate &amp; Save" in the Insurance Budget Calculator.
          </p>
        )}
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-[#2D7A4F]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Carrier(s)</span>
          </div>
          <p className="font-display text-base text-[#1B4332]">
            {stats.carriers.length > 0 ? stats.carriers.join(', ') : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
              <Calendar className="h-4 w-4 text-[#2D7A4F]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Next Renewal</span>
          </div>
          <p className="font-display text-lg text-[#1B4332]">
            {stats.nextExpiry?.expiration_date
              ? new Date(stats.nextExpiry.expiration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
              : '—'}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#2D7A4F]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Prior Year Total</span>
          </div>
          <p className="font-display text-lg text-[#1B4332]">
            {stats.totalPrior > 0 ? formatCurrency(stats.totalPrior) : '—'}
          </p>
        </div>
      </div>

      {/* Chart + Table side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Current vs Budget Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="font-display text-lg text-[#1B4332] mb-4">Current vs. Budgeted</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={60} />
                <YAxis
                  tickFormatter={(v: number) => v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'K' : '$' + v}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                <Legend />
                <Bar dataKey="Current" fill="#1B4332" radius={[4, 4, 0, 0]} />
                {projectedPremium != null && <Bar dataKey="Budgeted" fill="#F59E0B" radius={[4, 4, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[280px] text-gray-400 text-sm">No chart data</div>
          )}
        </div>

        {/* Policy Table */}
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#1B4332] text-white">
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Policy Type</th>
                <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Carrier</th>
                <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider">Annual Premium</th>
                <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider">Expiration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {policies.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-12 text-center text-gray-400">
                    No insurance policies found for this building.
                  </td>
                </tr>
              )}
              {policies.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{formatPolicyType(p.policy_type)}</td>
                  <td className="px-4 py-3 text-gray-600">{p.carrier || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(p.annual_premium)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {p.expiration_date
                      ? new Date(p.expiration_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
            {policies.length > 0 && (
              <tfoot>
                <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                  <td className="px-4 py-3" colSpan={2}>Total</td>
                  <td className="px-4 py-3 text-right font-mono">{formatCurrency(stats.totalPremium)}</td>
                  <td className="px-4 py-3"></td>
                </tr>
                {projectedPremium != null && (
                  <tr className="bg-amber-50 font-semibold">
                    <td className="px-4 py-3" colSpan={2}>Budgeted (FY {budgetYear})</td>
                    <td className="px-4 py-3 text-right font-mono text-amber-700">{formatCurrency(projectedPremium)}</td>
                    <td className="px-4 py-3"></td>
                  </tr>
                )}
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
