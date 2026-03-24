import { useMemo } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { validatePlugin } from '@/lib/validators'
import { usePlugin } from '@/hooks/usePluginState'

export function ValidationPanel() {
  const { state } = usePlugin()

  const issues = useMemo(() => validatePlugin(state), [state])

  const errors = issues.filter((i) => i.severity === 'error')
  const warnings = issues.filter((i) => i.severity === 'warning')
  const infos = issues.filter((i) => i.severity === 'info')

  if (issues.length === 0) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-2 text-small" style={{ color: 'var(--success)' }}>
          <CheckCircle size={16} />
          <span>All checks passed</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      <h4 className="text-small font-medium" style={{ color: 'var(--text-primary)' }}>
        Validation ({issues.length})
      </h4>

      {errors.length > 0 && (
        <div className="space-y-1.5">
          {errors.map((issue, i) => (
            <IssueRow key={`e-${i}`} icon={XCircle} color="var(--error)" message={issue.message} />
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((issue, i) => (
            <IssueRow key={`w-${i}`} icon={AlertTriangle} color="var(--warning)" message={issue.message} />
          ))}
        </div>
      )}

      {infos.length > 0 && (
        <div className="space-y-1.5">
          {infos.map((issue, i) => (
            <IssueRow key={`i-${i}`} icon={Info} color="var(--accent)" message={issue.message} />
          ))}
        </div>
      )}
    </div>
  )
}

function IssueRow({
  icon: Icon,
  color,
  message
}: {
  icon: React.ElementType
  color: string
  message: string
}) {
  return (
    <div
      className="flex items-start gap-2 text-small px-2 py-1.5 rounded"
      style={{ backgroundColor: 'var(--bg-input)' }}
    >
      <Icon size={14} style={{ color, marginTop: 1, flexShrink: 0 }} />
      <span style={{ color: 'var(--text-secondary)' }}>{message}</span>
    </div>
  )
}
