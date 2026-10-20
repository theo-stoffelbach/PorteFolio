import type { Config } from 'tailwindcss'

const config: Config = {
  // L'admin utilise encore des variantes dark: ; sans classe .dark posée, elles restent inactives.
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Palette de l'admin, conservée telle quelle
        'github-gray': {
          dark: '#24292e',
          DEFAULT: '#586069',
          light: '#f6f8fa',
        },
        'github-blue': '#0366d6',
        'github-green': '#28a745',
        'github-border': '#e1e4e8',
        // Couleurs du monde « Console TS-27 » (jetons définis dans app/globals.css)
        desk: {
          DEFAULT: 'var(--desk)',
          deep: 'var(--desk-deep)',
          ink: 'var(--desk-ink)',
          edge: 'var(--desk-edge)',
        },
        cobalt: {
          DEFAULT: 'var(--cobalt)',
          night: 'var(--cobalt-night)',
          deep: 'var(--cobalt-deep)',
          mid: 'var(--cobalt-mid)',
          light: 'var(--cobalt-light)',
          glint: 'var(--cobalt-glint)',
          haze: 'var(--cobalt-haze)',
        },
        framboise: {
          DEFAULT: 'var(--framboise)',
          deep: 'var(--framboise-deep)',
          ink: 'var(--framboise-ink)',
          light: 'var(--framboise-light)',
          pale: 'var(--framboise-pale)',
        },
        start: {
          DEFAULT: 'var(--start)',
          deep: 'var(--start-deep)',
          shade: 'var(--start-shade)',
          pale: 'var(--start-pale)',
        },
        lcd: {
          0: 'var(--lcd-0)',
          1: 'var(--lcd-1)',
          2: 'var(--lcd-2)',
          3: 'var(--lcd-3)',
        },
        paper: {
          DEFAULT: 'var(--paper)',
          shade: 'var(--paper-shade)',
        },
        cream: 'var(--cream)',
        label: 'var(--label)',
        cat: {
          infra: 'var(--cat-infra)',
          ia: 'var(--cat-ia)',
          jeux: 'var(--cat-jeux)',
          web: 'var(--cat-web)',
        },
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'var(--font-body)', 'sans-serif'],
        pixel: ['var(--font-pixel)', 'monospace'],
      },
    },
  },
  plugins: [],
}
export default config
