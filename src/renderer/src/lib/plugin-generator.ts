import { toYamlFrontmatter } from './frontmatter'
import type {
  PluginState,
  GeneratedFile,
  SkillComponent,
  AgentComponent,
  CommandComponent,
  HooksComponent,
  McpServersComponent
} from '@/types/plugin'

export function generatePlugin(state: PluginState): GeneratedFile[] {
  const files: GeneratedFile[] = []

  // Generate component files
  for (const component of state.components) {
    switch (component.type) {
      case 'skill':
        files.push(...generateSkill(component))
        break
      case 'agent':
        files.push(generateAgent(component))
        break
      case 'command':
        files.push(generateCommand(component))
        break
      case 'hooks':
        if (component.rules.length > 0) {
          files.push(generateHooks(component))
        }
        break
      case 'mcpServers': {
        // Only generate .mcp.json for Claude Code servers (if in claude-code mode)
        if (state.mcpMode === 'claude-code' && component.servers.length > 0) {
          const mcpFile = generateClaudeCodeMcpJson(component)
          if (mcpFile) files.push(mcpFile)
        }
        break
      }
    }
  }

  // Generate .mcp.json for Cowork connectors (from root state, not components)
  if (state.mcpMode === 'cowork' && state.coworkConnectors.length > 0) {
    files.push(generateCoworkMcpJson(state.coworkConnectors))
    files.push(generateConnectorsMd(state.coworkConnectors))
  }

  // Generate plugin.json (needs knowledge of what was generated)
  files.push(generatePluginJson(state, files))

  // Generate README
  files.push(generateReadme(state))

  // Generate LICENSE
  files.push(generateLicense(state.metadata.license, state.metadata.author.name))

  return files
}

function generateSkill(skill: SkillComponent): GeneratedFile[] {
  const files: GeneratedFile[] = []
  const dir = `skills/${skill.name}`

  const frontmatter = toYamlFrontmatter({
    name: skill.name,
    description: skill.description,
    ...(skill.version && { version: skill.version }),
    ...(skill.allowedTools?.length && { 'allowed-tools': skill.allowedTools.join(', ') })
  })

  const content = frontmatter ? `${frontmatter}\n\n${skill.body}` : skill.body
  files.push({ relativePath: `${dir}/SKILL.md`, content })

  // Supporting files
  for (const script of skill.scripts) {
    files.push({ relativePath: `${dir}/scripts/${script.filename}`, content: script.content })
  }
  for (const ref of skill.references) {
    files.push({ relativePath: `${dir}/references/${ref.filename}`, content: ref.content })
  }

  return files
}

function generateAgent(agent: AgentComponent): GeneratedFile {
  const frontmatter = toYamlFrontmatter({
    name: agent.name,
    description: agent.description,
    ...(agent.model && { model: agent.model }),
    ...(agent.effort && { effort: agent.effort }),
    ...(agent.maxTurns && { maxTurns: agent.maxTurns }),
    ...(agent.tools?.length && { tools: agent.tools.join(', ') }),
    ...(agent.disallowedTools?.length && { disallowedTools: agent.disallowedTools.join(', ') }),
    ...(agent.memory !== undefined && agent.memory && { memory: agent.memory }),
    ...(agent.background !== undefined && agent.background && { background: agent.background }),
    ...(agent.isolation !== undefined && agent.isolation && { isolation: 'worktree' })
  })

  const content = frontmatter ? `${frontmatter}\n\n${agent.body}` : agent.body
  return { relativePath: `agents/${agent.name}.md`, content }
}

function generateCommand(command: CommandComponent): GeneratedFile {
  const frontmatter = toYamlFrontmatter({
    name: command.name,
    description: command.description
  })

  const content = frontmatter ? `${frontmatter}\n\n${command.body}` : command.body
  return { relativePath: `commands/${command.name}.md`, content }
}

function generateHooks(hooks: HooksComponent): GeneratedFile {
  const hooksConfig: Record<string, Array<{ matcher?: string; hooks: unknown[] }>> = {}

  for (const rule of hooks.rules) {
    if (!hooksConfig[rule.event]) {
      hooksConfig[rule.event] = []
    }

    const hookAction: Record<string, unknown> = { type: rule.hookType }
    if (rule.hookType === 'command' && rule.command) hookAction.command = rule.command
    if (rule.hookType === 'prompt' && rule.prompt) hookAction.prompt = rule.prompt
    if (rule.hookType === 'agent' && rule.agentName) hookAction.agent = rule.agentName

    // Check if there's an existing entry with the same matcher
    const existingEntry = hooksConfig[rule.event].find((e) => e.matcher === rule.matcher)
    if (existingEntry) {
      existingEntry.hooks.push(hookAction)
    } else {
      hooksConfig[rule.event].push({
        ...(rule.matcher && { matcher: rule.matcher }),
        hooks: [hookAction]
      })
    }
  }

  return {
    relativePath: 'hooks/hooks.json',
    content: JSON.stringify(hooksConfig, null, 2)
  }
}

