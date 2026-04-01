import { useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Building2, DollarSign, TrendingUp, Percent } from 'lucide-react'
import { formatCurrency } from '../lib/format'
import type { Building, PropertyTaxAssessment } from '../lib/types'

interface Props {
  building: Building | null
  assessments: PropertyTaxAssessment[]
}

function fmtRate(v: number | null | undefined): string {
  if (v == null || isNaN(v)) return '—'
  return (v * 100).toFixed(4) + '%'
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function PropertyTaxTab({ building, assessments }: Props) {
  // Use data from the most recent assessment for BBL display
  const latest = assessments.length > 0 ? assessments[0] : null

  const stats = useMemo(() => {
    if (!latest) return null
    const totalGross = latest.gross_tax || 0
    const totalAbatements = latest.abatement_credits || 0
    const annualAmount = latest.annual_amount || 0
    const assessedValue = latest.assessed_value || 0

    // Chart: historical trend sorted ascending
    const chartData = [...assessments]
      .sort((a, b) => a.tax_year - b.tax_year)
      .map((a) => ({
        year: 'FY' + a.tax_year,
        'Annual Amount': a.annual_amount || 0,
        'Abatement Credits': a.abatement_credits || 0,
      }))

    return { totalGross, totalAbatements, annualAmount, assessedValue, chartData }
  }, [assessments, latest])

  if (!building) {
    return <div className="text-center py-16 text-gray-400">Select a building.</div>
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-[#1B4332] text-center mb-2">Property Tax</h2>
      <p className="text-center text-sm text-gray-500 mb-8">
        {building.building_id} – {building.building_name} · FY {building.budget_year || '2027'}
      </p>

      {/* Note about fiscal year */}
      <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] px-4 py-3 mb-6 flex items-start gap-2.5">
        <span className="text-xs text-[#1B4332] leading-relaxed">
          <strong>Note:</strong> The budgeted amount will differ from the annual amount below, because the city's fiscal year is from July to June.
        </span>
      </div>

      {assessments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Building2 className="h-10 w-10 mx-auto mb-3 text-gray-300" />
          <p className="text-sm">No property tax data available for this building.</p>
          <p className="text-xs text-gray-300 mt-1">Sync from NYC DOF in the Grid dashboard first.</p>
        </div>
      ) : (
        <>
          {/* BBL Display */}
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-md">
            <div className="rounded-lg border border-gray-200 bg-white p-5 text-center">
              <p className="text-xs font-semibold text-[#1B4332] uppercase tracking-wider mb-2">Borough</p>
              <p className="font-display text-2xl text-[#1B4332]">{latest?.borough_name || '—'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5 text-center">
              <p className="text-xs font-semibold text-[#1B4332] uppercase tracking-wider mb-2">Block #</p>
              <p className="font-display text-2xl text-[#1B4332]">{latest?.block_number || '—'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5 text-center">
              <p className="text-xs font-semibold text-[#1B4332] uppercase tracking-wider mb-2">Lot #</p>
              <p className="font-display text-2xl text-[#1B4332]">{latest?.lot_number || '—'}</p>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
                  <DollarSign className="h-4 w-4 text-[#2D7A4F]" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Tax</span>
              </div>
              <p className="font-display text-2xl text-[#1B4332]">{formatCurrency(stats?.annualAmount || 0)}</p>
              <p className="text-[10px] text-gray-400 mt-1">FY{latest?.tax_year} net after abatements</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-[#2D7A4F]" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Assessed Value</span>
              </div>
              <p className="font-display text-2xl text-[#1B4332]">{formatCurrency(stats?.assessedValue || 0)}</p>
              <p className="text-[10px] text-gray-400 mt-1">Class {latest?.tax_class || '2'}</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 text-[#2D7A4F]" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Abatement Credits</span>
              </div>
              <p className="font-display text-2xl text-green-600">{formatCurrency(stats?.totalAbatements || 0)}</p>
              <p className="text-[10px] text-gray-400 mt-1">FY{latest?.tax_year} total</p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-5">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
                  <Percent className="h-4 w-4 text-[#2D7A4F]" />
                </div>
                <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Tax Rate</span>
              </div>
              <p className="font-display text-2xl text-[#1B4332]">{fmtRate(latest?.tax_rate)}</p>
              <p className="text-[10px] text-gray-400 mt-1">Class {latest?.tax_class || '2'} rate</p>
            </div>
          </div>

          {/* Chart: Property Tax Trend by Budget Year */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 mb-8">
            <h3 className="font-display text-lg text-[#1B4332] mb-4">Property Tax Trend by Budget Year</h3>
            {stats && stats.chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                  <YAxis
                    tickFormatter={(v: number) => v >= 1000 ? '$' + (v / 1000).toFixed(0) + 'K' : '$' + v}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip formatter={(value: number) => formatCurrency(value)}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }} />
                  <Bar dataKey="Abatement Credits" fill="#95C4A1" stackId="a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Annual Amount" fill="#1B4332" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-gray-400 text-sm">No chart data</div>
            )}
          </div>

          {/* Table: Property Tax Amounts based on the City's Fiscal Year */}
          <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <h3 className="font-display text-lg text-[#1B4332] px-5 pt-5 pb-3">
              Property Tax Amounts based on the City's Fiscal Year
            </h3>
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1B4332] text-white">
                  <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Year Start (from city)</th>
                  <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Year End (from city)</th>
                  <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider">Tax Rate</th>
                  <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider">Property Taxes (Tax before Abatements and STAR)</th>
                  <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider">Total Abatement Credits</th>
                  <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider">Annual Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assessments.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-12 text-center text-gray-400">
                      No property tax data loaded. Sync from NYC DOF in the Grid dashboard.
                    </td>
                  </tr>
                )}
                {assessments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-700">{fmtDate(a.fy_start_date)}</td>
                    <td className="px-4 py-3 text-gray-700">{fmtDate(a.fy_end_date)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{fmtRate(a.tax_rate)}</td>
                    <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(a.gross_tax)}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-600">{formatCurrency(a.abatement_credits)}</td>
                    <td className="px-4 py-3 text-right font-mono font-semibold text-gray-900">{formatCurrency(a.annual_amount)}</td>
                  </tr>
                ))}
              </tbody>
              {assessments.length > 0 && (
                <tfoot>
                  <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                    <td className="px-4 py-3" colSpan={3}>Latest (FY{latest?.tax_year})</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(latest?.gross_tax || 0)}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-600">{formatCurrency(latest?.abatement_credits || 0)}</td>
                    <td className="px-4 py-3 text-right font-mono">{formatCurrency(latest?.annual_amount || 0)}</td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </>
      )}
    </div>
  )
}
