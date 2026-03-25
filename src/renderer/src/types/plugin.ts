// ── Primitive types ──

export type ModelId = 'opus' | 'sonnet' | 'haiku'
export type EffortLevel = 'low' | 'medium' | 'high'
export type HookEvent =
  | 'SessionStart' | 'UserPromptSubmit' | 'PreToolUse' | 'PermissionRequest'
  | 'PostToolUse' | 'PostToolUseFailure' | 'Notification'
  | 'SubagentStart' | 'SubagentStop' | 'Stop' | 'StopFailure'
  | 'TeammateIdle' | 'TaskCompleted' | 'InstructionsLoaded' | 'ConfigChange'
  | 'WorktreeCreate' | 'WorktreeRemove' | 'PreCompact' | 'PostCompact'
  | 'Elicitation' | 'ElicitationResult' | 'SessionEnd'
export type HookType = 'command' | 'prompt' | 'agent' | 'http'
export type LicenseId = 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'BSD-3-Clause' | 'ISC' | 'UNLICENSED'

export interface Author {
  name: string
  email?: string
  url?: string
}

// ── Component types (discriminated union) ──

export interface FileAttachment {
  id: string
  filename: string
  content: string
  mimeType: string
}

export interface SkillComponent {
  type: 'skill'
  id: string
  name: string
  description: string
  version?: string
  allowedTools?: string[]
  body: string
  scripts: FileAttachment[]
  references: FileAttachment[]
}

export interface AgentComponent {
  type: 'agent'
  id: string
  name: string
  description: string
  model?: ModelId
  effort?: EffortLevel
  maxTurns?: number
  tools?: string[]
  disallowedTools?: string[]
  memory?: boolean
  background?: boolean
  isolation?: boolean
  body: string
}

export interface CommandComponent {
  type: 'command'
  id: string
  name: string
  description: string
  body: string
}

export interface HookRule {
  id: string
  event: HookEvent
  matcher?: string
  hookType: HookType
  command?: string
  prompt?: string
  agentName?: string
  url?: string  // For http hook type
}

export interface HooksComponent {
  type: 'hooks'
  id: string
  rules: HookRule[]
}

export interface McpServerEntry {
  id: string
  name: string
  command: string
  args: string[]
  env: Record<string, string>
}

export interface CoworkConnectorEntry {
  id: string
  connectorId: string
  name: string
  description: string
  url: string
  category: string
  required: boolean
}

export interface McpServersComponent {
  type: 'mcpServers'
  id: string
  mcpMode: 'cowork' | 'claude-code'
  servers: McpServerEntry[]
  coworkConnectors: CoworkConnectorEntry[]
}

export type PluginComponent =
  | SkillComponent
  | AgentComponent
  | CommandComponent
  | HooksComponent
  | McpServersComponent

// ── Root state ──

export interface PluginMetadata {
  name: string
  version: string
  description: string
  author: Author
  homepage?: string
  repository?: string
  license: LicenseId
  keywords: string[]
}

export interface PluginState {
  id: string
  metadata: PluginMetadata
  components: PluginComponent[]
  isDirty: boolean
  lastSavedAt?: number
  outputPath?: string
  activeComponentId?: string
  // MCP configuration — stored at root, not in components[]
  mcpMode: 'cowork' | 'claude-code'
  coworkConnectors: string[]  // Array of connector IDs from registry
}

// ── Lifecycle types ──

export type PluginStatus = 'draft' | 'generated' | 'installed'
export type BuilderMode = 'wizard' | 'advanced'

export interface VersionEntry {
  version: string
  generatedAt: string
  changelog: string
}

export interface PluginRegistryEntry {
  id: string
  name: string
  description: string
  status: PluginStatus
  createdAt: string
  updatedAt: string
  generatedAt: string | null
  installedAt: string | null
  version: string
  versionHistory: VersionEntry[]
  mode: BuilderMode
  wizardStep: number | null
  componentSummary: {
    skills: number
    agents: number
    commands: number
    hooks: number
    mcpServers: number
  }
  lastOutputPath: string | null
  lastZipPath: string | null
  tags: string[]
}

export interface DraftMeta {
  id: string
  createdAt: string
  updatedAt: string
  name: string
  mode: BuilderMode
  wizardStep: number | null
  lastActiveComponentId: string | null
}

export interface DraftSummary {
  id: string
  name: string
  mode: BuilderMode
  wizardStep: number | null
  updatedAt: string
  componentSummary: {
    skills: number
    agents: number
    commands: number
    hooks: number
    mcpServers: number
  }
}

export interface WizardState {
  pluginType: 'skills-only' | 'skills-agents' | 'full' | null
  currentStepIndex: number
}

// ── Generated output ──

export interface GeneratedFile {
  relativePath: string
  content: string
}

// ── Validation ──

export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info'
  componentId?: string
  field?: string
  message: string
}
