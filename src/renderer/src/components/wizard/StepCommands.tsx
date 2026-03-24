import { Plus, Trash2 } from 'lucide-react'
import type { CommandComponent } from '@/types/plugin'

interface StepCommandsProps {
  commands: CommandComponent[]
  pluginName: string
  onAdd: () => void
  onUpdate: (id: string, changes: Partial<CommandComponent>) => void
  onRemove: (id: string) => void
}

export function StepCommands({ commands, pluginName, onAdd, onUpdate, onRemove }: StepCommandsProps) {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h2 className="text-page-title font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
          Create slash commands
        </h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Commands are shortcuts your team can type to trigger specific workflows.
          {pluginName && (
            <> They'll look like <span className="font-mono" style={{ color: 'var(--accent)' }}>/{pluginName}:command-name</span>.</>
          )}
        </p>
      </div>

      <div className="space-y-4">
        {commands.map((cmd, index) => (
          <div key={cmd.id} className="surface-panel p-5 space-y-4" data-panel>
            <div className="flex items-center justify-between">
              <span className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
                Command {index + 1}
              </span>
              {commands.length > 1 && (
                <button onClick={() => onRemove(cmd.id)} className="p-1 rounded" style={{ color: 'var(--text-muted)' }}>
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div>
              <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Command name
              </label>
              <input
                type="text"
                value={cmd.name}
                onChange={(e) =>
                  onUpdate(cmd.id, {
                    name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
                  })
                }
                placeholder="review"
                className="w-full h-9"
              />
              {cmd.name && pluginName && (
                <p className="text-small mt-1" style={{ color: 'var(--text-muted)' }}>
                  Invoked as: <span className="font-mono" style={{ color: 'var(--accent)' }}>/{pluginName}:{cmd.name}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                What does this command do?
              </label>
              <textarea
                value={cmd.description}
                onChange={(e) => onUpdate(cmd.id, { description: e.target.value })}
                placeholder="Describe what happens when someone runs this command..."
                className="w-full h-16 resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Command prompt
              </label>
              <textarea
                value={cmd.body}
                onChange={(e) => onUpdate(cmd.id, { body: e.target.value })}
                placeholder="Write what Claude should do when someone runs this command..."
                className="w-full font-mono text-code resize-none"
                style={{ minHeight: '120px' }}
                rows={6}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="flex items-center gap-2 text-body px-4 py-2 rounded transition-colors w-full justify-center"
        style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--text-secondary)', border: '1px dashed var(--border)' }}
      >
        <Plus size={16} />
        Add another command
      </button>
    </div>
  )
}
