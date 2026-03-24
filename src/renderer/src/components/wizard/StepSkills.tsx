import { Plus, Trash2 } from 'lucide-react'
import { nanoid } from 'nanoid'
import type { SkillComponent } from '@/types/plugin'

interface StepSkillsProps {
  skills: SkillComponent[]
  onAdd: () => void
  onUpdate: (id: string, changes: Partial<SkillComponent>) => void
  onRemove: (id: string) => void
}

export function StepSkills({ skills, onAdd, onUpdate, onRemove }: StepSkillsProps) {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h2 className="text-page-title font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
          What should Claude know?
        </h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          Skills are knowledge files. Claude reads them automatically when they're relevant. Think of them as instruction manuals for specific tasks.
        </p>
      </div>

      <div className="space-y-4">
        {skills.map((skill, index) => (
          <div key={skill.id} className="surface-panel p-5 space-y-4" data-panel>
            <div className="flex items-center justify-between">
              <span className="text-section-heading font-heading" style={{ color: 'var(--text-primary)' }}>
                Skill {index + 1}
              </span>
              {skills.length > 1 && (
                <button
                  onClick={() => onRemove(skill.id)}
                  className="p-1 rounded transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div>
              <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                Skill name
              </label>
              <input
                type="text"
                value={skill.name}
                onChange={(e) =>
                  onUpdate(skill.id, {
                    name: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-')
                  })
                }
                placeholder="code-review-standards"
                className="w-full h-9"
              />
            </div>

            <div>
              <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                When should Claude use this?
              </label>
              <textarea
                value={skill.description}
                onChange={(e) => onUpdate(skill.id, { description: e.target.value })}
                placeholder="Describe the situations where Claude should apply this skill..."
                className="w-full h-16 resize-none"
                rows={2}
              />
            </div>

            <div>
              <label className="block text-body font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                What should Claude do?
              </label>
              <textarea
                value={skill.body}
                onChange={(e) => onUpdate(skill.id, { body: e.target.value })}
                placeholder="Write the instructions, checklists, or guidelines Claude should follow..."
                className="w-full font-mono text-code resize-none"
                style={{ minHeight: '160px' }}
                rows={8}
              />
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onAdd}
        className="flex items-center gap-2 text-body px-4 py-2 rounded transition-colors w-full justify-center"
        style={{
          backgroundColor: 'var(--bg-elevated)',
          color: 'var(--text-secondary)',
          border: '1px dashed var(--border)'
        }}
      >
        <Plus size={16} />
        Add another skill
      </button>
    </div>
  )
}
