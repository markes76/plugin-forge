import { useState, useCallback } from 'react'
import { type ThemeId, getTheme, setTheme as applyTheme } from '@/lib/theme'

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(getTheme)

  const setTheme = useCallback((id: ThemeId) => {
    applyTheme(id)
    setThemeState(id)
  }, [])

  return { theme, setTheme }
}
