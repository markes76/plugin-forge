import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Wand2,
  Wrench,
  FolderOpen,
  LayoutTemplate,
  Settings,
  Hammer,
  ChevronLeft,
  ChevronRight,
  FileEdit,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { PluginRegistryEntry } from '@/types/plugin'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface NavItem {
  icon: React.ElementType
  label: string
  path: string
  accent?: boolean
}

const navItems: NavItem[] = [
  { icon: Wand2, label: 'Guided Builder', path: '/wizard', accent: true },
  { icon: Wrench, label: 'Advanced Builder', path: '/builder' },
  { icon: FolderOpen, label: 'My Plugins', path: '/my-plugins' },
  { icon: LayoutTemplate, label: 'Templates', path: '/templates' },
  { icon: Settings, label: 'Settings', path: '/settings' }
]

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()
  const navigate = useNavigate()
  const [drafts, setDrafts] = useState<PluginRegistryEntry[]>([])
  const [draftsExpanded, setDraftsExpanded] = useState(false)

  // Load drafts for sidebar section
  useEffect(() => {
    window.pluginForge.getRegistry().then((entries) => {
      setDrafts(
        entries
          .filter((e: PluginRegistryEntry) => e.status === 'draft')
          .sort((a: PluginRegistryEntry, b: PluginRegistryEntry) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          )
          .slice(0, 5)
      )
    })
  }, [location.pathname]) // Refresh when navigating

  return (
    <aside
      data-sidebar
      className={cn(
        'flex flex-col border-r transition-all duration-200 select-none',
        collapsed ? 'w-[52px]' : 'w-[240px]'
      )}
      style={{
        backgroundColor: 'var(--bg-base)',
        borderColor: 'var(--border)'
      }}
    >
      {/* Logo / brand area */}
      <div className="flex items-center gap-2.5 px-3 h-12 border-b" style={{ borderColor: 'var(--border)' }}>
        <Hammer size={20} style={{ color: 'var(--accent)' }} />
        {!collapsed && (
          <span className="font-heading font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Plugin Forge
          </span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            item.path === '/builder'
              ? location.pathname.startsWith('/builder')
              : item.path === '/wizard'
                ? location.pathname.startsWith('/wizard')
                : location.pathname === item.path
          const Icon = item.icon

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex items-center gap-2.5 w-full rounded-md px-2.5 py-2 text-body transition-colors',
                collapsed && 'justify-center px-0'
              )}
              style={{
                backgroundColor: isActive ? 'var(--accent-muted)' : 'transparent',
                color: item.accent
                  ? 'var(--accent)'
                  : isActive
                    ? 'var(--text-primary)'
                    : 'var(--text-secondary)'
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-elevated)'
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={18} />
              {!collapsed && <span className="text-body">{item.label}</span>}
            </button>
          )
        })}

        {/* Drafts section */}
        {!collapsed && drafts.length > 0 && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setDraftsExpanded(!draftsExpanded)}
              className="flex items-center justify-between w-full px-2.5 py-1.5 text-small rounded transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-elevated)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              <div className="flex items-center gap-1.5">
                <FileEdit size={14} />
                <span>Drafts</span>
                <span
                  className="px-1 rounded text-small"
                  style={{ backgroundColor: 'var(--bg-elevated)', color: 'var(--warning)' }}
                >
                  {drafts.length}
                </span>
              </div>
              <ChevronDown
                size={12}
                className="transition-transform"
                style={{ transform: draftsExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              />
            </button>

            {draftsExpanded && (
              <div className="mt-1 space-y-0.5">
                {drafts.map((draft) => (
                  <button
                    key={draft.id}
                    onClick={() => {
                      const route = draft.mode === 'wizard' ? '/wizard' : '/builder'
                      navigate(`${route}/${draft.id}`)
                    }}
                    className="flex flex-col w-full px-2.5 py-1.5 rounded text-left transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-elevated)' }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
                  >
                    <span className="text-small truncate" style={{ color: 'var(--text-primary)' }}>
                      {draft.name || 'Untitled'}
                    </span>
                    <span className="text-small" style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
                      {formatRelativeTime(draft.updatedAt)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Collapse toggle */}
      <div className="px-2 py-2 border-t" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={onToggle}
          className="flex items-center justify-center w-full rounded-md py-1.5 transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-elevated)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>
    </aside>
  )
}

function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