// Generate .mcp.json for Cowork connectors (HTTP format)
// Note: connector URLs are looked up at generation time via the registry
function generateCoworkMcpJson(connectorIds: string[]): GeneratedFile {
  const mcpServers: Record<string, { type: string; url: string }> = {}

  // We store just IDs in state. URLs come from the registry at generation time.
  // For now, use the DEFAULT_CONNECTORS as a lookup since we can't call IPC from here.
  // The full URL is set when we have registry access.
  for (const id of connectorIds) {
    mcpServers[id] = {
      type: 'http',
      url: '' // Will be populated by the caller with registry data
    }
  }

  return {
    relativePath: '.mcp.json',
    content: JSON.stringify({ mcpServers }, null, 2)
  }
}

// Generate .mcp.json for Claude Code servers (command format)
function generateClaudeCodeMcpJson(mcp: McpServersComponent): GeneratedFile | null {
  const mcpServers: Record<string, unknown> = {}

  for (const server of mcp.servers) {
    if (!server.name) continue
    mcpServers[server.name] = {
      command: server.command,
      args: server.args,
      ...(Object.keys(server.env).length > 0 && { env: server.env })
    }
  }

  if (Object.keys(mcpServers).length === 0) return null

  return {
    relativePath: '.mcp.json',
    content: JSON.stringify({ mcpServers }, null, 2)
  }
}

function generateConnectorsMd(connectorIds: string[]): GeneratedFile {
  const lines: string[] = []

  lines.push('# Connectors')
  lines.push('')
  lines.push('## Connectors for this plugin')
  lines.push('')

  for (const id of connectorIds) {
    lines.push(`- ${id}`)
  }

  lines.push('')
  lines.push('## Setup')
  lines.push('')
  lines.push('Enable these connectors in Cowork: Customize → Connectors → Connect each one listed above.')
  lines.push('')

  return { relativePath: 'CONNECTORS.md', content: lines.join('\n') }
}

function generatePluginJson(state: PluginState, files: GeneratedFile[]): GeneratedFile {
  const { metadata } = state
  const hasSkills = files.some((f) => f.relativePath.startsWith('skills/'))
  const hasAgents = files.some((f) => f.relativePath.startsWith('agents/'))
  const hasHooks = files.some((f) => f.relativePath === 'hooks/hooks.json')
  const hasMcp = files.some((f) => f.relativePath === '.mcp.json')

  const commandPaths = files
    .filter((f) => f.relativePath.startsWith('commands/'))
    .map((f) => `./${f.relativePath}`)

  const pluginJson: Record<string, unknown> = {
    name: metadata.name,
    version: metadata.version,
    description: metadata.description,
    author: {
      name: metadata.author.name,
      ...(metadata.author.email && { email: metadata.author.email }),
      ...(metadata.author.url && { url: metadata.author.url })
    },
    ...(metadata.homepage && { homepage: metadata.homepage }),
    ...(metadata.repository && { repository: metadata.repository }),
    license: metadata.license,
    keywords: metadata.keywords,
    ...(commandPaths.length && { commands: commandPaths }),
    ...(hasAgents && { agents: './agents' }),
    ...(hasSkills && { skills: './skills' }),
    ...(hasHooks && { hooks: './hooks/hooks.json' }),
    ...(hasMcp && { mcpServers: './.mcp.json' })
  }

  return {
    relativePath: '.claude-plugin/plugin.json',
    content: JSON.stringify(pluginJson, null, 2)
  }
}

