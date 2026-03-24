import { Sparkles, Bot, Layers } from 'lucide-react'
import type { PluginType } from '@/hooks/useWizardState'

interface StepPluginTypeProps {
  selected: PluginType | null
  onSelect: (type: PluginType) => void
}

const options: Array<{
  type: PluginType
  icon: React.ElementType
  title: string
  description: string
  example: string
}> = [
  {
    type: 'skills-only',
    icon: Sparkles,
    title: 'Skills Plugin',
    description:
      'Teach Claude domain knowledge. Claude will automatically use your skills when they\'re relevant.',
    example: 'A skill that teaches Claude your company\'s code review standards.'
  },
  {
    type: 'skills-agents',
    icon: Bot,
    title: 'Skills + Agents Plugin',
    description:
      'Skills plus specialized agents that can be invoked for specific tasks.',
    example: 'A code review skill plus a dedicated reviewer agent with restricted tool access.'
  },
  {
    type: 'full',
    icon: Layers,
    title: 'Full Plugin',
    description:
      'Skills, agents, commands, hooks, and MCP connectors. The complete toolkit.',
    example: 'A sales plugin with CRM connectors, call prep commands, and deal analysis agents.'
  }
]

export function StepPluginType({ selected, onSelect }: StepPluginTypeProps) {
  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h2 className="text-page-title font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
          What kind of plugin do you want to create?
        </h2>
        <p className="text-body" style={{ color: 'var(--text-secondary)' }}>
          This determines which steps you'll see. You can always switch to the advanced builder later.
        </p>
      </div>

      <div className="space-y-3">
        {options.map((opt) => {
          const Icon = opt.icon
          const isSelected = selected === opt.type

          return (
            <button
              key={opt.type}
              onClick={() => onSelect(opt.type)}
              className="w-full surface-panel p-5 text-left transition-all"
              data-panel
              style={{
                borderColor: isSelected ? 'var(--accent)' : undefined,
                borderWidth: isSelected ? '2px' : undefined
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-muted)' : 'var(--bg-elevated)'
                  }}
                >
                  <Icon
                    size={20}
                    style={{ color: isSelected ? 'var(--accent)' : 'var(--text-muted)' }}
                  />
                </div>
                <div className="flex-1">
                  <h3
                    className="text-section-heading font-heading mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {opt.title}
                  </h3>
                  <p className="text-body mb-2" style={{ color: 'var(--text-secondary)' }}>
                    {opt.description}
                  </p>
                  <p className="text-small" style={{ color: 'var(--text-muted)' }}>
                    Example: {opt.example}
                  </p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
