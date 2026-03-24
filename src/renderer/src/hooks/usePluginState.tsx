import { useReducer, useCallback, createContext, useContext, type ReactNode } from 'react'
import { nanoid } from 'nanoid'
import type {
  PluginState,
  PluginMetadata,
  PluginComponent,
  SkillComponent,
  AgentComponent,
  CommandComponent,
  HooksComponent,
  McpServersComponent,
  HookRule,
  McpServerEntry
} from '@/types/plugin'

// ── Actions ──

type PluginAction =
  | { type: 'SET_METADATA'; payload: Partial<PluginMetadata> }
  | { type: 'ADD_COMPONENT'; payload: PluginComponent }
  | { type: 'UPDATE_COMPONENT'; payload: { id: string; changes: Partial<PluginComponent> } }
  | { type: 'REMOVE_COMPONENT'; payload: { id: string } }
  | { type: 'SET_ACTIVE_COMPONENT'; payload: { id: string | undefined } }
  | { type: 'ADD_HOOK_RULE'; payload: HookRule }
  | { type: 'UPDATE_HOOK_RULE'; payload: { id: string; changes: Partial<HookRule> } }
  | { type: 'REMOVE_HOOK_RULE'; payload: { id: string } }
  | { type: 'ADD_MCP_SERVER'; payload: McpServerEntry }
  | { type: 'UPDATE_MCP_SERVER'; payload: { id: string; changes: Partial<McpServerEntry> } }
  | { type: 'REMOVE_MCP_SERVER'; payload: { id: string } }
  | { type: 'SET_MCP_MODE'; payload: { mode: 'cowork' | 'claude-code' } }
  | { type: 'SET_COWORK_CONNECTORS'; payload: { connectors: string[] } }
  | { type: 'LOAD_STATE'; payload: PluginState }
  | { type: 'MARK_SAVED'; payload: { timestamp: number } }
  | { type: 'SET_OUTPUT_PATH'; payload: { path: string } }
  | { type: 'RESET' }

// ── Reducer ──

function pluginReducer(state: PluginState, action: PluginAction): PluginState {
  switch (action.type) {
    case 'SET_METADATA':
      return { ...state, metadata: { ...state.metadata, ...action.payload }, isDirty: true }

    case 'ADD_COMPONENT':
      return { ...state, components: [...state.components, action.payload], isDirty: true }

    case 'UPDATE_COMPONENT': {
      const { id, changes } = action.payload
      return {
        ...state,
        components: state.components.map((c) =>
          c.id === id ? ({ ...c, ...changes } as PluginComponent) : c
        ),
        isDirty: true
      }
    }

    case 'REMOVE_COMPONENT':
      return {
        ...state,
        components: state.components.filter((c) => c.id !== action.payload.id),
        activeComponentId:
          state.activeComponentId === action.payload.id ? undefined : state.activeComponentId,
        isDirty: true
      }

    case 'SET_ACTIVE_COMPONENT':
      return { ...state, activeComponentId: action.payload.id }

    case 'ADD_HOOK_RULE': {
      const hooks = state.components.find((c) => c.type === 'hooks') as HooksComponent | undefined
      if (!hooks) {
        const newHooks: HooksComponent = {
          type: 'hooks',
          id: nanoid(),
          rules: [action.payload]
        }
        return { ...state, components: [...state.components, newHooks], isDirty: true }
      }
      return {
        ...state,
        components: state.components.map((c) =>
          c.type === 'hooks' ? { ...c, rules: [...(c as HooksComponent).rules, action.payload] } : c
        ),
        isDirty: true
      }
    }

    case 'UPDATE_HOOK_RULE':
      return {
        ...state,
        components: state.components.map((c) =>
          c.type === 'hooks'
            ? {
                ...c,
                rules: (c as HooksComponent).rules.map((r) =>
                  r.id === action.payload.id ? { ...r, ...action.payload.changes } : r
                )
              }
            : c
        ),
        isDirty: true
      }

    case 'REMOVE_HOOK_RULE':
      return {
        ...state,
        components: state.components.map((c) =>
          c.type === 'hooks'
            ? { ...c, rules: (c as HooksComponent).rules.filter((r) => r.id !== action.payload.id) }
            : c
        ),
        isDirty: true
      }

    case 'ADD_MCP_SERVER': {
      const mcp = state.components.find((c) => c.type === 'mcpServers') as McpServersComponent | undefined
      if (!mcp) {
        const newMcp: McpServersComponent = {
          type: 'mcpServers',
          id: nanoid(),
          mcpMode: 'cowork',
          servers: [action.payload],
          coworkConnectors: []
        }
        return { ...state, components: [...state.components, newMcp], isDirty: true }
      }
      return {
        ...state,
        components: state.components.map((c) =>
          c.type === 'mcpServers'
            ? { ...c, servers: [...(c as McpServersComponent).servers, action.payload] }
            : c
        ),
        isDirty: true
      }
    }

    case 'UPDATE_MCP_SERVER':
      return {
        ...state,
        components: state.components.map((c) =>
          c.type === 'mcpServers'
            ? {
                ...c,
                servers: (c as McpServersComponent).servers.map((s) =>
                  s.id === action.payload.id ? { ...s, ...action.payload.changes } : s
                )
              }
            : c
        ),
        isDirty: true
      }

    case 'REMOVE_MCP_SERVER':
      return {
        ...state,
        components: state.components.map((c) =>
          c.type === 'mcpServers'
            ? {
                ...c,
                servers: (c as McpServersComponent).servers.filter(
                  (s) => s.id !== action.payload.id
                )
              }
            : c
        ),
        isDirty: true
      }

    case 'SET_MCP_MODE':
      return { ...state, mcpMode: action.payload.mode, isDirty: true }

    case 'SET_COWORK_CONNECTORS':
      return { ...state, coworkConnectors: action.payload.connectors, isDirty: true }

    case 'LOAD_STATE':
      return { ...action.payload, isDirty: false, mcpMode: action.payload.mcpMode || 'cowork', coworkConnectors: action.payload.coworkConnectors || [] }

    case 'MARK_SAVED':
      return { ...state, isDirty: false, lastSavedAt: action.payload.timestamp }

    case 'SET_OUTPUT_PATH':
      return { ...state, outputPath: action.payload.path }

    case 'RESET':
      return createInitialState()

    default:
      return state
  }
}

