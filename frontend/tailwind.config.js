/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        slate: {
          50: 'rgb(var(--color-slate-50) / <alpha-value>)',
          100: 'rgb(var(--color-slate-100) / <alpha-value>)',
          200: 'rgb(var(--color-slate-200) / <alpha-value>)',
          300: 'rgb(var(--color-slate-300) / <alpha-value>)',
          400: 'rgb(var(--color-slate-400) / <alpha-value>)',
          500: 'rgb(var(--color-slate-500) / <alpha-value>)',
          600: 'rgb(var(--color-slate-600) / <alpha-value>)',
          700: 'rgb(var(--color-slate-700) / <alpha-value>)',
          750: 'rgb(var(--color-slate-750) / <alpha-value>)',
          800: 'rgb(var(--color-slate-800) / <alpha-value>)',
          850: 'rgb(var(--color-slate-850) / <alpha-value>)',
          900: 'rgb(var(--color-slate-900) / <alpha-value>)',
          950: 'rgb(var(--color-slate-950) / <alpha-value>)',
        },
        tier1: {
          light: '#FEE2E2',
          DEFAULT: '#DC2626',
          dark: '#991B1B'
        },
        tier2: {
          light: '#FEF3C7',
          DEFAULT: '#D97706',
          dark: '#92400E'
        },
        tier3: {
          light: '#FEF9C3',
          DEFAULT: '#CA8A04',
          dark: '#854D0E'
        },
        tier4: {
          light: '#DCFCE7',
          DEFAULT: '#16A34A',
          dark: '#166534'
        }
      }
    },
  },
  plugins: [],
}
