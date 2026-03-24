import { useState, useMemo } from 'react'
import { X } from 'lucide-react'

type BumpType = 'patch' | 'minor' | 'major'

interface VersionBumpDialogProps {
  currentVersion: string
  autoChangelog: string
  suggestedBump: BumpType
  onConfirm: (newVersion: string, changelog: string) => void
  onCancel: () => void
}

function bumpVersion(version: string, type: BumpType): string {
  const [major, minor, patch] = version.split('.').map(Number)
  switch (type) {
    case 'patch': return `${major}.${minor}.${patch + 1}`
    case 'minor': return `${major}.${minor + 1}.0`
    case 'major': return `${major + 1}.0.0`
  }
}

export function VersionBumpDialog({
  currentVersion,
  autoChangelog,
  suggestedBump,
  onConfirm,
  onCancel
}: VersionBumpDialogProps) {
  const [bumpType, setBumpType] = useState<BumpType>(suggestedBump)
  const [changelog, setChangelog] = useState(autoChangelog)

  const newVersion = useMemo(() => bumpVersion(currentVersion, bumpType), [currentVersion, bumpType])

  const options: Array<{ type: BumpType; label: string; description: string; example: string }> = [
    {
      type: 'patch',
      label: 'Patch',
      description: 'Bug fixes, minor tweaks',
      example: bumpVersion(currentVersion, 'patch')
    },
    {
      type: 'minor',
      label: 'Minor',
      description: 'New features, added components',
      example: bumpVersion(currentVersion, 'minor')
    },
    {
      type: 'major',
      label: 'Major',
      description: 'Breaking changes, major restructure',
      example: bumpVersion(currentVersion, 'major')
    }
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
    >
      <div
        className="w-[480px] rounded-lg p-6 space-y-5"
        style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-page-title font-heading" style={{ color: 'var(--text-primary)' }}>
            Update Plugin
          </h2>
          <button onClick={onCancel} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
            <X size={18} />
          </button>
        </div>

        {/* Current version */}
        <div>
          <p className="text-small" style={{ color: 'var(--text-muted)' }}>
            Current version: <span className="font-mono" style={{ color: 'var(--text-primary)' }}>v{currentVersion}</span>
          </p>
        </div>

        {/* Bump type selection */}
        <div className="space-y-2">
          {options.map((opt) => (
            <label
              key={opt.type}
              className="flex items-center gap-3 p-3 rounded cursor-pointer transition-colors"
              style={{
                backgroundColor: bumpType === opt.type ? 'var(--accent-muted)' : 'var(--bg-input)',
                border: `1px solid ${bumpType === opt.type ? 'var(--accent)' : 'var(--border)'}`
              }}
            >
              <input
                type="radio"
                name="bumpType"
                checked={bumpType === opt.type}
                onChange={() => setBumpType(opt.type)}
                className="sr-only"
              />
              <div
                className="w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: bumpType === opt.type ? 'var(--accent)' : 'var(--text-muted)'
                }}
              >
                {bumpType === opt.type && (
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-body font-medium" style={{ color: 'var(--text-primary)' }}>
                    {opt.label}
                  </span>
                  <span className="font-mono text-small" style={{ color: 'var(--accent)' }}>
                    {opt.example}
                  </span>
                </div>
                <p className="text-small" style={{ color: 'var(--text-muted)' }}>{opt.description}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Changelog */}
        <div>
          <label className="block text-body font-medium mb-1.5" style={{ color: 'var(--text-secondary)' }}>
            What changed?
          </label>
          <textarea
            value={changelog}
            onChange={(e) => setChangelog(e.target.value)}
            placeholder="Describe what changed in this version..."
            className="w-full h-20 resize-none"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="text-body px-4 py-2 rounded transition-colors"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border)'
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(newVersion, changelog)}
            className="text-body font-medium px-5 py-2 rounded transition-colors"
            data-accent="true"
            style={{ backgroundColor: 'var(--accent)', color: 'var(--text-on-accent)' }}
          >
            Update to v{newVersion}
          </button>
        </div>
      </div>
    </div>
  )
}

// Helper to auto-detect suggested bump type from state changes
export function detectBumpType(
  originalComponents: Array<{ type: string; id: string }>,
  currentComponents: Array<{ type: string; id: string }>
): { bumpType: BumpType; changelog: string } {
  const originalIds = new Set(originalComponents.map((c) => c.id))
  const currentIds = new Set(currentComponents.map((c) => c.id))

  const added = currentComponents.filter((c) => !originalIds.has(c.id))
  const removed = originalComponents.filter((c) => !currentIds.has(c.id))

  const parts: string[] = []

  if (removed.length > 0) {
    parts.push(`Removed ${removed.length} component${removed.length > 1 ? 's' : ''}`)
    return { bumpType: 'major', changelog: parts.join('. ') }
  }

  if (added.length > 0) {
    for (const c of added) {
      parts.push(`Added ${c.type}`)
    }
    return { bumpType: 'minor', changelog: parts.join('. ') }
  }

  return { bumpType: 'patch', changelog: 'Updated content' }
}
