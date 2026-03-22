import coaData from './coa.json'

// COA category order map — single source of truth for FSLI ordering
var orderMap = new Map<string, number>()
coaData.forEach(function(row: any) {
  var cat = row.category as string
  if (!orderMap.has(cat)) {
    orderMap.set(cat, row.category_order as number)
  }
})

export function getFSLIOrder(categoryName: string): number {
  return orderMap.get(categoryName) || 99
}
