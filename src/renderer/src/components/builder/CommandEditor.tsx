import { usePlugin } from '@/hooks/usePluginState'
import { toKebabCase } from '@/lib/utils'
import type { CommandComponent } from '@/types/plugin'

interface CommandEditorProps {
  command: CommandComponent
}

export function CommandEditor({ command }: CommandEditorProps) {
  const { dispatch } = usePlugin()

  const update = (changes: Partial<CommandComponent>) => {
    dispatch({ type: 'UPDATE_COMPONENT', payload: { id: command.id, changes } })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <h2 className="text-page-title font-heading" style={{ color: 'var(--text-primary)' }}>
        Command Editor
      </h2>

      <div
        className="surface-panel p-4 text-small"
        style={{ borderLeft: '3px solid var(--accent)', color: 'var(--text-secondary)' }}
      >
        Commands are invoked as <code className="font-mono" style={{ color: 'var(--accent)' }}>/plugin-name:command-name</code>.
        The markdown content becomes the prompt Claude receives.
      </div>

      {/* Frontmatter */}
      <div className="surface-panel p-5 space-y-4" data-panel>
        <h3 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
          Frontmatter
        </h3>

        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
            Name <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <input
            type="text"
            value={command.name}
            onChange={(e) => update({ name: toKebabCase(e.target.value) })}
            placeholder="my-command"
            className="w-full h-9"
          />
        </div>

        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
            Description <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <textarea
            value={command.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Describe what this command does..."
            className="w-full h-16 resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* Content */}
      <div className="surface-panel p-5 space-y-3" data-panel>
        <h3 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
          Command Prompt
        </h3>
        <textarea
          value={command.body}
          onChange={(e) => update({ body: e.target.value })}
          placeholder="The prompt Claude receives when this command is invoked..."
          className="w-full font-mono text-code resize-none"
          style={{ minHeight: '250px' }}
          rows={12}
        />
      </div>
    </div>
  )
}
