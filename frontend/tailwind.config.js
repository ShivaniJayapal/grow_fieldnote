/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
      colors: {
        groww: {
          teal: '#00D09C',
          tealHover: '#00b386',
          tealDark: '#00a37b',
          tealLight: '#ebfbf5',
          tealBorder: '#b3f0dd',
          blue: '#5367FF',
          blueLight: '#eef1ff',
          dark: '#1e2233',
          heading: '#141721',
          body: '#44475b',
          muted: '#7c7e8c',
          dim: '#9ea0aa',
          bg: '#f8fafd',
          card: '#ffffff',
          subtle: '#f4f6f8',
          border: '#eaedf1',
          borderStrong: '#d8dde4',
          red: '#eb5b3c',
          redLight: '#fdedeb',
          redBorder: '#facbc5',
          amber: '#f59e0b',
          amberLight: '#fef3c7',
          amberBorder: '#fde68a',
        },
      },
      boxShadow: {
        'groww': '0 2px 8px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02)',
        'groww-hover': '0 8px 24px rgba(0, 0, 0, 0.07), 0 2px 6px rgba(0, 0, 0, 0.04)',
        'groww-dropdown': '0 12px 32px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'flash-green': 'flashGrowwGreen 1.5s ease-out',
        'flash-red': 'flashGrowwRed 1.5s ease-out',
      },
      keyframes: {
        flashGrowwGreen: {
          '0%': { backgroundColor: 'rgba(0, 208, 156, 0.18)' },
          '100%': { backgroundColor: 'transparent' },
        },
        flashGrowwRed: {
          '0%': { backgroundColor: 'rgba(235, 91, 60, 0.18)' },
          '100%': { backgroundColor: 'transparent' },
        }
      }
    },
  },
  plugins: [],
}
