import { useNavigate } from 'react-router-dom'
import {
  Code2,
  FileText,
  TestTube,
  Rocket,
  Sparkles,
  Bot
} from 'lucide-react'

interface Template {
  id: string
  name: string
  description: string
  icon: React.ElementType
  badges: string[]
}

const templates: Template[] = [
  {
    id: 'code-review',
    name: 'Code Review Plugin',
    description: 'Skill, agent, command, and hook for reviewing pull requests and code quality.',
    icon: Code2,
    badges: ['1 Skill', '1 Agent', '1 Command', '1 Hook']
  },
  {
    id: 'documentation',
    name: 'Documentation Generator',
    description: 'Generate and maintain documentation from your codebase automatically.',
    icon: FileText,
    badges: ['1 Skill', '1 Agent', '1 Command']
  },
  {
    id: 'testing',
    name: 'Testing Toolkit',
    description: 'Create and review tests with dedicated agents for writing and coverage analysis.',
    icon: TestTube,
    badges: ['1 Skill', '2 Agents', '1 Command']
  },
  {
    id: 'devops',
    name: 'DevOps Pipeline',
    description: 'Deployment checklist, readiness checker, and safety hooks for CI/CD workflows.',
    icon: Rocket,
    badges: ['1 Skill', '1 Agent', '1 Hook', '1 MCP']
  },
  {
    id: 'blank-skill',
    name: 'Blank Skill',
    description: 'Start with a single skill. The simplest possible plugin.',
    icon: Sparkles,
    badges: ['1 Skill']
  },
  {
    id: 'blank-agent',
    name: 'Blank Agent',
    description: 'Start with a single agent. Define its role and capabilities.',
    icon: Bot,
    badges: ['1 Agent']
  }
]

export function Templates() {
  const navigate = useNavigate()

  return (
    <div className="flex-1 overflow-y-auto p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-page-title font-heading mb-2" style={{ color: 'var(--text-primary)' }}>
          Templates
        </h1>
        <p className="text-body mb-8" style={{ color: 'var(--text-secondary)' }}>
          Start with a pre-built template and customize it to your needs.
        </p>

        <div className="space-y-3">
          {templates.map((template) => {
            const Icon = template.icon
            return (
              <div
                key={template.id}
                className="surface-panel p-5 flex items-start gap-4 transition-all hover:border-[var(--accent)] cursor-pointer"
                data-panel
                onClick={() => navigate(`/builder?template=${template.id}`)}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: 'var(--accent-muted)' }}
                >
                  <Icon size={20} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3
                    className="text-section-heading font-heading mb-1"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {template.name}
                  </h3>
                  <p className="text-small mb-3" style={{ color: 'var(--text-muted)' }}>
                    {template.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.badges.map((badge) => (
                      <span
                        key={badge}
                        className="text-small px-2 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--bg-elevated)',
                          color: 'var(--text-secondary)',
                          border: '1px solid var(--border)'
                        }}
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
