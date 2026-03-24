import { spawn } from 'child_process'

export interface InstallResult {
  success: boolean
  output: string
  errorOutput: string
}

export function installPluginViaCli(
  pluginPath: string,
  cliPath: string = 'claude'
): Promise<InstallResult> {
  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''

    const child = spawn(cliPath, ['plugin', 'install', pluginPath], {
      env: {
        ...process.env,
        PATH: getExpandedPath()
      },
      shell: true
    })

    child.stdout.on('data', (data) => {
      stdout += data.toString()
    })

    child.stderr.on('data', (data) => {
      stderr += data.toString()
    })

    child.on('close', (code) => {
      resolve({
        success: code === 0,
        output: stdout,
        errorOutput: stderr
      })
    })

    child.on('error', (error) => {
      resolve({
        success: false,
        output: '',
        errorOutput: `Failed to execute CLI: ${error.message}. Is Claude Code installed?`
      })
    })
  })
}

function getExpandedPath(): string {
  const base = process.env.PATH || ''
  const extras = [
    '/usr/local/bin',
    '/opt/homebrew/bin',
    `${process.env.HOME}/.local/bin`,
    `${process.env.HOME}/.npm-global/bin`
  ]
  return [...extras, base].join(':')
}
