import type { Config } from 'tailwindcss'
import animate from 'tailwindcss-animate'

const config: Config = {
  content: ['./src/renderer/src/**/*.{ts,tsx}', './src/renderer/index.html'],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-base)',
        foreground: 'var(--text-primary)',
        card: {
          DEFAULT: 'var(--bg-surface)',
          foreground: 'var(--text-primary)'
        },
        popover: {
          DEFAULT: 'var(--bg-elevated)',
          foreground: 'var(--text-primary)'
        },
        primary: {
          DEFAULT: 'var(--accent)',
          foreground: 'var(--text-on-accent)'
        },
        secondary: {
          DEFAULT: 'var(--bg-surface)',
          foreground: 'var(--text-secondary)'
        },
        muted: {
          DEFAULT: 'var(--bg-surface)',
          foreground: 'var(--text-muted)'
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          muted: 'var(--accent-muted)',
          foreground: 'var(--text-primary)'
        },
        destructive: {
          DEFAULT: 'var(--error)',
          foreground: '#ffffff'
        },
        success: 'var(--success)',
        warning: 'var(--warning)',
        error: 'var(--error)',
        border: 'var(--border)',
        input: 'var(--bg-input)',
        ring: 'var(--border-focus)',
        surface: 'var(--bg-surface)',
        elevated: 'var(--bg-elevated)'
      },
      borderRadius: {
        DEFAULT: '5px',
        lg: '6px',
        md: '5px',
        sm: '4px'
      },
      boxShadow: {
        inset: 'var(--shadow-inset)',
        elevated: 'var(--shadow-elevated)'
      },
      fontFamily: {
        sans: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
        heading: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
        display: ['var(--font-display, DM Sans)', 'system-ui', 'sans-serif']
      },
      fontSize: {
        'page-title': ['20px', { lineHeight: '28px', fontWeight: '600' }],
        'section-heading': ['15px', { lineHeight: '22px', fontWeight: '500' }],
        body: ['13px', { lineHeight: '20px', fontWeight: '400' }],
        small: ['11px', { lineHeight: '16px', fontWeight: '400' }],
        code: ['12px', { lineHeight: '18px', fontWeight: '400' }]
      }
    }
  },
  plugins: [animate]
}

export default config
