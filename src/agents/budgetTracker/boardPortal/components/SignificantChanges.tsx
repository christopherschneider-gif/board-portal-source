import { useMemo } from 'react'
import { formatCurrency, formatPercent, calcVariance, calcPctChange } from '../lib/format'
import type { Building, BudgetLineItem } from '../lib/types'

interface Props {
  building: Building | null
  lineItems: BudgetLineItem[]
}

export function SignificantChanges({ building, lineItems }: Props) {
  var significantItems = useMemo(function() {
    return lineItems
      .filter(function(i) {
        if (i.is_subtotal) return false
        var rec = i.recommended_amount || 0
        var prior = i.actual_prior_year || 0
        var absDiff = Math.abs(rec - prior)
        var pctDiff = prior !== 0 ? Math.abs((rec - prior) / prior) * 100 : (rec !== 0 ? 100 : 0)
        // Show items with > $1000 change or > 10% change, or has AI recommendation
        return absDiff > 1000 || pctDiff > 10 || (i.ai_recommendation && i.ai_recommendation.length > 0)
      })
      .sort(function(a, b) {
        return Math.abs((b.recommended_amount || 0) - (b.actual_prior_year || 0)) -
               Math.abs((a.recommended_amount || 0) - (a.actual_prior_year || 0))
      })
  }, [lineItems])

  if (!building) return <div className="text-center py-16 text-gray-400">Select a building.</div>

  var fy = building.budget_year || 2026
  var fyShort = String(fy).slice(-2)
  var priorShort = String(fy - 1).slice(-2)

  return (
    <div>
      <h2 className="font-display text-3xl text-[#1B4332] text-center mb-1">Summary of Significant Changes</h2>
      <p className="text-center text-sm text-gray-500 mb-8">
        {building.building_id} – {building.building_name} · FY {fy} · Line items with notable variances
      </p>

      <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] px-4 py-3 mb-5 flex items-start gap-2.5">
        <span className="text-xs text-[#1B4332] leading-relaxed">This tab highlights line items with the largest year-over-year variances. Each item includes an explanation of why the amount changed, including vendor details, market conditions, and regulatory factors.</span>
      </div>

      <p className="hidden">
      </p>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-[#1B4332] text-white">
              <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider min-w-[250px]">Name</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider w-[110px]">{fy} Budget</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider w-[110px]">{fy - 1} Forecast</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider w-[110px]">'{fyShort} vs '{priorShort} Var.</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider w-[80px]">% Chg</th>
            </tr>
          </thead>
          <tbody>
            {significantItems.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  No significant changes found. No significant changes found for this building.
                </td>
              </tr>
            )}
            {significantItems.map(function(item) {
              var rec = item.recommended_amount || 0
              var prior = item.actual_prior_year || 0
              var variance = calcVariance(rec, prior)
              var pct = calcPctChange(rec, prior)
              var isExpense = item.category === 'expense'
              var varColor = variance === 0 ? 'text-gray-500' : (isExpense ? (variance > 0 ? 'text-red-600' : 'text-green-600') : (variance > 0 ? 'text-green-600' : 'text-red-600'))

              return (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{item.gl_code} - {item.gl_name}</p>
                    {item.ai_recommendation && (
                      <p className="mt-1.5 text-xs text-gray-500 leading-relaxed max-w-[500px]">
                        {item.ai_recommendation}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900">{formatCurrency(rec)}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-600">{formatCurrency(prior)}</td>
                  <td className={'px-4 py-3 text-right font-mono ' + varColor}>{formatCurrency(variance)}</td>
                  <td className={'px-4 py-3 text-right font-mono ' + varColor}>{formatPercent(pct)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
