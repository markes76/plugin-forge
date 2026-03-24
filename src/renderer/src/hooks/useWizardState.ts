import { useState, useCallback, useMemo } from 'react'

export type PluginType = 'skills-only' | 'skills-agents' | 'full'

export interface WizardStep {
  id: string
  label: string
  requiredTypes: PluginType[]
}

const ALL_STEPS: WizardStep[] = [
  { id: 'type', label: 'Plugin Type', requiredTypes: ['skills-only', 'skills-agents', 'full'] },
  { id: 'identity', label: 'Identity', requiredTypes: ['skills-only', 'skills-agents', 'full'] },
  { id: 'skills', label: 'Skills', requiredTypes: ['skills-only', 'skills-agents', 'full'] },
  { id: 'agents', label: 'Agents', requiredTypes: ['skills-agents', 'full'] },
  { id: 'commands', label: 'Commands', requiredTypes: ['full'] },
  { id: 'hooks', label: 'Hooks', requiredTypes: ['full'] },
  { id: 'connectors', label: 'Connectors', requiredTypes: ['full'] },
  { id: 'review', label: 'Review', requiredTypes: ['skills-only', 'skills-agents', 'full'] }
]

interface InitialWizardState {
  pluginType: PluginType | null
  currentStepIndex: number
}

export function useWizardState(initial?: InitialWizardState) {
  const [pluginType, setPluginType] = useState<PluginType | null>(initial?.pluginType ?? null)
  const [currentStepIndex, setCurrentStepIndex] = useState(initial?.currentStepIndex ?? 0)

  const visibleSteps = useMemo(() => {
    if (!pluginType) return ALL_STEPS.filter((s) => s.id === 'type')
    return ALL_STEPS.filter((s) => s.requiredTypes.includes(pluginType))
  }, [pluginType])

  const currentStep = visibleSteps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === visibleSteps.length - 1
  const progress = visibleSteps.length > 1 ? currentStepIndex / (visibleSteps.length - 1) : 0

  const goNext = useCallback(() => {
    if (currentStepIndex < visibleSteps.length - 1) {
      setCurrentStepIndex((i) => i + 1)
    }
  }, [currentStepIndex, visibleSteps.length])

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((i) => i - 1)
    }
  }, [currentStepIndex])

  const goToStep = useCallback(
    (stepId: string) => {
      const idx = visibleSteps.findIndex((s) => s.id === stepId)
      if (idx >= 0) setCurrentStepIndex(idx)
    },
    [visibleSteps]
  )

  const selectPluginType = useCallback(
    (type: PluginType) => {
      setPluginType(type)
      // After selecting type, move to next step
      setCurrentStepIndex(1)
    },
    []
  )

  return {
    pluginType,
    selectPluginType,
    currentStep,
    currentStepIndex,
    visibleSteps,
    isFirstStep,
    isLastStep,
    progress,
    goNext,
    goBack,
    goToStep
  }
}
