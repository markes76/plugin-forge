import { useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { nanoid } from 'nanoid'
import { PluginProvider, usePlugin, createInitialState } from '@/hooks/usePluginState'
import { useWizardState, type PluginType } from '@/hooks/useWizardState'
import { useManualSave } from '@/hooks/useAutosave'
import { WizardShell } from '@/components/wizard/WizardShell'
import { StepPluginType } from '@/components/wizard/StepPluginType'
import { StepIdentity } from '@/components/wizard/StepIdentity'
import { StepSkills } from '@/components/wizard/StepSkills'
import { StepAgents } from '@/components/wizard/StepAgents'
import { StepCommands } from '@/components/wizard/StepCommands'
import { StepHooks } from '@/components/wizard/StepHooks'
import { StepConnectors } from '@/components/wizard/StepConnectors'
import { StepReview } from '@/components/wizard/StepReview'
import { SaveIndicator } from '@/components/shared/SaveIndicator'
import { generatePlugin } from '@/lib/plugin-generator'
import type {
  PluginState,
  SkillComponent,
  AgentComponent,
  CommandComponent,
  HookRule,
  HooksComponent,
  McpServersComponent,
  WizardState
} from '@/types/plugin'
import { useState } from 'react'

export function Wizard() {
  const { id: pluginId } = useParams<{ id: string }>()
  const [loadedState, setLoadedState] = useState<PluginState | undefined>(undefined)
  const [loadedWizardState, setLoadedWizardState] = useState<WizardState | undefined>(undefined)
  const [loading, setLoading] = useState(!!pluginId)

  // Load existing draft by ID
  useEffect(() => {
    if (!pluginId) {
      setLoading(false)
      return
    }
    async function load() {
      const draft = await window.pluginForge.loadDraft(pluginId!)
      if (draft?.pluginState) {
        setLoadedState(draft.pluginState as PluginState)
        if (draft.wizardState) {
          setLoadedWizardState(draft.wizardState as WizardState)
        }
      }
      setLoading(false)
    }
    load()
  }, [pluginId])

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-body" style={{ color: 'var(--text-muted)' }}>Resuming your draft...</p>
      </div>
    )
  }

  return (
    <PluginProvider initialState={loadedState}>
      <WizardInner initialWizardState={loadedWizardState} />
    </PluginProvider>
  )
}

interface WizardInnerProps {
  initialWizardState?: WizardState
}

