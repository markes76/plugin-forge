import { app } from 'electron'
import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync } from 'fs'
import { join } from 'path'

// ── Types (mirrored from renderer for main process use) ──

interface PluginRegistryEntry {
  id: string
  name: string
  description: string
  status: 'draft' | 'generated' | 'installed'
  createdAt: string
  updatedAt: string
  generatedAt: string | null
  installedAt: string | null
  version: string
  versionHistory: Array<{ version: string; generatedAt: string; changelog: string }>
  mode: 'wizard' | 'advanced'
  wizardStep: number | null
  componentSummary: { skills: number; agents: number; commands: number; hooks: number; mcpServers: number }
  lastOutputPath: string | null
  lastZipPath: string | null
  tags: string[]
}

// ── Paths ──

function getDataDir(): string {
  const dir = join(app.getPath('userData'), 'plugin-forge-data')
  mkdirSync(dir, { recursive: true })
  return dir
}

function getDraftsDir(): string {
  const dir = join(getDataDir(), 'drafts')
  mkdirSync(dir, { recursive: true })
  return dir
}

function getGeneratedDir(): string {
  const dir = join(getDataDir(), 'generated')
  mkdirSync(dir, { recursive: true })
  return dir
}

function getRegistryPath(): string {
  return join(getDataDir(), 'plugins.json')
}

// ── Registry ──

function readRegistry(): PluginRegistryEntry[] {
  const path = getRegistryPath()
  if (!existsSync(path)) return []
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return []
  }
}

function writeRegistry(entries: PluginRegistryEntry[]): void {
  writeFileSync(getRegistryPath(), JSON.stringify(entries, null, 2), 'utf-8')
}

export function getRegistry(): PluginRegistryEntry[] {
  return readRegistry()
}

export function getRegistryEntry(id: string): PluginRegistryEntry | null {
  return readRegistry().find((e) => e.id === id) || null
}

export function updateRegistryEntry(id: string, updates: Partial<PluginRegistryEntry>): void {
  const entries = readRegistry()
  const idx = entries.findIndex((e) => e.id === id)
  if (idx === -1) {
    // Create new entry
    entries.push({ ...createDefaultEntry(id), ...updates } as PluginRegistryEntry)
  } else {
    entries[idx] = { ...entries[idx], ...updates, updatedAt: new Date().toISOString() }
  }
  writeRegistry(entries)
}

export function deleteRegistryEntry(id: string): void {
  const entries = readRegistry().filter((e) => e.id !== id)
  writeRegistry(entries)
  // Also clean up draft and generated directories
  const draftDir = join(getDraftsDir(), id)
  if (existsSync(draftDir)) rmSync(draftDir, { recursive: true, force: true })
  const genDir = join(getGeneratedDir(), id)
  if (existsSync(genDir)) rmSync(genDir, { recursive: true, force: true })
}

function createDefaultEntry(id: string): PluginRegistryEntry {
  const now = new Date().toISOString()
  return {
    id,
    name: '',
    description: '',
    status: 'draft',
    createdAt: now,
    updatedAt: now,
    generatedAt: null,
    installedAt: null,
    version: '1.0.0',
    versionHistory: [],
    mode: 'advanced',
    wizardStep: null,
    componentSummary: { skills: 0, agents: 0, commands: 0, hooks: 0, mcpServers: 0 },
    lastOutputPath: null,
    lastZipPath: null,
    tags: []
  }
}

// ── Draft Storage ──

export function saveDraft(
  id: string,
  pluginState: unknown,
  wizardState?: unknown,
  meta?: Record<string, unknown>
): void {
  const dir = join(getDraftsDir(), id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'state.json'), JSON.stringify(pluginState, null, 2), 'utf-8')
  if (wizardState) {
    writeFileSync(join(dir, 'wizard-state.json'), JSON.stringify(wizardState, null, 2), 'utf-8')
  }
  if (meta) {
    writeFileSync(join(dir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8')
  }
}

export function loadDraft(id: string): {
  pluginState: unknown
  wizardState: unknown | null
  meta: unknown | null
} | null {
  const dir = join(getDraftsDir(), id)
  const statePath = join(dir, 'state.json')
  if (!existsSync(statePath)) return null

  try {
    const pluginState = JSON.parse(readFileSync(statePath, 'utf-8'))
    let wizardState = null
    let meta = null

    const wizardPath = join(dir, 'wizard-state.json')
    if (existsSync(wizardPath)) {
      try { wizardState = JSON.parse(readFileSync(wizardPath, 'utf-8')) } catch {}
    }

    const metaPath = join(dir, 'meta.json')
    if (existsSync(metaPath)) {
      try { meta = JSON.parse(readFileSync(metaPath, 'utf-8')) } catch {}
    }

    return { pluginState, wizardState, meta }
  } catch {
    return null
  }
}

export function deleteDraft(id: string): void {
  const dir = join(getDraftsDir(), id)
  if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
}

export function listDrafts(): Array<{
  id: string
  name: string
  mode: string
  wizardStep: number | null
  updatedAt: string
}> {
  const registry = readRegistry()
  return registry
    .filter((e) => e.status === 'draft')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .map((e) => ({
      id: e.id,
      name: e.name,
      mode: e.mode,
      wizardStep: e.wizardStep,
      updatedAt: e.updatedAt
    }))
}

// ── Generated Plugin Storage ──

export function saveGeneratedState(id: string, pluginState: unknown): void {
  const dir = join(getGeneratedDir(), id)
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'state.json'), JSON.stringify(pluginState, null, 2), 'utf-8')
}

