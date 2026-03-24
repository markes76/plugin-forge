import { contextBridge, ipcRenderer } from 'electron'

const api = {
  // ── Plugin file I/O ──
  writePlugin: (outputPath: string, files: Array<{ relativePath: string; content: string }>) =>
    ipcRenderer.invoke('write-plugin', { outputPath, files }),
  readPlugin: (path: string) =>
    ipcRenderer.invoke('read-plugin', { path }),
  listPlugins: (directory: string) =>
    ipcRenderer.invoke('list-plugins', { directory }),

  // ── Filesystem dialogs ──
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  selectFile: (filters: Array<{ name: string; extensions: string[] }>) =>
    ipcRenderer.invoke('select-file', { filters }),

  // ── Claude CLI ──
  installPlugin: (pluginPath: string) =>
    ipcRenderer.invoke('install-plugin', { pluginPath }),

  // ── Generate Plugin as ZIP ──
  generatePluginZip: (files: Array<{ relativePath: string; content: string }>, pluginName: string) =>
    ipcRenderer.invoke('generate-plugin-zip', { files, pluginName }),

  // ── Legacy ZIP export ──
  exportZip: (files: Array<{ relativePath: string; content: string }>) =>
    ipcRenderer.invoke('export-zip', { files }),

  // ── Show in Finder/Explorer ──
  showItemInFolder: (path: string) =>
    ipcRenderer.invoke('show-item-in-folder', { path }),

  // ── Plugin Registry ──
  getRegistry: () => ipcRenderer.invoke('get-registry'),
  getRegistryEntry: (id: string) => ipcRenderer.invoke('get-registry-entry', { id }),
  updateRegistryEntry: (id: string, updates: unknown) =>
    ipcRenderer.invoke('update-registry-entry', { id, updates }),
  deleteRegistryEntry: (id: string) =>
    ipcRenderer.invoke('delete-registry-entry', { id }),

  // ── Draft persistence ──
  saveDraft: (id: string, pluginState: unknown, wizardState?: unknown, meta?: unknown) =>
    ipcRenderer.invoke('save-draft', { id, pluginState, wizardState, meta }),
  loadDraft: (id: string) => ipcRenderer.invoke('load-draft', { id }),
  listDrafts: () => ipcRenderer.invoke('list-drafts'),
  deleteDraft: (id: string) => ipcRenderer.invoke('delete-draft', { id }),

  // ── Generated plugin storage ──
  saveGeneratedState: (id: string, pluginState: unknown) =>
    ipcRenderer.invoke('save-generated-state', { id, pluginState }),
  loadGeneratedState: (id: string) =>
    ipcRenderer.invoke('load-generated-state', { id }),

  // ── Lock files ──
  acquireLock: (id: string) => ipcRenderer.invoke('acquire-lock', { id }),
  releaseLock: (id: string) => ipcRenderer.invoke('release-lock', { id }),

  // ── Import ──
  importPlugin: () => ipcRenderer.invoke('import-plugin'),

  // ── Connector Registry ──
  getConnectors: () => ipcRenderer.invoke('get-connectors'),
  addConnector: (connector: { id: string; name: string; url: string; description: string; category: string }) =>
    ipcRenderer.invoke('add-connector', { connector }),
  updateConnector: (id: string, updates: Record<string, unknown>) =>
    ipcRenderer.invoke('update-connector', { id, updates }),
  deleteConnector: (id: string) => ipcRenderer.invoke('delete-connector', { id }),
  resetConnectors: () => ipcRenderer.invoke('reset-connectors'),

  // ── App settings ──
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSettings: (settings: unknown) => ipcRenderer.invoke('set-settings', { settings }),

  // ── App info ──
  getAppDataPath: () => ipcRenderer.invoke('get-app-data-path'),
  getPlatform: () => ipcRenderer.invoke('get-platform'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),

  // ── Window controls ──
  minimize: () => ipcRenderer.invoke('window-minimize'),
  maximize: () => ipcRenderer.invoke('window-maximize'),
  close: () => ipcRenderer.invoke('window-close'),
  isMaximized: () => ipcRenderer.invoke('window-is-maximized'),
  onMaximizeChange: (callback: (maximized: boolean) => void) => {
    const handler = (_event: unknown, maximized: boolean): void => callback(maximized)
    ipcRenderer.on('window-maximized', handler)
    return () => ipcRenderer.removeListener('window-maximized', handler)
  },

  // ── Force save (quit flow) ──
  onForceSave: (callback: () => Promise<void>) => {
    ipcRenderer.on('force-save', async () => {
      await callback()
      ipcRenderer.invoke('force-save-ack')
    })
  }
}

contextBridge.exposeInMainWorld('pluginForge', api)
