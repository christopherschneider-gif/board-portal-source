export interface Building {
  id: string
  building_id: string
  building_name: string
  address: string
  borough: string
  units: number
  year_built: number
  building_class: string
  building_type: string
  square_footage: number
  budget_status: string
  assessment_change_pct: number
  quality_score: number
  pipeline_phase: number
  last_updated: string
  association_id: string
  fiscal_year_end: string
  budget_year: number
  reserve_balance: number
  projected_ending_cash: number
}

export interface BudgetLineItem {
  id: string
  building_id: string
  gl_code: string
  gl_name: string
  category: string
  subcategory: string
  parent_category: string
  indent_level: number
  is_subtotal: boolean
  sort_order: number
  actual_prior_year: number
  forecast_current_year: number
  recommended_amount: number
  scenario_amount: number
  board_adjusted_amount: number
  ai_recommendation: string
  edited_by: string
  edited_at: string
}

export interface PayrollRecord {
  id: string
  building_id: string
  position_title: string
  employee_name: string
  annual_salary: number
  benefits: number
  employer_taxes: number
  total_cost: number
  union_code: string
  notes: string
}

export interface InsurancePolicy {
  id: string
  building_id: string
  policy_type: string
  carrier: string
  annual_premium: number
  expiration_date: string
  coverage_limit: number
  prior_year_premium: number
  yoy_change_pct: number
  notes: string
}

export interface MortgageLoan {
  id: string
  building_id: string
  loan_name: string
  lender: string
  principal_payment: number
  interest_payment: number
  total_payment: number
  outstanding_balance: number
  interest_rate: number
  maturity_date: string
  loan_type: string
}

export type TabId =
  | 'summary'
  | 'currentreview'
  | 'recommendations'
  | 'trending'
  | 'budget'
  | 'income'
  | 'expenses'
  | 'payroll'
  | 'insurance'
  | 'mortgage'
  | 'compliance'
  | 'reserves'
