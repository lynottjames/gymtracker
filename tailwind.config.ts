import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        accent: 'var(--color-accent)',
        muted: 'var(--color-muted)',
        foreground: 'var(--color-foreground)',
        border: 'var(--color-border)',
      },
      fontFamily: {
        sans: ['var(--font-geist-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-geist-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
      },
      boxShadow: {
        mood: '0 10px 30px rgba(0, 0, 0, 0.4)',
        card: '0 8px 24px rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
}

export default config
