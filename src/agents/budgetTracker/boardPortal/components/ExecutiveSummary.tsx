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
      {/* Title */}
      <div className="text-center">
        <h2 className="font-display text-2xl text-[#1B4332] mb-1">Executive Summary</h2>
        <p className="text-xs text-gray-500">{building.building_id} – {building.building_name} · FY {fy} Budget</p>
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
