import { Check, ArrowLeft, ArrowRight } from 'lucide-react'
import type { WizardStep } from '@/hooks/useWizardState'

interface WizardShellProps {
  visibleSteps: WizardStep[]
  currentStepIndex: number
  isFirstStep: boolean
  isLastStep: boolean
  onBack: () => void
  onNext: () => void
  onGoToStep: (stepId: string) => void
  canAdvance: boolean
  children: React.ReactNode
}

export function WizardShell({
  visibleSteps,
  currentStepIndex,
  isFirstStep,
  isLastStep,
  onBack,
  onNext,
  onGoToStep,
  canAdvance,
  children
}: WizardShellProps) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Step indicator */}
      <div
        className="px-8 py-4 border-b flex items-center gap-2"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}
      >
        {visibleSteps.map((step, i) => {
          const isCompleted = i < currentStepIndex
          const isCurrent = i === currentStepIndex
          const isFuture = i > currentStepIndex

          return (
            <div key={step.id} className="flex items-center gap-2">
              {i > 0 && (
                <div
                  className="w-8 h-px"
                  style={{
                    backgroundColor: isCompleted ? 'var(--accent)' : 'var(--border)'
                  }}
                />
              )}
              <button
                onClick={() => isCompleted && onGoToStep(step.id)}
                className="flex items-center gap-1.5"
                disabled={isFuture}
                style={{ cursor: isCompleted ? 'pointer' : isFuture ? 'default' : 'default' }}
              >
                <div
                  className="w-6 h-6 rounded-full flex items-center justify-center text-small font-medium transition-colors"
                  style={{
                    backgroundColor: isCurrent
                      ? 'var(--accent)'
                      : isCompleted
                        ? 'var(--accent)'
                        : 'var(--bg-input)',
                    color: isCurrent || isCompleted ? 'var(--text-on-accent)' : 'var(--text-muted)',
                    border: isFuture ? '1px solid var(--border)' : 'none'
                  }}
                >
                  {isCompleted ? <Check size={12} /> : i + 1}
                </div>
                <span
                  className="text-small hidden sm:inline"
                  style={{
                    color: isCurrent
                      ? 'var(--text-primary)'
                      : isCompleted
                        ? 'var(--text-secondary)'
                        : 'var(--text-muted)'
                  }}
                >
                  {step.label}
                </span>
              </button>
            </div>
          )
        })}
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">{children}</div>

      {/* Navigation buttons */}
      <div
        className="px-8 py-4 border-t flex items-center justify-between"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--bg-base)' }}
      >
        <button
          onClick={onBack}
          disabled={isFirstStep}
          className="flex items-center gap-1.5 text-body px-4 py-2 rounded transition-colors"
          style={{
            backgroundColor: isFirstStep ? 'transparent' : 'var(--bg-elevated)',
            color: isFirstStep ? 'var(--text-muted)' : 'var(--text-secondary)',
            border: isFirstStep ? 'none' : '1px solid var(--border)',
            cursor: isFirstStep ? 'default' : 'pointer',
            opacity: isFirstStep ? 0.4 : 1
          }}
        >
          <ArrowLeft size={14} />
          Back
        </button>

        <button
          onClick={onNext}
          disabled={!canAdvance}
          className="flex items-center gap-1.5 text-body font-medium px-5 py-2 rounded transition-colors"
          data-accent="true"
          style={{
            backgroundColor: canAdvance ? 'var(--accent)' : 'var(--bg-elevated)',
            color: canAdvance ? 'var(--text-on-accent)' : 'var(--text-muted)',
            cursor: canAdvance ? 'pointer' : 'default',
            opacity: canAdvance ? 1 : 0.5
          }}
        >
          {isLastStep ? 'Generate Plugin' : 'Next'}
          {!isLastStep && <ArrowRight size={14} />}
        </button>
      </div>
    </div>
  )
}
