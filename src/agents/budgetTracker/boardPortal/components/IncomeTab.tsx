import { useMemo } from 'react'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts'
import { Info } from 'lucide-react'
import { formatCurrency } from '../lib/format'
import type { Building, BudgetLineItem } from '../lib/types'

var COLORS = ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D', '#95D5B2', '#D4A843']

interface Props {
  building: Building | null
  lineItems: BudgetLineItem[]
}

export function IncomeTab({ building, lineItems }: Props) {
  var stats = useMemo(function() {
    var items = lineItems.filter(function(i) { return !i.is_subtotal })
    var totalBudgeted = items.reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
    var totalForecast = items.reduce(function(s, i) { return s + (i.forecast_current_year || 0) }, 0)
    var totalPrior = items.reduce(function(s, i) { return s + (i.actual_prior_year || 0) }, 0)

    var pieData = items
      .filter(function(i) { return (i.recommended_amount || 0) > 0 })
      .map(function(i) { return { name: i.gl_code + ' – ' + (i.gl_name || ''), value: i.recommended_amount || 0 } })
      .sort(function(a, b) { return b.value - a.value })

    return { items: items, totalBudgeted: totalBudgeted, totalForecast: totalForecast, totalPrior: totalPrior, pieData: pieData }
  }, [lineItems])

  if (!building) return <div className="text-center py-16 text-gray-400">Select a building.</div>

  var fy = building.budget_year || 2026
  var monthlyIncome = stats.totalBudgeted / 12

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="text-center">
        <h2 className="font-display text-2xl text-[#1B4332] mb-1">Income Summary</h2>
        <p className="text-xs text-gray-500">{building.building_id} – {building.building_name} · FY {fy}</p>
      </div>

      {/* Tab Purpose Note */}
      <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] px-4 py-3 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-[#2D6A4F] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#1B4332] leading-relaxed">
          This tab provides a visual breakdown of the building's income sources. The pie chart shows where revenue is generated. Score cards display budgeted income on both an annual and monthly basis. Historical cards on the right show prior year comparisons.
        </p>
      </div>

      {/* Main Layout: KPIs | Pie Chart | Historical */}
      <div className="flex gap-6 items-start">
        {/* Left: KPI Cards */}
        <div className="w-56 flex-shrink-0 space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-5 text-center">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">Budgeted Income</p>
            <p className="font-display text-3xl text-[#1B4332]">{formatCurrency(stats.totalBudgeted)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 text-center">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">Monthly Income</p>
            <p className="font-display text-3xl text-[#1B4332]">{formatCurrency(monthlyIncome)}</p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 text-center">
            <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider mb-2">Number of Units</p>
            <p className="font-display text-3xl text-[#1B4332]">{building.units || '—'}</p>
          </div>
        </div>

        {/* Center: Pie Chart */}
        <div className="flex-1">
          {stats.pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <PieChart>
                <Pie
                  data={stats.pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={150}
                  dataKey="value"
                  label={function(entry) {
                    var short = entry.name.length > 28 ? entry.name.substring(0, 28) + '…' : entry.name
                    return short + ' ' + formatCurrency(entry.value) + ' (' + (entry.percent * 100).toFixed(2) + '%)'
                  }}
                  labelLine={true}
                >
                  {stats.pieData.map(function(_, i) {
                    return <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  })}
                </Pie>
                <Tooltip
                  formatter={function(value: number) { return formatCurrency(value) }}
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '13px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-gray-400 text-sm">No income data available</div>
          )}
        </div>

        {/* Right: Historical Cards */}
        <div className="w-48 flex-shrink-0 space-y-3">
          <p className="text-right font-display text-base text-[#1B4332]">Historical</p>

          {/* FY-1: Forecast */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <p className="text-[10px] font-medium text-gray-500 mb-1">{fy - 1} (Forecast)</p>
            <p className="font-display text-xl text-[#1B4332]">{formatCurrency(stats.totalForecast)}</p>
          </div>

          {/* FY-2: Prior Year Actuals */}
          <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
            <p className="text-[10px] font-medium text-gray-500 mb-1">{fy - 2} (Actuals)</p>
            <p className="font-display text-xl text-[#1B4332]">{formatCurrency(stats.totalPrior)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
