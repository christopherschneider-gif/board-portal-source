import { useState, useCallback, useMemo, useEffect } from 'react'
import { ChevronRight, ChevronDown, Info, Wallet } from 'lucide-react'
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

function getComment(name: string, forecast: number, prior: number): string {
  var variance = forecast - prior
  if (Math.abs(variance) < 500) return 'In line with prior year budget.'
  var comments: Record<string, string> = {
    'Income': variance >= 0 ? 'Reflects current assessment levels and occupancy.' : 'Lower occupancy or collection challenges.',
    'Misc. Operating Income': variance >= 0 ? 'Miscellaneous fees trending higher.' : 'Fewer fee events than planned.',
    'Administrative Expenses': variance > 0 ? 'Management fee and professional services escalation.' : 'Lower legal or advisory costs.',
    'Insurance': variance > 0 ? 'NYC hard market — Scaffold Law driving premiums.' : 'Favorable renewal or timing.',
    'Compliance & Monitoring': variance > 0 ? 'Additional inspection or permit costs.' : 'Fewer inspections this cycle.',
    'Building Operating Expenses': variance > 0 ? 'Service contract escalations.' : 'Contract renegotiation savings.',
    'Payroll Expenses': variance > 0 ? '32BJ SEIU wage increases and benefit growth.' : 'Staffing vacancy or reduced overtime.',
    'Utilities': variance > 0 ? 'Rate increases from Con Edison and NYC DEP.' : 'Favorable weather or efficiency gains.',
    'Taxes': variance > 0 ? 'NYC DOF assessment increase.' : 'Abatement benefit.',
    'Non-Recurring- Repairs': variance > 0 ? 'Unplanned repairs — aging systems.' : 'Fewer emergency repairs.',
    'Non-Recurring Repairs': variance > 0 ? 'Unplanned repairs — aging systems.' : 'Fewer emergency repairs.',
    'Capital Expenditures': 'Capital projects — see CapEx detail.',
  }
  return comments[name] || (Math.abs(((forecast - prior) / (Math.abs(prior) || 1)) * 100).toFixed(1) + '% change from prior year.')
}

