import { useState } from 'react'
import { Lightbulb, Info, MessageSquare } from 'lucide-react'
import { formatPercent } from '../lib/format'
import type { Building } from '../lib/types'

interface Props {
  building: Building | null
}

export function BudgetRecommendations({ building }: Props) {
  var [comment1, setComment1] = useState('')
  var [comment2, setComment2] = useState('')
  var [comment3, setComment3] = useState('')
  var [generalNote, setGeneralNote] = useState('')

  if (!building) return <div className="text-center py-16 text-gray-400">Select a building.</div>

  return (
    <div>
      <div className="flex items-center justify-center gap-2 mb-2">
        <Lightbulb className="h-4 w-4 text-[#2D7A4F]" />
        <h2 className="font-display text-xl text-[#1B4332]">Budget Recommendations</h2>
      </div>

      <div className="rounded-lg bg-[#E8F5EE] border border-[#B7E4C7] px-3 py-2 mb-4 max-w-4xl mx-auto flex items-start gap-2">
        <Info className="h-3.5 w-3.5 text-[#2D6A4F] mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-[#1B4332] leading-relaxed">
          Answers the key questions board members ask. Use the comment fields to add context.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* 3 Recommendations in a compact grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {/* Q1 */}
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-2">Do owner charges need to increase?</p>
            <div className="rounded bg-[#E8F5EE] px-4 py-2 text-center mb-2">
              <p className="font-display text-3xl text-[#1B4332]">{formatPercent(building.assessment_change_pct || 0).replace('+', '')}</p>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <MessageSquare className="h-2.5 w-2.5 text-[#2D6A4F]" />
              <span className="text-[8px] font-medium text-[#1B4332] uppercase tracking-wider">Finance / AM Comment</span>
            </div>
            <textarea value={comment1} onChange={function(e) { setComment1(e.target.value) }}
              placeholder="Add notes for the board..."
              className="w-full rounded border border-gray-200 bg-[#FAFAF8] px-2 py-1.5 text-[10px] text-gray-700 placeholder-gray-400 focus:border-[#2D6A4F] focus:outline-none resize-none"
              rows={2} />
          </div>

          {/* Q2 */}
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-2">Special assessment needed?</p>
            <div className="rounded bg-[#E8F5EE] px-4 py-2 text-center mb-2">
              <p className="font-display text-3xl text-[#1B4332]">$0</p>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <MessageSquare className="h-2.5 w-2.5 text-[#2D6A4F]" />
              <span className="text-[8px] font-medium text-[#1B4332] uppercase tracking-wider">Finance / AM Comment</span>
            </div>
            <textarea value={comment2} onChange={function(e) { setComment2(e.target.value) }}
              placeholder="Add notes on reserve strategy..."
              className="w-full rounded border border-gray-200 bg-[#FAFAF8] px-2 py-1.5 text-[10px] text-gray-700 placeholder-gray-400 focus:border-[#2D6A4F] focus:outline-none resize-none"
              rows={2} />
          </div>

          {/* Q3 */}
          <div className="rounded-lg border border-gray-200 bg-white p-3">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider mb-2">Previous assessment remaining</p>
            <div className="rounded bg-[#E8F5EE] px-4 py-2 text-center mb-2">
              <p className="font-display text-3xl text-[#1B4332]">$0</p>
            </div>
            <div className="flex items-center gap-1 mb-1">
              <MessageSquare className="h-2.5 w-2.5 text-[#2D6A4F]" />
              <span className="text-[8px] font-medium text-[#1B4332] uppercase tracking-wider">Finance / AM Comment</span>
            </div>
            <textarea value={comment3} onChange={function(e) { setComment3(e.target.value) }}
              placeholder="Add notes on prior assessments..."
              className="w-full rounded border border-gray-200 bg-[#FAFAF8] px-2 py-1.5 text-[10px] text-gray-700 placeholder-gray-400 focus:border-[#2D6A4F] focus:outline-none resize-none"
              rows={2} />
          </div>
        </div>

        {/* General notes - compact */}
        <div className="rounded-lg border border-dashed border-gray-300 bg-[#FAFAF8] p-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageSquare className="h-3 w-3 text-[#2D6A4F]" />
            <label className="text-[10px] font-medium text-[#1B4332]">Additional Notes for the Board</label>
          </div>
          <textarea value={generalNote} onChange={function(e) { setGeneralNote(e.target.value) }}
            placeholder="Add any additional context, explanations, or recommendations for the board..."
            className="w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-[10px] text-gray-700 placeholder-gray-400 focus:border-[#2D6A4F] focus:outline-none resize-y min-h-[40px]"
            rows={2} />
        </div>
      </div>
    </div>
  )
}
