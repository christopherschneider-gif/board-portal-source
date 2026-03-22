import { useMemo } from 'react'
import { Landmark, DollarSign, Percent, CalendarClock } from 'lucide-react'
import { formatCurrency } from '../lib/format'
import type { Building, MortgageLoan } from '../lib/types'

interface Props {
  building: Building | null
  loans: MortgageLoan[]
}

export function MortgageTab({ building, loans }: Props) {
  const stats = useMemo(() => {
    const mortgageLoans = loans.filter((l) => l.loan_type === 'mortgage' || !l.loan_type || l.loan_type === '')
    const locLoans = loans.filter((l) => l.loan_type === 'loc')
    const totalDebtService = loans.reduce((s, l) => s + (l.total_payment || 0), 0)
    const totalBalance = loans.reduce((s, l) => s + (l.outstanding_balance || 0), 0)
    const totalPrincipal = loans.reduce((s, l) => s + (l.principal_payment || 0), 0)
    const totalInterest = loans.reduce((s, l) => s + (l.interest_payment || 0), 0)

    // Weighted average interest rate
    var weightedRate = 0
    if (totalBalance > 0) {
      weightedRate = loans.reduce(function(sum, l) {
        return sum + (l.interest_rate || 0) * ((l.outstanding_balance || 0) / totalBalance)
      }, 0)
    }

    return { mortgageLoans, locLoans, totalDebtService, totalBalance, totalPrincipal, totalInterest, weightedRate }
  }, [loans])

  if (!building) {
    return <div className="text-center py-16 text-gray-400">Select a building.</div>
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-[#1B4332] text-center mb-2">Mortgage & Debt Service</h2>
      <p className="text-center text-sm text-gray-500 mb-8">
        {building.building_id} – {building.building_name} · FY {building.budget_year || '2026'}
      </p>

      <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] px-4 py-3 mb-5 flex items-start gap-2.5">
        <span className="text-xs text-[#1B4332] leading-relaxed">This tab details the building's debt obligations including mortgage loans and lines of credit. It shows principal and interest breakdowns, outstanding balances, interest rates, and maturity dates.</span>
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
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Annual Debt Service</span>
          </div>
          <p className="font-display text-2xl text-[#1B4332]">{formatCurrency(stats.totalDebtService)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
              <Landmark className="h-4 w-4 text-[#2D7A4F]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Outstanding Balance</span>
          </div>
          <p className="font-display text-2xl text-[#1B4332]">{formatCurrency(stats.totalBalance)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
              <Percent className="h-4 w-4 text-[#2D7A4F]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Wtd. Avg. Rate</span>
          </div>
          <p className="font-display text-2xl text-[#1B4332]">{stats.weightedRate.toFixed(2)}%</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-8 w-8 rounded-lg bg-[#E8F5EE] flex items-center justify-center">
              <CalendarClock className="h-4 w-4 text-[#2D7A4F]" />
            </div>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Loans</span>
          </div>
          <p className="font-display text-2xl text-[#1B4332]">{loans.length}</p>
        </div>
      </div>

      {/* Mortgage Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden mb-6">
        <div className="px-5 py-3 bg-[#1B4332]">
          <h3 className="text-white font-medium text-sm">Mortgage Loans</h3>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider text-gray-500">Loan</th>
              <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider text-gray-500">Lender</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider text-gray-500">Principal</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider text-gray-500">Interest</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider text-gray-500">Total Payment</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider text-gray-500">Balance</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider text-gray-500">Rate</th>
              <th className="px-4 py-3 text-right font-medium text-xs uppercase tracking-wider text-gray-500">Maturity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {stats.mortgageLoans.length === 0 && stats.locLoans.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                  No mortgage data for this building. Data syncs from Make.com.
                </td>
              </tr>
            )}
            {stats.mortgageLoans.map((l) => (
              <tr key={l.id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">{l.loan_name}</td>
                <td className="px-4 py-3 text-gray-600">{l.lender || '—'}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(l.principal_payment)}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(l.interest_payment)}</td>
                <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">{formatCurrency(l.total_payment)}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{formatCurrency(l.outstanding_balance)}</td>
                <td className="px-4 py-3 text-right font-mono text-gray-700">{l.interest_rate ? l.interest_rate.toFixed(2) + '%' : '—'}</td>
                <td className="px-4 py-3 text-right text-gray-600">
                  {l.maturity_date ? new Date(l.maturity_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
          {stats.mortgageLoans.length > 0 && (
            <tfoot>
              <tr className="bg-gray-50 font-semibold border-t-2 border-gray-300">
                <td className="px-4 py-3" colSpan={2}>Total Mortgages</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(stats.totalPrincipal)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(stats.totalInterest)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(stats.totalDebtService)}</td>
                <td className="px-4 py-3 text-right font-mono">{formatCurrency(stats.totalBalance)}</td>
                <td className="px-4 py-3" colSpan={2}></td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      {/* LOC Section */}
      {stats.locLoans.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 overflow-hidden">
          <div className="px-5 py-3 bg-amber-600">
            <h3 className="text-white font-medium text-sm">Line of Credit (LOC)</h3>
          </div>
          <table className="w-full text-sm">
            <tbody className="divide-y divide-amber-100">
              {stats.locLoans.map((l) => (
                <tr key={l.id}>
                  <td className="px-4 py-3 font-medium text-gray-900">{l.loan_name}</td>
                  <td className="px-4 py-3 text-gray-600">{l.lender}</td>
                  <td className="px-4 py-3 text-right font-mono text-gray-900">{formatCurrency(l.outstanding_balance)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{l.interest_rate ? l.interest_rate.toFixed(2) + '%' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
