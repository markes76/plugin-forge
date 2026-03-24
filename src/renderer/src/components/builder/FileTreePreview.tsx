import { useMemo } from 'react'
import { File, Folder, FolderOpen } from 'lucide-react'
import { usePlugin } from '@/hooks/usePluginState'
import type { PluginState, HooksComponent, McpServersComponent } from '@/types/plugin'

interface TreeNode {
  name: string
  isFile: boolean
  children?: TreeNode[]
}

function buildFileTree(state: PluginState): TreeNode {
  const root: TreeNode = { name: state.metadata.name || 'my-plugin', isFile: false, children: [] }

  // .claude-plugin/plugin.json
  root.children!.push({
    name: '.claude-plugin',
    isFile: false,
    children: [{ name: 'plugin.json', isFile: true }]
  })

  // Skills
  const skills = state.components.filter((c) => c.type === 'skill')
  if (skills.length > 0) {
    const skillsDir: TreeNode = { name: 'skills', isFile: false, children: [] }
    for (const skill of skills) {
      const skillDir: TreeNode = {
        name: (skill as any).name || 'untitled',
        isFile: false,
        children: [{ name: 'SKILL.md', isFile: true }]
      }
      skillsDir.children!.push(skillDir)
    }
    root.children!.push(skillsDir)
  }

  // Agents
  const agents = state.components.filter((c) => c.type === 'agent')
  if (agents.length > 0) {
    const agentsDir: TreeNode = { name: 'agents', isFile: false, children: [] }
    for (const agent of agents) {
      agentsDir.children!.push({
        name: `${(agent as any).name || 'untitled'}.md`,
        isFile: true
      })
    }
    root.children!.push(agentsDir)
  }

  // Commands
  const commands = state.components.filter((c) => c.type === 'command')
  if (commands.length > 0) {
    const cmdsDir: TreeNode = { name: 'commands', isFile: false, children: [] }
    for (const cmd of commands) {
      cmdsDir.children!.push({
        name: `${(cmd as any).name || 'untitled'}.md`,
        isFile: true
      })
    }
    root.children!.push(cmdsDir)
  }

  // Hooks
  const hooks = state.components.find((c) => c.type === 'hooks') as HooksComponent | undefined
  if (hooks && hooks.rules.length > 0) {
    root.children!.push({
      name: 'hooks',
      isFile: false,
      children: [{ name: 'hooks.json', isFile: true }]
    })
  }

  // MCP
  const mcp = state.components.find((c) => c.type === 'mcpServers') as McpServersComponent | undefined
  if (mcp && mcp.servers.length > 0) {
    root.children!.push({ name: '.mcp.json', isFile: true })
  }

  // Always-generated files
  root.children!.push({ name: 'README.md', isFile: true })
  root.children!.push({ name: 'LICENSE', isFile: true })

  return root
}

export function FileTreePreview() {
  const { state } = usePlugin()
  const tree = useMemo(() => buildFileTree(state), [state])

  return (
    <div className="p-4">
      <h4 className="text-small font-medium mb-3" style={{ color: 'var(--text-primary)' }}>
        File Tree
      </h4>
      <div className="font-mono text-code space-y-0.5">
        <TreeNodeItem node={tree} depth={0} />
      </div>
    </div>
  )
}

function TreeNodeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const indent = depth * 16

  return (
    <>
      <div
        className="flex items-center gap-1.5 py-0.5 rounded px-1"
        style={{ paddingLeft: indent + 4, color: 'var(--text-secondary)' }}
      >
        {node.isFile ? (
          <File size={13} style={{ color: 'var(--text-muted)' }} />
        ) : (
          <FolderOpen size={13} style={{ color: 'var(--accent)' }} />
        )}
        <span className="text-code">{node.name}</span>
      </div>
      {node.children?.map((child, i) => (
        <TreeNodeItem key={`${child.name}-${i}`} node={child} depth={depth + 1} />
      ))}
    </>
  )
}