function WizardInner({ initialWizardState }: WizardInnerProps) {
  const { state, dispatch } = usePlugin()
  const wizard = useWizardState(initialWizardState)

  // Wire up manual save with wizard state
  const { saveStatus, hasUnsavedChanges, save } = useManualSave({
    pluginState: state,
    wizardState: {
      pluginType: wizard.pluginType,
      currentStepIndex: wizard.currentStepIndex
    },
    mode: 'wizard',
    wizardStep: wizard.currentStepIndex
  })

  // No auto-draft creation. Draft is created only when user explicitly clicks Save.

  // Derived component lists
  const skills = state.components.filter((c) => c.type === 'skill') as SkillComponent[]
  const agents = state.components.filter((c) => c.type === 'agent') as AgentComponent[]
  const commands = state.components.filter((c) => c.type === 'command') as CommandComponent[]
  const hooksComp = state.components.find((c) => c.type === 'hooks') as HooksComponent | undefined
  const hookRules = hooksComp?.rules || []
  const mcpComp = state.components.find((c) => c.type === 'mcpServers') as McpServersComponent | undefined
  const mcpServers = mcpComp?.servers || []

  // Ensure at least one component exists when entering relevant steps
  useEffect(() => {
    if (wizard.currentStep?.id === 'skills' && skills.length === 0) {
      dispatch({
        type: 'ADD_COMPONENT',
        payload: { type: 'skill', id: nanoid(), name: '', description: '', body: '', scripts: [], references: [] }
      })
    }
    if (wizard.currentStep?.id === 'agents' && agents.length === 0) {
      dispatch({
        type: 'ADD_COMPONENT',
        payload: { type: 'agent', id: nanoid(), name: '', description: '', body: '' }
      })
    }
    if (wizard.currentStep?.id === 'commands' && commands.length === 0) {
      dispatch({
        type: 'ADD_COMPONENT',
        payload: { type: 'command', id: nanoid(), name: '', description: '', body: '' }
      })
    }
  }, [wizard.currentStep?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Can advance?
  const canAdvance = (() => {
    if (!wizard.currentStep) return false
    switch (wizard.currentStep.id) {
      case 'type':
        return wizard.pluginType !== null
      case 'identity':
        return state.metadata.name.length > 0 && state.metadata.description.length > 0
      case 'skills':
        return skills.some((s) => s.name && s.body)
      case 'agents':
        return agents.some((a) => a.name && a.description)
      case 'commands':
        return commands.some((c) => c.name && c.body)
      case 'hooks':
        return true
      case 'connectors':
        return true
      case 'review':
        return true
      default:
        return true
    }
  })()

  const handleGenerate = useCallback(async () => {
    const files = generatePlugin(state)
    const dir = await window.pluginForge.selectDirectory()
    if (!dir) return

    const outputPath = `${dir}/${state.metadata.name}`
    try {
      await window.pluginForge.writePlugin(outputPath, files)
      await window.pluginForge.saveGeneratedState(state.id, state)
      await window.pluginForge.updateRegistryEntry(state.id, {
        status: 'generated',
        generatedAt: new Date().toISOString(),
        lastOutputPath: outputPath
      })
    } catch (err) {
      console.error('Generation failed:', err)
    }
  }, [state])

  // Save immediately on Next click, then advance
  const handleNext = useCallback(async () => {
    if (wizard.isLastStep) {
      await handleGenerate()
    } else {
      // Save before advancing
      await save()
      wizard.goNext()
    }
  }, [wizard, handleGenerate, save])

  // Skill CRUD
  const addSkill = () => {
    dispatch({
      type: 'ADD_COMPONENT',
      payload: { type: 'skill', id: nanoid(), name: '', description: '', body: '', scripts: [], references: [] }
    })
  }
  const updateSkill = (id: string, changes: Partial<SkillComponent>) => {
    dispatch({ type: 'UPDATE_COMPONENT', payload: { id, changes } })
  }
  const removeSkill = (id: string) => {
    dispatch({ type: 'REMOVE_COMPONENT', payload: { id } })
  }

  // Agent CRUD
  const addAgent = () => {
    dispatch({
      type: 'ADD_COMPONENT',
      payload: { type: 'agent', id: nanoid(), name: '', description: '', body: '' }
    })
  }
  const updateAgent = (id: string, changes: Partial<AgentComponent>) => {
    dispatch({ type: 'UPDATE_COMPONENT', payload: { id, changes } })
  }
  const removeAgent = (id: string) => {
    dispatch({ type: 'REMOVE_COMPONENT', payload: { id } })
  }

  // Command CRUD
  const addCommand = () => {
    dispatch({
      type: 'ADD_COMPONENT',
      payload: { type: 'command', id: nanoid(), name: '', description: '', body: '' }
    })
  }
  const updateCommand = (id: string, changes: Partial<CommandComponent>) => {
    dispatch({ type: 'UPDATE_COMPONENT', payload: { id, changes } })
  }
  const removeCommand = (id: string) => {
    dispatch({ type: 'REMOVE_COMPONENT', payload: { id } })
  }

  // Hook CRUD
  const addHook = () => {
    dispatch({
      type: 'ADD_HOOK_RULE',
      payload: { id: nanoid(), event: 'PostToolUse', matcher: 'Write|Edit', hookType: 'prompt', prompt: '' }
    })
  }
  const updateHook = (id: string, changes: Partial<HookRule>) => {
    dispatch({ type: 'UPDATE_HOOK_RULE', payload: { id, changes } })
  }
  const removeHook = (id: string) => {
    dispatch({ type: 'REMOVE_HOOK_RULE', payload: { id } })
  }



  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Save indicator in a thin header bar */}
      <div
        className="h-8 px-4 flex items-center justify-end flex-shrink-0"
        style={{ backgroundColor: 'var(--bg-base)' }}
      >
        <SaveIndicator status={saveStatus} hasUnsavedChanges={hasUnsavedChanges} onSave={save} />
      </div>

      <WizardShell
        visibleSteps={wizard.visibleSteps}
        currentStepIndex={wizard.currentStepIndex}
        isFirstStep={wizard.isFirstStep}
        isLastStep={wizard.isLastStep}
        onBack={wizard.goBack}
        onNext={handleNext}
        onGoToStep={wizard.goToStep}
        canAdvance={canAdvance}
      >
        {wizard.currentStep?.id === 'type' && (
          <StepPluginType selected={wizard.pluginType} onSelect={wizard.selectPluginType} />
        )}
        {wizard.currentStep?.id === 'identity' && (
          <StepIdentity
            metadata={state.metadata}
            onUpdate={(changes) => dispatch({ type: 'SET_METADATA', payload: changes })}
          />
        )}
        {wizard.currentStep?.id === 'skills' && (
          <StepSkills
            skills={skills}
            onAdd={addSkill}
            onUpdate={updateSkill}
            onRemove={removeSkill}
          />
        )}
        {wizard.currentStep?.id === 'agents' && (
          <StepAgents
            agents={agents}
            onAdd={addAgent}
            onUpdate={updateAgent}
            onRemove={removeAgent}
          />
        )}
        {wizard.currentStep?.id === 'commands' && (
          <StepCommands
            commands={commands}
            pluginName={state.metadata.name}
            onAdd={addCommand}
            onUpdate={updateCommand}
            onRemove={removeCommand}
          />
        )}
        {wizard.currentStep?.id === 'hooks' && (
          <StepHooks
            rules={hookRules}
            onAdd={addHook}
            onUpdate={updateHook}
            onRemove={removeHook}
          />
        )}
        {wizard.currentStep?.id === 'connectors' && (
          <StepConnectors
            selectedIds={state.coworkConnectors}
            onUpdate={(ids) => dispatch({ type: 'SET_COWORK_CONNECTORS', payload: { connectors: ids } })}
          />
        )}
        {wizard.currentStep?.id === 'review' && (
          <StepReview
            state={state}
            onGenerate={handleGenerate}
            onGoToStep={wizard.goToStep}
          />
        )}
      </WizardShell>
    </div>
  )
}
