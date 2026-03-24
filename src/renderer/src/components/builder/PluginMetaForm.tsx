import { useState, useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { usePlugin } from '@/hooks/usePluginState'
import { toKebabCase } from '@/lib/utils'
import type { LicenseId, PluginRegistryEntry } from '@/types/plugin'

const licenses: LicenseId[] = ['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause', 'ISC', 'UNLICENSED']

export function PluginMetaForm() {
  const { state, dispatch } = usePlugin()
  const { metadata } = state
  const [existingNames, setExistingNames] = useState<Set<string>>(new Set())

  // Load registry to detect name conflicts
  useEffect(() => {
    window.pluginForge.getRegistry().then((entries: PluginRegistryEntry[]) => {
      const names = new Set(entries.filter((e) => e.id !== state.id).map((e) => e.name))
      setExistingNames(names)
    })
  }, [state.id])

  const hasNameConflict = metadata.name.length > 0 && existingNames.has(metadata.name)

  const updateMeta = (changes: Record<string, unknown>) => {
    dispatch({ type: 'SET_METADATA', payload: changes })
  }

  return (
    <div className="space-y-4">
      <h3 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
        Plugin Info
      </h3>

      {/* Name */}
      <div>
        <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
          Name <span style={{ color: 'var(--error)' }}>*</span>
        </label>
        <input
          type="text"
          value={metadata.name}
          onChange={(e) => updateMeta({ name: toKebabCase(e.target.value) })}
          placeholder="my-plugin"
          className="w-full h-9"
        />
        {hasNameConflict && (
          <div className="flex items-center gap-1.5 mt-1.5 text-small" style={{ color: 'var(--warning)' }}>
            <AlertTriangle size={12} />
            <span>A plugin named "{metadata.name}" already exists. This may cause conflicts during installation.</span>
          </div>
        )}
      </div>

      {/* Version */}
      <div>
        <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
          Version
        </label>
        <input
          type="text"
          value={metadata.version}
          onChange={(e) => updateMeta({ version: e.target.value })}
          placeholder="1.0.0"
          className="w-full h-9"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
          Description <span style={{ color: 'var(--error)' }}>*</span>
        </label>
        <textarea
          value={metadata.description}
          onChange={(e) => updateMeta({ description: e.target.value })}
          placeholder="What does this plugin do?"
          className="w-full h-20 resize-none"
          rows={3}
        />
      </div>

      {/* Author */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
            Author
          </label>
          <input
            type="text"
            value={metadata.author.name}
            onChange={(e) => updateMeta({ author: { ...metadata.author, name: e.target.value } })}
            placeholder="Name"
            className="w-full h-9"
          />
        </div>
        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
            Email
          </label>
          <input
            type="email"
            value={metadata.author.email || ''}
            onChange={(e) =>
              updateMeta({ author: { ...metadata.author, email: e.target.value } })
            }
            placeholder="email@example.com"
            className="w-full h-9"
          />
        </div>
      </div>

      {/* License */}
      <div>
        <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
          License
        </label>
        <select
          value={metadata.license}
          onChange={(e) => updateMeta({ license: e.target.value })}
          className="w-full h-9"
        >
          {licenses.map((l) => (
            <option key={l} value={l}>
              {l}
            </option>
          ))}
        </select>
      </div>

      {/* Keywords */}
      <div>
        <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
          Keywords
        </label>
        <input
          type="text"
          value={metadata.keywords.join(', ')}
          onChange={(e) =>
            updateMeta({
              keywords: e.target.value
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean)
                .slice(0, 10)
            })
          }
          placeholder="keyword1, keyword2"
          className="w-full h-9"
        />
        <p className="text-small mt-1" style={{ color: 'var(--text-muted)' }}>
          Comma-separated, max 10
        </p>
      </div>
    </div>
  )
}
