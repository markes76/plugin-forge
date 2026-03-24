import { useState, useEffect } from 'react'
import { Minus, Square, X, Maximize2 } from 'lucide-react'

export function TitleBar() {
  const [platform, setPlatform] = useState<string>('darwin')
  const [isMaximized, setIsMaximized] = useState(false)

  useEffect(() => {
    window.pluginForge.getPlatform().then(setPlatform)
    window.pluginForge.isMaximized().then(setIsMaximized)

    const cleanup = window.pluginForge.onMaximizeChange(setIsMaximized)
    return cleanup
  }, [])

  const isMac = platform === 'darwin'

  return (
    <div
      className="drag-region flex items-center justify-between h-10 px-4"
      style={{ backgroundColor: 'var(--bg-base)' }}
    >
      {/* macOS: traffic lights are built-in, we just need spacing */}
      {isMac && <div className="w-[72px]" />}

      {/* App title */}
      <div className="flex-1 text-center select-none">
        <span
          className="text-small font-heading font-medium tracking-wide"
          style={{ color: 'var(--text-muted)' }}
        >
          PLUGIN FORGE
        </span>
      </div>

      {/* Windows/Linux: custom window controls */}
      {!isMac && (
        <div className="no-drag flex items-center gap-0.5">
          <button
            onClick={() => window.pluginForge.minimize()}
            className="flex items-center justify-center w-8 h-8 rounded-sm transition-colors hover:bg-[var(--bg-elevated)]"
          >
            <Minus size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
          <button
            onClick={() => window.pluginForge.maximize()}
            className="flex items-center justify-center w-8 h-8 rounded-sm transition-colors hover:bg-[var(--bg-elevated)]"
          >
            {isMaximized ? (
              <Square size={12} style={{ color: 'var(--text-muted)' }} />
            ) : (
              <Maximize2 size={12} style={{ color: 'var(--text-muted)' }} />
            )}
          </button>
          <button
            onClick={() => window.pluginForge.close()}
            className="flex items-center justify-center w-8 h-8 rounded-sm transition-colors hover:bg-[var(--error)]"
          >
            <X size={14} style={{ color: 'var(--text-muted)' }} />
          </button>
        </div>
      )}

      {isMac && <div className="w-[72px]" />}
    </div>
  )
}
