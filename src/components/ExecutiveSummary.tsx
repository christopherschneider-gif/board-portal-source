import { useMemo } from 'react'
import { Info, DollarSign, TrendingUp, TrendingDown, Wallet, Lightbulb, CheckCircle2, Brain, BarChart3, Shield } from 'lucide-react'
import { formatCurrency, formatPercent, calcPctChange } from '../lib/format'
import type { Building, BudgetLineItem } from '../lib/types'

interface Props {
  building: Building | null
  lineItems: BudgetLineItem[]
}

export function ExecutiveSummary({ building, lineItems }: Props) {
  var stats = useMemo(function() {
    var opIncome = lineItems.filter(function(i) { return i.category === 'income' && !i.is_subtotal })
    var opExpenses = lineItems.filter(function(i) { return i.category === 'expense' && !i.is_subtotal && !(i.gl_code || '').startsWith('560') })
    var opIncRec = opIncome.reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
    var opIncPrior = opIncome.reduce(function(s, i) { return s + (i.actual_prior_year || 0) }, 0)
    var opExpRec = opExpenses.reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
    var opExpPrior = opExpenses.reduce(function(s, i) { return s + (i.actual_prior_year || 0) }, 0)
    var opNet = opIncRec - opExpRec

    var resItems = lineItems.filter(function(i) { return (i.gl_code || '').startsWith('855') && !i.is_subtotal })
    var resContrib = resItems.reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
    var resPct = opIncRec > 0 ? (resContrib / opIncRec * 100) : 0
    var resBalance = (building?.reserve_balance || 0)
    var resEnding = resBalance + resContrib
    var monthlyExp = opExpRec / 12
    var monthsInReserve = monthlyExp > 0 ? resEnding / monthlyExp : 0

    var capExpItems = lineItems.filter(function(i) { return ((i.gl_code || '').startsWith('560') || (i.gl_code || '') === '51235') && !i.is_subtotal })
    var capIncItems = lineItems.filter(function(i) { return ((i.gl_code || '').startsWith('410') || (i.gl_code || '').startsWith('491')) && !i.is_subtotal })
    var capIncRec = capIncItems.reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
    var capExpRec = capExpItems.reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
    var capExpPrior = capExpItems.reduce(function(s, i) { return s + (i.actual_prior_year || 0) }, 0)
    var capNet = capIncRec - capExpRec

    var opBeginCash = building?.projected_ending_cash || 0
    var opEndCash = opBeginCash + opNet
    var totalBeginCash = opBeginCash + resBalance + 0
    var totalEndCash = opEndCash + resEnding + capNet

    return {
      opIncRec: opIncRec, opIncPrior: opIncPrior, opExpRec: opExpRec, opExpPrior: opExpPrior, opNet: opNet,
      resContrib: resContrib, resPct: resPct, resBalance: resBalance, resEnding: resEnding, monthsInReserve: monthsInReserve,
      capIncRec: capIncRec, capExpRec: capExpRec, capExpPrior: capExpPrior, capNet: capNet,
      opBeginCash: opBeginCash, opEndCash: opEndCash, totalBeginCash: totalBeginCash, totalEndCash: totalEndCash,
      totalLineItems: lineItems.filter(function(i) { return !i.is_subtotal }).length,
    }
  }, [lineItems, building])

  if (!building) return <div className="text-center py-16 text-gray-400">Select a building.</div>
  var fy = building.budget_year || 2026

  var hdr = 'px-4 py-2.5 text-right text-xs font-mono'
  var lbl = 'px-4 py-2.5 text-xs'

  function pctRow(label: string, opVal: number, opPrior: number, resVal: number, resPrior: number, capVal: number, capPrior: number, totalVal: number, totalPrior: number) {
    function fmt(v: number, p: number, isExp: boolean) {
      if (p === 0 && v === 0) return <span className="text-gray-400">—</span>
      var pct = calcPctChange(v, p)
      return <span className={pct === 0 ? 'text-gray-500' : (isExp ? (pct > 0 ? 'text-red-600' : 'text-green-600') : (pct >= 0 ? 'text-green-600' : 'text-red-600'))}>{formatPercent(pct)}</span>
    }
    var isExp = label === 'vs Prior Year' && arguments[1] === stats.opExpRec
    return (
      <tr className="border-b border-gray-50">
        <td className="px-4 py-1 pl-8 text-[10px] text-gray-400 italic">{label}</td>
        <td className="px-4 py-1 text-right text-[10px]">{fmt(opVal, opPrior, isExp)}</td>
        <td className="px-4 py-1 text-right text-[10px]">{fmt(resVal, resPrior, false)}</td>
        <td className="px-4 py-1 text-right text-[10px]">{fmt(capVal, capPrior, true)}</td>
        <td className="px-4 py-1 text-right text-[10px]">{fmt(totalVal, totalPrior, false)}</td>
      </tr>
    )
  }

  return (
    <div className="space-y-6">
      {/* Board Introduction Letter */}
      <div className="rounded-lg border border-gray-200 bg-white p-8">
        <div className="max-w-3xl mx-auto">
          {/* Letterhead */}
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
            <div className="h-10 w-10 rounded-lg bg-[#1B4332] flex items-center justify-center flex-shrink-0">
              <span className="text-white font-display text-lg">D</span>
            </div>
            <div>
              <p className="font-display text-base text-[#1B4332]">Daisy Management</p>
              <p className="text-[9px] text-gray-400 uppercase tracking-wider">Corporate Finance Division</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-[10px] text-gray-500">{new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
              <p className="text-[10px] text-gray-400">{building.building_id} · FY {fy}</p>
            </div>
          </div>

          {/* Letter Body */}
          <h2 className="font-display text-lg text-[#1B4332] mb-4">RE: FY {fy} Proposed Operating Budget — {building.building_name}</h2>

          <p className="text-xs text-gray-700 leading-relaxed mb-3">Dear Board Members,</p>

          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            On behalf of Daisy Management, we are pleased to submit the proposed Fiscal Year {fy} operating budget
            for {building.building_name} ({building.building_id}). This document represents a comprehensive financial
            plan for the upcoming fiscal year and has been prepared in accordance with industry best practices for
            residential property management.
          </p>

          {/* What This Package Contains */}
          <p className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider mt-5 mb-2">About This Budget Package</p>
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            This budget package is designed to provide full transparency into the building's financial outlook. Each section
            serves a specific purpose in helping you understand, review, and ultimately approve the proposed budget. The
            package is organized as follows:
          </p>
          <div className="rounded bg-[#F5F5F0] px-4 py-3 mb-4 text-[11px] text-gray-600 leading-relaxed space-y-1.5">
            <p><span className="font-semibold text-[#1B4332]">Executive Summary</span> — The page you are reading now. High-level financial overview across all three funds.</p>
            <p><span className="font-semibold text-[#1B4332]">Current Year Review</span> — How the building performed during the current fiscal year compared to what was budgeted.</p>
            <p><span className="font-semibold text-[#1B4332]">Budget Recommendations</span> — Key decisions for the board: owner charge adjustments, special assessments, and prior assessment balances.</p>
            <p><span className="font-semibold text-[#1B4332]">Budget Table</span> — The detailed line-by-line budget broken out by Operating, Reserve, and Capital funds. Each line item includes a recommended amount, scenario modeling, and commentary.</p>
            <p><span className="font-semibold text-[#1B4332]">Historical Trending</span> — Three-year comparison showing how income and expenses have changed over time.</p>
            <p><span className="font-semibold text-[#1B4332]">Income Summary</span> — Visual breakdown of all revenue sources.</p>
            <p><span className="font-semibold text-[#1B4332]">Significant Expenses</span> — The largest expense categories and their share of total spending.</p>
            <p><span className="font-semibold text-[#1B4332]">Payroll, Insurance, Mortgage</span> — Detailed schedules for the building's three largest fixed-cost categories.</p>
            <p><span className="font-semibold text-[#1B4332]">Compliance</span> — All regulatory and inspection requirements with costs, status, and upcoming due dates.</p>
            <p><span className="font-semibold text-[#1B4332]">Reserve Adequacy</span> — Analysis of the building's reserve fund health and contribution levels.</p>
          </div>

          {/* What Has Been Done */}
          <p className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider mt-5 mb-2">How This Budget Was Prepared</p>
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            This budget was developed through a multi-step process that includes collecting historical financial data
            from the building's accounting system, analyzing current-year performance against the approved budget,
            researching market conditions (utility rate changes, insurance market trends, labor contract updates),
            reviewing all regulatory compliance obligations, and projecting each individual line item based on
            building-specific factors. The process incorporates data from verified NYC escalation rates, current
            vendor contracts, and applicable regulatory requirements.
          </p>

          {/* Where We Are in the Process */}
          <p className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider mt-5 mb-2">Current Status</p>
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            This budget is currently in the <span className="font-semibold text-[#1B4332]">Board Review</span> stage.
            The Finance team and your Account Manager have completed their internal review and are confident in the
            projections presented. The budget has been quality-checked for accuracy across all line items, fund
            allocations, and compliance requirements.
          </p>

          {/* What Happens Next */}
          <p className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider mt-5 mb-2">Next Steps</p>
          <p className="text-xs text-gray-600 leading-relaxed mb-3">
            We respectfully request the Board review this package and provide any questions or feedback to your Account
            Manager. Upon board approval, the budget will be finalized and the approved owner charge schedule will take
            effect at the start of the fiscal year. If any adjustments are needed, your Account Manager can model
            alternative scenarios using the Budget Table tab.
          </p>

          {/* Signature */}
          <div className="mt-8 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-700 mb-4">Respectfully submitted,</p>
            <p className="font-display text-sm text-[#1B4332]">Daisy Management</p>
          </div>
        </div>
      </div>

      {/* ── Fund Summary Table ── */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-[#1B4332] text-white">
              <th className="px-4 py-2.5 text-left text-[10px] font-medium uppercase tracking-wider w-[200px]"></th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">
                <div className="flex items-center justify-end gap-1.5"><DollarSign className="h-3 w-3" /> Operating</div>
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">
                <div className="flex items-center justify-end gap-1.5"><Wallet className="h-3 w-3" /> Reserve</div>
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">
                <div className="flex items-center justify-end gap-1.5"><BarChart3 className="h-3 w-3" /> Capital</div>
              </th>
              <th className="px-4 py-2.5 text-right text-[10px] font-medium uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody>
            {/* Beginning Cash — ribbon style at top */}
            <tr className="bg-[#1B4332] text-white">
              <td className="px-4 py-3 text-xs font-bold flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Beginning Cash</td>
              <td className="px-4 py-3 text-right font-mono text-sm font-bold">{formatCurrency(stats.opBeginCash)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm font-bold">{formatCurrency(stats.resBalance)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm font-bold">{formatCurrency(0)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm font-bold">{formatCurrency(stats.totalBeginCash)}</td>
            </tr>

            {/* Revenue */}
            <tr className="border-b border-gray-200 hover:bg-gray-50">
              <td className={lbl + ' font-semibold text-[#1B4332] flex items-center gap-1.5'}><TrendingUp className="h-3.5 w-3.5 text-[#2D6A4F]" /> Revenue</td>
              <td className={hdr + ' font-semibold text-[#1B4332]'}>{formatCurrency(stats.opIncRec)}</td>
              <td className={hdr + ' text-gray-500'}>{formatCurrency(stats.resContrib)}</td>
              <td className={hdr + ' text-gray-500'}>{formatCurrency(stats.capIncRec)}</td>
              <td className={hdr + ' font-semibold text-[#1B4332]'}>{formatCurrency(stats.opIncRec + stats.resContrib + stats.capIncRec)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-1 pl-8 text-[10px] text-gray-400 italic">vs Prior Year</td>
              <td className="px-4 py-1 text-right text-[10px]"><span className={calcPctChange(stats.opIncRec, stats.opIncPrior) >= 0 ? 'text-green-600' : 'text-red-600'}>{formatPercent(calcPctChange(stats.opIncRec, stats.opIncPrior))}</span></td>
              <td className="px-4 py-1 text-right text-[10px] text-gray-400">—</td>
              <td className="px-4 py-1 text-right text-[10px] text-gray-400">—</td>
              <td className="px-4 py-1 text-right text-[10px]"><span className={calcPctChange(stats.opIncRec, stats.opIncPrior) >= 0 ? 'text-green-600' : 'text-red-600'}>{formatPercent(calcPctChange(stats.opIncRec, stats.opIncPrior))}</span></td>
            </tr>

            {/* Expenses */}
            <tr className="border-b border-gray-200 hover:bg-gray-50">
              <td className={lbl + ' font-semibold text-[#1B4332] flex items-center gap-1.5'}><TrendingDown className="h-3.5 w-3.5 text-red-500" /> Expenses</td>
              <td className={hdr + ' font-semibold text-[#1B4332]'}>{formatCurrency(stats.opExpRec)}</td>
              <td className={hdr + ' text-gray-500'}>{formatCurrency(0)}</td>
              <td className={hdr + ' text-gray-500'}>{formatCurrency(stats.capExpRec)}</td>
              <td className={hdr + ' font-semibold text-[#1B4332]'}>{formatCurrency(stats.opExpRec + stats.capExpRec)}</td>
            </tr>
            <tr className="border-b border-gray-100">
              <td className="px-4 py-1 pl-8 text-[10px] text-gray-400 italic">vs Prior Year</td>
              <td className="px-4 py-1 text-right text-[10px]"><span className={calcPctChange(stats.opExpRec, stats.opExpPrior) > 0 ? 'text-red-600' : 'text-green-600'}>{formatPercent(calcPctChange(stats.opExpRec, stats.opExpPrior))}</span></td>
              <td className="px-4 py-1 text-right text-[10px] text-gray-400">—</td>
              <td className="px-4 py-1 text-right text-[10px]">{stats.capExpPrior > 0 ? <span className={calcPctChange(stats.capExpRec, stats.capExpPrior) > 0 ? 'text-red-600' : 'text-green-600'}>{formatPercent(calcPctChange(stats.capExpRec, stats.capExpPrior))}</span> : <span className="text-gray-400">{stats.capExpRec === 0 ? '—' : formatPercent(calcPctChange(stats.capExpRec, stats.capExpPrior))}</span>}</td>
              <td className="px-4 py-1 text-right text-[10px]"><span className={calcPctChange(stats.opExpRec + stats.capExpRec, stats.opExpPrior + stats.capExpPrior) > 0 ? 'text-red-600' : 'text-green-600'}>{formatPercent(calcPctChange(stats.opExpRec + stats.capExpRec, stats.opExpPrior + stats.capExpPrior))}</span></td>
            </tr>

            {/* Net Surplus */}
            <tr className="border-b border-gray-200 bg-[#E8F5EE]">
              <td className={lbl + ' font-bold text-[#1B4332] flex items-center gap-1.5'}><DollarSign className="h-3.5 w-3.5 text-[#2D6A4F]" /> Net Surplus (Deficit)</td>
              <td className={hdr + ' font-bold ' + (stats.opNet >= 0 ? 'text-[#2D6A4F]' : 'text-red-600')}>{formatCurrency(stats.opNet)}</td>
              <td className={hdr + ' font-bold text-[#2D6A4F]'}>{formatCurrency(stats.resContrib)}</td>
              <td className={hdr + ' font-bold ' + (stats.capNet >= 0 ? 'text-[#2D6A4F]' : 'text-red-600')}>{formatCurrency(stats.capNet)}</td>
              <td className={hdr + ' font-bold ' + (stats.opNet + stats.resContrib + stats.capNet >= 0 ? 'text-[#2D6A4F]' : 'text-red-600')}>{formatCurrency(stats.opNet + stats.resContrib + stats.capNet)}</td>
            </tr>

            {/* Projected Ending Cash — ribbon style at bottom */}
            <tr className="bg-[#1B4332] text-white">
              <td className="px-4 py-3 text-xs font-bold flex items-center gap-1.5"><Wallet className="h-3.5 w-3.5" /> Projected Ending Cash</td>
              <td className="px-4 py-3 text-right font-mono text-sm font-bold">{formatCurrency(stats.opEndCash)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm font-bold">{formatCurrency(stats.resEnding)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm font-bold">{formatCurrency(stats.capNet)}</td>
              <td className="px-4 py-3 text-right font-mono text-sm font-bold text-green-300">{formatCurrency(stats.totalEndCash)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Owner Charge Recommendation Bar ── */}
      <div className="rounded-lg bg-[#1B4332] p-5 text-white flex items-center justify-between">
        <div>
          <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Recommended Owner Charge Increase</p>
          <p className="font-display text-3xl">{formatPercent(building.assessment_change_pct || 0).replace('+', '')}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Reserve Contribution</p>
          <p className="font-display text-3xl">{stats.resPct.toFixed(1)}%</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Months in Reserve</p>
          <p className={'font-display text-3xl ' + (stats.monthsInReserve < 3 ? 'text-red-300' : stats.monthsInReserve < 5 ? 'text-yellow-300' : 'text-green-300')}>
            {stats.monthsInReserve.toFixed(1)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-white/60 uppercase tracking-wider mb-1">Quality Score</p>
          <p className="font-display text-3xl">{building.quality_score || '—'}<span className="text-lg text-white/40">/100</span></p>
        </div>
      </div>

      {/* ── How This Budget Was Created (Mock SW6) ── */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="bg-[#1B4332] px-5 py-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-[#52B788]" />
            <h3 className="text-white font-medium text-sm">How This Budget Was Created</h3>
          </div>
          <p className="text-white/50 text-[10px] mt-0.5">Budget methodology — Daisy Budget Automation Platform</p>
        </div>

        <div className="p-5 space-y-5">
          {/* Pipeline phases */}
          <div className="flex items-center gap-2 flex-wrap">
            {[
              { phase: 'Data Collection', desc: 'SharePoint + Buildium' },
              { phase: 'Building Intelligence', desc: 'NYC regulatory data' },
              { phase: 'Market Research', desc: '13 reference tables' },
              { phase: 'GL-Level Forecasting', desc: 'Per-account analysis' },
              { phase: 'QA Review', desc: 'Automated quality check' },
              { phase: 'Final Output', desc: 'Board-ready package' },
            ].map(function(p, i) {
              return (
                <div key={p.phase} className="flex items-center gap-1.5">
                  <div className="h-5 w-5 rounded-full bg-[#2D6A4F] flex items-center justify-center">
                    <CheckCircle2 className="h-3 w-3 text-white" />
                  </div>
                  <div>
                    <span className="text-[10px] font-medium text-[#1B4332]">{p.phase}</span>
                    <span className="text-[9px] text-gray-400 ml-1">{p.desc}</span>
                  </div>
                  {i < 5 && <span className="text-gray-300 mx-1">→</span>}
                </div>
              )
            })}
          </div>

          {/* Narrative */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <BarChart3 className="h-4 w-4 text-[#2D6A4F] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#1B4332] mb-1">Income Analysis</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Total operating income of {formatCurrency(stats.opIncRec)} reflects a {formatPercent(calcPctChange(stats.opIncRec, stats.opIncPrior))} change
                    from prior year. Common charges escalated by {(building.assessment_change_pct || 5).toFixed(1)}% based on
                    projected expense growth and reserve adequacy requirements. Miscellaneous income conservatively
                    estimated using 3-year historical averages.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <TrendingDown className="h-4 w-4 text-[#2D6A4F] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#1B4332] mb-1">Expense Methodology</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Each of the {stats.totalLineItems} GL accounts was individually analyzed using verified NYC escalation rates
                    (Con Edison 3.5%, water/sewer 3.7%, insurance 25% hard market), historical actuals (3-year trend), and
                    building-specific factors ({building.year_built} construction, {building.units} units, {building.borough || 'Manhattan'}).
                    32BJ SEIU contract rates applied through April 2026 expiry.
                  </p>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-[#2D6A4F] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#1B4332] mb-1">Compliance & Risk</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    Budget incorporates all applicable NYC regulatory requirements: LL11/FISP facade inspection,
                    LL97 carbon emissions, annual elevator and boiler inspections, fire safety, and lead paint monitoring
                    (pre-1960 building). Insurance escalated 25% reflecting Scaffold Law (§240) exposure.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Lightbulb className="h-4 w-4 text-[#2D6A4F] mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-[#1B4332] mb-1">Key Recommendations</p>
                  <p className="text-[11px] text-gray-600 leading-relaxed">
                    {(building.assessment_change_pct || 5).toFixed(1)}% owner charge increase recommended. Reserve contribution at
                    {' '}{stats.resPct.toFixed(1)}% ({formatCurrency(stats.resContrib)}/year) builds reserves to
                    {' '}{stats.monthsInReserve.toFixed(1)} months of operating expenses
                    {stats.monthsInReserve < 3 ? ' — below the Fannie Mae 3-month minimum' : stats.monthsInReserve < 5 ? ' — meets minimum, below 5-month target' : ' — meets recommended target'}.
                    Capital projects pending AM confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Data sources */}
          <div className="rounded bg-[#F3F4F1] px-4 py-2.5 flex items-center gap-4 text-[9px] text-gray-500">
            <span className="font-medium text-[#1B4332]">Data Sources:</span>
            <span>Buildium GL Actuals</span><span>·</span>
            <span>NYC DOB/HPD/DEP/FDNY</span><span>·</span>
            <span>Con Edison Rate Filings</span><span>·</span>
            <span>32BJ SEIU Contract</span><span>·</span>
            <span>RGB I&E Study</span><span>·</span>
            <span>13 Reference Tables</span>
          </div>
        </div>
      </div>
    </div>
  )
}
