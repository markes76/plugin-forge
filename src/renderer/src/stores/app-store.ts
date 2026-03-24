import { create } from 'zustand'
import type { ThemeId } from '@/lib/theme'

interface AppState {
  theme: ThemeId
  sidebarCollapsed: boolean
  recentPluginIds: string[]
  setTheme: (theme: ThemeId) => void
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  addRecentPlugin: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  theme: (localStorage.getItem('plugin-forge-theme') as ThemeId) || 'forge',
  sidebarCollapsed: false,
  recentPluginIds: [],

  setTheme: (theme) => set({ theme }),

  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  addRecentPlugin: (id) =>
    set((state) => ({
      recentPluginIds: [id, ...state.recentPluginIds.filter((p) => p !== id)].slice(0, 10)
    }))
}))
