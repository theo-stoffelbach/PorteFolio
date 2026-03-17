import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'github-gray': {
          dark: '#24292e',
          DEFAULT: '#586069',
          light: '#f6f8fa',
        },
        'github-blue': '#0366d6',
        'github-green': '#28a745',
        'github-border': '#e1e4e8',
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config