// ── Initial state ──

export function createInitialState(): PluginState {
  return {
    id: nanoid(),
    metadata: {
      name: '',
      version: '1.0.0',
      description: '',
      author: { name: '' },
      license: 'MIT',
      keywords: []
    },
    components: [],
    isDirty: false,
    activeComponentId: undefined,
    mcpMode: 'cowork',
    coworkConnectors: []
  }
}

// ── Context ──

interface PluginContextValue {
  state: PluginState
  dispatch: React.Dispatch<PluginAction>
  // Convenience helpers
  addSkill: () => string
  addAgent: () => string
  addCommand: () => string
  addHookRule: () => string
  addMcpServer: () => string
}

const PluginContext = createContext<PluginContextValue | null>(null)

export function PluginProvider({ children, initialState }: { children: ReactNode; initialState?: PluginState }) {
  // Normalize loaded state: ensure new fields have defaults for backward compat
  const normalized = initialState
    ? { ...createInitialState(), ...initialState, mcpMode: initialState.mcpMode || 'cowork', coworkConnectors: initialState.coworkConnectors || [] }
    : createInitialState()
  const [state, dispatch] = useReducer(pluginReducer, normalized)

  const addSkill = useCallback(() => {
    const id = nanoid()
    const skill: SkillComponent = {
      type: 'skill',
      id,
      name: '',
      description: '',
      body: '',
      scripts: [],
      references: []
    }
    dispatch({ type: 'ADD_COMPONENT', payload: skill })
    dispatch({ type: 'SET_ACTIVE_COMPONENT', payload: { id } })
    return id
  }, [])

  const addAgent = useCallback(() => {
    const id = nanoid()
    const agent: AgentComponent = {
      type: 'agent',
      id,
      name: '',
      description: '',
      body: ''
    }
    dispatch({ type: 'ADD_COMPONENT', payload: agent })
    dispatch({ type: 'SET_ACTIVE_COMPONENT', payload: { id } })
    return id
  }, [])

  const addCommand = useCallback(() => {
    const id = nanoid()
    const command: CommandComponent = {
      type: 'command',
      id,
      name: '',
      description: '',
      body: ''
    }
    dispatch({ type: 'ADD_COMPONENT', payload: command })
    dispatch({ type: 'SET_ACTIVE_COMPONENT', payload: { id } })
    return id
  }, [])

  const addHookRule = useCallback(() => {
    const id = nanoid()
    const rule: HookRule = {
      id,
      event: 'PreToolUse',
      hookType: 'prompt',
      prompt: ''
    }
    dispatch({ type: 'ADD_HOOK_RULE', payload: rule })
    return id
  }, [])

  const addMcpServer = useCallback(() => {
    const id = nanoid()
    const server: McpServerEntry = {
      id,
      name: '',
      command: '',
      args: [],
      env: {}
    }
    dispatch({ type: 'ADD_MCP_SERVER', payload: server })
    return id
  }, [])

  return (
    <PluginContext.Provider value={{ state, dispatch, addSkill, addAgent, addCommand, addHookRule, addMcpServer }}>
      {children}
    </PluginContext.Provider>
  )
}

export function usePlugin() {
  const ctx = useContext(PluginContext)
  if (!ctx) throw new Error('usePlugin must be used within PluginProvider')
  return ctx
}
