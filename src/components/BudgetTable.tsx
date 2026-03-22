import { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { ChevronRight, ChevronDown, MessageSquare, Search } from 'lucide-react'
import { formatCurrency, formatPercent, calcVariance, calcPctChange, varianceColor } from '../lib/format'
import { getFSLIOrder } from '../lib/fsli'
import type { Building, BudgetLineItem } from '../lib/types'

interface Props {
  building: Building | null
  lineItems: BudgetLineItem[]
  onUpdate: (id: string, field: string, value: number) => Promise<void>
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

function EditableCell({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  var [editing, setEditing] = useState(false)
  var [draft, setDraft] = useState('')
  var inputRef = useRef<HTMLInputElement>(null)
  useEffect(function() { if (editing && inputRef.current) { inputRef.current.focus(); inputRef.current.select() } }, [editing])

  if (editing) {
    return (
      <input ref={inputRef} type="text" value={draft}
        onChange={function(e) { setDraft(e.target.value) }}
        onBlur={function() { var p = parseFloat(draft.replace(/[,$]/g, '')); if (!isNaN(p)) onSave(p); setEditing(false) }}
        onKeyDown={function(e) { if (e.key === 'Enter') { var p = parseFloat(draft.replace(/[,$]/g, '')); if (!isNaN(p)) onSave(p); setEditing(false) } if (e.key === 'Escape') setEditing(false) }}
        className="w-full rounded border border-red-300 bg-white px-1.5 py-0.5 text-right text-xs font-mono text-red-700 focus:border-red-500 focus:outline-none"
      />
    )
  }
  return (
    <span onClick={function() { setDraft(String(value || 0)); setEditing(true) }}
      className="block text-right text-xs font-mono text-red-600 cursor-pointer hover:bg-red-50 rounded px-1.5 py-0.5">
      {formatCurrency(value)}
    </span>
  )
}

export function BudgetTable({ building, lineItems, onUpdate }: Props) {
  var [fundView, setFundView] = useState<FundView>('operating')
  var [searchQuery, setSearchQuery] = useState('')
  var [selectedRow, setSelectedRow] = useState<string | null>(null)
  var [popupId, setPopupId] = useState<string | null>(null)
  var [comments, setComments] = useState<Record<string, string>>({})
  var [ownerIncrease, setOwnerIncrease] = useState(5)
  var [ownerIncreaseMonth, setOwnerIncreaseMonth] = useState(1)
  var [operatingAssessment, setOperatingAssessment] = useState(0)
  var [additionalCost, setAdditionalCost] = useState(1)
  var [reserveContribPct, setReserveContribPct] = useState(10)

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
    if (searchQuery) {
      fundItems = fundItems.filter(function(i) {
        return (i.gl_name || '').toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0 ||
               (i.gl_code || '').toLowerCase().indexOf(searchQuery.toLowerCase()) >= 0
      })
    }

    var categories: { name: string; order: number; isIncome: boolean; items: BudgetLineItem[]; totals: { rec: number; prior: number; forecast: number } }[] = []
    var catMap = new Map<string, typeof categories[0]>()

    fundItems.forEach(function(item) {
      var fsli = getFSLI(item)
      if (!catMap.has(fsli)) {
        var cat = { name: fsli, order: getFSLIOrder(fsli), isIncome: item.category === 'income', items: [] as BudgetLineItem[], totals: { rec: 0, prior: 0, forecast: 0 } }
        catMap.set(fsli, cat)
        categories.push(cat)
      }
      var c = catMap.get(fsli)!
      c.items.push(item)
      c.totals.rec += (item.recommended_amount || 0)
      c.totals.prior += (item.actual_prior_year || 0)
      c.totals.forecast += (item.forecast_current_year || 0)
    })

    categories.sort(function(a, b) { return a.order - b.order })
    return categories
  }, [lineItems, fundView, searchQuery])

  var opTotals = useMemo(function() {
    if (fundView !== 'operating') return null
    var inc = grouped.filter(function(c) { return c.isIncome })
    var exp = grouped.filter(function(c) { return !c.isIncome })
    var iR = inc.reduce(function(s, c) { return s + c.totals.rec }, 0)
    var iP = inc.reduce(function(s, c) { return s + c.totals.prior }, 0)
    var iF = inc.reduce(function(s, c) { return s + c.totals.forecast }, 0)
    var eR = exp.reduce(function(s, c) { return s + c.totals.rec }, 0)
    var eP = exp.reduce(function(s, c) { return s + c.totals.prior }, 0)
    var eF = exp.reduce(function(s, c) { return s + c.totals.forecast }, 0)
    return { iR: iR, iP: iP, iF: iF, eR: eR, eP: eP, eF: eF, nR: iR - eR, nP: iP - eP, nF: iF - eF }
  }, [grouped, fundView])

  var selectedItem = lineItems.find(function(i) { return i.id === selectedRow })
  var incItems = lineItems.filter(function(i) { return i.category === 'income' && !i.is_subtotal })
  var totalIncome = incItems.reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
  var commonCharges = incItems.filter(function(i) { return (i.gl_code || '').startsWith('400') }).reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
  var reserveContrib = lineItems.filter(function(i) { return (i.gl_code || '').startsWith('855') && !i.is_subtotal }).reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
  var reservePctCalc = totalIncome > 0 ? (reserveContrib / totalIncome * 100) : 0

  if (!building) return <div className="text-center py-16 text-gray-400">Select a building.</div>
  var fy = building.budget_year || 2026
  var pyShort = String(fy - 1).slice(-2)
  var beginningCash = building.projected_ending_cash || 0

  var thBase = 'px-2 py-2.5 text-right font-medium text-[10px] uppercase tracking-wider'
  var tdNum = 'px-2 py-2 text-right font-mono text-xs'

  return (
    <div>
      <h2 className="font-display text-2xl text-[#1B4332] text-center mb-0.5">Budget vs. Prior Yr. Actual</h2>
      <p className="text-center text-xs text-gray-500 mb-3">
        {building.building_id} – {building.building_name} · FY {fy} · Edit red cells or adjust assumptions
      </p>

      <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] px-4 py-3 mb-3 flex items-start gap-2.5">
        <span className="text-xs text-[#1B4332] leading-relaxed">This tab is the core budget worksheet. Toggle between Operating, Reserve, and Capital funds. Click any FSLI category to expand individual GL accounts. Edit the red scenario column to model different assumptions. The Daisy Recommendation panel on the right shows data-driven suggestions.</span>
      </div>

      <p className="hidden">
      </p>

      {/* Fund Tabs */}
      <div className="flex gap-1 mb-3 justify-center">
        {([['operating', 'Operating Fund'], ['reserve', 'Reserve Fund'], ['capital', 'Capital Fund']] as [FundView, string][]).map(function(p) {
          return (
            <button key={p[0]} onClick={function() { setFundView(p[0]) }}
              className={'rounded-md px-4 py-1.5 text-xs font-medium transition-colors ' + (fundView === p[0] ? 'bg-[#1B4332] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50')}>
              {p[1]}
            </button>
          )
        })}
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search GL…" value={searchQuery}
              onChange={function(e) { setSearchQuery(e.target.value) }}
              className="w-40 rounded border border-gray-200 bg-white py-1.5 pl-7 pr-2 text-xs focus:border-[#2D7A4F] focus:outline-none" />
          </div>
          <button onClick={function() { setCollapsedFSLI(new Set(allFSLINames)) }} className="rounded border border-gray-200 bg-white px-2 py-1.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50">Collapse All</button>
          <button onClick={function() { setCollapsedFSLI(new Set()) }} className="rounded border border-gray-200 bg-white px-2 py-1.5 text-[10px] font-medium text-gray-600 hover:bg-gray-50">Expand All</button>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">Export:</span>
          <button className="rounded border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50">📊 Excel</button>
          <button className="rounded border border-gray-200 bg-white px-2 py-1 text-[10px] font-medium text-gray-600 hover:bg-gray-50">📄 PDF</button>
          <button className="rounded border border-gray-200 bg-white px-2 py-1 text-[10px] text-gray-500 hover:bg-gray-50">↻ Reset</button>
        </div>
      </div>

      {/* 3-Column Layout */}
      <div className="flex gap-3">
        {/* LEFT: Scenario Controls */}
        <div className="w-[155px] flex-shrink-0 space-y-2">
          <p className="text-[10px] text-[#2D7A4F] font-medium leading-tight">Change the Assumptions below to review different budget scenarios:</p>
          <p className="text-[9px] text-red-600 font-medium">(See column with Red Font)</p>
          {[
            { l: 'Owner Increase %', v: ownerIncrease, s: setOwnerIncrease, u: '%' },
          ].map(function(c) {
            return (
              <div key={c.l} className="rounded border border-gray-200 bg-white p-2">
                <label className="text-[9px] text-gray-500 block mb-1 leading-tight">{c.l}</label>
                <div className="flex items-center gap-1">
                  <input type="number" value={c.v} onChange={function(e) { c.s(Number(e.target.value)) }}
                    className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs font-mono text-center focus:border-[#2D6A4F] focus:outline-none" />
                  {c.u && <span className="text-[9px] text-gray-400 flex-shrink-0">{c.u}</span>}
                </div>
              </div>
            )
          })}

          <div className="rounded border border-gray-200 bg-white p-2">
            <label className="text-[9px] text-gray-500 block mb-1 leading-tight">Owner Increase % Month Start</label>
            <select value={ownerIncreaseMonth} onChange={function(e) { setOwnerIncreaseMonth(Number(e.target.value)) }}
              className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs text-center focus:border-[#2D6A4F] focus:outline-none bg-white cursor-pointer">
              {['January','February','March','April','May','June','July','August','September','October','November','December'].map(function(m, i) {
                return <option key={i + 1} value={i + 1}>{m}</option>
              })}
            </select>
          </div>

          {[
            { l: 'Operating Assessment Estimate', v: operatingAssessment, s: setOperatingAssessment, u: '$' },
            { l: 'Additional Cost Estimate', v: additionalCost, s: setAdditionalCost, u: '$' },
            { l: 'Reserve Contribution %', v: reserveContribPct, s: setReserveContribPct, u: '%' },
          ].map(function(c) {
            return (
              <div key={c.l} className="rounded border border-gray-200 bg-white p-2">
                <label className="text-[9px] text-gray-500 block mb-1 leading-tight">{c.l}</label>
                <div className="flex items-center gap-1">
                  <input type="number" value={c.v} onChange={function(e) { c.s(Number(e.target.value)) }}
                    className="w-full rounded border border-gray-200 px-1.5 py-1 text-xs font-mono text-center focus:border-[#2D6A4F] focus:outline-none" />
                  {c.u && <span className="text-[9px] text-gray-400 flex-shrink-0">{c.u}</span>}
                </div>
              </div>
            )
          })}
        </div>

        {/* CENTER: P&L Table */}
        <div className="flex-1 rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs" style={{ tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '200px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '90px' }} />
                <col style={{ width: '85px' }} />
                <col style={{ width: '75px' }} />
                <col style={{ width: '55px' }} />
                <col style={{ width: '200px' }} />
              </colgroup>
              <thead>
                <tr className="bg-[#1B4332] text-white">
                  <th className="px-3 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider">Financial Category</th>
                  <th className={thBase + ' bg-[#6B1D1D]'}>{fy} Budget-Scenario</th>
                  <th className={thBase}>{fy} Recommended Budget</th>
                  <th className={thBase}>FY'{pyShort} Forecast</th>
                  <th className={thBase}>'{String(fy).slice(-2)} vs '{pyShort} Var.</th>
                  <th className={thBase}>{String(fy).slice(-2)} v {pyShort} % Chg</th>
                  <th className="px-3 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider">Comment</th>
                </tr>
              </thead>
              <tbody>
                {/* Beginning Cash */}
                <tr className="bg-[#F3F4F1] border-b border-gray-200">
                  <td className="px-3 py-2 font-semibold text-[#1B4332] text-xs">Beginning Balance Operating Cash</td>
                  <td className={tdNum + ' font-semibold text-red-600 bg-[#FEF2F2]/50'}>{formatCurrency(beginningCash)}</td>
                  <td className={tdNum + ' font-semibold text-[#1B4332]'}>{formatCurrency(beginningCash)}</td>
                  <td className={tdNum + ' text-gray-600'}>{formatCurrency(beginningCash)}</td>
                  <td className={tdNum + ' text-gray-400'}>—</td>
                  <td className={tdNum + ' text-gray-400'}>—</td>
                  <td className="px-2 py-2 text-[9px] text-gray-400 italic">Cash on hand at start of fiscal year.</td>
                </tr>

                {grouped.length === 0 && (
                  <tr><td colSpan={7} className="px-3 py-10 text-center text-gray-400 text-xs">
                    {searchQuery ? 'No matching items.' : 'No budget data for this fund view.'}
                  </td></tr>
                )}

                {grouped.map(function(cat) {
                  var isCollapsed = collapsedFSLI.has(cat.name)
                  var catVar = cat.totals.rec - cat.totals.forecast
                  var catPct = calcPctChange(cat.totals.rec, cat.totals.forecast)
                  var isExp = !cat.isIncome

                  return [
                    <tr key={'h-' + cat.name} className="bg-[#F3F4F1] hover:bg-[#EAEBE7] cursor-pointer border-b border-gray-200"
                      onClick={function() { toggleFSLI(cat.name) }}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          {isCollapsed ? <ChevronRight className="h-3 w-3 text-gray-500 flex-shrink-0" /> : <ChevronDown className="h-3 w-3 text-gray-500 flex-shrink-0" />}
                          <span className="font-semibold text-[#1B4332] text-xs truncate">{cat.name}</span>
                        </div>
                      </td>
                      <td className={tdNum + ' font-semibold text-[#1B4332] bg-[#FEF2F2]/50'}>{formatCurrency(cat.totals.rec)}</td>
                      <td className={tdNum + ' font-semibold text-[#1B4332]'}>{formatCurrency(cat.totals.rec)}</td>
                      <td className={tdNum + ' text-gray-600'}>{formatCurrency(cat.totals.forecast)}</td>
                      <td className={tdNum + ' ' + varianceColor(catVar, isExp)}>{formatCurrency(catVar)}</td>
                      <td className={tdNum + ' ' + varianceColor(catPct, isExp)}>{formatPercent(catPct)}</td>
                      <td className="px-2 py-2"></td>
                    </tr>,

                    ...(!isCollapsed ? cat.items.map(function(item) {
                      var v = calcVariance(item.recommended_amount || 0, item.forecast_current_year || 0)
                      var pct = calcPctChange(item.recommended_amount || 0, item.forecast_current_year || 0)
                      var isSel = selectedRow === item.id
                      return (
                        <tr key={item.id} onClick={function() { setSelectedRow(item.id) }}
                          className={'border-b border-gray-50 cursor-pointer ' + (isSel ? 'bg-[#E8F5EE]' : 'hover:bg-gray-50')}>
                          <td className="px-3 py-1.5 pl-8 relative">
                            <span className="font-mono text-[10px] text-gray-400 mr-1.5">{item.gl_code}</span>
                            <span className="text-gray-700 text-xs">{item.gl_name}</span>
                            {item.ai_recommendation && (
                              <span className="relative inline-block ml-1">
                                <button
                                  onClick={function(e) { e.stopPropagation(); setPopupId(popupId === item.id ? null : item.id) }}
                                  className="text-[#2D6A4F] text-[10px] hover:text-[#1B4332] cursor-pointer font-bold"
                                  title="View analysis"
                                >ⓘ</button>
                                {popupId === item.id && (
                                  <div className="absolute left-0 top-5 z-50 w-[320px] rounded-lg border border-[#B7E4C7] bg-white shadow-xl p-3 animate-in fade-in">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-1.5">
                                        <MessageSquare className="h-3.5 w-3.5 text-[#2D6A4F]" />
                                        <span className="text-[10px] font-bold text-[#1B4332]">Daisy Analysis</span>
                                      </div>
                                      <button onClick={function(e) { e.stopPropagation(); setPopupId(null) }}
                                        className="text-gray-400 hover:text-gray-600 text-xs font-bold px-1">✕</button>
                                    </div>
                                    <p className="text-[9px] font-mono text-gray-500 mb-1.5">{item.gl_code} – {item.gl_name}</p>
                                    <p className="text-[11px] text-[#1B4332] leading-relaxed">{item.ai_recommendation}</p>
                                    <div className="mt-2 pt-2 border-t border-gray-100 flex justify-between text-[9px] text-gray-400">
                                      <span>Recommended: {formatCurrency(item.recommended_amount)}</span>
                                      <span>Prior Year: {formatCurrency(item.actual_prior_year)}</span>
                                    </div>
                                  </div>
                                )}
                              </span>
                            )}
                          </td>
                          <td className="px-1 py-0.5 bg-[#FEF2F2]/30">
                            <EditableCell value={item.board_adjusted_amount || item.recommended_amount || 0}
                              onSave={function(val) { onUpdate(item.id, 'board_adjusted_amount', val) }} />
                          </td>
                          <td className={tdNum + ' text-gray-900'}>{formatCurrency(item.recommended_amount)}</td>
                          <td className={tdNum + ' text-gray-500'}>{formatCurrency(item.forecast_current_year)}</td>
                          <td className={tdNum + ' ' + varianceColor(v, isExp)}>{formatCurrency(v)}</td>
                          <td className={tdNum + ' ' + varianceColor(pct, isExp)}>{formatPercent(pct)}</td>
                          <td className="px-1.5 py-0.5">
                            <textarea
                              value={comments[item.id] !== undefined ? comments[item.id] : (item.ai_recommendation || '')}
                              onChange={function(e) { setComments(function(prev) { var next = Object.assign({}, prev); next[item.id] = e.target.value; return next }) }}
                              onClick={function(e) { e.stopPropagation() }}
                              className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[9px] text-gray-500 leading-relaxed hover:border-gray-200 focus:border-[#2D6A4F] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#2D6A4F]/20 resize-none"
                              rows={2}
                              placeholder="Add comment..."
                            />
                          </td>
                        </tr>
                      )
                    }) : [])
                  ]
                })}

                {/* Operating Fund Totals + Rolling Cash */}
                {fundView === 'operating' && opTotals && [
                  <tr key="tot-inc" className="bg-[#1B4332]/5 border-t-2 border-[#1B4332]">
                    <td className="px-3 py-2 font-bold text-xs text-[#1B4332]">Total Income</td>
                    <td className={tdNum + ' font-bold text-[#1B4332] bg-[#FEF2F2]/50'}>{formatCurrency(opTotals.iR)}</td>
                    <td className={tdNum + ' font-bold text-[#1B4332]'}>{formatCurrency(opTotals.iR)}</td>
                    <td className={tdNum + ' font-bold text-gray-600'}>{formatCurrency(opTotals.iF)}</td>
                    <td className={tdNum + ' font-bold text-green-600'}>{formatCurrency(opTotals.iR - opTotals.iF)}</td>
                    <td className={tdNum + ' font-bold'}>{formatPercent(calcPctChange(opTotals.iR, opTotals.iF))}</td>
                    <td className="px-2 py-2"></td>
                  </tr>,
                  <tr key="tot-exp" className="bg-[#1B4332]/5">
                    <td className="px-3 py-2 font-bold text-xs text-[#1B4332]">Total Expenses</td>
                    <td className={tdNum + ' font-bold text-[#1B4332] bg-[#FEF2F2]/50'}>{formatCurrency(opTotals.eR)}</td>
                    <td className={tdNum + ' font-bold text-[#1B4332]'}>{formatCurrency(opTotals.eR)}</td>
                    <td className={tdNum + ' font-bold text-gray-600'}>{formatCurrency(opTotals.eF)}</td>
                    <td className={tdNum + ' font-bold ' + varianceColor(opTotals.eR - opTotals.eF, true)}>{formatCurrency(opTotals.eR - opTotals.eF)}</td>
                    <td className={tdNum + ' font-bold'}>{formatPercent(calcPctChange(opTotals.eR, opTotals.eF))}</td>
                    <td className="px-2 py-2"></td>
                  </tr>,
                  <tr key="net" className="bg-[#E8F5EE] border-t-2 border-[#2D7A4F]">
                    <td className="px-3 py-2.5 font-bold text-sm text-[#1B4332]">Net Surplus (Deficit)</td>
                    <td className={tdNum + ' font-bold text-sm text-red-700 bg-[#FEF2F2]/50'}>{formatCurrency(opTotals.nR)}</td>
                    <td className={tdNum + ' font-bold text-sm text-[#1B4332]'}>{formatCurrency(opTotals.nR)}</td>
                    <td className={tdNum + ' font-bold text-sm text-gray-600'}>{formatCurrency(opTotals.nF)}</td>
                    <td className={tdNum + ' font-bold ' + (opTotals.nR >= opTotals.nF ? 'text-green-600' : 'text-red-600')}>{formatCurrency(opTotals.nR - opTotals.nF)}</td>
                    <td className={tdNum + ' font-bold'}>{formatPercent(calcPctChange(opTotals.nR, opTotals.nF))}</td>
                    <td className="px-2 py-2"></td>
                  </tr>,
                  <tr key="ending-cash" className="bg-[#F3F4F1] border-t-2 border-gray-300">
                    <td className="px-3 py-2.5 font-bold text-xs text-[#1B4332]">Projected Ending Operating Cash</td>
                    <td className={tdNum + ' font-bold text-red-700 bg-[#FEF2F2]/50'}>{formatCurrency(beginningCash + opTotals.nR)}</td>
                    <td className={tdNum + ' font-bold text-[#1B4332]'}>{formatCurrency(beginningCash + opTotals.nR)}</td>
                    <td className={tdNum + ' font-bold text-gray-600'}>{formatCurrency(beginningCash + opTotals.nF)}</td>
                    <td className={tdNum + ' text-gray-400'}>—</td>
                    <td className={tdNum + ' text-gray-400'}>—</td>
                    <td className="px-2 py-2 text-[9px] text-gray-400 italic">Beginning cash + net surplus.</td>
                  </tr>
                ]}

                {/* Reserve Fund Totals + Ending Cash */}
                {fundView === 'reserve' && (function() {
                  var rTotal = grouped.reduce(function(s, c) { return s + c.totals.rec }, 0)
                  var rBal = building?.reserve_balance || 0
                  return [
                    <tr key="res-total" className="bg-[#E8F5EE] border-t-2 border-[#2D6A4F]">
                      <td className="px-3 py-2 font-bold text-xs text-[#1B4332]">Total Reserve Contributions</td>
                      <td className={tdNum + ' font-bold text-[#1B4332] bg-[#FEF2F2]/50'}>{formatCurrency(rTotal)}</td>
                      <td className={tdNum + ' font-bold text-[#1B4332]'}>{formatCurrency(rTotal)}</td>
                      <td className={tdNum + ' font-bold text-gray-600'}>{formatCurrency(0)}</td>
                      <td className={tdNum + ' font-bold text-green-600'}>{formatCurrency(rTotal)}</td>
                      <td className={tdNum + ' font-bold'}>—</td>
                      <td className="px-2 py-2"></td>
                    </tr>,
                    <tr key="res-ending" className="bg-[#1B4332] text-white">
                      <td className="px-3 py-2.5 font-bold text-xs">Projected Ending Reserve Balance</td>
                      <td className={tdNum + ' text-white font-bold'}>{formatCurrency(rBal + rTotal)}</td>
                      <td className={tdNum + ' text-white font-bold'}>{formatCurrency(rBal + rTotal)}</td>
                      <td className={tdNum + ' text-white/70 font-bold'}>{formatCurrency(rBal)}</td>
                      <td className={tdNum + ' text-white/50'}>—</td>
                      <td className={tdNum + ' text-white/50'}>—</td>
                      <td className="px-2 py-2 text-[9px] text-white/50 italic">Beginning balance + contributions.</td>
                    </tr>
                  ]
                })()}

                {/* Capital Fund Totals + Ending Cash */}
                {fundView === 'capital' && (function() {
                  var cInc = grouped.filter(function(c) { return c.isIncome }).reduce(function(s, c) { return s + c.totals.rec }, 0)
                  var cExp = grouped.filter(function(c) { return !c.isIncome }).reduce(function(s, c) { return s + c.totals.rec }, 0)
                  var cNet = cInc - cExp
                  return [
                    <tr key="cap-net" className="bg-[#E8F5EE] border-t-2 border-[#2D6A4F]">
                      <td className="px-3 py-2 font-bold text-xs text-[#1B4332]">Net Capital Position</td>
                      <td className={tdNum + ' font-bold ' + (cNet >= 0 ? 'text-[#2D6A4F]' : 'text-red-600') + ' bg-[#FEF2F2]/50'}>{formatCurrency(cNet)}</td>
                      <td className={tdNum + ' font-bold ' + (cNet >= 0 ? 'text-[#1B4332]' : 'text-red-600')}>{formatCurrency(cNet)}</td>
                      <td className={tdNum + ' font-bold text-gray-600'}>—</td>
                      <td className={tdNum + ' font-bold'}>—</td>
                      <td className={tdNum + ' font-bold'}>—</td>
                      <td className="px-2 py-2"></td>
                    </tr>,
                    <tr key="cap-ending" className="bg-[#1B4332] text-white">
                      <td className="px-3 py-2.5 font-bold text-xs">Projected Ending Capital Cash</td>
                      <td className={tdNum + ' text-white font-bold'}>{formatCurrency(cNet)}</td>
                      <td className={tdNum + ' text-white font-bold'}>{formatCurrency(cNet)}</td>
                      <td className={tdNum + ' text-white/70 font-bold'}>{formatCurrency(0)}</td>
                      <td className={tdNum + ' text-white/50'}>—</td>
                      <td className={tdNum + ' text-white/50'}>—</td>
                      <td className="px-2 py-2 text-[9px] text-white/50 italic">Capital income less expenditures.</td>
                    </tr>
                  ]
                })()}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT: Daisy Recommendation */}
        <div className="w-[185px] flex-shrink-0 space-y-2">
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-1.5 mb-2.5">
              <div className="h-2 w-2 rounded-full bg-[#2D7A4F]"></div>
              <span className="text-[10px] font-bold text-[#1B4332]">Daisy Recommendation:</span>
            </div>
            {[
              { l: 'Owner Charges based on Recommendation', v: ownerIncrease.toFixed(2) + '%' },
              { l: 'Assessment Recommendation', v: formatCurrency(operatingAssessment) },
              { l: 'Reserve Contribution %', v: reserveContribPct.toFixed(2) + '%' },
            ].map(function(r) {
              return (
                <div key={r.l} className="rounded bg-[#F5F5F0] p-2 mb-1.5 text-center">
                  <p className="text-[8px] text-gray-500 mb-0.5 leading-tight">{r.l}</p>
                  <p className="font-display text-base text-[#1B4332]">{r.v}</p>
                </div>
              )
            })}
            <div className="border-t border-gray-200 pt-2 mt-2">
              <p className="text-[9px] font-bold text-[#1B4332] mb-1">KEY METRICS</p>
              <div className="space-y-0.5 text-[9px]">
                <div className="flex justify-between"><span className="text-gray-500">Common Charges</span><span className="font-mono font-medium">{formatCurrency(commonCharges)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Reserve Contrib.</span><span className="font-mono font-medium">{formatCurrency(reserveContrib)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Reserve %</span><span className="font-mono font-medium">{reservePctCalc.toFixed(2)}%</span></div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
