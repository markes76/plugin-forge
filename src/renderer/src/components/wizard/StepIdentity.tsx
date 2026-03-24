import { toKebabCase } from '@/lib/utils'
import type { PluginMetadata } from '@/types/plugin'

interface StepIdentityProps {
  metadata: PluginMetadata
  onUpdate: (changes: Partial<PluginMetadata>) => void
}

export function StepIdentity({ metadata, onUpdate }: StepIdentityProps) {
  return (
    <div className="max-w-xl mx-auto p-8 space-y-6">
      <div>
        <h2 className="text-page-title font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
          Give your plugin a name and description
        </h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          These help Claude and users understand what your plugin does.
        </p>
      </div>

      <div className="space-y-5">
        {/* Plugin name */}
        <div>
          <label className="block text-body font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Plugin name
          </label>
          <input
            type="text"
            value={metadata.name}
            onChange={(e) => onUpdate({ name: toKebabCase(e.target.value) })}
            placeholder="my-plugin"
            className="w-full h-10"
          />
          {metadata.name && (
            <p className="text-small mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Will be used as: <span className="font-mono" style={{ color: 'var(--accent)' }}>{metadata.name}</span>
            </p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-body font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Short description
          </label>
          <textarea
            value={metadata.description}
            onChange={(e) => onUpdate({ description: e.target.value })}
            placeholder="In one sentence, what does this plugin do?"
            className="w-full h-20 resize-none"
            rows={3}
          />
        </div>

        {/* Who is this for */}
        <div>
          <label className="block text-body font-medium mb-1.5" style={{ color: 'var(--text-primary)' }}>
            Who is this for?
            <span className="text-small font-normal ml-1.5" style={{ color: 'var(--text-muted)' }}>
              Optional
            </span>
          </label>
          <input
            type="text"
            value={metadata.keywords.join(', ')}
            onChange={(e) =>
              onUpdate({
                keywords: e.target.value
                  .split(',')
                  .map((k) => k.trim())
                  .filter(Boolean)
              })
            }
            placeholder="Engineering team, Sales reps, Everyone"
            className="w-full h-10"
          />
        </div>

        {/* Target platform */}
        <div>
          <label className="block text-body font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Target platform
          </label>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-body" style={{ color: 'var(--text-secondary)' }}>Claude Code</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" defaultChecked className="rounded" />
              <span className="text-body" style={{ color: 'var(--text-secondary)' }}>Cowork</span>
            </label>
          </div>
          <p className="text-small mt-1" style={{ color: 'var(--text-muted)' }}>
            Both use the same plugin format.
          </p>
        </div>
      </div>
    </div>
  )
}
