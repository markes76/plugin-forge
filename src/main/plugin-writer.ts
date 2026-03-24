import { mkdir, writeFile, readdir, readFile, stat } from 'fs/promises'
import { join, dirname } from 'path'
import { existsSync } from 'fs'
import yaml from 'js-yaml'

export interface GeneratedFile {
  relativePath: string
  content: string
}

export async function writePluginToDisk(
  outputPath: string,
  files: GeneratedFile[]
): Promise<{ success: boolean; path: string; fileCount: number }> {
  try {
    for (const file of files) {
      const fullPath = join(outputPath, file.relativePath)
      await mkdir(dirname(fullPath), { recursive: true })
      await writeFile(fullPath, file.content, 'utf-8')
    }
    return { success: true, path: outputPath, fileCount: files.length }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to write plugin: ${message}`)
  }
}

export async function readPluginFromDisk(
  pluginPath: string
): Promise<{ manifest: unknown; components: unknown[] } | null> {
  try {
    const pluginJsonPath = join(pluginPath, '.claude-plugin', 'plugin.json')
    if (!existsSync(pluginJsonPath)) return null

    const manifestRaw = await readFile(pluginJsonPath, 'utf-8')
    const manifest = JSON.parse(manifestRaw)
    const components: unknown[] = []

    // Read skills
    const skillsDir = join(pluginPath, 'skills')
    if (existsSync(skillsDir)) {
      const skillDirs = await readdir(skillsDir, { withFileTypes: true })
      for (const dir of skillDirs) {
        if (!dir.isDirectory()) continue
        const skillMdPath = join(skillsDir, dir.name, 'SKILL.md')
        if (existsSync(skillMdPath)) {
          const content = await readFile(skillMdPath, 'utf-8')
          const { frontmatter, body } = parseFrontmatter(content)
          components.push({
            type: 'skill',
            name: dir.name,
            frontmatter,
            body
          })
        }
      }
    }

    // Read agents
    const agentsDir = join(pluginPath, 'agents')
    if (existsSync(agentsDir)) {
      const agentFiles = await readdir(agentsDir, { withFileTypes: true })
      for (const file of agentFiles) {
        if (!file.isFile() || !file.name.endsWith('.md')) continue
        const content = await readFile(join(agentsDir, file.name), 'utf-8')
        const { frontmatter, body } = parseFrontmatter(content)
        components.push({
          type: 'agent',
          name: file.name.replace('.md', ''),
          frontmatter,
          body
        })
      }
    }

    // Read commands
    const commandsDir = join(pluginPath, 'commands')
    if (existsSync(commandsDir)) {
      const cmdFiles = await readdir(commandsDir, { withFileTypes: true })
      for (const file of cmdFiles) {
        if (!file.isFile() || !file.name.endsWith('.md')) continue
        const content = await readFile(join(commandsDir, file.name), 'utf-8')
        const { frontmatter, body } = parseFrontmatter(content)
        components.push({
          type: 'command',
          name: file.name.replace('.md', ''),
          frontmatter,
          body
        })
      }
    }

    // Read hooks
    const hooksPath = join(pluginPath, 'hooks', 'hooks.json')
    if (existsSync(hooksPath)) {
      const hooksRaw = await readFile(hooksPath, 'utf-8')
      components.push({
        type: 'hooks',
        config: JSON.parse(hooksRaw)
      })
    }

    // Read MCP config
    const mcpPath = join(pluginPath, '.mcp.json')
    if (existsSync(mcpPath)) {
      const mcpRaw = await readFile(mcpPath, 'utf-8')
      components.push({
        type: 'mcpServers',
        config: JSON.parse(mcpRaw)
      })
    }

    return { manifest, components }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to read plugin: ${message}`)
  }
}

export async function listPluginsInDirectory(
  directory: string
): Promise<Array<{ name: string; path: string; hasManifest: boolean }>> {
  try {
    if (!existsSync(directory)) return []
    const entries = await readdir(directory, { withFileTypes: true })
    const plugins: Array<{ name: string; path: string; hasManifest: boolean }> = []

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      const pluginPath = join(directory, entry.name)
      const manifestPath = join(pluginPath, '.claude-plugin', 'plugin.json')
      const hasManifest = existsSync(manifestPath)
      plugins.push({
        name: entry.name,
        path: pluginPath,
        hasManifest
      })
    }

    return plugins
  } catch {
    return []
  }
}

function parseFrontmatter(content: string): { frontmatter: Record<string, unknown>; body: string } {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!match) return { frontmatter: {}, body: content }

  try {
    const frontmatter = yaml.load(match[1]) as Record<string, unknown>
    return { frontmatter: frontmatter || {}, body: match[2].trim() }
  } catch {
    return { frontmatter: {}, body: content }
  }
}