function generateReadme(state: PluginState): GeneratedFile {
  const { metadata, components } = state
  const lines: string[] = []

  lines.push(`# ${metadata.name}`)
  lines.push('')
  lines.push(metadata.description)
  lines.push('')
  lines.push('## Components')
  lines.push('')

  const skills = components.filter((c) => c.type === 'skill') as SkillComponent[]
  if (skills.length) {
    lines.push('### Skills')
    for (const s of skills) {
      lines.push(`- **${s.name}**: ${s.description}`)
    }
    lines.push('')
  }

  const agents = components.filter((c) => c.type === 'agent') as AgentComponent[]
  if (agents.length) {
    lines.push('### Agents')
    for (const a of agents) {
      lines.push(`- **${a.name}**: ${a.description}`)
    }
    lines.push('')
  }

  const commands = components.filter((c) => c.type === 'command') as CommandComponent[]
  if (commands.length) {
    lines.push('### Commands')
    for (const c of commands) {
      lines.push(`- \`/${metadata.name}:${c.name}\`: ${c.description}`)
    }
    lines.push('')
  }

  const hooks = components.find((c) => c.type === 'hooks') as HooksComponent | undefined
  if (hooks && hooks.rules.length) {
    lines.push('### Hooks')
    for (const r of hooks.rules) {
      lines.push(`- ${r.event}${r.matcher ? ` on ${r.matcher}` : ''}: ${r.hookType}`)
    }
    lines.push('')
  }

  const mcp = components.find((c) => c.type === 'mcpServers') as McpServersComponent | undefined
  if (mcp && mcp.servers.length) {
    lines.push('### MCP Servers')
    for (const s of mcp.servers) {
      lines.push(`- **${s.name}**: ${s.command} ${s.args.join(' ')}`)
    }
    lines.push('')
  }

  // Cowork connector prerequisites
  const coworkConnectors = mcp?.coworkConnectors || []
  if (coworkConnectors.length > 0) {
    const required = coworkConnectors.filter((c) => c.required)
    const optional = coworkConnectors.filter((c) => !c.required)

    lines.push('## Prerequisites')
    lines.push('')
    lines.push('This plugin works best with the following connectors enabled in Cowork:')
    lines.push('')

    if (required.length > 0) {
      lines.push('**Required:**')
      for (const c of required) {
        lines.push(`- ${c.name} — ${c.description}`)
      }
      lines.push('')
    }

    if (optional.length > 0) {
      lines.push('**Optional:**')
      for (const c of optional) {
        lines.push(`- ${c.name} — ${c.description}`)
      }
      lines.push('')
    }

    lines.push('To enable connectors: Open Cowork → Customize → Connectors → Enable each one listed above.')
    lines.push('')
  }

  lines.push('## Installation')
  lines.push('')
  lines.push('```bash')
  lines.push(`claude plugin install /path/to/${metadata.name}`)
  lines.push('```')
  lines.push('')

  if (metadata.author.name) {
    lines.push('## Author')
    lines.push('')
    lines.push(`${metadata.author.name}${metadata.author.email ? ` (${metadata.author.email})` : ''}`)
    lines.push('')
  }

  lines.push(`## License`)
  lines.push('')
  lines.push(metadata.license)
  lines.push('')

  return { relativePath: 'README.md', content: lines.join('\n') }
}

function generateLicense(license: string, authorName: string): GeneratedFile {
  const year = new Date().getFullYear()

  const templates: Record<string, string> = {
    MIT: `MIT License\n\nCopyright (c) ${year} ${authorName}\n\nPermission is hereby granted, free of charge, to any person obtaining a copy\nof this software and associated documentation files (the "Software"), to deal\nin the Software without restriction, including without limitation the rights\nto use, copy, modify, merge, publish, distribute, sublicense, and/or sell\ncopies of the Software, and to permit persons to whom the Software is\nfurnished to do so, subject to the following conditions:\n\nThe above copyright notice and this permission notice shall be included in all\ncopies or substantial portions of the Software.\n\nTHE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR\nIMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,\nFITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE\nAUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER\nLIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,\nOUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE\nSOFTWARE.`,
    'Apache-2.0': `Copyright ${year} ${authorName}\n\nLicensed under the Apache License, Version 2.0 (the "License");\nyou may not use this file except in compliance with the License.\nYou may obtain a copy of the License at\n\n    http://www.apache.org/licenses/LICENSE-2.0`,
    ISC: `ISC License\n\nCopyright (c) ${year} ${authorName}\n\nPermission to use, copy, modify, and/or distribute this software for any\npurpose with or without fee is hereby granted, provided that the above\ncopyright notice and this permission notice appear in all copies.\n\nTHE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH\nREGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY\nAND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,\nINDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM\nLOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR\nOTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR\nPERFORMANCE OF THIS SOFTWARE.`
  }

  return {
    relativePath: 'LICENSE',
    content: templates[license] || `${license}\n\nCopyright (c) ${year} ${authorName}`
  }
}
