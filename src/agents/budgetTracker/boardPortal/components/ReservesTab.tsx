import { useMemo } from 'react'
import { Lightbulb } from 'lucide-react'
import { formatCurrency } from '../lib/format'
import type { Building, BudgetLineItem } from '../lib/types'

interface Props {
  building: Building | null
  lineItems: BudgetLineItem[]
}

function GaugeChart({ value, max }: { value: number; max: number }) {
  // Speedometer gauge: red 0-3, yellow 3-5, green 5+
  var pct = Math.min(value / max, 1)
  var angle = -90 + pct * 180
  var cx = 100, cy = 100, r = 70

  // Color zones
  var zones = [
    { start: -90, end: -90 + (3 / max) * 180, color: '#EF4444' },
    { start: -90 + (3 / max) * 180, end: -90 + (5 / max) * 180, color: '#F59E0B' },
    { start: -90 + (5 / max) * 180, end: 90, color: '#22C55E' },
  ]

  function arcPath(startAngle: number, endAngle: number, radius: number) {
    var s = (startAngle * Math.PI) / 180
    var e = (endAngle * Math.PI) / 180
    var x1 = cx + radius * Math.cos(s)
    var y1 = cy + radius * Math.sin(s)
    var x2 = cx + radius * Math.cos(e)
    var y2 = cy + radius * Math.sin(e)
    var large = endAngle - startAngle > 180 ? 1 : 0
    return 'M ' + x1 + ' ' + y1 + ' A ' + radius + ' ' + radius + ' 0 ' + large + ' 1 ' + x2 + ' ' + y2
  }

  var needleAngle = (angle * Math.PI) / 180
  var nx = cx + (r - 15) * Math.cos(needleAngle)
  var ny = cy + (r - 15) * Math.sin(needleAngle)

  var statusColor = value < 3 ? '#EF4444' : value < 5 ? '#F59E0B' : '#22C55E'
  var statusText = value < 3 ? 'Inadequate — Below Minimum' : value < 5 ? 'Adequate — Meets Minimum' : 'Strong — Exceeds Target'

  return (
    <div className="text-center">
      <svg viewBox="0 0 200 130" width="220" height="145">
        {zones.map(function(z, i) {
          return (
            <path
              key={i}
              d={arcPath(z.start, z.end, r)}
              fill="none"
              stroke={z.color}
              strokeWidth="14"
              strokeLinecap="round"
            />
          )
        })}
        {/* Needle */}
        <line x1={cx} y1={cy} x2={nx} y2={ny} stroke="#6B7280" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx={cx} cy={cy} r="5" fill="#6B7280" />
        {/* Value */}
        <text x={cx} y={cy - 12} textAnchor="middle" fontSize="28" fontWeight="bold" fill="#1B4332">
          {value.toFixed(1)}
        </text>
        {/* Scale labels */}
        <text x="22" y={cy + 15} fontSize="10" fill="#9CA3AF">{0}</text>
        <text x={cx} y="18" fontSize="10" fill="#9CA3AF" textAnchor="middle">{Math.round(max / 2)}</text>
        <text x="172" y={cy + 15} fontSize="10" fill="#9CA3AF" textAnchor="end">{max}</text>
      </svg>
      <p className="text-xs font-medium mt-1" style={{ color: statusColor }}>
        {'⚠ ' + statusText}
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">Target: ≥ 5 months · Minimum: ≥ 3 months</p>
    </div>
  )
}

