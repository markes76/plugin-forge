import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Wand2, Wrench, LayoutTemplate, Hammer, Clock, Trash2 } from 'lucide-react'
import type { PluginRegistryEntry } from '@/types/plugin'

export function Dashboard() {
  const navigate = useNavigate()
  const [registry, setRegistry] = useState<PluginRegistryEntry[]>([])

  useEffect(() => {
    window.pluginForge.getRegistry().then(setRegistry)
  }, [])

  const drafts = registry
    .filter((e) => e.status === 'draft')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const recent = registry
    .filter((e) => e.status !== 'draft')
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    .slice(0, 5)

  const handleDeleteDraft = async (id: string) => {
    await window.pluginForge.deleteRegistryEntry(id)
    setRegistry((prev) => prev.filter((e) => e.id !== id))
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Welcome */}
        <div className="text-center space-y-3">
          <div className="flex justify-center">
            <div
              className="w-14 h-14 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--accent-muted)' }}
            >
              <Hammer size={28} style={{ color: 'var(--accent)' }} />
            </div>
          </div>
          <h1 className="text-page-title font-heading" style={{ color: 'var(--text-primary)' }}>
            Build a plugin for Claude Code or Cowork
          </h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            Create fully valid plugins visually. No CLI knowledge required.
          </p>
        </div>

        {/* Three creation paths */}
        <div className="grid grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/wizard')}
            className="surface-panel p-5 text-left transition-all hover:border-[var(--accent)] relative"
            data-panel
          >
            <span
              className="absolute top-3 right-3 text-small px-1.5 py-0.5 rounded"
              style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}
            >
              Recommended
            </span>
            <Wand2 size={22} className="mb-3" style={{ color: 'var(--accent)' }} />
            <h3 className="text-section-heading font-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              Guided Builder
            </h3>
            <p className="text-small" style={{ color: 'var(--text-muted)' }}>
              Step-by-step. Answer questions, pick components, we'll handle the rest.
            </p>
          </button>

          <button
            onClick={() => navigate('/builder')}
            className="surface-panel p-5 text-left transition-all hover:border-[var(--accent)]"
            data-panel
          >
            <Wrench size={22} className="mb-3" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="text-section-heading font-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              Advanced Builder
            </h3>
            <p className="text-small" style={{ color: 'var(--text-muted)' }}>
              Full workspace. Build every detail manually.
            </p>
          </button>

          <button
            onClick={() => navigate('/templates')}
            className="surface-panel p-5 text-left transition-all hover:border-[var(--accent)]"
            data-panel
          >
            <LayoutTemplate size={22} className="mb-3" style={{ color: 'var(--text-secondary)' }} />
            <h3 className="text-section-heading font-heading mb-1" style={{ color: 'var(--text-primary)' }}>
              Start from Template
            </h3>
            <p className="text-small" style={{ color: 'var(--text-muted)' }}>
              Pre-built starting points you can customize.
            </p>
          </button>
        </div>

        {/* Continue Working — drafts */}
        {drafts.length > 0 && (
          <section>
            <h2 className="text-section-heading font-heading mb-3" style={{ color: 'var(--text-primary)' }}>
              Continue Working
            </h2>
            <div className="space-y-2">
              {drafts.map((draft) => (
                <DraftCard
                  key={draft.id}
                  entry={draft}
                  onContinue={() => {
                    const route = draft.mode === 'wizard' ? '/wizard' : '/builder'
                    navigate(`${route}/${draft.id}`)
                  }}
                  onDelete={() => handleDeleteDraft(draft.id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recent plugins */}
        {recent.length > 0 && (
          <section>
            <h2 className="text-section-heading font-heading mb-3" style={{ color: 'var(--text-primary)' }}>
              Recent Plugins
            </h2>
            <div className="space-y-2">
              {recent.map((entry) => (
                <button
                  key={entry.id}
                  onClick={() => navigate(`/builder/${entry.id}`)}
                  className="w-full surface-panel p-4 text-left flex items-center gap-4 transition-all hover:border-[var(--accent)]"
                  data-panel
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                        {entry.name || 'Untitled'}
                      </span>
                      <span
                        className="text-small px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
                      >
                        v{entry.version}
                      </span>
                      <StatusBadge status={entry.status} />
                    </div>
                    <p className="text-small mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatRelativeTime(entry.updatedAt)}
                    </p>
                  </div>
                  <ComponentCounts summary={entry.componentSummary} />
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}

function DraftCard({
  entry,
  onContinue,
  onDelete
}: {
  entry: PluginRegistryEntry
  onContinue: () => void
  onDelete: () => void
}) {
  const stepLabel = entry.mode === 'wizard' && entry.wizardStep !== null
    ? `Wizard Step ${entry.wizardStep}`
    : entry.mode === 'wizard'
      ? 'Wizard'
      : 'Advanced'

  return (
    <div className="surface-panel p-4 flex items-center gap-4" data-panel>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
            {entry.name || 'Untitled Plugin'}
          </span>
          <StatusBadge status="draft" />
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-small" style={{ color: 'var(--text-muted)' }}>
            {stepLabel}
          </span>
          <span className="text-small" style={{ color: 'var(--text-muted)' }}>
            · {formatRelativeTime(entry.updatedAt)}
          </span>
        </div>
        <ComponentCounts summary={entry.componentSummary} />
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onContinue}
          className="text-body font-medium px-3 py-1.5 rounded transition-colors"
          data-accent="true"
          style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
        >
          Continue
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="p-1.5 rounded transition-colors"
          style={{ color: 'var(--text-muted)' }}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    draft: { color: 'var(--warning)', label: 'Draft' },
    generated: { color: 'var(--success)', label: 'Generated' },
    installed: { color: 'var(--accent)', label: 'Installed' }
  }[status] || { color: 'var(--text-muted)', label: status }

  return (
    <span className="flex items-center gap-1 text-small">
      <span
        className="w-1.5 h-1.5 rounded-full"
        style={{ backgroundColor: config.color }}
      />
      <span style={{ color: config.color }}>{config.label}</span>
    </span>
  )
}

function ComponentCounts({ summary }: { summary: PluginRegistryEntry['componentSummary'] }) {
  const parts: string[] = []
  if (summary.skills > 0) parts.push(`${summary.skills} skill${summary.skills > 1 ? 's' : ''}`)
  if (summary.agents > 0) parts.push(`${summary.agents} agent${summary.agents > 1 ? 's' : ''}`)
  if (summary.commands > 0) parts.push(`${summary.commands} cmd${summary.commands > 1 ? 's' : ''}`)
  if (summary.hooks > 0) parts.push(`${summary.hooks} hook${summary.hooks > 1 ? 's' : ''}`)
  if (summary.mcpServers > 0) parts.push(`${summary.mcpServers} MCP`)

  if (parts.length === 0) return null

  return (
    <span className="text-small" style={{ color: 'var(--text-muted)' }}>
      {parts.join(' · ')}
    </span>
  )
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}
