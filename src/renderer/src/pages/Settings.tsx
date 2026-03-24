import { useState, useEffect, useRef } from 'react'
import { Plus, Pencil, Trash2, RotateCcw, Search } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { themes, type ThemeId } from '@/lib/theme'
import type { ConnectorEntry } from '@/lib/constants'

export function Settings() {
  const { theme, setTheme } = useTheme()
  const standardThemes = themes.filter((t) => t.group === 'standard')
  const styledThemes = themes.filter((t) => t.group === 'styled')

  // App settings state
  const [authorName, setAuthorName] = useState('')
  const [authorEmail, setAuthorEmail] = useState('')
  const [outputDir, setOutputDir] = useState('')

  // Load settings on mount
  useEffect(() => {
    window.pluginForge.getSettings().then((s: any) => {
      if (s?.defaultAuthor?.name) setAuthorName(s.defaultAuthor.name)
      if (s?.defaultAuthor?.email) setAuthorEmail(s.defaultAuthor.email)
      if (s?.defaultOutputPath) setOutputDir(s.defaultOutputPath)
    })
  }, [])

  // Debounced save to avoid hammering disk on every keystroke
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const saveSettings = (updates: Record<string, unknown>) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(async () => {
      const current = await window.pluginForge.getSettings() as Record<string, unknown>
      await window.pluginForge.setSettings({ ...current, ...updates })
    }, 500)
  }

  // Connector registry state
  const [connectors, setConnectors] = useState<ConnectorEntry[]>([])
  const [connectorSearch, setConnectorSearch] = useState('')
  const [editingConnector, setEditingConnector] = useState<ConnectorEntry | null>(null)
  const [showAddForm, setShowAddForm] = useState(false)

  useEffect(() => {
    window.pluginForge.getConnectors().then(setConnectors)
  }, [])

  const filteredConnectors = connectors.filter(
    (c) =>
      c.name.toLowerCase().includes(connectorSearch.toLowerCase()) ||
      c.category.toLowerCase().includes(connectorSearch.toLowerCase()) ||
      c.description.toLowerCase().includes(connectorSearch.toLowerCase())
  )

  const categories = [...new Set(connectors.map((c) => c.category))].sort()

  const groupedConnectors = categories
    .map((cat) => ({
      category: cat,
      items: filteredConnectors.filter((c) => c.category === cat)
    }))
    .filter((g) => g.items.length > 0)

  const handleAddConnector = async (data: Omit<ConnectorEntry, 'builtIn'>) => {
    await window.pluginForge.addConnector(data)
    const updated = await window.pluginForge.getConnectors()
    setConnectors(updated)
    setShowAddForm(false)
  }

  const handleUpdateConnector = async (id: string, updates: Partial<ConnectorEntry>) => {
    await window.pluginForge.updateConnector(id, updates)
    const updated = await window.pluginForge.getConnectors()
    setConnectors(updated)
    setEditingConnector(null)
  }

  const handleDeleteConnector = async (id: string) => {
    await window.pluginForge.deleteConnector(id)
    const updated = await window.pluginForge.getConnectors()
    setConnectors(updated)
  }

  const handleResetConnectors = async () => {
    await window.pluginForge.resetConnectors()
    const updated = await window.pluginForge.getConnectors()
    setConnectors(updated)
  }

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-2xl mx-auto space-y-10">
        <div>
          <h1 className="text-page-title font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
            Settings
          </h1>
          <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
            Customize Plugin Forge to your preferences.
          </p>
        </div>

        {/* Theme selector */}
        <section className="space-y-5">
          <h2 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
            Theme
          </h2>

          {/* Standard themes */}
          <div>
            <p className="text-small mb-3" style={{ color: 'var(--text-muted)' }}>Standard</p>
            <div className="grid grid-cols-3 gap-3">
              {standardThemes.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  isActive={theme === t.id}
                  onClick={() => setTheme(t.id)}
                />
              ))}
            </div>
          </div>

          {/* Styled themes */}
          <div>
            <p className="text-small mb-3" style={{ color: 'var(--text-muted)' }}>
              Styled
              <span
                className="ml-2 text-small px-1.5 py-0.5 rounded"
                style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-muted)' }}
              >
                Decorative
              </span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              {styledThemes.map((t) => (
                <ThemeCard
                  key={t.id}
                  theme={t}
                  isActive={theme === t.id}
                  onClick={() => setTheme(t.id)}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Default author */}
        <section className="space-y-4">
          <h2 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
            Default Author
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-small mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Name
              </label>
              <input
                type="text"
                placeholder="Your name"
                className="w-full h-9"
                value={authorName}
                onChange={(e) => {
                  setAuthorName(e.target.value)
                  saveSettings({ defaultAuthor: { name: e.target.value, email: authorEmail }, defaultOutputPath: outputDir })
                }}
              />
            </div>
            <div>
              <label className="block text-small mb-1.5" style={{ color: 'var(--text-secondary)' }}>
                Email
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className="w-full h-9"
                value={authorEmail}
                onChange={(e) => {
                  setAuthorEmail(e.target.value)
                  saveSettings({ defaultAuthor: { name: authorName, email: e.target.value }, defaultOutputPath: outputDir })
                }}
              />
            </div>
          </div>
        </section>

        {/* Output directory */}
        <section className="space-y-4">
          <h2 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
            Default Output Directory
          </h2>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="~/Desktop"
              className="flex-1 h-9"
              value={outputDir}
              readOnly
            />
            <button
              onClick={async () => {
                const dir = await window.pluginForge.selectDirectory()
                if (dir) {
                  setOutputDir(dir)
                  saveSettings({ defaultAuthor: { name: authorName, email: authorEmail }, defaultOutputPath: dir })
                }
              }}
              className="h-9 px-4 rounded text-body font-medium transition-colors"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border)'
              }}
            >
              Browse
            </button>
          </div>
        </section>

        {/* Connector Manager */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
                Connectors
              </h2>
              <p className="text-small mt-1" style={{ color: 'var(--text-muted)' }}>
                MCP connectors available when building plugins. Add new ones as they become available.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleResetConnectors}
                className="flex items-center gap-1 text-small px-2 py-1 rounded transition-colors"
                style={{ color: 'var(--text-muted)' }}
                title="Reset built-in connectors to defaults"
              >
                <RotateCcw size={12} />
                Reset
              </button>
              <button
                onClick={() => { setEditingConnector(null); setShowAddForm(true) }}
                className="flex items-center gap-1.5 text-small px-3 py-1.5 rounded transition-colors"
                data-accent="true"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
              >
                <Plus size={14} />
                Add Connector
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={connectorSearch}
              onChange={(e) => setConnectorSearch(e.target.value)}
              placeholder="Search connectors..."
              className="w-full h-9 pl-8"
            />
          </div>

          {/* Add/Edit form */}
          {(showAddForm || editingConnector) && (
            <ConnectorForm
              initial={editingConnector}
              categories={categories}
              onSave={(data) => {
                if (editingConnector) {
                  handleUpdateConnector(editingConnector.id, data)
                } else {
                  handleAddConnector(data as Omit<ConnectorEntry, 'builtIn'>)
                }
              }}
              onCancel={() => { setShowAddForm(false); setEditingConnector(null) }}
            />
          )}

          {/* Grouped connector list */}
          <div className="space-y-4">
            {groupedConnectors.map((group) => (
              <div key={group.category}>
                <h4 className="text-small font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
                  {group.category}
                </h4>
                <div className="space-y-1">
                  {group.items.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center gap-3 px-3 py-2 rounded"
                      style={{ backgroundColor: 'var(--bg-input)' }}
                    >
                      <div className="flex-1 min-w-0">
                        <span className="text-body" style={{ color: 'var(--text-primary)' }}>{c.name}</span>
                        <span className="text-small block truncate" style={{ color: 'var(--text-muted)' }} title={c.url}>
                          {c.url}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => { setShowAddForm(false); setEditingConnector(c) }}
                          className="p-1 rounded transition-colors"
                          style={{ color: 'var(--text-muted)' }}
                        >
                          <Pencil size={12} />
                        </button>
                        {!c.builtIn && (
                          <button
                            onClick={() => handleDeleteConnector(c.id)}
                            className="p-1 rounded transition-colors"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <p className="text-small" style={{ color: 'var(--text-muted)' }}>
            {connectors.length} connectors ({connectors.filter((c) => c.builtIn).length} built-in, {connectors.filter((c) => !c.builtIn).length} custom)
          </p>
        </section>
      </div>
    </div>
  )
}

function ConnectorForm({
  initial,
  categories,
  onSave,
  onCancel
}: {
  initial: ConnectorEntry | null
  categories: string[]
  onSave: (data: Partial<ConnectorEntry>) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(initial?.name || '')
  const [id, setId] = useState(initial?.id || '')
  const [url, setUrl] = useState(initial?.url || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [category, setCategory] = useState(initial?.category || '')
  const [customCategory, setCustomCategory] = useState('')

  const autoId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

  return (
    <div className="surface-panel p-4 space-y-3" data-panel>
      <h4 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
        {initial ? 'Edit Connector' : 'Add Connector'}
      </h4>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => { setName(e.target.value); if (!initial) setId(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) }}
            placeholder="Trello"
            className="w-full h-9"
          />
        </div>
        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>ID</label>
          <input
            type="text"
            value={id || autoId}
            onChange={(e) => setId(e.target.value)}
            placeholder="trello"
            className="w-full h-9 font-mono text-code"
          />
        </div>
      </div>
      <div>
        <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>MCP Server URL</label>
        <input
          type="text"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://mcp.trello.com/mcp"
          className="w-full h-9 font-mono text-code"
        />
      </div>
      <div>
        <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>Description</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Boards, lists, cards"
          className="w-full h-9"
        />
      </div>
      <div>
        <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>Category</label>
        <div className="flex gap-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex-1 h-9"
          >
            <option value="">Select category...</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="__custom__">+ New category</option>
          </select>
          {category === '__custom__' && (
            <input
              type="text"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Category name"
              className="flex-1 h-9"
            />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={() => {
            const finalCategory = category === '__custom__' ? customCategory : category
            onSave({
              id: id || autoId,
              name,
              url,
              description,
              category: finalCategory
            })
          }}
          disabled={!name || !(id || autoId) || !url}
          className="text-body font-medium px-4 py-1.5 rounded transition-colors"
          data-accent="true"
          style={{
            backgroundColor: (!name || !(id || autoId) || !url) ? 'var(--bg-elevated)' : 'var(--accent)',
            color: (!name || !(id || autoId) || !url) ? 'var(--text-muted)' : 'var(--text-on-accent)'
          }}
        >
          {initial ? 'Save Changes' : 'Add'}
        </button>
        <button
          onClick={onCancel}
          className="text-body px-3 py-1.5 rounded"
          style={{ color: 'var(--text-muted)' }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

function ThemeCard({
  theme,
  isActive,
  onClick
}: {
  theme: { id: ThemeId; name: string; description: string; preview: { bg: string; surface: string; accent: string; text: string } }
  isActive: boolean
  onClick: () => void
}) {
  const { preview } = theme

  return (
    <button
      onClick={onClick}
      className="relative rounded-md overflow-hidden transition-all text-left"
      style={{
        backgroundColor: preview.bg,
        border: isActive
          ? `2px solid ${preview.accent}`
          : '2px solid rgba(255,255,255,0.06)'
      }}
    >
      {/* Mini surface mockup */}
      <div className="p-3 space-y-2">
        <div style={{ backgroundColor: preview.surface, borderRadius: 4, height: 24 }} />
        <div className="flex gap-2">
          <div style={{ backgroundColor: preview.accent, borderRadius: 3, height: 6, width: 36 }} />
          <div style={{ backgroundColor: preview.surface, borderRadius: 3, height: 6, flex: 1 }} />
        </div>
        <div style={{ backgroundColor: preview.surface, borderRadius: 3, height: 6, width: '60%' }} />
      </div>

      {/* Label */}
      <div className="px-3 pb-2.5">
        <span className="text-small font-medium block" style={{ color: preview.text }}>
          {theme.name}
        </span>
        <span className="text-small block" style={{ color: preview.text, opacity: 0.5 }}>
          {theme.description}
        </span>
      </div>

      {/* Active indicator */}
      {isActive && (
        <div
          className="absolute top-2 right-2 w-2 h-2 rounded-full"
          style={{ backgroundColor: preview.accent }}
        />
      )}
    </button>
  )
}
