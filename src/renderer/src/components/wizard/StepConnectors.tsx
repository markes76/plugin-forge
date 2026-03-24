import { useState, useEffect } from 'react'
import { Search, Check } from 'lucide-react'
import type { ConnectorEntry } from '@/lib/constants'

interface StepConnectorsProps {
  selectedIds: string[]
  onUpdate: (ids: string[]) => void
}

export function StepConnectors({ selectedIds, onUpdate }: StepConnectorsProps) {
  const [search, setSearch] = useState('')
  const [registry, setRegistry] = useState<ConnectorEntry[]>([])

  useEffect(() => {
    window.pluginForge.getConnectors().then(setRegistry)
  }, [])

  const selectedSet = new Set(selectedIds)

  const filtered = registry.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.description.toLowerCase().includes(search.toLowerCase())
  )

  const toggleConnector = (id: string) => {
    if (selectedSet.has(id)) {
      onUpdate(selectedIds.filter((i) => i !== id))
    } else {
      onUpdate([...selectedIds, id])
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h2 className="text-page-title font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
          Connect to your tools
        </h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Select the services your plugin needs access to. In Cowork, these are enabled through the Customize panel.
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search connectors..."
          className="w-full h-9 pl-8"
        />
      </div>

      {/* Connector grid */}
      <div className="space-y-1.5">
        {filtered.map((connector) => {
          const isSelected = selectedSet.has(connector.id)

          return (
            <div
              key={connector.id}
              className="flex items-center gap-3 p-3 rounded cursor-pointer transition-colors"
              style={{
                backgroundColor: isSelected ? 'var(--accent-muted)' : 'var(--bg-input)',
                border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`
              }}
              onClick={() => toggleConnector(connector.id)}
            >
              <div
                className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                style={{
                  backgroundColor: isSelected ? 'var(--accent)' : 'transparent',
                  border: `1.5px solid ${isSelected ? 'var(--accent)' : 'var(--text-muted)'}`
                }}
              >
                {isSelected && <Check size={10} style={{ color: 'var(--text-on-accent)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                  {connector.name}
                </span>
                <span className="text-small block" style={{ color: 'var(--text-muted)' }}>
                  {connector.description}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Selected summary */}
      {selectedIds.length > 0 && (
        <div className="surface-panel p-4" data-panel>
          <h4 className="text-small font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Selected ({selectedIds.length})
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {selectedIds.map((id) => {
              const conn = registry.find((c) => c.id === id)
              return (
                <span key={id} className="text-small px-2 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--accent-muted)', color: 'var(--accent)' }}>
                  {conn?.name || id}
                </span>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
