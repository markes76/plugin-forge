import archiver from 'archiver'
import { createWriteStream, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs'
import { join, dirname } from 'path'
import { tmpdir } from 'os'

export interface PluginFile {
  relativePath: string
  content: string
}

/**
 * Generate a ZIP file from plugin files.
 * Files are placed at the root of the archive (not nested in a parent folder).
 */
export function generatePluginZip(
  files: PluginFile[],
  savePath: string
): Promise<{ success: boolean; path: string }> {
  return new Promise((resolve, reject) => {
    // Write files to a temp directory first
    const tempDir = mkdtempSync(join(tmpdir(), 'plugin-forge-'))

    for (const file of files) {
      const fullPath = join(tempDir, file.relativePath)
      mkdirSync(dirname(fullPath), { recursive: true })
      writeFileSync(fullPath, file.content, 'utf-8')
    }

    // Create zip from temp dir contents at root level
    const output = createWriteStream(savePath)
    const archive = archiver('zip', { zlib: { level: 9 } })

    output.on('close', () => {
      // Clean up temp dir
      try { rmSync(tempDir, { recursive: true, force: true }) } catch {}
      resolve({ success: true, path: savePath })
    })

    archive.on('error', (err) => {
      try { rmSync(tempDir, { recursive: true, force: true }) } catch {}
      reject(new Error(`ZIP creation failed: ${err.message}`))
    })

    archive.pipe(output)
    // Add contents at root level (not nested in a folder)
    archive.directory(tempDir, false)
    archive.finalize()
  })
}

/**
 * Legacy: export from pre-built file array (used by the old export-zip IPC)
 */
export function exportPluginAsZip(
  files: PluginFile[],
  outputPath: string
): Promise<{ success: boolean; path: string }> {
  return generatePluginZip(files, outputPath)
}
