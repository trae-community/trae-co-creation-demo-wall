'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export type StepNumber = 1 | 2 | 3 | 4

const STEPS: { n: StepNumber; label: string }[] = [
  { n: 1, label: '基本信息' },
  { n: 2, label: '视觉素材' },
  { n: 3, label: '创作详情' },
  { n: 4, label: '团队信息' },
]

interface StepIndicatorProps {
  current: StepNumber
  onStepClick: (n: StepNumber) => void
}

export function StepIndicator({ current, onStepClick }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-between mb-10">
      {STEPS.map((step, idx) => {
        const done = step.n < current
        const active = step.n === current
        const clickable = step.n < current

        return (
          <div key={step.n} className="flex items-center flex-1 last:flex-none">
            {/* Step circle + label */}
            <button
              type="button"
              onClick={() => clickable && onStepClick(step.n)}
              disabled={!clickable}
              className={cn(
                "flex flex-col items-center gap-1.5 group",
                clickable ? "cursor-pointer" : "cursor-default"
              )}
            >
              <div
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 border-2",
                  done && "bg-green-500 border-green-500 text-black",
                  active && "border-green-500 text-green-400 bg-transparent shadow-[0_0_16px_rgba(34,197,94,0.3)]",
                  !done && !active && "border-zinc-700 text-zinc-600 bg-transparent"
                )}
              >
                {done ? <Check className="w-4 h-4" /> : step.n}
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap",
                  active && "text-green-400",
                  done && "text-zinc-400",
                  !done && !active && "text-zinc-600"
                )}
              >
                {step.label}
              </span>
            </button>

            {/* Connector line (not after last step) */}
            {idx < STEPS.length - 1 && (
              <div className="flex-1 mx-2 mt-[-12px]">
                <div
                  className={cn(
                    "h-0.5 w-full transition-all duration-500",
                    step.n < current ? "bg-green-500" : "bg-zinc-700"
                  )}
                />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
