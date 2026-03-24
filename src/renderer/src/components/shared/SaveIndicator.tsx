import { Loader2, Check, Save } from 'lucide-react'
import type { SaveStatus } from '@/hooks/useAutosave'

interface SaveIndicatorProps {
  status: SaveStatus
  hasUnsavedChanges: boolean
  onSave: () => void
}

export function SaveIndicator({ status, hasUnsavedChanges, onSave }: SaveIndicatorProps) {
  return (
    <div className="flex items-center gap-2">
      {/* Save button */}
      <button
        onClick={onSave}
        disabled={!hasUnsavedChanges && status !== 'unsaved'}
        className="flex items-center gap-1.5 text-small px-2.5 py-1 rounded transition-colors"
        style={{
          backgroundColor: hasUnsavedChanges ? 'var(--accent)' : 'transparent',
          color: hasUnsavedChanges ? 'var(--text-on-accent)' : 'var(--text-muted)',
          cursor: hasUnsavedChanges ? 'pointer' : 'default',
          opacity: hasUnsavedChanges ? 1 : 0.5
        }}
        title="Save (Cmd+S)"
      >
        <Save size={12} />
        Save
      </button>

      {/* Status indicator */}
      {status === 'saving' && (
        <div className="flex items-center gap-1 text-small">
          <Loader2 size={11} className="animate-spin" style={{ color: 'var(--text-muted)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Saving...</span>
        </div>
      )}
      {status === 'saved' && (
        <div className="flex items-center gap-1 text-small">
          <Check size={11} style={{ color: 'var(--success)' }} />
          <span style={{ color: 'var(--text-muted)' }}>Saved</span>
        </div>
      )}

      {/* Unsaved changes dot */}
      {hasUnsavedChanges && status !== 'saving' && status !== 'saved' && (
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: 'var(--warning)' }} title="Unsaved changes" />
      )}
    </div>
  )
}
