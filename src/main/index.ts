import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { registerIpcHandlers } from './ipc-handlers'
import { cleanupOrphanedDrafts } from './persistence'

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: '#13161b',
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    frame: process.platform === 'darwin',
    ...(process.platform === 'darwin'
      ? { trafficLightPosition: { x: 16, y: 18 } }
      : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // Window state events for custom title bar
  mainWindow.on('maximize', () => {
    mainWindow?.webContents.send('window-maximized', true)
  })
  mainWindow.on('unmaximize', () => {
    mainWindow?.webContents.send('window-maximized', false)
  })

  if (process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId?.('com.pluginforge.app')

  // Clean up orphaned drafts on launch
  try { cleanupOrphanedDrafts() } catch {}

  registerIpcHandlers(ipcMain, dialog)
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Before quit: notify renderer to save, then wait briefly
app.on('before-quit', (event) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('force-save')
    // Give renderer 2 seconds to save
    event.preventDefault()
    setTimeout(() => {
      app.exit(0)
    }, 2000)
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

export { mainWindow }
