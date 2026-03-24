import { usePlugin } from '@/hooks/usePluginState'
import { toKebabCase } from '@/lib/utils'
import type { SkillComponent } from '@/types/plugin'

const toolOptions = [
  'Bash', 'Read', 'Write', 'Edit', 'Glob', 'Grep', 'LS',
  'WebSearch', 'WebFetch', 'TodoRead', 'TodoWrite', 'Agent'
]

interface SkillEditorProps {
  skill: SkillComponent
}

export function SkillEditor({ skill }: SkillEditorProps) {
  const { dispatch } = usePlugin()

  const update = (changes: Partial<SkillComponent>) => {
    dispatch({ type: 'UPDATE_COMPONENT', payload: { id: skill.id, changes } })
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <h2 className="text-page-title font-heading" style={{ color: 'var(--text-primary)' }}>
        Skill Editor
      </h2>

      {/* Frontmatter form */}
      <div className="surface-panel p-5 space-y-4" data-panel>
        <h3 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
          Frontmatter
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
              Name <span style={{ color: 'var(--error)' }}>*</span>
            </label>
            <input
              type="text"
              value={skill.name}
              onChange={(e) => update({ name: toKebabCase(e.target.value) })}
              placeholder="my-skill"
              className="w-full h-9"
            />
          </div>
          <div>
            <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
              Version
            </label>
            <input
              type="text"
              value={skill.version || ''}
              onChange={(e) => update({ version: e.target.value || undefined })}
              placeholder="1.0.0"
              className="w-full h-9"
            />
          </div>
        </div>

        <div>
          <label className="block text-small mb-1" style={{ color: 'var(--text-secondary)' }}>
            Description <span style={{ color: 'var(--error)' }}>*</span>
          </label>
          <textarea
            value={skill.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Describe when Claude should use this skill..."
            className="w-full h-20 resize-none"
            rows={3}
          />
        </div>

        {/* Allowed tools */}
        <div>
          <label className="block text-small mb-2" style={{ color: 'var(--text-secondary)' }}>
            Allowed Tools
          </label>
          <div className="flex flex-wrap gap-2">
            {toolOptions.map((tool) => {
              const isSelected = skill.allowedTools?.includes(tool)
              return (
                <button
                  key={tool}
                  onClick={() => {
                    const current = skill.allowedTools || []
                    update({
                      allowedTools: isSelected
                        ? current.filter((t) => t !== tool)
                        : [...current, tool]
                    })
                  }}
                  className="text-small px-2.5 py-1 rounded transition-colors"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-muted)' : 'var(--bg-input)',
                    color: isSelected ? 'var(--accent)' : 'var(--text-muted)',
                    border: `1px solid ${isSelected ? 'var(--accent)' : 'var(--border)'}`
                  }}
                >
                  {tool}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content editor */}
      <div className="surface-panel p-5 space-y-3" data-panel>
        <h3 className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
          Skill Content
        </h3>
        <p className="text-small" style={{ color: 'var(--text-muted)' }}>
          Write the instructions Claude receives when this skill is activated. Supports markdown.
        </p>
        <textarea
          value={skill.body}
          onChange={(e) => update({ body: e.target.value })}
          placeholder="## Instructions\n\nDescribe what Claude should do when this skill is activated..."
          className="w-full font-mono text-code resize-none"
          style={{ minHeight: '300px' }}
          rows={15}
        />
      </div>
    </div>
  )
}
