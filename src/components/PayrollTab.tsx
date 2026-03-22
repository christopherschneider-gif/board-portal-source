import { useMemo } from 'react'
import { Users, DollarSign, Heart, Receipt } from 'lucide-react'
import { formatCurrency } from '../lib/format'
import type { Building, PayrollRecord } from '../lib/types'

interface Props {
  building: Building | null
  records: PayrollRecord[]
}

export function PayrollTab({ building, records }: Props) {
  const stats = useMemo(() => {
    const totalSalary = records.reduce((s, r) => s + (r.annual_salary || 0), 0)
    const totalBenefits = records.reduce((s, r) => s + (r.benefits || 0), 0)
    const totalTaxes = records.reduce((s, r) => s + (r.employer_taxes || 0), 0)
    const totalCost = records.reduce((s, r) => s + (r.total_cost || 0), 0)
    const unionEmployees = records.filter((r) => r.union_code && r.union_code !== '').length

    return { totalSalary, totalBenefits, totalTaxes, totalCost, unionEmployees, headcount: records.length }
  }, [records])

  if (!building) {
    return <div className="text-center py-16 text-gray-400">Select a building.</div>
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-[#1B4332] text-center mb-2">Payroll Summary</h2>
      <p className="text-center text-sm text-gray-500 mb-8">
        {building.building_id} – {building.building_name} · FY {building.budget_year || '2026'}
      </p>

      <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] px-4 py-3 mb-5 flex items-start gap-2.5">
        <span className="text-xs text-[#1B4332] leading-relaxed">This tab shows the building's staff roster with wages, benefits, employer taxes, and total cost per employee. Union contract details (32BJ SEIU) are noted where applicable. This data is provided by the Account Manager.</span>
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
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Payroll</span>
          </div>
          <p className="font-display text-2xl text-[#1B4332]">{formatCurrency(stats.totalCost)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
              <Users className="h-4 w-4 text-[#2D7A4F]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Staff Count</span>
          </div>
          <p className="font-display text-2xl text-[#1B4332]">{stats.headcount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
              <Heart className="h-4 w-4 text-[#2D7A4F]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Benefits</span>
          </div>
          <p className="font-display text-2xl text-[#1B4332]">{formatCurrency(stats.totalBenefits)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
              <Receipt className="h-4 w-4 text-[#2D7A4F]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Employer Taxes</span>
          </div>
          <p className="font-display text-2xl text-[#1B4332]">{formatCurrency(stats.totalTaxes)}</p>
        </div>
      </div>

      {/* Staff Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1B4332] text-white">
              <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Position</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Employee</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider">Union</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider">Annual Salary</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider">Benefits</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider">Employer Taxes</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider">Total Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                  No payroll records for this building. Data will appear once populated via Make.com sync.
                </td>
              </tr>
            )}
            {records.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{r.position_title}</td>
                <td className="px-4 py-3 text-gray-600">{r.employee_name || '—'}</td>
                <td className="px-4 py-3">
                  {r.union_code ? (
                    <span className="inline-flex items-center rounded-full bg-[#E8F5EE] px-2 py-0.5 text-xs font-medium text-[#1B4332]">
                      {r.union_code}
                    </span>
                  ) : (
                    <span className="text-gray-400">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(r.annual_salary)}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(r.benefits)}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(r.employer_taxes)}</td>
                <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">{formatCurrency(r.total_cost)}</td>
              </tr>
            ))}
          </tbody>
          {records.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                <td className="px-4 py-3" colSpan={3}>Total</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(stats.totalSalary)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(stats.totalBenefits)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(stats.totalTaxes)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(stats.totalCost)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* 32BJ Contract Note */}
      {stats.unionEmployees > 0 && (
        <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] px-5 py-4">
          <p className="text-sm font-medium text-[#1B4332] mb-1">32BJ SEIU Contract Note</p>
          <p className="text-xs text-gray-600 leading-relaxed">
            This building has {stats.unionEmployees} union employee(s) covered under 32BJ SEIU.
            The current contract expires April 20, 2026. Negotiations are beginning — budget reflects
            current rates. Any wage increases from the new contract will require a budget amendment.
          </p>
        </div>
      )}
    </div>
  )
}
