'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────

type Step = {
  label: string
  description?: string
}

type StepIndicatorProps = {
  steps: Step[]
  /** Index courant, 0-based */
  currentStep: number
  className?: string
}

// ── Component ────────────────────────────────────────────────

export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <nav
      aria-label="Étapes du formulaire"
      className={cn('w-full', className)}
    >
      {/* Desktop — horizontal complet */}
      <ol className="hidden items-center sm:flex" role="list">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep
          const isActive = index === currentStep
          const isLast = index === steps.length - 1

          return (
            <li
              key={step.label}
              className={cn('flex items-center', !isLast && 'flex-1')}
            >
              {/* Step bubble + label */}
              <div className="flex flex-col items-center">
                <StepBubble
                  index={index}
                  isCompleted={isCompleted}
                  isActive={isActive}
                />
                <div className="mt-2 text-center">
                  <span
                    className={cn(
                      'block font-heading text-[12px] leading-tight whitespace-nowrap transition-colors duration-200',
                      isCompleted && 'text-[var(--apebi-cyan)] font-medium',
                      isActive && 'text-foreground font-semibold',
                      !isCompleted && !isActive && 'text-muted-foreground font-normal',
                    )}
                  >
                    {step.label}
                  </span>
                  {step.description && (
                    <span className="mt-0.5 block text-[11px] text-muted-foreground">
                      {step.description}
                    </span>
                  )}
                </div>
              </div>

              {/* Connector (pas sur le dernier) */}
              {!isLast && (
                <div
                  className="mx-3 mb-5 h-0.5 flex-1 rounded-full transition-colors duration-300"
                  style={{
                    background: isCompleted
                      ? 'var(--apebi-cyan)'
                      : 'var(--apebi-border)',
                  }}
                  aria-hidden
                />
              )}
            </li>
          )
        })}
      </ol>

      {/* Mobile — numéros seuls + label actif */}
      <div className="flex items-center gap-2 sm:hidden">
        <div className="flex items-center gap-1.5">
          {steps.map((step, index) => {
            const isCompleted = index < currentStep
            const isActive = index === currentStep

            return (
              <div key={step.label} className="flex items-center gap-1.5">
                <StepBubble
                  index={index}
                  isCompleted={isCompleted}
                  isActive={isActive}
                  size="sm"
                />
                {/* Connector mobile */}
                {index < steps.length - 1 && (
                  <div
                    className="h-0.5 w-4 rounded-full"
                    style={{
                      background: isCompleted
                        ? 'var(--apebi-cyan)'
                        : 'var(--apebi-border)',
                    }}
                    aria-hidden
                  />
                )}
              </div>
            )
          })}
        </div>

        {/* Label étape active sur mobile */}
        <div className="ml-2 min-w-0">
          <p className="truncate font-heading text-[13px] font-semibold text-foreground">
            {steps[currentStep]?.label}
          </p>
          <p className="text-[11px] text-muted-foreground">
            Étape {currentStep + 1} sur {steps.length}
          </p>
        </div>
      </div>
    </nav>
  )
}

// ── Step bubble ───────────────────────────────────────────────

function StepBubble({
  index,
  isCompleted,
  isActive,
  size = 'md',
}: {
  index: number
  isCompleted: boolean
  isActive: boolean
  size?: 'sm' | 'md'
}) {
  const dim = size === 'sm' ? 24 : 32
  const iconSize = size === 'sm' ? 12 : 16
  const fontSize = size === 'sm' ? 11 : 13

  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full transition-all duration-300"
      style={{
        width: dim,
        height: dim,
        background: isCompleted || isActive
          ? 'var(--apebi-cyan)'
          : 'var(--apebi-bg-alt)',
        border: isCompleted || isActive
          ? 'none'
          : '2px solid var(--apebi-border)',
        boxShadow: isActive
          ? '0 0 0 4px var(--apebi-cyan-muted)'
          : 'none',
      }}
      aria-current={isActive ? 'step' : undefined}
    >
      {isCompleted ? (
        <Check
          style={{ width: iconSize, height: iconSize, color: 'white' }}
          strokeWidth={2.5}
          aria-hidden
        />
      ) : (
        <span
          className="font-heading font-semibold leading-none"
          style={{
            fontSize,
            color: isActive ? 'white' : 'var(--apebi-text-light)',
          }}
          aria-hidden
        >
          {index + 1}
        </span>
      )}
    </div>
  )
}
