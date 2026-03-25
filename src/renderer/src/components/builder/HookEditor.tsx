import { usePlugin } from '@/hooks/usePluginState'
import { nanoid } from 'nanoid'
import { Plus, Trash2 } from 'lucide-react'
import type { HooksComponent, HookEvent, HookType } from '@/types/plugin'

const hookEvents: HookEvent[] = [
  'SessionStart', 'UserPromptSubmit', 'PreToolUse', 'PermissionRequest',
  'PostToolUse', 'PostToolUseFailure', 'Notification',
  'SubagentStart', 'SubagentStop', 'Stop', 'StopFailure',
  'TeammateIdle', 'TaskCompleted', 'InstructionsLoaded', 'ConfigChange',
  'WorktreeCreate', 'WorktreeRemove', 'PreCompact', 'PostCompact',
  'Elicitation', 'ElicitationResult', 'SessionEnd'
]
const hookTypes: HookType[] = ['command', 'prompt', 'agent', 'http']

interface HookEditorProps {
  hooks: HooksComponent
}

export function HookEditor({ hooks }: HookEditorProps) {
  const { dispatch } = usePlugin()

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-page-title font-heading" style={{ color: 'var(--text-primary)' }}>
          Hook Rules
        </h2>
        <button
          onClick={() =>
            dispatch({
              type: 'ADD_HOOK_RULE',
              payload: { id: nanoid(), event: 'PreToolUse', hookType: 'prompt', prompt: '' }
            })
          }
          className="flex items-center gap-1.5 text-small px-3 py-1.5 rounded transition-colors"
          data-accent="true"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--text-on-accent)'
          }}
        >
          <Plus size={14} />
          Add Rule
        </button>
      </div>

      <p className="text-small" style={{ color: 'var(--text-muted)' }}>
        Hooks run automatically in response to Claude Code events. Define rules to trigger commands, prompts, or agents.
      </p>

      {hooks.rules.length === 0 && (
        <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>
          No hook rules yet. Click "Add Rule" to create one.
        </div>
      )}

      <div className="space-y-4">
        {hooks.rules.map((rule) => (
          <div key={rule.id} className="surface-panel p-5 space-y-4" data-panel>
            <div className="flex items-center justify-between">
              <span
                className="text-small px-2 py-0.5 rounded font-mono"
                style={{
                  backgroundColor: 'var(--accent-muted)',
                  color: 'var(--accent)'
                }}
              >
                {rule.event}
              </span>
              <button
                onClick={() => dispatch({ type: 'REMOVE_HOOK_RULE', payload: { id: rule.id } })}
                className="p-1 rounded transition-colors"
                style={{ color: 'var(--text-muted)' }}
              >
                <Trash2 size={14} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Event
                </label>
                <select
                  value={rule.event}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_HOOK_RULE',
                      payload: { id: rule.id, changes: { event: e.target.value as HookEvent } }
                    })
                  }
                  className="w-full h-9"
                >
                  {hookEvents.map((ev) => (
                    <option key={ev} value={ev}>
                      {ev}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Matcher (regex)
                </label>
                <input
                  type="text"
                  value={rule.matcher || ''}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_HOOK_RULE',
                      payload: { id: rule.id, changes: { matcher: e.target.value || undefined } }
                    })
                  }
                  placeholder="Write|Edit"
                  className="w-full h-9 font-mono text-code"
                />
              </div>
              <div>
                <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Type
                </label>
                <select
                  value={rule.hookType}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_HOOK_RULE',
                      payload: { id: rule.id, changes: { hookType: e.target.value as HookType } }
                    })
                  }
                  className="w-full h-9"
                >
                  {hookTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Type-specific action field */}
            {rule.hookType === 'command' && (
              <div>
                <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Command
                </label>
                <input
                  type="text"
                  value={rule.command || ''}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_HOOK_RULE',
                      payload: { id: rule.id, changes: { command: e.target.value } }
                    })
                  }
                  placeholder='node "${CLAUDE_PLUGIN_ROOT}/scripts/check.js"'
                  className="w-full h-9 font-mono text-code"
                />
              </div>
            )}

            {rule.hookType === 'prompt' && (
              <div>
                <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Prompt
                </label>
                <textarea
                  value={rule.prompt || ''}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_HOOK_RULE',
                      payload: { id: rule.id, changes: { prompt: e.target.value } }
                    })
                  }
                  placeholder="Check if the code follows our coding standards..."
                  className="w-full h-20 resize-none"
                  rows={3}
                />
              </div>
            )}

            {rule.hookType === 'agent' && (
              <div>
                <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Agent Name
                </label>
                <input
                  type="text"
                  value={rule.agentName || ''}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_HOOK_RULE',
                      payload: { id: rule.id, changes: { agentName: e.target.value } }
                    })
                  }
                  placeholder="my-agent"
                  className="w-full h-9"
                />
              </div>
            )}

            {rule.hookType === 'http' && (
              <div>
                <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
                  URL (POST endpoint)
                </label>
                <input
                  type="text"
                  value={rule.url || ''}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_HOOK_RULE',
                      payload: { id: rule.id, changes: { url: e.target.value } }
                    })
                  }
                  placeholder="https://api.example.com/webhook"
                  className="w-full h-9 font-mono text-code"
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
