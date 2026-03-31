import { useState, useEffect, useCallback } from 'react'
import { supabase } from './lib/supabase'
import type { Building, BudgetLineItem, PayrollRecord, InsurancePolicy, MortgageLoan, PropertyTaxAssessment } from './lib/types'

export function useBuildingData() {
  const [buildings, setBuildings] = useState<Building[]>([])
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null)
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([])
  const [payroll, setPayroll] = useState<PayrollRecord[]>([])
  const [insurance, setInsurance] = useState<InsurancePolicy[]>([])
  const [mortgages, setMortgages] = useState<MortgageLoan[]>([])
  const [propertyTax, setPropertyTax] = useState<PropertyTaxAssessment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch building list
  useEffect(() => {
    async function fetchBuildings() {
      const { data, error } = await supabase
        .from('buildings')
        .select('*')
        .order('building_name')

      if (error) {
        setError('Failed to load buildings: ' + error.message)
        setLoading(false)
        return
      }

      setBuildings(data || [])
      if (data && data.length > 0) {
        setSelectedBuildingId(data[0].building_id)
      }
      setLoading(false)
    }

    fetchBuildings()
  }, [])

  // Fetch all data when building changes
  useEffect(() => {
    if (!selectedBuildingId) return

    async function fetchAll() {
      setLoading(true)

      const [lineRes, payRes, insRes, mortRes, ptaxRes] = await Promise.all([
        supabase
          .from('budget_line_items')
          .select('*')
          .eq('building_id', selectedBuildingId)
          .order('sort_order', { ascending: true }),
        supabase
          .from('payroll')
          .select('*')
          .eq('building_id', selectedBuildingId),
        supabase
          .from('v_insurance_board_portal')
          .select('*')
          .eq('building_id', selectedBuildingId),
        supabase
          .from('mortgages')
          .select('*')
          .eq('building_id', selectedBuildingId),
        supabase
          .from('v_property_tax_board_portal')
          .select('*')
          .eq('building_id', selectedBuildingId)
          .order('tax_year', { ascending: false }),
      ])

      if (lineRes.error) {
        setError('Failed to load budget: ' + lineRes.error.message)
      }

      setLineItems(lineRes.data || [])
      setPayroll(payRes.data || [])
      setInsurance(insRes.data || [])
      setMortgages(mortRes.data || [])
      setPropertyTax(ptaxRes.data || [])
      setLoading(false)
    }

    fetchAll()
  }, [selectedBuildingId])

  var selectedBuilding = buildings.find(
    function(b) { return b.building_id === selectedBuildingId }
  ) || null

  // Update a line item (board_adjusted_amount)
  var updateLineItem = useCallback(
    async function(id: string, field: string, value: number) {
      var result = await supabase
        .from('budget_line_items')
        .update({ [field]: value, edited_at: new Date().toISOString() })
        .eq('id', id)

      if (result.error) {
        console.error('Update failed:', result.error)
        return
      }

      setLineItems(function(prev) {
        return prev.map(function(item) {
          return item.id === id ? Object.assign({}, item, { [field]: value }) : item
        })
      })
    },
    []
  )

  return {
    buildings,
    selectedBuilding,
    selectedBuildingId,
    setSelectedBuildingId,
    lineItems,
    payroll,
    insurance,
    mortgages,
    propertyTax,
    loading,
    error,
    updateLineItem,
  }
}
