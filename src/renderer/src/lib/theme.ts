export type ThemeId = 'forge' | 'carbon' | 'ember' | 'arctic' | 'daylight' | 'grimoire' | 'ironworks'
export type ThemeGroup = 'standard' | 'styled'

export interface ThemeConfig {
  id: ThemeId
  name: string
  group: ThemeGroup
  description: string
  preview: {
    bg: string
    surface: string
    accent: string
    text: string
  }
}

export const themes: ThemeConfig[] = [
  {
    id: 'forge',
    name: 'Forge',
    group: 'standard',
    description: 'Deep charcoal with amber warmth',
    preview: { bg: '#13161b', surface: '#1a1d23', accent: '#e8941a', text: '#d4d8e0' }
  },
  {
    id: 'carbon',
    name: 'Carbon',
    group: 'standard',
    description: 'Minimal dark with electric blue',
    preview: { bg: '#0c0c0c', surface: '#161616', accent: '#4f8cf7', text: '#e0e0e0' }
  },
  {
    id: 'ember',
    name: 'Ember',
    group: 'standard',
    description: 'Warm workshop tones',
    preview: { bg: '#170f0b', surface: '#221812', accent: '#e05a33', text: '#e8d5c4' }
  },
  {
    id: 'arctic',
    name: 'Arctic',
    group: 'standard',
    description: 'Cool blue-black with green',
    preview: { bg: '#0d1117', surface: '#161b22', accent: '#3fb950', text: '#c9d1d9' }
  },
  {
    id: 'daylight',
    name: 'Daylight',
    group: 'standard',
    description: 'Clean light mode',
    preview: { bg: '#f5f5f0', surface: '#ffffff', accent: '#b45309', text: '#1c1917' }
  },
  {
    id: 'grimoire',
    name: 'Grimoire',
    group: 'styled',
    description: 'Fantasy spellbook',
    preview: { bg: '#2a3425', surface: '#3a4434', accent: '#d4943a', text: '#e8dcc8' }
  },
  {
    id: 'ironworks',
    name: 'Ironworks',
    group: 'styled',
    description: 'Industrial forge',
    preview: { bg: '#1c1e22', surface: '#282b31', accent: '#c44b3f', text: '#d6d3cc' }
  }
]

export function getTheme(): ThemeId {
  return (localStorage.getItem('plugin-forge-theme') as ThemeId) || 'forge'
}

export function setTheme(id: ThemeId): void {
  document.documentElement.setAttribute('data-theme', id)
  localStorage.setItem('plugin-forge-theme', id)
}
