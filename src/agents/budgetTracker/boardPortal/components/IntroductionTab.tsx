import { formatCurrency } from '../lib/format'
import type { Building, BudgetLineItem } from '../lib/types'
import { useMemo } from 'react'

interface Props {
  building: Building | null
  lineItems: BudgetLineItem[]
}

export function IntroductionTab({ building, lineItems }: Props) {
  var stats = useMemo(function() {
    var opIncome = lineItems.filter(function(i) { return i.category === 'income' && !i.is_subtotal })
    var opExpenses = lineItems.filter(function(i) { return i.category === 'expense' && !i.is_subtotal && !(i.gl_code || '').startsWith('560') })
    var opIncRec = opIncome.reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
    var opExpRec = opExpenses.reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
    var opNet = opIncRec - opExpRec
    return { opIncRec: opIncRec, opExpRec: opExpRec, opNet: opNet }
  }, [lineItems])

  if (!building) return <div className="text-center py-16 text-gray-400">Select a building.</div>
  var fy = building.budget_year || 2026
  var beginningCash = building.projected_ending_cash || 0
  var endingCash = beginningCash + stats.opNet

  return (
    <div className="max-w-3xl mx-auto">
      <div className="rounded-lg border border-gray-200 bg-white p-8">
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

        <p className="text-xs text-gray-600 leading-relaxed mb-3">
          The budget recommends a <span className="font-semibold text-[#1B4332]">{(building.assessment_change_pct || 5).toFixed(1)}% owner charge adjustment</span> to
          maintain the building's financial health while continuing to fund essential operations, compliance obligations,
          and reserve contributions. Total projected income of <span className="font-semibold">{formatCurrency(stats.opIncRec)}</span> against
          projected expenses of <span className="font-semibold">{formatCurrency(stats.opExpRec)}</span> yields
          a net operating surplus of <span className="font-semibold text-[#2D6A4F]">{formatCurrency(stats.opNet)}</span>, bringing
          the projected ending cash balance to <span className="font-semibold">{formatCurrency(endingCash)}</span>.
        </p>

        {/* What This Package Contains */}
        <p className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider mt-6 mb-2">About This Budget Package</p>
        <p className="text-xs text-gray-600 leading-relaxed mb-3">
          This budget package is designed to provide full transparency into the building's financial outlook. Each section
          serves a specific purpose in helping you understand, review, and ultimately approve the proposed budget. The
          package is organized as follows:
        </p>
        <div className="rounded bg-[#F5F5F0] px-4 py-3 mb-4 text-[11px] text-gray-600 leading-relaxed space-y-1.5">
          <p><span className="font-semibold text-[#1B4332]">Executive Summary</span> — High-level financial overview across all three funds (Operating, Reserve, and Capital) with key metrics and the methodology used to prepare this budget.</p>
          <p><span className="font-semibold text-[#1B4332]">Current Year Review</span> — How the building performed during the current fiscal year compared to what was budgeted. Toggle between fund views and drill into individual GL accounts.</p>
          <p><span className="font-semibold text-[#1B4332]">Budget Recommendations</span> — Key decisions for the board: owner charge adjustments, special assessments, and prior assessment balances.</p>
          <p><span className="font-semibold text-[#1B4332]">Budget Table</span> — The detailed line-by-line budget broken out by Operating, Reserve, and Capital funds. Each line item includes a recommended amount, scenario modeling, and commentary.</p>
          <p><span className="font-semibold text-[#1B4332]">Historical Trending</span> — Three-year comparison showing how income and expenses have changed over time.</p>
          <p><span className="font-semibold text-[#1B4332]">Income Summary</span> — Visual breakdown of all revenue sources.</p>
          <p><span className="font-semibold text-[#1B4332]">Significant Expenses</span> — The largest expense categories and their share of total spending.</p>
          <p><span className="font-semibold text-[#1B4332]">Payroll, Insurance, Mortgage</span> — Detailed schedules for the building's three largest fixed-cost categories.</p>
          <p><span className="font-semibold text-[#1B4332]">Compliance</span> — All regulatory and inspection requirements with costs, status, and upcoming due dates.</p>
          <p><span className="font-semibold text-[#1B4332]">Reserve Adequacy</span> — Analysis of the building's reserve fund health and contribution levels.</p>
        </div>

        {/* How This Budget Was Prepared */}
        <p className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider mt-6 mb-2">How This Budget Was Prepared</p>
        <p className="text-xs text-gray-600 leading-relaxed mb-3">
          This budget was developed through a multi-step process that includes collecting historical financial data
          from the building's accounting system, analyzing current-year performance against the approved budget,
          researching market conditions (utility rate changes, insurance market trends, labor contract updates),
          reviewing all regulatory compliance obligations, and projecting each individual line item based on
          building-specific factors. The process incorporates data from verified NYC escalation rates, current
          vendor contracts, and applicable regulatory requirements.
        </p>

        {/* Current Status */}
        <p className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider mt-6 mb-2">Current Status</p>
        <p className="text-xs text-gray-600 leading-relaxed mb-3">
          This budget is currently in the <span className="font-semibold text-[#1B4332]">Board Review</span> stage.
          The Finance team and your Account Manager have completed their internal review and are confident in the
          projections presented. The budget has been quality-checked for accuracy across all line items, fund
          allocations, and compliance requirements.
        </p>

        {/* Next Steps */}
        <p className="text-[10px] font-bold text-[#1B4332] uppercase tracking-wider mt-6 mb-2">Next Steps</p>
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
  )
}
