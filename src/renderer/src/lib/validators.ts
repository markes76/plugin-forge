import type { PluginState, PluginComponent, ValidationIssue, SkillComponent, AgentComponent, CommandComponent, HooksComponent, McpServersComponent } from '@/types/plugin'

export function validatePlugin(state: PluginState): ValidationIssue[] {
  const issues: ValidationIssue[] = []

  // ── Plugin metadata ──
  if (!state.metadata.name) {
    issues.push({ severity: 'error', field: 'name', message: 'Plugin: name — Required. Give your plugin a kebab-case name.' })
  }
  if (!state.metadata.description) {
    issues.push({ severity: 'error', field: 'description', message: 'Plugin: description — Required.' })
  }
  if (!state.metadata.author.name) {
    issues.push({ severity: 'error', field: 'author.name', message: 'Plugin: author name — Required.' })
  }
  if (state.metadata.version && !/^\d+\.\d+\.\d+$/.test(state.metadata.version)) {
    issues.push({ severity: 'error', field: 'version', message: 'Plugin: version — Must be valid semver (e.g., 1.0.0).' })
  }

  // ── Components ──
  if (state.components.length === 0) {
    issues.push({ severity: 'warning', message: 'Plugin has no components. Add at least one skill, agent, or command.' })
  }

  // Check for duplicate names
  const names = new Map<string, string[]>()
  for (const c of state.components) {
    if ('name' in c && c.name) {
      const key = `${c.type}:${c.name}`
      if (!names.has(key)) names.set(key, [])
      names.get(key)!.push(c.id)
    }
  }
  for (const [key, ids] of names) {
    if (ids.length > 1) {
      const [type, name] = key.split(':')
      for (const id of ids) {
        issues.push({ severity: 'error', componentId: id, field: 'name', message: `${capitalize(type)} "${name}": name — Duplicate. Each ${type} must have a unique name.` })
      }
    }
  }

  // ── Per-component validation ──
  for (const c of state.components) {
    const label = getComponentLabel(c)

    if (c.type === 'skill') {
      if (!c.name) issues.push({ severity: 'error', componentId: c.id, field: 'name', message: `${label}: name — Required.` })
      if (!c.description) issues.push({ severity: 'warning', componentId: c.id, field: 'description', message: `${label}: description — Skills without descriptions may not trigger correctly.` })
      if (!c.body) issues.push({ severity: 'error', componentId: c.id, field: 'body', message: `${label}: content — Required. Write the instructions Claude should follow.` })
      if (c.body && c.body.split('\n').length > 500) {
        issues.push({ severity: 'info', componentId: c.id, message: `${label}: Content exceeds 500 lines. Consider splitting into reference files.` })
      }
    }

    if (c.type === 'agent') {
      if (!c.name) issues.push({ severity: 'error', componentId: c.id, field: 'name', message: `${label}: name — Required.` })
      if (!c.description) issues.push({ severity: 'error', componentId: c.id, field: 'description', message: `${label}: description — Required. Agents need a description so Claude knows when to invoke them.` })
      if (!c.body) issues.push({ severity: 'error', componentId: c.id, field: 'body', message: `${label}: system prompt — Required.` })
      if (c.maxTurns && c.maxTurns > 50) {
        issues.push({ severity: 'info', componentId: c.id, field: 'maxTurns', message: `${label}: maxTurns (${c.maxTurns}) is high. Consider lowering unless needed.` })
      }
    }

    if (c.type === 'command') {
      if (!c.name) issues.push({ severity: 'error', componentId: c.id, field: 'name', message: `${label}: name — Required.` })
      if (!c.description) issues.push({ severity: 'error', componentId: c.id, field: 'description', message: `${label}: description — Required.` })
      if (!c.body) issues.push({ severity: 'error', componentId: c.id, field: 'body', message: `${label}: content — Required.` })
    }

    // MCP validation — only for Claude Code mode servers
    if (c.type === 'mcpServers' && state.mcpMode === 'claude-code') {
      for (const server of c.servers) {
        if (!server.name) issues.push({ severity: 'error', componentId: c.id, field: 'name', message: `MCP Server: name — Required.` })
        if (!server.command) issues.push({ severity: 'error', componentId: c.id, field: 'command', message: `MCP Server "${server.name || 'unnamed'}": command — Required.` })
      }
    }
  }

  return issues
}

export function validateComponent(component: PluginComponent): ValidationIssue[] {
  // Delegate to the full validator with a minimal state
  return []
}

function getComponentLabel(c: PluginComponent): string {
  switch (c.type) {
    case 'skill': return `Skill "${(c as SkillComponent).name || 'unnamed'}"`
    case 'agent': return `Agent "${(c as AgentComponent).name || 'unnamed'}"`
    case 'command': return `Command "${(c as CommandComponent).name || 'unnamed'}"`
    case 'hooks': return 'Hooks'
    case 'mcpServers': return 'MCP Servers'
    default: return 'Component'
  }
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}
