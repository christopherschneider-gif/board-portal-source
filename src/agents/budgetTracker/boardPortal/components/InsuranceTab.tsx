import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Shield, DollarSign, TrendingUp, Calendar } from 'lucide-react'
import { formatCurrency, formatPercent } from '../lib/format'
import type { Building, InsurancePolicy } from '../lib/types'

interface Props {
  building: Building | null
  policies: InsurancePolicy[]
}

export function InsuranceTab({ building, policies }: Props) {
  const stats = useMemo(() => {
    const totalPremium = policies.reduce((s, p) => s + (p.annual_premium || 0), 0)
    const totalPrior = policies.reduce((s, p) => s + (p.prior_year_premium || 0), 0)
    const yoyChange = totalPrior > 0 ? ((totalPremium - totalPrior) / totalPrior) * 100 : 0

    const carriers = [...new Set(policies.map((p) => p.carrier).filter(Boolean))]

    const chartData = policies
      .filter((p) => p.annual_premium > 0)
      .map((p) => ({
        name: p.policy_type || 'Unknown',
        'Current Year': p.annual_premium || 0,
        'Prior Year': p.prior_year_premium || 0,
      }))

    const nextExpiry = policies
      .filter((p) => p.expiration_date)
      .sort((a, b) => new Date(a.expiration_date).getTime() - new Date(b.expiration_date).getTime())[0]

    return { totalPremium, totalPrior, yoyChange, carriers, chartData, nextExpiry }
  }, [policies])

  if (!building) {
    return <div className="text-center py-16 text-gray-400">Select a building.</div>
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-[#1B4332] text-center mb-2">Insurance Summary</h2>
      <p className="text-center text-sm text-gray-500 mb-8">
        {building.building_id} – {building.building_name} · FY {building.budget_year || '2026'}
      </p>

      <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] px-4 py-3 mb-5 flex items-start gap-2.5">
        <span className="text-xs text-[#1B4332] leading-relaxed">This tab summarizes the building's insurance portfolio including policy types, carriers, premiums, and renewal dates. Year-over-year premium changes are highlighted. Insurance data is provided by the broker at renewal.</span>
      </div>

      <p className="hidden">
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
              <DollarSign className="h-4 w-4 text-[#2D7A4F]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Premium</span>
          </div>
          <p className="font-display text-2xl text-[#1B4332]">{formatCurrency(stats.totalPremium)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-[#2D7A4F]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">YoY Change</span>
          </div>
          <p className={'font-display text-2xl ' + (stats.yoyChange > 0 ? 'text-red-600' : 'text-green-600')}>
            {formatPercent(stats.yoyChange)}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
              <Shield className="h-4 w-4 text-[#2D7A4F]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Carrier(s)</span>
          </div>
          <p className="font-display text-lg text-[#1B4332]">
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
      </div>

      {/* Chart + Table side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Premium Comparison Chart */}
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <h3 className="font-display text-lg text-[#1B4332] mb-4">Premium Comparison</h3>
          {stats.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={stats.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis
                  tickFormatter={(v: number) => v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'K' : '$' + v}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                <Bar dataKey="Prior Year" fill="#95C4A1" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Current Year" fill="#1B4332" radius={[4, 4, 0, 0]} />
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
                    No insurance policies loaded. Data syncs from Make.com.
                  </td>
                </tr>
              )}
              {policies.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">{p.policy_type}</td>
                  <td className="px-4 py-3 text-gray-600">{p.carrier || '—'}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(p.annual_premium)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {p.expiration_date
                      ? new Date(p.expiration_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
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
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
