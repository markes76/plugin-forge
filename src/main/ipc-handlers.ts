import { type IpcMain, type Dialog, BrowserWindow, app } from 'electron'
import { writePluginToDisk, readPluginFromDisk, listPluginsInDirectory } from './plugin-writer'
import { installPluginViaCli } from './claude-installer'
import { exportPluginAsZip, generatePluginZip } from './zip-exporter'
import {
  getRegistry,
  getRegistryEntry,
  updateRegistryEntry,
  deleteRegistryEntry,
  saveDraft,
  loadDraft,
  deleteDraft,
  listDrafts,
  saveGeneratedState,
  loadGeneratedState,
  getConnectors,
  addConnector,
  updateConnector,
  deleteConnector,
  resetConnectors,
  acquireLock,
  releaseLock
} from './persistence'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join } from 'path'

// ── Simple settings store (separate from plugin data) ──

class SettingsStore {
  private filePath: string
  private data: Record<string, unknown>

  constructor() {
    const userDataPath = app.getPath('userData')
    mkdirSync(userDataPath, { recursive: true })
    this.filePath = join(userDataPath, 'settings.json')
    if (existsSync(this.filePath)) {
      try { this.data = JSON.parse(readFileSync(this.filePath, 'utf-8')) } catch { this.data = {} }
    } else {
      this.data = {
        theme: 'forge',
        defaultAuthor: { name: '', email: '' },
        defaultOutputPath: '',
        claudeCliPath: ''
      }
    }
  }

  get(key: string): unknown {
    return this.data[key]
  }

  getAll(): Record<string, unknown> {
    return this.data
  }

  set(key: string, value: unknown): void {
    this.data[key] = value
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
  }

  setAll(data: Record<string, unknown>): void {
    this.data = data
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2), 'utf-8')
  }
}

let settings: SettingsStore

function getSettings(): SettingsStore {
  if (!settings) settings = new SettingsStore()
  return settings
}