export function loadGeneratedState(id: string): unknown | null {
  const path = join(getGeneratedDir(), id, 'state.json')
  if (!existsSync(path)) return null
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return null
  }
}

// ── Lock Files ──

export function acquireLock(id: string): boolean {
  const lockPath = join(getDraftsDir(), id, '.lock')
  if (existsSync(lockPath)) {
    // Check if lock is stale (older than 30 seconds)
    try {
      const lockData = JSON.parse(readFileSync(lockPath, 'utf-8'))
      const age = Date.now() - lockData.timestamp
      if (age < 30000) return false // Active lock
    } catch {}
  }
  mkdirSync(join(getDraftsDir(), id), { recursive: true })
  writeFileSync(lockPath, JSON.stringify({ timestamp: Date.now(), pid: process.pid }), 'utf-8')
  return true
}

export function releaseLock(id: string): void {
  const lockPath = join(getDraftsDir(), id, '.lock')
  if (existsSync(lockPath)) {
    try { rmSync(lockPath) } catch {}
  }
}

// ── Draft Cleanup ──

export function cleanupOrphanedDrafts(): { removed: number } {
  let removed = 0
  const registry = readRegistry()
  const draftsDir = getDraftsDir()

  // Remove registry entries whose draft files are missing
  const validEntries = registry.filter((entry) => {
    if (entry.status !== 'draft') return true
    const statePath = join(draftsDir, entry.id, 'state.json')
    if (!existsSync(statePath)) {
      removed++
      return false
    }
    return true
  })

  // Remove draft directories with no registry entry
  if (existsSync(draftsDir)) {
    const dirs = readdirSync(draftsDir, { withFileTypes: true })
    for (const dir of dirs) {
      if (!dir.isDirectory()) continue
      if (!validEntries.some((e) => e.id === dir.name)) {
        rmSync(join(draftsDir, dir.name), { recursive: true, force: true })
        removed++
      }
    }
  }

  // Deduplicate: same name, created within 60s of each other, keep most recent
  const drafts = validEntries.filter((e) => e.status === 'draft')
  const toRemove = new Set<string>()
  for (let i = 0; i < drafts.length; i++) {
    for (let j = i + 1; j < drafts.length; j++) {
      if (drafts[i].name === drafts[j].name && drafts[i].name !== '') {
        const diff = Math.abs(new Date(drafts[i].createdAt).getTime() - new Date(drafts[j].createdAt).getTime())
        if (diff < 60000) {
          // Keep the newer one
          const older = new Date(drafts[i].updatedAt) < new Date(drafts[j].updatedAt) ? drafts[i] : drafts[j]
          toRemove.add(older.id)
        }
      }
    }
  }

  const cleanedEntries = validEntries.filter((e) => !toRemove.has(e.id))
  for (const id of toRemove) {
    const dir = join(draftsDir, id)
    if (existsSync(dir)) rmSync(dir, { recursive: true, force: true })
    removed++
  }

  if (removed > 0) {
    writeRegistry(cleanedEntries)
  }

  return { removed }
}

// ── Connector Registry ──

interface ConnectorEntry {
  id: string
  name: string
  url: string
  description: string
  category: string
  builtIn: boolean
}