export function CurrentYearReview({ building, lineItems }: Props) {
  var [fundView, setFundView] = useState<FundView>('operating')
  var allFSLINames = useMemo(function() {
    var names = new Set<string>()
    lineItems.forEach(function(i) { if (!i.is_subtotal) names.add(getFSLI(i)) })
    return names
  }, [lineItems])
  var [collapsedFSLI, setCollapsedFSLI] = useState<Set<string>>(new Set())
  useEffect(function() { setCollapsedFSLI(new Set(allFSLINames)) }, [allFSLINames])
  var toggleFSLI = useCallback(function(fsli: string) {
    setCollapsedFSLI(function(prev) { var next = new Set(prev); if (next.has(fsli)) next.delete(fsli); else next.add(fsli); return next })
  }, [])

  var grouped = useMemo(function() {
    var fundItems = lineItems.filter(function(i) { return !i.is_subtotal && getFund(i) === fundView })
    var categories: { name: string; order: number; isIncome: boolean; items: BudgetLineItem[]; totals: { forecast: number; prior: number } }[] = []
    var catMap = new Map<string, typeof categories[0]>()
    fundItems.forEach(function(item) {
      var fsli = getFSLI(item)
      if (!catMap.has(fsli)) { var cat = { name: fsli, order: getFSLIOrder(fsli), isIncome: item.category === 'income', items: [] as BudgetLineItem[], totals: { forecast: 0, prior: 0 } }; catMap.set(fsli, cat); categories.push(cat) }
      var c = catMap.get(fsli)!; c.items.push(item); c.totals.forecast += (item.forecast_current_year || 0); c.totals.prior += (item.actual_prior_year || 0)
    })
    categories.sort(function(a, b) { return a.order - b.order })
    return categories
  }, [lineItems, fundView])

  var opTotals = useMemo(function() {
    if (fundView !== 'operating') return null
    var inc = grouped.filter(function(c) { return c.isIncome }); var exp = grouped.filter(function(c) { return !c.isIncome })
    var iF = inc.reduce(function(s, c) { return s + c.totals.forecast }, 0); var iP = inc.reduce(function(s, c) { return s + c.totals.prior }, 0)
    var eF = exp.reduce(function(s, c) { return s + c.totals.forecast }, 0); var eP = exp.reduce(function(s, c) { return s + c.totals.prior }, 0)
    return { iF: iF, iP: iP, eF: eF, eP: eP, nF: iF - eF, nP: iP - eP }
  }, [grouped, fundView])

  if (!building) return <div className="text-center py-16 text-gray-400">Select a building.</div>
  var fy = building.budget_year || 2026; var pyShort = String(fy - 1).slice(-2); var beginningCash = building.projected_ending_cash || 0
  var thBase = 'px-2 py-2.5 text-right font-medium text-[10px] uppercase tracking-wider'; var tdNum = 'px-2 py-2 text-right font-mono text-xs'

  return (
    <div className="space-y-2">
      <div className="text-center">
        <h2 className="font-display text-xl text-[#1B4332] mb-0.5">Current Year Review</h2>
        <p className="text-[10px] text-gray-500">{building.building_id} – {building.building_name} · FY {fy - 1}</p>
      </div>
      <div className="rounded bg-[#E8F5EE] border border-[#B7E4C7] px-3 py-1.5 flex items-center gap-2">
        <Info className="h-3 w-3 text-[#2D6A4F] flex-shrink-0" />
        <p className="text-[9px] text-[#1B4332]">Compares FY'{pyShort} forecast against the prior year approved budget. Click any category to drill into GL accounts.</p>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {([['operating', 'Operating Fund'], ['reserve', 'Reserve Fund'], ['capital', 'Capital Fund']] as [FundView, string][]).map(function(p) {
            return (<button key={p[0]} onClick={function() { setFundView(p[0]) }} className={'rounded-md px-3 py-1 text-[10px] font-medium transition-colors ' + (fundView === p[0] ? 'bg-[#1B4332] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>{p[1]}</button>)
          })}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={function() { setCollapsedFSLI(new Set(allFSLINames)) }} className="rounded border border-gray-200 bg-white px-2 py-1 text-[9px] font-medium text-gray-600 hover:bg-gray-50">Collapse All</button>
          <button onClick={function() { setCollapsedFSLI(new Set()) }} className="rounded border border-gray-200 bg-white px-2 py-1 text-[9px] font-medium text-gray-600 hover:bg-gray-50">Expand All</button>
        </div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
            <colgroup><col style={{ width: '200px' }} /><col style={{ width: '100px' }} /><col style={{ width: '100px' }} /><col style={{ width: '90px' }} /><col style={{ width: '60px' }} /><col style={{ width: '200px' }} /></colgroup>
            <thead>
              <tr className="bg-[#1B4332] text-white">
                <th className="px-3 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider">Financial Category</th>
                <th className={thBase}>FY'{pyShort} Forecast</th>
                <th className={thBase}>Prior Year Budget</th>
                <th className={thBase}>{fy - 1} Variance</th>
                <th className={thBase}>% Chg</th>
                <th className="px-3 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider">Comment</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-[#1B4332] text-white">
                <td className="px-3 py-2.5 text-xs font-bold flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Beginning Cash</td>
                <td className={tdNum + ' text-white font-bold'}>{formatCurrency(beginningCash)}</td>
                <td className={tdNum + ' text-white font-bold'}>{formatCurrency(beginningCash)}</td>
                <td className={tdNum + ' text-white/50'}>—</td>
                <td className={tdNum + ' text-white/50'}>—</td>
                <td className="px-2 py-2 text-[9px] text-white/60 italic">Cash on hand at start of fiscal year.</td>
              </tr>
              {grouped.length === 0 && (<tr><td colSpan={6} className="px-3 py-10 text-center text-gray-400 text-xs">No data for this fund.</td></tr>)}
              {grouped.map(function(cat) {
                var isCollapsed = collapsedFSLI.has(cat.name); var catVar = cat.totals.forecast - cat.totals.prior; var catPct = calcPctChange(cat.totals.forecast, cat.totals.prior); var isExp = !cat.isIncome
                return [
                  <tr key={'h-' + cat.name} className="bg-[#F3F4F1] hover:bg-[#EAEBE7] cursor-pointer border-b border-gray-200" onClick={function() { toggleFSLI(cat.name) }}>
                    <td className="px-3 py-2"><div className="flex items-center gap-1">{isCollapsed ? <ChevronRight className="h-3 w-3 text-gray-500 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 text-gray-500 flex-shrink-0" />}<span className="font-semibold text-[#1B4332] text-xs truncate">{cat.name}</span></div></td>
                    <td className={tdNum + ' font-semibold text-[#1B4332]'}>{formatCurrency(cat.totals.forecast)}</td>
                    <td className={tdNum + ' text-gray-600'}>{formatCurrency(cat.totals.prior)}</td>
                    <td className={tdNum + ' ' + varianceColor(catVar, isExp)}>{formatCurrency(catVar)}</td>
                    <td className={tdNum + ' ' + varianceColor(catPct, isExp)}>{formatPercent(catPct)}</td>
                    <td className="px-2 py-2 text-[9px] text-gray-400">{getComment(cat.name, cat.totals.forecast, cat.totals.prior)}</td>
                  </tr>,
                  ...(!isCollapsed ? cat.items.map(function(item) {
                    var fcast = item.forecast_current_year || 0; var prior = item.actual_prior_year || 0; var v = fcast - prior; var pct = calcPctChange(fcast, prior)
                    return (<tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="px-3 py-1.5 pl-8"><span className="font-mono text-[10px] text-gray-400 mr-1.5">{item.gl_code}</span><span className="text-gray-700 text-xs">{item.gl_name}</span></td>
                      <td className={tdNum + ' text-gray-900'}>{formatCurrency(fcast)}</td>
                      <td className={tdNum + ' text-gray-500'}>{formatCurrency(prior)}</td>
                      <td className={tdNum + ' ' + varianceColor(v, isExp)}>{formatCurrency(v)}</td>
                      <td className={tdNum + ' ' + varianceColor(pct, isExp)}>{formatPercent(pct)}</td>
                      <td className="px-2 py-1.5 text-[9px] text-gray-400">{item.ai_recommendation || ''}</td>
                    </tr>)
                  }) : [])
                ]
              })}
              {fundView === 'operating' && opTotals && [
                <tr key="tot-inc" className="bg-[#1B4332]/5 border-t-2 border-[#1B4332]"><td className="px-3 py-2 font-bold text-xs text-[#1B4332]">Total Income</td><td className={tdNum + ' font-bold text-[#1B4332]'}>{formatCurrency(opTotals.iF)}</td><td className={tdNum + ' font-bold text-gray-600'}>{formatCurrency(opTotals.iP)}</td><td className={tdNum + ' font-bold text-green-600'}>{formatCurrency(opTotals.iF - opTotals.iP)}</td><td className={tdNum + ' font-bold'}>{formatPercent(calcPctChange(opTotals.iF, opTotals.iP))}</td><td className="px-2 py-2"></td></tr>,
                <tr key="tot-exp" className="bg-[#1B4332]/5"><td className="px-3 py-2 font-bold text-xs text-[#1B4332]">Total Expenses</td><td className={tdNum + ' font-bold text-[#1B4332]'}>{formatCurrency(opTotals.eF)}</td><td className={tdNum + ' font-bold text-gray-600'}>{formatCurrency(opTotals.eP)}</td><td className={tdNum + ' font-bold ' + varianceColor(opTotals.eF - opTotals.eP, true)}>{formatCurrency(opTotals.eF - opTotals.eP)}</td><td className={tdNum + ' font-bold'}>{formatPercent(calcPctChange(opTotals.eF, opTotals.eP))}</td><td className="px-2 py-2"></td></tr>,
                <tr key="net" className="bg-[#E8F5EE] border-t-2 border-[#2D7A4F]"><td className="px-3 py-2.5 font-bold text-sm text-[#1B4332]">Net Surplus (Deficit)</td><td className={tdNum + ' font-bold text-sm ' + (opTotals.nF >= 0 ? 'text-[#2D6A4F]' : 'text-red-600')}>{formatCurrency(opTotals.nF)}</td><td className={tdNum + ' font-bold text-sm ' + (opTotals.nP >= 0 ? 'text-gray-600' : 'text-red-600')}>{formatCurrency(opTotals.nP)}</td><td className={tdNum + ' font-bold ' + (opTotals.nF >= opTotals.nP ? 'text-green-600' : 'text-red-600')}>{formatCurrency(opTotals.nF - opTotals.nP)}</td><td className={tdNum + ' font-bold'}>{formatPercent(calcPctChange(opTotals.nF, opTotals.nP))}</td><td className="px-2 py-2 text-[9px] text-gray-500">{opTotals.nF >= 0 ? 'Operating within budget.' : 'Operating deficit.'}</td></tr>,
                <tr key="ending" className="bg-[#1B4332] text-white"><td className="px-3 py-2.5 text-xs font-bold flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Projected Ending Cash</td><td className={tdNum + ' text-white font-bold text-sm'}>{formatCurrency(beginningCash + opTotals.nF)}</td><td className={tdNum + ' text-white font-bold text-sm'}>{formatCurrency(beginningCash + opTotals.nP)}</td><td className={tdNum + ' text-white/50'}>—</td><td className={tdNum + ' text-white/50'}>—</td><td className="px-2 py-2 text-[9px] text-white/60 italic">Beginning cash + net surplus.</td></tr>
              ]}
              {fundView === 'reserve' && (function() {
                var rF = grouped.reduce(function(s, c) { return s + c.totals.forecast }, 0); var rBal = building?.reserve_balance || 0
                return [
                  <tr key="res-t" className="bg-[#E8F5EE] border-t-2 border-[#2D6A4F]"><td className="px-3 py-2 font-bold text-xs text-[#1B4332]">Total Reserve Contributions</td><td className={tdNum + ' font-bold text-[#1B4332]'}>{formatCurrency(rF)}</td><td className={tdNum + ' font-bold text-gray-600'}>{formatCurrency(0)}</td><td className={tdNum + ' font-bold text-green-600'}>{formatCurrency(rF)}</td><td className={tdNum + ' font-bold'}>—</td><td className="px-2 py-2"></td></tr>,
                  <tr key="res-e" className="bg-[#1B4332] text-white"><td className="px-3 py-2.5 text-xs font-bold flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Projected Ending Reserve</td><td className={tdNum + ' text-white font-bold'}>{formatCurrency(rBal + rF)}</td><td className={tdNum + ' text-white font-bold'}>{formatCurrency(rBal)}</td><td className={tdNum + ' text-white/50'}>—</td><td className={tdNum + ' text-white/50'}>—</td><td className="px-2 py-2 text-[9px] text-white/60 italic">Beginning balance + contributions.</td></tr>
                ]
              })()}
              {fundView === 'capital' && (function() {
                var cI = grouped.filter(function(c) { return c.isIncome }).reduce(function(s, c) { return s + c.totals.forecast }, 0); var cE = grouped.filter(function(c) { return !c.isIncome }).reduce(function(s, c) { return s + c.totals.forecast }, 0); var cN = cI - cE
                return [
                  <tr key="cap-n" className="bg-[#E8F5EE] border-t-2 border-[#2D6A4F]"><td className="px-3 py-2 font-bold text-xs text-[#1B4332]">Net Capital Position</td><td className={tdNum + ' font-bold ' + (cN >= 0 ? 'text-[#2D6A4F]' : 'text-red-600')}>{formatCurrency(cN)}</td><td className={tdNum + ' font-bold text-gray-600'}>—</td><td className={tdNum + ' font-bold'}>—</td><td className={tdNum + ' font-bold'}>—</td><td className="px-2 py-2"></td></tr>,
                  <tr key="cap-e" className="bg-[#1B4332] text-white"><td className="px-3 py-2.5 text-xs font-bold flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Projected Ending Capital</td><td className={tdNum + ' text-white font-bold'}>{formatCurrency(cN)}</td><td className={tdNum + ' text-white font-bold'}>{formatCurrency(0)}</td><td className={tdNum + ' text-white/50'}>—</td><td className={tdNum + ' text-white/50'}>—</td><td className="px-2 py-2 text-[9px] text-white/60 italic">Capital income less expenditures.</td></tr>
                ]
              })()}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
