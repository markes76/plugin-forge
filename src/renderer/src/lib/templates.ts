import { nanoid } from 'nanoid'
import type { PluginState } from '@/types/plugin'

export function getTemplate(templateId: string): PluginState | null {
  const factory = templateFactories[templateId]
  return factory ? factory() : null
}

const templateFactories: Record<string, () => PluginState> = {
  'code-review': () => ({
    id: nanoid(),
    metadata: {
      name: 'code-review',
      version: '1.0.0',
      description: 'Code review plugin with skill, agent, command, and hook for reviewing PRs.',
      author: { name: '' },
      license: 'MIT',
      keywords: ['code-review', 'quality', 'linting']
    },
    components: [
      {
        type: 'skill',
        id: nanoid(),
        name: 'review-standards',
        description: 'Use when reviewing code for quality issues, style violations, and best practices.',
        body: '## Code Review Standards\n\nWhen reviewing code, check for:\n\n1. **Naming conventions** — clear, descriptive variable and function names\n2. **Error handling** — proper try/catch, error propagation\n3. **Type safety** — no `any` types, proper interfaces\n4. **Security** — no hardcoded secrets, proper input validation\n5. **Performance** — no unnecessary re-renders, efficient algorithms\n6. **Testing** — adequate test coverage for new code',
        scripts: [],
        references: []
      },
      {
        type: 'agent',
        id: nanoid(),
        name: 'code-reviewer',
        description: 'Reviews code for quality issues, style violations, and best practices. Use for PR reviews and code audits.',
        model: 'sonnet',
        body: 'You are an expert code reviewer. Analyze code changes for:\n\n- Bug risks and logic errors\n- Security vulnerabilities\n- Performance issues\n- Style and naming consistency\n- Missing error handling\n- Test coverage gaps\n\nProvide specific, actionable feedback with line references. Be constructive, not pedantic.'
      },
      {
        type: 'command',
        id: nanoid(),
        name: 'review',
        description: 'Trigger a code review of recent changes',
        body: 'Review the recent code changes in this project. Use the code-reviewer agent to analyze the diff and provide feedback on quality, security, and best practices.'
      },
      {
        type: 'hooks',
        id: nanoid(),
        rules: [
          {
            id: nanoid(),
            event: 'PostToolUse',
            matcher: 'Write|Edit',
            hookType: 'prompt',
            prompt: 'Briefly check if the code just written follows project conventions. If there are obvious issues (security, performance, or correctness), mention them. Otherwise, stay silent.'
          }
        ]
      }
    ],
    isDirty: false,
    mcpMode: 'cowork' as const,
    coworkConnectors: []
  }),

  'documentation': () => ({
    id: nanoid(),
    metadata: {
      name: 'doc-generator',
      version: '1.0.0',
      description: 'Generate and maintain documentation from your codebase.',
      author: { name: '' },
      license: 'MIT',
      keywords: ['documentation', 'docs', 'readme']
    },
    components: [
      {
        type: 'skill',
        id: nanoid(),
        name: 'doc-standards',
        description: 'Use when generating or reviewing documentation for consistency and completeness.',
        body: '## Documentation Standards\n\n- Use clear, concise language\n- Include code examples for all public APIs\n- Document parameters, return values, and exceptions\n- Keep README.md up to date with installation and usage\n- Use JSDoc/TSDoc for inline documentation',
        scripts: [],
        references: []
      },
      {
        type: 'agent',
        id: nanoid(),
        name: 'doc-writer',
        description: 'Generates documentation from code. Use for README generation, API docs, and inline comments.',
        model: 'sonnet',
        body: 'You are a technical documentation specialist. Generate clear, accurate documentation from source code. Focus on:\n\n- What the code does (purpose)\n- How to use it (examples)\n- What parameters it accepts\n- What it returns\n- Edge cases and gotchas'
      },
      {
        type: 'command',
        id: nanoid(),
        name: 'docs',
        description: 'Generate documentation for the current project',
        body: 'Analyze the codebase and generate or update documentation. Focus on public APIs, README.md, and any undocumented functions.'
      }
    ],
    isDirty: false,
    mcpMode: 'cowork' as const,
    coworkConnectors: []
  }),

  'testing': () => ({
    id: nanoid(),
    metadata: {
      name: 'testing-toolkit',
      version: '1.0.0',
      description: 'Create and review tests with dedicated agents.',
      author: { name: '' },
      license: 'MIT',
      keywords: ['testing', 'tests', 'coverage']
    },
    components: [
      {
        type: 'skill',
        id: nanoid(),
        name: 'testing-patterns',
        description: 'Use when writing or reviewing tests for best practices and patterns.',
        body: '## Testing Best Practices\n\n- Test behavior, not implementation\n- Use descriptive test names that explain the scenario\n- Follow Arrange-Act-Assert pattern\n- Mock external dependencies, not internal logic\n- Aim for edge cases: null, empty, boundary values\n- Keep tests independent and idempotent',
        scripts: [],
        references: []
      },
      {
        type: 'agent',
        id: nanoid(),
        name: 'test-writer',
        description: 'Creates tests for code. Use when you need unit tests, integration tests, or test scaffolding.',
        model: 'sonnet',
        body: 'You are a test engineering expert. Write comprehensive tests that:\n\n- Cover happy paths and error paths\n- Test edge cases and boundary conditions\n- Use the project\'s existing test framework\n- Follow existing test patterns in the codebase\n- Are readable and maintainable'
      },
      {
        type: 'agent',
        id: nanoid(),
        name: 'test-reviewer',
        description: 'Reviews test coverage and quality. Use to audit test suites for gaps.',
        model: 'sonnet',
        body: 'You are a test quality auditor. Review test suites for:\n\n- Missing test cases\n- Insufficient edge case coverage\n- Brittle tests that depend on implementation\n- Tests that don\'t actually assert anything meaningful\n- Opportunities for better test organization'
      },
      {
        type: 'command',
        id: nanoid(),
        name: 'test',
        description: 'Write tests for recent changes',
        body: 'Analyze the recent code changes and create comprehensive tests. Use the test-writer agent for creation and the test-reviewer agent to verify coverage.'
      }
    ],
    isDirty: false,
    mcpMode: 'cowork' as const,
    coworkConnectors: []
  }),

  'devops': () => ({
    id: nanoid(),
    metadata: {
      name: 'devops-pipeline',
      version: '1.0.0',
      description: 'Deployment checklist, safety hooks, and CI/CD helpers.',
      author: { name: '' },
      license: 'MIT',
      keywords: ['devops', 'deployment', 'ci-cd']
    },
    components: [
      {
        type: 'skill',
        id: nanoid(),
        name: 'deploy-checklist',
        description: 'Use before deploying to production to verify readiness.',
        body: '## Pre-Deployment Checklist\n\n- [ ] All tests passing\n- [ ] No console.log or debug statements\n- [ ] Environment variables configured\n- [ ] Database migrations ready\n- [ ] Rollback plan documented\n- [ ] Monitoring and alerts configured\n- [ ] Change log updated',
        scripts: [],
        references: []
      },
      {
        type: 'agent',
        id: nanoid(),
        name: 'deploy-checker',
        description: 'Validates deployment readiness by checking tests, configs, and dependencies.',
        model: 'sonnet',
        body: 'You are a deployment readiness validator. Before any deployment, verify:\n\n- All tests pass\n- No debug code remains\n- Environment variables are properly configured\n- Database migrations are in order\n- Dependencies are locked and up to date'
      },
      {
        type: 'hooks',
        id: nanoid(),
        rules: [
          {
            id: nanoid(),
            event: 'PreToolUse',
            matcher: 'Bash',
            hookType: 'prompt',
            prompt: 'Check if this bash command could be destructive (rm -rf, DROP TABLE, force push, etc.). If so, warn about the risks and suggest a safer alternative.'
          }
        ]
      },
      {
        type: 'mcpServers',
        id: nanoid(),
        mcpMode: 'claude-code',
        servers: [
          {
            id: nanoid(),
            name: 'ci-server',
            command: 'npx',
            args: ['@your-org/ci-mcp-server'],
            env: { CI_TOKEN: '${CI_TOKEN}' }
          }
        ],
        coworkConnectors: []
      }
    ],
    isDirty: false,
    mcpMode: 'cowork' as const,
    coworkConnectors: []
  }),

  'blank-skill': () => ({
    id: nanoid(),
    metadata: {
      name: 'my-skill-plugin',
      version: '1.0.0',
      description: 'A plugin with a single skill.',
      author: { name: '' },
      license: 'MIT',
      keywords: []
    },
    components: [
      {
        type: 'skill',
        id: nanoid(),
        name: 'my-skill',
        description: '',
        body: '## Instructions\n\nDescribe what Claude should do when this skill is activated.\n',
        scripts: [],
        references: []
      }
    ],
    isDirty: false,
    mcpMode: 'cowork' as const,
    coworkConnectors: []
  }),

  'blank-agent': () => ({
    id: nanoid(),
    metadata: {
      name: 'my-agent-plugin',
      version: '1.0.0',
      description: 'A plugin with a single agent.',
      author: { name: '' },
      license: 'MIT',
      keywords: []
    },
    components: [
      {
        type: 'agent',
        id: nanoid(),
        name: 'my-agent',
        description: '',
        body: 'You are an expert at...\n'
      }
    ],
    isDirty: false
  })
}