export function registerIpcHandlers(ipcMain: IpcMain, dialog: Dialog): void {
  // ── Plugin file I/O ──

  ipcMain.handle('write-plugin', async (_event, { outputPath, files }) => {
    return writePluginToDisk(outputPath, files)
  })

  ipcMain.handle('read-plugin', async (_event, { path }) => {
    return readPluginFromDisk(path)
  })

  ipcMain.handle('list-plugins', async (_event, { directory }) => {
    return listPluginsInDirectory(directory)
  })

  // ── Filesystem dialogs ──

  ipcMain.handle('select-directory', async () => {
    const result = await dialog.showOpenDialog({ properties: ['openDirectory', 'createDirectory'] })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  ipcMain.handle('select-file', async (_event, { filters }) => {
    const result = await dialog.showOpenDialog({ properties: ['openFile'], filters })
    if (result.canceled) return null
    return result.filePaths[0]
  })

  // ── Claude CLI ──

  ipcMain.handle('install-plugin', async (_event, { pluginPath }) => {
    const cliPath = (getSettings().get('claudeCliPath') as string) || 'claude'
    return installPluginViaCli(pluginPath, cliPath)
  })

  // ── Generate Plugin as ZIP ──

  ipcMain.handle('generate-plugin-zip', async (_event, { files, pluginName }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: `${pluginName || 'plugin'}.zip`,
      filters: [{ name: 'Plugin Archive', extensions: ['zip'] }]
    })
    if (result.canceled || !result.filePath) return { success: false, path: null }
    return generatePluginZip(files, result.filePath)
  })

  // ── Legacy ZIP export (backward compat) ──

  ipcMain.handle('export-zip', async (_event, { files }) => {
    const result = await dialog.showSaveDialog({
      defaultPath: 'plugin.zip',
      filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
    })
    if (result.canceled || !result.filePath) return { success: false }
    return exportPluginAsZip(files, result.filePath)
  })

  // ── Show file in Finder/Explorer ──

  ipcMain.handle('show-item-in-folder', async (_event, { path }) => {
    const { shell } = require('electron')
    shell.showItemInFolder(path)
    return { success: true }
  })

  // ── Plugin Registry ──

  ipcMain.handle('get-registry', async () => {
    return getRegistry()
  })

  ipcMain.handle('get-registry-entry', async (_event, { id }) => {
    return getRegistryEntry(id)
  })

  ipcMain.handle('update-registry-entry', async (_event, { id, updates }) => {
    updateRegistryEntry(id, updates)
    return { success: true }
  })

  ipcMain.handle('delete-registry-entry', async (_event, { id }) => {
    releaseLock(id)
    deleteRegistryEntry(id)
    return { success: true }
  })

  // ── Draft persistence ──

  ipcMain.handle('save-draft', async (_event, { id, pluginState, wizardState, meta }) => {
    saveDraft(id, pluginState, wizardState, meta)
    // Also update registry
    if (pluginState && typeof pluginState === 'object') {
      const ps = pluginState as Record<string, unknown>
      const metadata = ps.metadata as Record<string, unknown> | undefined
      const components = (ps.components || []) as Array<{ type: string }>
      // Don't overwrite status if already generated/installed — only set draft on first save
      const existing = getRegistryEntry(id)
      const status = existing?.status || 'draft'

      updateRegistryEntry(id, {
        name: (metadata?.name as string) || '',
        description: (metadata?.description as string) || '',
        version: (metadata?.version as string) || '1.0.0',
        status,
        componentSummary: {
          skills: components.filter((c) => c.type === 'skill').length,
          agents: components.filter((c) => c.type === 'agent').length,
          commands: components.filter((c) => c.type === 'command').length,
          hooks: components.filter((c) => c.type === 'hooks').reduce((n, c) => n + ((c as any).rules?.length || 0), 0),
          mcpServers: components.filter((c) => c.type === 'mcpServers').reduce((n, c) => n + ((c as any).servers?.length || 0), 0)
        },
        ...(meta?.mode && { mode: meta.mode as 'wizard' | 'advanced' }),
        ...(meta?.wizardStep !== undefined && { wizardStep: meta.wizardStep as number | null })
      })
    }
    return { success: true }
  })

  ipcMain.handle('load-draft', async (_event, { id }) => {
    return loadDraft(id)
  })

  ipcMain.handle('list-drafts', async () => {
    return listDrafts()
  })

  ipcMain.handle('delete-draft', async (_event, { id }) => {
    releaseLock(id)
    deleteDraft(id)
    return { success: true }
  })

  // ── Generated plugin storage ──

  ipcMain.handle('save-generated-state', async (_event, { id, pluginState }) => {
    saveGeneratedState(id, pluginState)
    return { success: true }
  })

  ipcMain.handle('load-generated-state', async (_event, { id }) => {
    return loadGeneratedState(id)
  })

  // ── Lock files ──

  ipcMain.handle('acquire-lock', async (_event, { id }) => {
    return acquireLock(id)
  })

  ipcMain.handle('release-lock', async (_event, { id }) => {
    releaseLock(id)
    return { success: true }
  })

  // ── Import plugin from disk ──

  ipcMain.handle('import-plugin', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'openDirectory'],
      title: 'Select Plugin (.zip or folder)',
      filters: [
        { name: 'Plugin Archives', extensions: ['zip'] },
        { name: 'All Files', extensions: ['*'] }
      ]
    })
    if (result.canceled) return null
    const selectedPath = result.filePaths[0]

    let pluginPath = selectedPath

    // If it's a .zip file, extract to temp dir first
    if (selectedPath.endsWith('.zip')) {
      const AdmZip = require('adm-zip')
      const { mkdtempSync } = require('fs')
      const { join } = require('path')
      const { tmpdir } = require('os')
      const tempDir = mkdtempSync(join(tmpdir(), 'plugin-forge-import-'))
      const zip = new AdmZip(selectedPath)
      zip.extractAllTo(tempDir, true)
      pluginPath = tempDir
    }

    const data = await readPluginFromDisk(pluginPath)
    if (!data) return null
    return { ...data, sourcePath: selectedPath }
  })

  // ── App settings ──

  ipcMain.handle('get-settings', async () => {
    return getSettings().getAll()
  })

  ipcMain.handle('set-settings', async (_event, { settings: newSettings }) => {
    getSettings().setAll(newSettings)
    return { success: true }
  })

  // ── App info ──

  ipcMain.handle('get-app-data-path', async () => app.getPath('userData'))
  ipcMain.handle('get-platform', () => process.platform)
  ipcMain.handle('get-app-version', () => app.getVersion())

  // ── Window controls ──

  ipcMain.handle('window-minimize', () => BrowserWindow.getFocusedWindow()?.minimize())
  ipcMain.handle('window-maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win?.isMaximized()) win.unmaximize()
    else win?.maximize()
  })
  ipcMain.handle('window-close', () => BrowserWindow.getFocusedWindow()?.close())
  ipcMain.handle('window-is-maximized', () => BrowserWindow.getFocusedWindow()?.isMaximized() ?? false)

  // ── Connector Registry ──

  ipcMain.handle('get-connectors', async () => {
    return getConnectors()
  })

  ipcMain.handle('add-connector', async (_event, { connector }) => {
    return addConnector(connector)
  })

  ipcMain.handle('update-connector', async (_event, { id, updates }) => {
    return updateConnector(id, updates)
  })

  ipcMain.handle('delete-connector', async (_event, { id }) => {
    return deleteConnector(id)
  })

  ipcMain.handle('reset-connectors', async () => {
    resetConnectors()
    return { success: true }
  })

  // ── Force save (called before quit) ──

  ipcMain.handle('force-save-ack', () => {
    return { success: true }
  })
}
