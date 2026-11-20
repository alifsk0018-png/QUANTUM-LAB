/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      colors: {
        lab: {
          bg: 'var(--lab-bg)',
          surface: 'var(--lab-surface)',
          elevated: 'var(--lab-elevated)',
          border: 'var(--lab-border)',
        },
        quantum: {
          cyan: '#22d3ee',
          blue: '#3b82f6',
          purple: '#8b5cf6',
        },
      },
    },
  },
  plugins: [],
};