export function ReservesTab({ building, lineItems }: Props) {
  const stats = useMemo(() => {
    var reserveItems = lineItems.filter(function(i) {
      return i.gl_code && i.gl_code.startsWith('855')
    })
    var expenseItems = lineItems.filter(function(i) {
      return i.category === 'expense' && !i.is_subtotal
    })
    var incomeItems = lineItems.filter(function(i) {
      return i.category === 'income' && !i.is_subtotal
    })

    var totalExpenses = expenseItems.reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
    var totalIncome = incomeItems.reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
    var reserveContrib = reserveItems.reduce(function(s, i) { return s + (i.recommended_amount || 0) }, 0)
    var reserveCash = building?.reserve_balance || 0
    var transfersOut = 0
    var projectedEnding = reserveCash + reserveContrib - transfersOut
    var monthlyExpenses = totalExpenses / 12
    var monthsInReserve = monthlyExpenses > 0 ? projectedEnding / monthlyExpenses : 0
    var reservePct = totalIncome > 0 ? (reserveContrib / totalIncome) * 100 : 0

    return {
      reserveCash,
      reserveContrib,
      transfersOut,
      projectedEnding,
      totalIncome,
      totalExpenses,
      monthsInReserve,
      reservePct,
    }
  }, [lineItems, building])

  if (!building) {
    return <div className="text-center py-16 text-gray-400">Select a building.</div>
  }

  return (
    <div>
      <h2 className="font-display text-3xl text-[#1B4332] text-center mb-2">
        Budgeted Cash Reserve Contribution
      </h2>
      <p className="text-center text-sm text-gray-500 mb-10">
        {building.building_id} – {building.building_name} · FY {building.budget_year || '2026'} · Reserve adequacy analysis
      </p>

      <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] px-4 py-3 mb-5 flex items-start gap-2.5">
        <span className="text-xs text-[#1B4332] leading-relaxed">This tab analyzes the building's reserve fund health. It shows the cash flow calculation (beginning balance + contributions - transfers = ending reserve), the contribution percentage, and a gauge measuring months of operating expenses held in reserves. The Fannie Mae/Freddie Mac guideline recommends a minimum of 10% reserve contribution.</span>
      </div>

      <p className="hidden">
      </p>

      {/* Cash Flow Cards: Reserves Cash + Annual Requirement - Transfers = Projected Ending */}
      <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-center min-w-[180px]">
          <p className="text-xs font-medium text-[#2D7A4F] uppercase tracking-wider mb-2">Reserves Cash</p>
          <p className="font-display text-3xl text-[#1B4332]">{formatCurrency(stats.reserveCash)}</p>
        </div>
        <span className="text-3xl text-gray-400 font-light">+</span>
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-center min-w-[180px]">
          <p className="text-xs font-medium text-[#2D7A4F] uppercase tracking-wider mb-2">Annual Reserve Requirement</p>
          <p className="font-display text-3xl text-[#1B4332]">{formatCurrency(stats.reserveContrib)}</p>
        </div>
        <span className="text-3xl text-gray-400 font-light">−</span>
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-center min-w-[180px]">
          <p className="text-xs font-medium text-[#2D7A4F] uppercase tracking-wider mb-2">Less: Transfers Out</p>
          <p className="font-display text-3xl text-[#1B4332]">{formatCurrency(stats.transfersOut)}</p>
        </div>
        <span className="text-3xl text-gray-400 font-light">=</span>
        <div className="rounded-lg border-2 border-[#2D7A4F] bg-[#E8F5EE] p-5 text-center min-w-[200px]">
          <p className="text-xs font-medium text-[#2D7A4F] uppercase tracking-wider mb-2">Projected Ending Reserve</p>
          <p className="font-display text-3xl text-[#2D7A4F]">{formatCurrency(stats.projectedEnding)}</p>
        </div>
      </div>

      {/* Contribution Calculation + Gauge */}
      <div className="flex gap-8 items-start justify-center flex-wrap">
        {/* Contribution Calculation */}
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider text-center mb-4">
            Annual Reserve Contribution Calculation
          </p>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] p-4 text-center min-w-[150px]">
              <p className="text-xs font-medium text-[#2D7A4F] mb-1">Annual Recurring Charges</p>
              <p className="font-display text-xl text-[#1B4332]">{formatCurrency(stats.totalIncome)}</p>
            </div>
            <span className="text-xl text-gray-400">×</span>
            <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] p-4 text-center min-w-[120px]">
              <p className="text-xs font-medium text-[#2D7A4F] mb-1">Reserve % in Budget</p>
              <p className="font-display text-xl text-[#1B4332]">{stats.reservePct.toFixed(0)}%</p>
            </div>
            <span className="text-xl text-gray-400">=</span>
            <div className="rounded-lg border border-gray-200 bg-white p-4 text-center min-w-[150px]">
              <p className="text-xs font-medium text-gray-500 mb-1">Annual Requirement</p>
              <p className="font-display text-xl text-[#1B4332]">{formatCurrency(stats.reserveContrib)}</p>
            </div>
          </div>
        </div>

        {/* Gauge */}
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-center">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
            # of Monthly Operating Expenses in Reserves
          </p>
          <GaugeChart value={stats.monthsInReserve} max={10} />
        </div>
      </div>

      {/* Fannie Mae Note */}
      <div className="mt-8 mx-auto max-w-2xl rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] px-5 py-4 flex gap-3">
        <Lightbulb className="h-5 w-5 text-[#2D7A4F] flex-shrink-0 mt-0.5" />
        <p className="text-xs text-[#1B4332] leading-relaxed">
          <strong>*10% of Annual Operating Income</strong> is the Fannie Mae & Freddie Mac recommended guideline.
          Failure to have an adequate reserve strategy could limit potential Buyers from getting a mortgage
          and could limit a Building's ability to get a loan or refinance.
        </p>
      </div>
    </div>
  )
}
