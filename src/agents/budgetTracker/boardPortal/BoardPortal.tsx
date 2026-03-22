import { useState } from 'react'
import { useBuildingData } from './useBuildingData'
import { ExecutiveSummary } from './components/ExecutiveSummary'
import { IntroductionTab } from './components/IntroductionTab'
import { CurrentYearReview } from './components/CurrentYearReview'
import { BudgetRecommendations } from './components/BudgetRecommendations'
import { HistoricalTrending } from './components/HistoricalTrending'
import { BudgetTable } from './components/BudgetTable'
import { IncomeTab } from './components/IncomeTab'
import { ExpensesTab } from './components/ExpensesTab'
import { PayrollTab } from './components/PayrollTab'
import { InsuranceTab } from './components/InsuranceTab'
import { MortgageTab } from './components/MortgageTab'
import { ComplianceTab } from './components/ComplianceTab'
import { ReservesTab } from './components/ReservesTab'
import type { TabId } from './lib/types'
import {
  LayoutDashboard,
  BookOpen,
  ClipboardList,
  Lightbulb,
  BarChart3,
  Table2,
  TrendingUp,
  PieChart,
  Users,
  Shield,
  Landmark,
  PiggyBank,
  ChevronDown,
  Loader2,
  AlertCircle,
  Building2,
} from 'lucide-react'

var TABS: { id: TabId; label: string; icon: typeof Table2 }[] = [
  { id: 'intro', label: 'Introduction', icon: BookOpen },
  { id: 'summary', label: 'Executive Summary', icon: LayoutDashboard },
  { id: 'currentreview', label: 'Current Year Review', icon: ClipboardList },
  { id: 'recommendations', label: 'Budget Recommendations', icon: Lightbulb },
  { id: 'budget', label: 'Budget Table', icon: Table2 },
  { id: 'trending', label: 'Historical Trending', icon: BarChart3 },
  { id: 'income', label: 'Income Summary', icon: TrendingUp },
  { id: 'expenses', label: 'Significant Expenses', icon: PieChart },
  { id: 'payroll', label: 'Payroll', icon: Users },
  { id: 'insurance', label: 'Insurance', icon: Shield },
  { id: 'mortgage', label: 'Mortgage', icon: Landmark },
  { id: 'compliance', label: 'Compliance', icon: Shield },
  { id: 'reserves', label: 'Reserve Adequacy', icon: PiggyBank },
]

export function BoardPortal() {
  var [activeTab, setActiveTab] = useState<TabId>('intro')
  var data = useBuildingData()

  return (
    <div className="bg-[#f5f5f0] min-h-0">
      {/* Building selector bar */}
      <div className="bg-[#1B4332] px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-[#2D7A4F]">
            <Building2 className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-white/80 text-sm font-body">Budget Planner</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-[#244A3A] px-4 py-1.5 border border-[#2D5A45]">
          <Building2 className="h-4 w-4 text-white/60" />
          <select value={data.selectedBuildingId || ''}
            onChange={function(e) { data.setSelectedBuildingId(e.target.value) }}
            className="appearance-none bg-transparent text-white text-sm font-body focus:outline-none min-w-[240px] cursor-pointer">
            {data.buildings.map(function(b) {
              return <option key={b.building_id} value={b.building_id} className="text-gray-900">{b.building_id} – {b.building_name}</option>
            })}
            {data.buildings.length === 0 && <option value="" className="text-gray-900">No buildings found</option>}
          </select>
          <ChevronDown className="h-4 w-4 text-white/60 pointer-events-none" />
        </div>
        <div />
      </div>

      {/* Tabs */}
      <nav className="border-b border-gray-200 bg-white">
        <div className="px-5 flex gap-0.5 overflow-x-auto">
          {TABS.map(function(tab) {
            var Icon = tab.icon
            var isActive = activeTab === tab.id
            return (
              <button key={tab.id} onClick={function() { setActiveTab(tab.id) }}
                className={'flex items-center gap-1 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs transition-colors ' +
                  (isActive ? 'border-[#1B4332] text-[#1B4332] font-medium' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700')}>
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            )
          })}
        </div>
      </nav>

      {/* Content */}
      <main className="px-5 py-5">
        {data.error && (
          <div className="mb-5 flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" /><p>{data.error}</p>
          </div>
        )}

        {data.loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <Loader2 className="h-8 w-8 animate-spin mb-3" /><p className="text-sm">Loading budget data…</p>
          </div>
        ) : (
          <>
            {activeTab === 'intro' && <IntroductionTab building={data.selectedBuilding} lineItems={data.lineItems} />}
            {activeTab === 'summary' && <ExecutiveSummary building={data.selectedBuilding} lineItems={data.lineItems} />}
            {activeTab === 'currentreview' && <CurrentYearReview building={data.selectedBuilding} lineItems={data.lineItems} />}
            {activeTab === 'recommendations' && <BudgetRecommendations building={data.selectedBuilding} />}
            {activeTab === 'trending' && <HistoricalTrending building={data.selectedBuilding} lineItems={data.lineItems} />}
            {activeTab === 'budget' && <BudgetTable building={data.selectedBuilding} lineItems={data.lineItems} onUpdate={data.updateLineItem} />}
            {activeTab === 'income' && <IncomeTab building={data.selectedBuilding} lineItems={data.lineItems.filter(function(i) { return i.category === 'income' })} />}
            {activeTab === 'expenses' && <ExpensesTab building={data.selectedBuilding} lineItems={data.lineItems.filter(function(i) { return i.category === 'expense' })} />}
            {activeTab === 'payroll' && <PayrollTab building={data.selectedBuilding} records={data.payroll} />}
            {activeTab === 'insurance' && <InsuranceTab building={data.selectedBuilding} policies={data.insurance} />}
            {activeTab === 'mortgage' && <MortgageTab building={data.selectedBuilding} loans={data.mortgages} />}
            {activeTab === 'compliance' && <ComplianceTab building={data.selectedBuilding} />}
            {activeTab === 'reserves' && <ReservesTab building={data.selectedBuilding} lineItems={data.lineItems} />}
          </>
        )}
      </main>
    </div>
  )
}
