import { useState, useEffect } from 'react'
import { Info, Shield, AlertTriangle, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { formatCurrency } from '../lib/format'
import { supabase } from '../lib/supabase'
import type { Building } from '../lib/types'

interface ComplianceItem {
  id: string
  building_id: string
  requirement_name: string
  gl_code: string
  annual_cost: number
  one_time_cost: number
  status: string
  frequency: string
  next_due_date: string
  notes: string
}

interface Props {
  building: Building | null
}

function StatusBadge({ status }: { status: string }) {
  var s = (status || '').toLowerCase()
  if (s === 'overdue') return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700"><AlertTriangle className="h-3 w-3" />Overdue</span>
  if (s === 'upcoming') return <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700"><Clock className="h-3 w-3" />Upcoming</span>
  if (s === 'required') return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700"><CheckCircle2 className="h-3 w-3" />Required</span>
  if (s === 'not_applicable' || s === 'n/a') return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500"><XCircle className="h-3 w-3" />N/A</span>
  return <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-500">{status}</span>
}

export function ComplianceTab({ building }: Props) {
  var [items, setItems] = useState<ComplianceItem[]>([])
  var [loading, setLoading] = useState(true)

  useEffect(function() {
    if (!building) return
    setLoading(true)
    supabase
      .from('building_compliance')
      .select('*')
      .eq('building_id', building.building_id)
      .then(function(result) {
        setItems(result.data || [])
        setLoading(false)
      })
  }, [building])

  if (!building) return <div className="text-center py-16 text-gray-400">Select a building.</div>

  var totalAnnual = items.reduce(function(s, i) { return s + (i.annual_cost || 0) }, 0)
  var totalOneTime = items.reduce(function(s, i) { return s + (i.one_time_cost || 0) }, 0)
  var overdueCount = items.filter(function(i) { return (i.status || '').toLowerCase() === 'overdue' }).length
  var upcomingCount = items.filter(function(i) { return (i.status || '').toLowerCase() === 'upcoming' }).length
  var requiredCount = items.filter(function(i) { return (i.status || '').toLowerCase() === 'required' }).length

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="font-display text-2xl text-[#1B4332] mb-1">Compliance & Regulatory Requirements</h2>
        <p className="text-xs text-gray-500">{building.building_id} – {building.building_name} · FY {building.budget_year || 2026}</p>
      </div>

      {/* Tab Purpose Note */}
      <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] px-4 py-3 flex items-start gap-2.5">
        <Info className="h-4 w-4 text-[#2D6A4F] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[#1B4332] leading-relaxed">
          This tab lists all regulatory and compliance requirements applicable to this building based on its location, age, and building class. Each requirement shows the associated GL code, annual and one-time costs, status, frequency, and next due date. Red badges indicate overdue items requiring immediate attention.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Total Annual Cost</p>
          <p className="font-display text-xl text-[#1B4332]">{formatCurrency(totalAnnual)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">One-Time Costs</p>
          <p className="font-display text-xl text-[#1B4332]">{formatCurrency(totalOneTime)}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Required</p>
          <p className="font-display text-xl text-green-600">{requiredCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Upcoming</p>
          <p className="font-display text-xl text-amber-600">{upcomingCount}</p>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Overdue</p>
          <p className="font-display text-xl text-red-600">{overdueCount}</p>
        </div>
      </div>

      {/* Compliance Table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {loading ? (
          <div className="px-4 py-12 text-center text-gray-400 text-xs">Loading compliance data...</div>
        ) : (
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#1B4332] text-white">
                <th className="px-4 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider">Requirement</th>
                <th className="px-3 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider w-[70px]">GL Code</th>
                <th className="px-3 py-2.5 text-right font-medium text-[10px] uppercase tracking-wider w-[90px]">Annual Cost</th>
                <th className="px-3 py-2.5 text-right font-medium text-[10px] uppercase tracking-wider w-[90px]">One-Time</th>
                <th className="px-3 py-2.5 text-center font-medium text-[10px] uppercase tracking-wider w-[90px]">Status</th>
                <th className="px-3 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider w-[90px]">Frequency</th>
                <th className="px-3 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider w-[90px]">Next Due</th>
                <th className="px-3 py-2.5 text-left font-medium text-[10px] uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-400">
                    No compliance records found for this building.
                  </td>
                </tr>
              )}
              {items.map(function(item) {
                var isOverdue = (item.status || '').toLowerCase() === 'overdue'
                return (
                  <tr key={item.id} className={'hover:bg-gray-50 ' + (isOverdue ? 'bg-red-50/30' : '')}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <Shield className={'h-3.5 w-3.5 flex-shrink-0 ' + (isOverdue ? 'text-red-500' : 'text-[#2D6A4F]')} />
                        <span className="font-medium text-gray-900">{item.requirement_name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-gray-500">{item.gl_code || '—'}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-700">{item.annual_cost > 0 ? formatCurrency(item.annual_cost) : '—'}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-gray-700">{item.one_time_cost > 0 ? formatCurrency(item.one_time_cost) : '—'}</td>
                    <td className="px-3 py-2.5 text-center"><StatusBadge status={item.status} /></td>
                    <td className="px-3 py-2.5 text-gray-600">{item.frequency || '—'}</td>
                    <td className="px-3 py-2.5 text-gray-600">
                      {item.next_due_date ? new Date(item.next_due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-3 py-2.5 text-gray-500 text-[10px] leading-relaxed max-w-[200px]">{item.notes || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
            {items.length > 0 && (
              <tfoot>
                <tr className="bg-[#1B4332]/5 font-bold border-t-2 border-[#1B4332]">
                  <td className="px-4 py-2.5 text-[#1B4332]" colSpan={2}>Total Compliance Costs</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[#1B4332]">{formatCurrency(totalAnnual)}</td>
                  <td className="px-3 py-2.5 text-right font-mono text-[#1B4332]">{formatCurrency(totalOneTime)}</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>
    </div>
  )
}
