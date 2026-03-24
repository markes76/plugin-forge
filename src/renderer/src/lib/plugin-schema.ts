import { z } from 'zod'

// ── Primitives ──

const kebabCaseRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/
const semverRegex = /^\d+\.\d+\.\d+$/

export const semverSchema = z.string().regex(semverRegex, 'Must be valid semver (e.g., 1.0.0)')

export const kebabCaseSchema = z
  .string()
  .min(1, 'Required')
  .max(64, 'Max 64 characters')
  .regex(kebabCaseRegex, 'Must be lowercase with hyphens only (e.g., my-plugin)')

export const authorSchema = z.object({
  name: z.string().min(1, 'Author name required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  url: z.string().url('Invalid URL').optional().or(z.literal(''))
})

export const licenseSchema = z.enum([
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'BSD-3-Clause',
  'ISC',
  'UNLICENSED'
])

// ── Plugin Metadata ──

export const metadataSchema = z.object({
  name: kebabCaseSchema,
  version: semverSchema,
  description: z.string().min(1, 'Description required').max(1024),
  author: authorSchema,
  homepage: z.string().url().optional().or(z.literal('')),
  repository: z.string().optional().or(z.literal('')),
  license: licenseSchema,
  keywords: z.array(z.string()).max(10)
})

// ── Skill ──

export const skillSchema = z.object({
  type: z.literal('skill'),
  id: z.string(),
  name: kebabCaseSchema,
  description: z.string().min(1, 'Description required').max(1024),
  version: semverSchema.optional(),
  allowedTools: z.array(z.string()).optional(),
  body: z.string().min(1, 'Skill content cannot be empty'),
  scripts: z.array(z.any()).default([]),
  references: z.array(z.any()).default([])
})

// ── Agent ──

export const agentSchema = z.object({
  type: z.literal('agent'),
  id: z.string(),
  name: kebabCaseSchema,
  description: z.string().min(1, 'Description required'),
  model: z.enum(['opus', 'sonnet', 'haiku']).optional(),
  effort: z.enum(['low', 'medium', 'high']).optional(),
  maxTurns: z.number().int().min(1).max(100).optional(),
  tools: z.array(z.string()).optional(),
  disallowedTools: z.array(z.string()).optional(),
  memory: z.boolean().optional(),
  background: z.boolean().optional(),
  isolation: z.boolean().optional(),
  body: z.string().min(1, 'System prompt cannot be empty')
})

// ── Command ──

export const commandSchema = z.object({
  type: z.literal('command'),
  id: z.string(),
  name: kebabCaseSchema,
  description: z.string().min(1, 'Description required'),
  body: z.string().min(1, 'Command content cannot be empty')
})

// ── Hook Rule ──

export const hookRuleSchema = z
  .object({
    id: z.string(),
    event: z.enum(['PreToolUse', 'PostToolUse', 'Notification', 'Stop', 'SubagentStop']),
    matcher: z.string().optional(),
    hookType: z.enum(['command', 'prompt', 'agent']),
    command: z.string().optional(),
    prompt: z.string().optional(),
    agentName: z.string().optional()
  })
  .refine(
    (data) => {
      if (data.hookType === 'command') return !!data.command
      if (data.hookType === 'prompt') return !!data.prompt
      if (data.hookType === 'agent') return !!data.agentName
      return false
    },
    { message: 'Action field must match hook type' }
  )

export const hooksComponentSchema = z.object({
  type: z.literal('hooks'),
  id: z.string(),
  rules: z.array(hookRuleSchema)
})

// ── MCP Server ──

export const mcpServerEntrySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Server name required'),
  command: z.string().min(1, 'Command required'),
  args: z.array(z.string()),
  env: z.record(z.string())
})

export const mcpServersComponentSchema = z.object({
  type: z.literal('mcpServers'),
  id: z.string(),
  mcpMode: z.enum(['cowork', 'claude-code']).optional(),
  servers: z.array(z.any()).default([]),
  coworkConnectors: z.array(z.any()).default([])
})

// ── Discriminated union ──

export const componentSchema = z.discriminatedUnion('type', [
  skillSchema,
  agentSchema,
  commandSchema,
  hooksComponentSchema,
  mcpServersComponentSchema
])

// ── Root plugin state ──

export const pluginStateSchema = z.object({
  metadata: metadataSchema,
  components: z.array(componentSchema)
})
