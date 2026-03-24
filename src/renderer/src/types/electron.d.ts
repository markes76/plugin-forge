export interface PluginForgeAPI {
  // Plugin file I/O
  writePlugin: (outputPath: string, files: Array<{ relativePath: string; content: string }>) => Promise<{ success: boolean; path: string; fileCount: number }>
  readPlugin: (path: string) => Promise<unknown>
  listPlugins: (directory: string) => Promise<Array<{ name: string; path: string; hasManifest: boolean }>>

  // Filesystem dialogs
  selectDirectory: () => Promise<string | null>
  selectFile: (filters: Array<{ name: string; extensions: string[] }>) => Promise<string | null>

  // Claude CLI
  installPlugin: (pluginPath: string) => Promise<{ success: boolean; output: string; errorOutput: string }>

  // ZIP export
  exportZip: (files: Array<{ relativePath: string; content: string }>) => Promise<{ success: boolean; path?: string }>

  // Plugin Registry
  getRegistry: () => Promise<import('./plugin').PluginRegistryEntry[]>
  getRegistryEntry: (id: string) => Promise<import('./plugin').PluginRegistryEntry | null>
  updateRegistryEntry: (id: string, updates: Partial<import('./plugin').PluginRegistryEntry>) => Promise<{ success: boolean }>
  deleteRegistryEntry: (id: string) => Promise<{ success: boolean }>

  // Draft persistence
  saveDraft: (id: string, pluginState: unknown, wizardState?: unknown, meta?: unknown) => Promise<{ success: boolean }>
  loadDraft: (id: string) => Promise<{ pluginState: unknown; wizardState: unknown | null; meta: unknown | null } | null>
  listDrafts: () => Promise<Array<{ id: string; name: string; mode: string; wizardStep: number | null; updatedAt: string }>>
  deleteDraft: (id: string) => Promise<{ success: boolean }>

  // Generated plugin storage
  saveGeneratedState: (id: string, pluginState: unknown) => Promise<{ success: boolean }>
  loadGeneratedState: (id: string) => Promise<unknown | null>

  // Lock files
  acquireLock: (id: string) => Promise<boolean>
  releaseLock: (id: string) => Promise<{ success: boolean }>

  // Import
  importPlugin: () => Promise<{ manifest: unknown; components: unknown[]; sourcePath: string } | null>

  // App settings
  getSettings: () => Promise<unknown>
  setSettings: (settings: unknown) => Promise<{ success: boolean }>

  // App info
  getAppDataPath: () => Promise<string>
  getPlatform: () => Promise<string>
  getAppVersion: () => Promise<string>

  // Window controls
  minimize: () => Promise<void>
  maximize: () => Promise<void>
  close: () => Promise<void>
  isMaximized: () => Promise<boolean>
  onMaximizeChange: (callback: (maximized: boolean) => void) => () => void

  // Force save (quit flow)
  onForceSave: (callback: () => Promise<void>) => void
}

declare global {
  interface Window {
    pluginForge: PluginForgeAPI
  }
}
