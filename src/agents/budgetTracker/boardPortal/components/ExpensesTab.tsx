import { useMemo, useState } from 'react'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from 'recharts'
import { TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
  formatCurrency,
  formatPercent,
  calcPctChange,
  varianceColor,
} from '../lib/format'
import type { Building, BudgetLineItem } from '../lib/types'

const COLORS = [
  '#1B4332',
  '#2D6A4F',
  '#40916C',
  '#52B788',
  '#74C69D',
  '#95D5B2',
  '#D4A843',
  '#8B7355',
  '#6B8065',
  '#B7E4C7',
  '#3A7D5C',
  '#4B6858',
]

interface Props {
  building: Building | null
  lineItems: BudgetLineItem[]
}

export function ExpensesTab({ building, lineItems }: Props) {
  const [highlightedCategory, setHighlightedCategory] = useState<string | null>(
    null
  )

  const stats = useMemo(() => {
    const items = lineItems.filter((i) => !i.is_subtotal)

    const totalRecommended = items.reduce(
      (sum, i) => sum + (i.recommended_amount || 0),
      0
    )
    const totalPriorYear = items.reduce(
      (sum, i) => sum + (i.actual_prior_year || 0),
      0
    )

    // Group by parent_category for donut
    const categoryMap = new Map<
      string,
      { recommended: number; priorYear: number; items: BudgetLineItem[] }
    >()
    items.forEach((item) => {
      const cat = item.parent_category || item.subcategory || 'Other'
      const existing = categoryMap.get(cat) || {
        recommended: 0,
        priorYear: 0,
        items: [],
      }
      existing.recommended += item.recommended_amount || 0
      existing.priorYear += item.actual_prior_year || 0
      existing.items.push(item)
      categoryMap.set(cat, existing)
    })

    const categories = Array.from(categoryMap.entries())
      .map(([name, data]) => ({
        name,
        value: data.recommended,
        priorYear: data.priorYear,
        pctOfTotal:
          totalRecommended > 0
            ? ((data.recommended / totalRecommended) * 100).toFixed(1)
            : '0',
        yoyChange: calcPctChange(data.recommended, data.priorYear),
        items: data.items,
      }))
      .sort((a, b) => b.value - a.value)

    // Top 10 individual line items
    const topItems = [...items]
      .sort(
        (a, b) => (b.recommended_amount || 0) - (a.recommended_amount || 0)
      )
      .slice(0, 15)

    return { items, totalRecommended, totalPriorYear, categories, topItems }
  }, [lineItems])

  if (!building) {
    return (
      <div className="text-center py-16 text-gray-400">
        Select a building to view expenses.
      </div>
    )
  }

  const yoyChange = calcPctChange(stats.totalRecommended, stats.totalPriorYear)

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Prior Year Expenses
          </p>
          <p className="font-display text-2xl text-gray-900">
            {formatCurrency(stats.totalPriorYear)}
          </p>
        </div>
        <div className="rounded-xl bg-red-50 p-5 shadow-sm border border-red-100">
          <p className="text-xs font-medium text-red-500 uppercase tracking-wider mb-2">
            Recommended Budget
          </p>
          <p className="font-display text-2xl text-gray-900">
            {formatCurrency(stats.totalRecommended)}
          </p>
          <div className="mt-1 flex items-center gap-1">
            {yoyChange >= 0 ? (
              <ArrowUpRight className="h-3 w-3 text-red-500" />
            ) : (
              <ArrowDownRight className="h-3 w-3 text-green-500" />
            )}
            <span
              className={`text-xs font-medium ${
                yoyChange > 0 ? 'text-red-600' : 'text-green-600'
              }`}
            >
              {formatPercent(yoyChange)} vs prior year
            </span>
          </div>
        </div>
        <div className="rounded-xl bg-white p-5 shadow-sm border border-gray-100">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            Expense Categories
          </p>
          <p className="font-display text-2xl text-gray-900">
            {stats.categories.length}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {stats.items.length} individual GL accounts
          </p>
        </div>
      </div>

      {/* Donut + Category Table */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Donut Chart */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="font-display text-lg text-gray-900 mb-4">
            By Category
          </h3>
          {stats.categories.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie
                  data={stats.categories}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={120}
                  paddingAngle={2}
                  dataKey="value"
                  onMouseEnter={(_, index) =>
                    setHighlightedCategory(stats.categories[index].name)
                  }
                  onMouseLeave={() => setHighlightedCategory(null)}
                >
                  {stats.categories.map((entry, index) => (
                    <Cell
                      key={entry.name}
                      fill={COLORS[index % COLORS.length]}
                      opacity={
                        highlightedCategory
                          ? highlightedCategory === entry.name
                            ? 1
                            : 0.3
                          : 1
                      }
                      stroke="white"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #e5e7eb',
                    fontSize: '13px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[320px] text-gray-400 text-sm">
              No expense data
            </div>
          )}
        </div>

        {/* Category Ranked Table */}
        <div className="rounded-xl bg-white p-6 shadow-sm border border-gray-100">
          <h3 className="font-display text-lg text-gray-900 mb-4">
            Category Ranking
          </h3>
          <div className="space-y-2">
            {stats.categories.map((cat, index) => (
              <div
                key={cat.name}
                onMouseEnter={() => setHighlightedCategory(cat.name)}
                onMouseLeave={() => setHighlightedCategory(null)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${
                  highlightedCategory === cat.name
                    ? 'bg-brand-50'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div
                  className="h-3 w-3 rounded-sm flex-shrink-0"
                  style={{
                    backgroundColor: COLORS[index % COLORS.length],
                  }}
                />
                <span className="text-sm text-gray-700 flex-1 truncate">
                  {cat.name}
                </span>
                <span className="text-xs text-gray-500 w-[50px] text-right">
                  {cat.pctOfTotal}%
                </span>
                <span className="text-sm font-mono font-medium text-gray-900 w-[100px] text-right">
                  {formatCurrency(cat.value)}
                </span>
                <span
                  className={`text-xs font-mono w-[60px] text-right ${varianceColor(
                    cat.yoyChange,
                    true
                  )}`}
                >
                  {formatPercent(cat.yoyChange)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Expense Items Table */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-display text-lg text-gray-900">
            Top 15 Expense Accounts
          </h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider text-gray-500 w-[50px]">
                #
              </th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider text-gray-500">
                GL Code
              </th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider text-gray-500">
                Account
              </th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider text-gray-500">
                Category
              </th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider text-gray-500">
                Recommended
              </th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider text-gray-500">
                % of Total
              </th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider text-gray-500">
                YoY
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.topItems.map((item, i) => {
              const pct = calcPctChange(
                item.recommended_amount || 0,
                item.actual_prior_year || 0
              )
              const share =
                stats.totalRecommended > 0
                  ? (
                      ((item.recommended_amount || 0) / stats.totalRecommended) *
                      100
                    ).toFixed(1)
                  : '0'
              return (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 text-xs text-gray-400 font-mono">
                    {i + 1}
                  </td>
                  <td className="px-4 py-2.5 font-mono text-xs text-gray-500">
                    {item.gl_code}
                  </td>
                  <td className="px-4 py-2.5 text-gray-700">{item.gl_name}</td>
                  <td className="px-4 py-2.5 text-xs text-gray-500">
                    {item.parent_category || item.subcategory}
                  </td>
                  <td className="px-4 py-2.5 text-right font-mono font-medium text-gray-900">
                    {formatCurrency(item.recommended_amount)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-gray-500">
                    {share}%
                  </td>
                  <td
                    className={`px-4 py-2.5 text-right font-mono text-xs ${varianceColor(
                      pct,
                      true
                    )}`}
                  >
                    {formatPercent(pct)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
