import colors from 'tailwindcss/colors';

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
        vault: { 600: 'rgb(var(--vault-600) / <alpha-value>)', 700: 'rgb(var(--vault-700) / <alpha-value>)', 750: 'rgb(var(--vault-750) / <alpha-value>)', 800: 'rgb(var(--vault-800) / <alpha-value>)', 850: 'rgb(var(--vault-850) / <alpha-value>)', 900: 'rgb(var(--vault-900) / <alpha-value>)', 950: 'rgb(var(--vault-950) / <alpha-value>)' },
        slate: { ...colors.slate, 100: 'rgb(var(--slate-100) / <alpha-value>)', 200: 'rgb(var(--slate-200) / <alpha-value>)', 300: 'rgb(var(--slate-300) / <alpha-value>)', 400: 'rgb(var(--slate-400) / <alpha-value>)', 500: 'rgb(var(--slate-500) / <alpha-value>)', 600: 'rgb(var(--slate-600) / <alpha-value>)', 700: 'rgb(var(--slate-700) / <alpha-value>)' },
        sky: { ...colors.sky, 300: 'rgb(var(--sky-300) / <alpha-value>)', 400: 'rgb(var(--sky-400) / <alpha-value>)', 800: 'rgb(var(--sky-800) / <alpha-value>)', 900: 'rgb(var(--sky-900) / <alpha-value>)', 950: 'rgb(var(--sky-950) / <alpha-value>)' },
        amber: { ...colors.amber, 300: 'rgb(var(--amber-300) / <alpha-value>)', 400: 'rgb(var(--amber-400) / <alpha-value>)', 800: 'rgb(var(--amber-800) / <alpha-value>)', 950: 'rgb(var(--amber-950) / <alpha-value>)' },
        rose: { ...colors.rose, 400: 'rgb(var(--rose-400) / <alpha-value>)', 800: 'rgb(var(--rose-800) / <alpha-value>)', 950: 'rgb(var(--rose-950) / <alpha-value>)' },
        emerald: { ...colors.emerald, 300: 'rgb(var(--emerald-300) / <alpha-value>)', 800: 'rgb(var(--emerald-800) / <alpha-value>)', 950: 'rgb(var(--emerald-950) / <alpha-value>)' },
        indigo: { ...colors.indigo, 300: 'rgb(var(--indigo-300) / <alpha-value>)', 400: 'rgb(var(--indigo-400) / <alpha-value>)', 800: 'rgb(var(--indigo-800) / <alpha-value>)', 950: 'rgb(var(--indigo-950) / <alpha-value>)' },
        brand: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
        },
        accent: {
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
        }
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          'Roboto',
          'Helvetica',
          'Arial',
          'sans-serif',
        ],
        mono: [
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
    },
  },
  plugins: [],
};
