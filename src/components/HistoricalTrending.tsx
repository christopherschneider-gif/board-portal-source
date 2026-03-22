import { useState, useCallback, useMemo, useEffect } from 'react'
import { ChevronRight, ChevronDown, Wallet, DollarSign, TrendingUp, TrendingDown, Info } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { formatCurrency, formatPercent, calcPctChange, varianceColor } from '../lib/format'
import { getFSLIOrder } from '../lib/fsli'
import type { Building, BudgetLineItem } from '../lib/types'

interface Props {
  building: Building | null
  lineItems: BudgetLineItem[]
}

type FundView = 'operating' | 'reserve' | 'capital'

function getFund(item: BudgetLineItem): FundView {
  var gl = item.gl_code || ''
  if (gl.startsWith('855') || gl.startsWith('843') || gl === '85215' || gl === '85530') return 'reserve'
  if (gl.startsWith('410') || gl.startsWith('491') || gl.startsWith('560') || gl === '51235' || gl === '61500') return 'capital'
  return 'operating'
}

function getFSLI(item: BudgetLineItem): string {
  return item.parent_category || item.subcategory || 'Other'
}

export function HistoricalTrending({ building, lineItems }: Props) {
  var [fundView, setFundView] = useState<FundView>('operating')

  var allFSLINames = useMemo(function() {
    var names = new Set<string>()
    lineItems.forEach(function(i) { if (!i.is_subtotal) names.add(getFSLI(i)) })
    return names
  }, [lineItems])

  var [collapsedFSLI, setCollapsedFSLI] = useState<Set<string>>(new Set())
  useEffect(function() { setCollapsedFSLI(new Set(allFSLINames)) }, [allFSLINames])

  var toggleFSLI = useCallback(function(fsli: string) {
    setCollapsedFSLI(function(prev) {
      var next = new Set(prev)
      if (next.has(fsli)) next.delete(fsli); else next.add(fsli)
      return next
    })
  }, [])

  var grouped = useMemo(function() {
    var fundItems = lineItems.filter(function(i) { return !i.is_subtotal && getFund(i) === fundView })

    var categories: { name: string; order: number; isIncome: boolean; items: BudgetLineItem[]; totals: { rec: number; forecast: number; prior: number } }[] = []
    var catMap = new Map<string, typeof categories[0]>()

    fundItems.forEach(function(item) {
      var fsli = getFSLI(item)
      if (!catMap.has(fsli)) {
        var cat = { name: fsli, order: getFSLIOrder(fsli), isIncome: item.category === 'income', items: [] as BudgetLineItem[], totals: { rec: 0, forecast: 0, prior: 0 } }
        catMap.set(fsli, cat)
        categories.push(cat)
      }
      var c = catMap.get(fsli)!
      c.items.push(item)
      c.totals.rec += (item.recommended_amount || 0)
      c.totals.forecast += (item.forecast_current_year || 0)
      c.totals.prior += (item.actual_prior_year || 0)
    })

    categories.sort(function(a, b) { return a.order - b.order })
    return categories
  }, [lineItems, fundView])

  var opTotals = useMemo(function() {
    if (fundView !== 'operating') return null
    var inc = grouped.filter(function(c) { return c.isIncome })
    var exp = grouped.filter(function(c) { return !c.isIncome })
    var iR = inc.reduce(function(s, c) { return s + c.totals.rec }, 0)
    var iF = inc.reduce(function(s, c) { return s + c.totals.forecast }, 0)
    var iP = inc.reduce(function(s, c) { return s + c.totals.prior }, 0)
    var eR = exp.reduce(function(s, c) { return s + c.totals.rec }, 0)
    var eF = exp.reduce(function(s, c) { return s + c.totals.forecast }, 0)
    var eP = exp.reduce(function(s, c) { return s + c.totals.prior }, 0)
    return { iR: iR, iF: iF, iP: iP, eR: eR, eF: eF, eP: eP, nR: iR - eR, nF: iF - eF, nP: iP - eP }
  }, [grouped, fundView])

  if (!building) return <div className="text-center py-16 text-gray-400">Select a building.</div>
  var fy = building.budget_year || 2026
  var beginningCash = building.projected_ending_cash || 0

  var thBase = 'px-2 py-2.5 text-right font-medium text-[10px] uppercase tracking-wider'
  var tdNum = 'px-2 py-2 text-right font-mono text-xs'

  // Chart data for summary
  var chartData = useMemo(function() {
    if (fundView !== 'operating' || !opTotals) return []
    return [
      { name: 'Income', Budget: opTotals.iR, Forecast: opTotals.iF, Prior: opTotals.iP },
      { name: 'Expenses', Budget: opTotals.eR, Forecast: opTotals.eF, Prior: opTotals.eP },
      { name: 'Net Surplus', Budget: opTotals.nR, Forecast: opTotals.nF, Prior: opTotals.nP },
    ]
  }, [opTotals, fundView])

  return (
    <div className="space-y-2">
      <div className="text-center">
        <h2 className="font-display text-xl text-[#1B4332] mb-0.5">Historical Trending</h2>
        <p className="text-[10px] text-gray-500">{building.building_id} – {building.building_name} · 3-year comparison</p>
      </div>

      <div className="rounded bg-[#E8F5EE] border border-[#B7E4C7] px-3 py-1.5 flex items-center gap-2">
        <Info className="h-3 w-3 text-[#2D6A4F] flex-shrink-0" />
        <p className="text-[9px] text-[#1B4332]">3-year comparison. Click any category to expand GL accounts.</p>
      </div>

      {/* Fund Tabs + Toolbar on same row */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {([['operating', 'Operating Fund'], ['reserve', 'Reserve Fund'], ['capital', 'Capital Fund']] as [FundView, string][]).map(function(p) {
            return (
              <button key={p[0]} onClick={function() { setFundView(p[0]) }}
                className={'rounded-md px-3 py-1 text-[10px] font-medium transition-colors ' + (fundView === p[0] ? 'bg-[#1B4332] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
                {p[1]}
              </button>
            )
          })}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={function() { setCollapsedFSLI(new Set(allFSLINames)) }} className="rounded border border-gray-200 bg-white px-2 py-1 text-[9px] font-medium text-gray-600 hover:bg-gray-50">Collapse All</button>
          <button onClick={function() { setCollapsedFSLI(new Set()) }} className="rounded border border-gray-200 bg-white px-2 py-1 text-[9px] font-medium text-gray-600 hover:bg-gray-50">Expand All</button>
        </div>
      </div>

      {/* P&L Table */}
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              <col style={{ width: '240px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '120px' }} />
              <col style={{ width: '120px' }} />
            </colgroup>
            <thead>
              <tr className="bg-[#1B4332] text-white">
                <th className="px-3 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider">Financial Category</th>
                <th className={thBase}>FY'{String(fy).slice(-2)} Budget</th>
                <th className={thBase}>FY'{String(fy - 1).slice(-2)} Forecast</th>
                <th className={thBase}>FY'{String(fy - 2).slice(-2)} Actuals</th>
              </tr>
            </thead>
            <tbody>
              {/* Beginning Cash */}
              <tr className="bg-[#1B4332] text-white">
                <td className="px-3 py-2.5 text-xs font-bold flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Beginning Cash</td>
                <td className={tdNum + ' text-white font-bold'}>{formatCurrency(beginningCash)}</td>
                <td className={tdNum + ' text-white font-bold'}>{formatCurrency(beginningCash)}</td>
                <td className={tdNum + ' text-white font-bold'}>{formatCurrency(beginningCash)}</td>
              </tr>

              {grouped.length === 0 && (
                <tr><td colSpan={4} className="px-3 py-10 text-center text-gray-400 text-xs">No data for this fund.</td></tr>
              )}

              {grouped.map(function(cat) {
                var isCollapsed = collapsedFSLI.has(cat.name)
                var isExp = !cat.isIncome

                return [
                  /* FSLI Header */
                  <tr key={'h-' + cat.name} className="bg-[#F3F4F1] hover:bg-[#EAEBE7] cursor-pointer border-b border-gray-200"
                    onClick={function() { toggleFSLI(cat.name) }}>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1">
                        {isCollapsed ? <ChevronRight className="h-3 w-3 text-gray-500 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 text-gray-500 flex-shrink-0" />}
                        <span className="font-semibold text-[#1B4332] text-xs truncate">{cat.name}</span>
                      </div>
                    </td>
                    <td className={tdNum + ' font-semibold text-[#1B4332]'}>{formatCurrency(cat.totals.rec)}</td>
                    <td className={tdNum + ' text-gray-600'}>{formatCurrency(cat.totals.forecast)}</td>
                    <td className={tdNum + ' text-gray-600'}>{formatCurrency(cat.totals.prior)}</td>
                  </tr>,

                  /* GL Rows */
                  ...(!isCollapsed ? cat.items.map(function(item) {
                    return (
                      <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                        <td className="px-3 py-1.5 pl-8">
                          <span className="font-mono text-[10px] text-gray-400 mr-1.5">{item.gl_code}</span>
                          <span className="text-gray-700 text-xs">{item.gl_name}</span>
                        </td>
                        <td className={tdNum + ' text-gray-900'}>{formatCurrency(item.recommended_amount)}</td>
                        <td className={tdNum + ' text-gray-500'}>{formatCurrency(item.forecast_current_year)}</td>
                        <td className={tdNum + ' text-gray-500'}>{formatCurrency(item.actual_prior_year)}</td>
                      </tr>
                    )
                  }) : [])
                ]
              })}

              {/* Operating Fund Totals + Rolling Cash */}
              {fundView === 'operating' && opTotals && [
                <tr key="tot-inc" className="bg-[#1B4332]/5 border-t-2 border-[#1B4332]">
                  <td className="px-3 py-2 font-bold text-xs text-[#1B4332]">Total Income</td>
                  <td className={tdNum + ' font-bold text-[#1B4332]'}>{formatCurrency(opTotals.iR)}</td>
                  <td className={tdNum + ' font-bold text-gray-600'}>{formatCurrency(opTotals.iF)}</td>
                  <td className={tdNum + ' font-bold text-gray-600'}>{formatCurrency(opTotals.iP)}</td>
                </tr>,
                <tr key="tot-exp" className="bg-[#1B4332]/5">
                  <td className="px-3 py-2 font-bold text-xs text-[#1B4332]">Total Expenses</td>
                  <td className={tdNum + ' font-bold text-[#1B4332]'}>{formatCurrency(opTotals.eR)}</td>
                  <td className={tdNum + ' font-bold text-gray-600'}>{formatCurrency(opTotals.eF)}</td>
                  <td className={tdNum + ' font-bold text-gray-600'}>{formatCurrency(opTotals.eP)}</td>
                </tr>,
                <tr key="net" className="bg-[#E8F5EE] border-t-2 border-[#2D6A4F]">
                  <td className="px-3 py-2.5 font-bold text-sm text-[#1B4332]">Net Surplus (Deficit)</td>
                  <td className={tdNum + ' font-bold text-sm ' + (opTotals.nR >= 0 ? 'text-[#2D6A4F]' : 'text-red-600')}>{formatCurrency(opTotals.nR)}</td>
                  <td className={tdNum + ' font-bold text-sm text-gray-600'}>{formatCurrency(opTotals.nF)}</td>
                  <td className={tdNum + ' font-bold text-sm ' + (opTotals.nP >= 0 ? 'text-gray-600' : 'text-red-600')}>{formatCurrency(opTotals.nP)}</td>
                </tr>,
                <tr key="ending" className="bg-[#1B4332] text-white">
                  <td className="px-3 py-2.5 text-xs font-bold flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Projected Ending Cash</td>
                  <td className={tdNum + ' text-white font-bold text-sm'}>{formatCurrency(beginningCash + opTotals.nR)}</td>
                  <td className={tdNum + ' text-white font-bold text-sm'}>{formatCurrency(beginningCash + opTotals.nF)}</td>
                  <td className={tdNum + ' text-white font-bold text-sm'}>{formatCurrency(beginningCash + opTotals.nP)}</td>
                </tr>
              ]}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Chart */}
      {fundView === 'operating' && chartData.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <h3 className="text-xs font-semibold text-[#1B4332] mb-3">3-Year Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={function(v: number) { return v >= 1000000 ? '$' + (v/1000000).toFixed(1) + 'M' : '$' + (v/1000).toFixed(0) + 'K' }} tick={{ fontSize: 10 }} />
              <Tooltip formatter={function(v: number) { return formatCurrency(v) }} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '11px' }} />
              <Legend wrapperStyle={{ fontSize: '10px' }} />
              <Bar dataKey="Prior" fill="#B7E4C7" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Forecast" fill="#52B788" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Budget" fill="#1B4332" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
