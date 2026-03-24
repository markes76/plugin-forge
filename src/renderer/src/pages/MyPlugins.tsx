import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen, Download, Upload, Trash2, Copy, Edit3,
  ChevronDown, ChevronRight, Package
} from 'lucide-react'
import type { PluginRegistryEntry, PluginStatus, PluginState } from '@/types/plugin'
import { generatePlugin } from '@/lib/plugin-generator'

type SortField = 'updatedAt' | 'name' | 'createdAt' | 'version'

export function MyPlugins() {
  const navigate = useNavigate()
  const [registry, setRegistry] = useState<PluginRegistryEntry[]>([])
  const [filter, setFilter] = useState<PluginStatus | 'all'>('all')
  const [sortBy, setSortBy] = useState<SortField>('updatedAt')
  const [expandedVersions, setExpandedVersions] = useState<Set<string>>(new Set())

  useEffect(() => {
    window.pluginForge.getRegistry().then(setRegistry)
  }, [])

  const filtered = useMemo(() => {
    let list = filter === 'all' ? registry : registry.filter((e) => e.status === filter)

    list = [...list].sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name)
        case 'createdAt': return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        case 'version': return b.version.localeCompare(a.version)
        default: return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
      }
    })

    return list
  }, [registry, filter, sortBy])

  const handleDelete = async (id: string) => {
    await window.pluginForge.deleteRegistryEntry(id)
    setRegistry((prev) => prev.filter((e) => e.id !== id))
  }

  const handleDuplicate = async (entry: PluginRegistryEntry) => {
    const draft = await window.pluginForge.loadDraft(entry.id)
    const generated = await window.pluginForge.loadGeneratedState(entry.id)
    const sourceState = draft?.pluginState || generated
    if (!sourceState) return

    const { nanoid } = await import('nanoid')
    const newId = nanoid()
    const state = sourceState as Record<string, unknown>
    const metadata = state.metadata as Record<string, unknown>

    await window.pluginForge.saveDraft(newId, {
      ...state,
      id: newId,
      metadata: { ...metadata, name: `${metadata.name}-copy`, version: '1.0.0' }
    }, undefined, {
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: `${metadata.name}-copy`,
      mode: 'advanced',
      wizardStep: null,
      lastActiveComponentId: null
    })

    const updated = await window.pluginForge.getRegistry()
    setRegistry(updated)
    navigate(`/builder/${newId}`)
  }

  const handleImport = async () => {
    const result = await window.pluginForge.importPlugin()
    if (!result) return
    if ((result as any).error) {
      alert(`Import failed: ${(result as any).error}`)
      return
    }

    const { nanoid } = await import('nanoid')
    const newId = nanoid()
    const manifest = (result.manifest || {}) as Record<string, unknown>
    const author = manifest.author as Record<string, unknown> | undefined
    const pluginName = (manifest.name as string) || 'imported-plugin'

    // Save the raw imported data — the PluginProvider's migrateState() will
    // handle converting frontmatter format to flat format when loaded
    await window.pluginForge.saveDraft(newId, {
      id: newId,
      metadata: {
        name: pluginName,
        version: (manifest.version as string) || '1.0.0',
        description: (manifest.description as string) || '',
        author: { name: (author?.name as string) || '', email: (author?.email as string) || '' },
        license: (manifest.license as string) || 'MIT',
        keywords: (manifest.keywords as string[]) || []
      },
      components: result.components || [],
      isDirty: false,
      mcpMode: 'cowork',
      coworkConnectors: (result as any).coworkConnectors || []
    }, undefined, {
      id: newId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      name: pluginName,
      mode: 'advanced',
      wizardStep: null,
      lastActiveComponentId: null
    })

    await window.pluginForge.updateRegistryEntry(newId, { status: 'generated', lastOutputPath: result.sourcePath })
    const updated = await window.pluginForge.getRegistry()
    setRegistry(updated)
    navigate(`/builder/${newId}`)
  }

  const handleExportZip = async (entry: PluginRegistryEntry) => {
    // Load the saved state (try draft first, then generated)
    const draft = await window.pluginForge.loadDraft(entry.id)
    const generated = await window.pluginForge.loadGeneratedState(entry.id)
    const savedState = (draft?.pluginState || generated) as PluginState | null

    if (!savedState) {
      alert('Could not load plugin state for export.')
      return
    }

    // Generate plugin files from the saved state
    const files = generatePlugin(savedState)

    // If Cowork mode, patch .mcp.json with real URLs
    if (savedState.mcpMode === 'cowork' && savedState.coworkConnectors?.length > 0) {
      const connectorRegistry = await window.pluginForge.getConnectors()
      const mcpFileIdx = files.findIndex(f => f.relativePath === '.mcp.json')
      if (mcpFileIdx >= 0) {
        const mcpServers: Record<string, { type: string; url: string }> = {}
        for (const id of savedState.coworkConnectors) {
          const connector = connectorRegistry.find((c: any) => c.id === id)
          if (connector) mcpServers[id] = { type: 'http', url: connector.url }
        }
        files[mcpFileIdx] = {
          relativePath: '.mcp.json',
          content: JSON.stringify({ mcpServers }, null, 2)
        }
      }
    }

    // Export as ZIP
    const result = await window.pluginForge.generatePluginZip(
      files,
      entry.name || 'plugin'
    )
    if (result?.success) {
      await window.pluginForge.updateRegistryEntry(entry.id, {
        status: 'generated',
        generatedAt: new Date().toISOString(),
        lastOutputPath: result.path
      })
      const updated = await window.pluginForge.getRegistry()
      setRegistry(updated)
    }
  }

  const filterTabs: Array<{ label: string; value: PluginStatus | 'all'; count: number }> = [
    { label: 'All', value: 'all', count: registry.length },
    { label: 'Drafts', value: 'draft', count: registry.filter((e) => e.status === 'draft').length },
    { label: 'Generated', value: 'generated', count: registry.filter((e) => e.status === 'generated').length },
    { label: 'Installed', value: 'installed', count: registry.filter((e) => e.status === 'installed').length }
  ]

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-page-title font-heading" style={{ color: 'var(--text-primary)' }}>
              My Plugins
            </h1>
            <p className="text-body mt-1" style={{ color: 'var(--text-secondary)' }}>
              {registry.length} plugin{registry.length !== 1 ? 's' : ''}
            </p>
          </div>
          <button
            onClick={handleImport}
            className="flex items-center gap-1.5 text-body px-3 py-2 rounded transition-colors"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <Upload size={14} />
            Import Plugin
          </button>
        </div>

        {/* Filters + Sort */}
        <div className="flex items-center justify-between">
          <div className="flex gap-1">
            {filterTabs.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setFilter(tab.value)}
                className="text-small px-3 py-1.5 rounded transition-colors"
                style={{
                  backgroundColor: filter === tab.value ? 'var(--accent-muted)' : 'transparent',
                  color: filter === tab.value ? 'var(--accent)' : 'var(--text-muted)'
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className="ml-1" style={{ opacity: 0.7 }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortField)}
            className="h-8 text-small px-2"
            style={{ width: 'auto' }}
          >
            <option value="updatedAt">Last modified</option>
            <option value="name">Name (A-Z)</option>
            <option value="createdAt">Date created</option>
            <option value="version">Version</option>
          </select>
        </div>

        {/* Plugin list */}
        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FolderOpen size={48} style={{ color: 'var(--text-muted)', opacity: 0.3 }} />
            <p className="text-body mt-4" style={{ color: 'var(--text-muted)' }}>
              {filter === 'all'
                ? 'No plugins yet. Create one from scratch or start with a template.'
                : `No ${filter} plugins.`}
            </p>
          </div>
        )}

        <div className="space-y-3">
          {filtered.map((entry) => (
            <PluginCard
              key={entry.id}
              entry={entry}
              isVersionsExpanded={expandedVersions.has(entry.id)}
              onToggleVersions={() =>
                setExpandedVersions((prev) => {
                  const next = new Set(prev)
                  if (next.has(entry.id)) next.delete(entry.id)
                  else next.add(entry.id)
                  return next
                })
              }
              onEdit={() => navigate(`/builder/${entry.id}`)}
              onExportZip={() => handleExportZip(entry)}
              onDuplicate={() => handleDuplicate(entry)}
              onDelete={() => handleDelete(entry.id)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function PluginCard({
  entry,
  isVersionsExpanded,
  onToggleVersions,
  onEdit,
  onExportZip,
  onDuplicate,
  onDelete
}: {
  entry: PluginRegistryEntry
  isVersionsExpanded: boolean
  onToggleVersions: () => void
  onEdit: () => void
  onExportZip: () => void
  onDuplicate: () => void
  onDelete: () => void
}) {
  const statusConfig = {
    draft: { color: 'var(--warning)', label: 'Draft' },
    generated: { color: 'var(--success)', label: 'Generated' },
    installed: { color: 'var(--accent)', label: 'Installed' }
  }[entry.status]

  const summary = entry.componentSummary
  const parts: string[] = []
  if (summary.skills > 0) parts.push(`${summary.skills} skill${summary.skills > 1 ? 's' : ''}`)
  if (summary.agents > 0) parts.push(`${summary.agents} agent${summary.agents > 1 ? 's' : ''}`)
  if (summary.commands > 0) parts.push(`${summary.commands} command${summary.commands > 1 ? 's' : ''}`)
  if (summary.hooks > 0) parts.push(`${summary.hooks} hook${summary.hooks > 1 ? 's' : ''}`)
  if (summary.mcpServers > 0) parts.push(`${summary.mcpServers} MCP`)

  return (
    <div className="surface-panel p-5 space-y-3" data-panel>
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: statusConfig.color }} />
              <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                {entry.name || 'Untitled'}
              </span>
            </span>
            {entry.status !== 'draft' && (
              <span className="text-small px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}>
                v{entry.version}
              </span>
            )}
          </div>
          {entry.description && (
            <p className="text-small mt-1" style={{ color: 'var(--text-secondary)' }}>{entry.description}</p>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-small" style={{ color: statusConfig.color }}>{statusConfig.label}</span>
            <span className="text-small" style={{ color: 'var(--text-muted)' }}>
              · Last updated {formatRelativeTime(entry.updatedAt)}
            </span>
          </div>
          {parts.length > 0 && (
            <p className="text-small mt-1" style={{ color: 'var(--text-muted)' }}>{parts.join(' · ')}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 text-small px-3 py-1.5 rounded transition-colors"
          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          <Edit3 size={12} />
          Edit
        </button>
        {entry.status !== 'draft' && (
          <button
            onClick={onExportZip}
            className="flex items-center gap-1.5 text-small px-3 py-1.5 rounded transition-colors"
            style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
          >
            <Download size={12} />
            Export ZIP
          </button>
        )}
        <button
          onClick={onDuplicate}
          className="flex items-center gap-1.5 text-small px-3 py-1.5 rounded transition-colors"
          style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}
        >
          <Copy size={12} />
          Duplicate
        </button>
        <button
          onClick={onDelete}
          className="flex items-center gap-1.5 text-small px-3 py-1.5 rounded transition-colors ml-auto"
          style={{ color: 'var(--text-muted)' }}
        >
          <Trash2 size={12} />
        </button>
      </div>

      {/* Version history */}
      {entry.versionHistory.length > 0 && (
        <div className="border-t pt-2" style={{ borderColor: 'var(--border)' }}>
          <button
            onClick={onToggleVersions}
            className="flex items-center gap-1 text-small w-full"
            style={{ color: 'var(--text-muted)' }}
          >
            {isVersionsExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            Version History ({entry.versionHistory.length})
          </button>
          {isVersionsExpanded && (
            <div className="mt-2 space-y-1.5 pl-4">
              {entry.versionHistory.slice(0, 5).map((v, i) => (
                <div key={i} className="text-small" style={{ color: 'var(--text-secondary)' }}>
                  <span className="font-mono" style={{ color: 'var(--text-primary)' }}>v{v.version}</span>
                  {v.changelog && <span> — {v.changelog}</span>}
                  <span style={{ color: 'var(--text-muted)' }}> ({formatRelativeTime(v.generatedAt)})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