// Default connectors (shipped with app)
const DEFAULT_CONNECTORS: ConnectorEntry[] = [
  { id: 'slack', name: 'Slack', url: 'https://mcp.slack.com/mcp', description: 'Channels, messages, threads', category: 'Chat', builtIn: true },
  { id: 'google-calendar', name: 'Google Calendar', url: 'https://gcal.mcp.claude.com/mcp', description: 'Events, availability, scheduling', category: 'Calendar', builtIn: true },
  { id: 'gmail', name: 'Gmail', url: 'https://gmail.mcp.claude.com/mcp', description: 'Read, search, draft emails', category: 'Email', builtIn: true },
  { id: 'google-drive', name: 'Google Drive', url: 'https://gdrive.mcp.claude.com/mcp', description: 'Docs, Sheets, Slides, files', category: 'Storage', builtIn: true },
  { id: 'notion', name: 'Notion', url: 'https://mcp.notion.com/mcp', description: 'Pages, databases, wikis', category: 'Knowledge Base', builtIn: true },
  { id: 'figma', name: 'Figma', url: 'https://mcp.figma.com/mcp', description: 'Design files, components, tokens', category: 'Design', builtIn: true },
  { id: 'canva', name: 'Canva', url: 'https://mcp.canva.com/mcp', description: 'Design assets, templates', category: 'Design', builtIn: true },
  { id: 'asana', name: 'Asana', url: 'https://mcp.asana.com/v2/mcp', description: 'Tasks, projects, workflows', category: 'Project Management', builtIn: true },
  { id: 'linear', name: 'Linear', url: 'https://mcp.linear.app/mcp', description: 'Issues, projects, cycles', category: 'Project Management', builtIn: true },
  { id: 'atlassian', name: 'Atlassian', url: 'https://mcp.atlassian.com/v1/mcp', description: 'Jira issues, Confluence docs', category: 'Project Management', builtIn: true },
  { id: 'monday', name: 'Monday.com', url: 'https://mcp.monday.com/mcp', description: 'Boards, items, automations', category: 'Project Management', builtIn: true },
  { id: 'clickup', name: 'ClickUp', url: 'https://mcp.clickup.com/mcp', description: 'Tasks, docs, goals', category: 'Project Management', builtIn: true },
  { id: 'hubspot', name: 'HubSpot', url: 'https://mcp.hubspot.com/anthropic', description: 'Contacts, deals, campaigns', category: 'CRM', builtIn: true },
  { id: 'salesforce', name: 'Salesforce', url: 'https://mcp.salesforce.com/mcp', description: 'Accounts, opportunities, records', category: 'CRM', builtIn: true },
  { id: 'amplitude', name: 'Amplitude', url: 'https://mcp.amplitude.com/mcp', description: 'Product analytics, events', category: 'Analytics', builtIn: true },
  { id: 'intercom', name: 'Intercom', url: 'https://mcp.intercom.com/mcp', description: 'Conversations, users, support', category: 'Support', builtIn: true },
  { id: 'tavily', name: 'Tavily', url: 'https://mcp.tavily.com/mcp', description: 'Web search and research', category: 'Search', builtIn: true },
  { id: 'fireflies', name: 'Fireflies', url: 'https://mcp.fireflies.ai/mcp', description: 'Meeting transcripts, notes', category: 'Meetings', builtIn: true },
  { id: 'outreach', name: 'Outreach', url: 'https://api.outreach.io/mcp', description: 'Sales engagement, sequences', category: 'Sales', builtIn: true },
  { id: 'microsoft-365', name: 'Microsoft 365', url: 'https://mcp.microsoft365.com/mcp', description: 'Outlook, SharePoint, OneDrive, Teams', category: 'Office Suite', builtIn: true }
]

function getConnectorsPath(): string {
  return join(getDataDir(), 'connectors.json')
}

export function getConnectors(): ConnectorEntry[] {
  const path = getConnectorsPath()
  if (!existsSync(path)) {
    // First launch: write defaults
    writeFileSync(path, JSON.stringify(DEFAULT_CONNECTORS, null, 2), 'utf-8')
    return DEFAULT_CONNECTORS
  }
  try {
    return JSON.parse(readFileSync(path, 'utf-8'))
  } catch {
    return DEFAULT_CONNECTORS
  }
}

function writeConnectors(entries: ConnectorEntry[]): void {
  writeFileSync(getConnectorsPath(), JSON.stringify(entries, null, 2), 'utf-8')
}

export function addConnector(connector: Omit<ConnectorEntry, 'builtIn'>): ConnectorEntry {
  const entries = getConnectors()
  const entry: ConnectorEntry = { ...connector, builtIn: false }
  entries.push(entry)
  writeConnectors(entries)
  return entry
}

export function updateConnector(id: string, updates: Partial<ConnectorEntry>): ConnectorEntry | null {
  const entries = getConnectors()
  const idx = entries.findIndex((e) => e.id === id)
  if (idx === -1) return null
  entries[idx] = { ...entries[idx], ...updates }
  writeConnectors(entries)
  return entries[idx]
}

export function deleteConnector(id: string): boolean {
  const entries = getConnectors()
  const entry = entries.find((e) => e.id === id)
  if (!entry || entry.builtIn) return false // Can't delete built-in
  writeConnectors(entries.filter((e) => e.id !== id))
  return true
}

export function resetConnectors(): void {
  const entries = getConnectors()
  // Keep user-added, reset built-in to defaults
  const userAdded = entries.filter((e) => !e.builtIn)
  writeConnectors([...DEFAULT_CONNECTORS, ...userAdded])
}
