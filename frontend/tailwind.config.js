/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  safelist: [{ pattern: /sysgate/ }],
  theme: {
    extend: {
      colors: {
        sysgate: {
          50: '#e8f4ff',
          100: '#c3deff',
          200: '#9ecaff',
          300: '#5fa8ff',
          400: '#2e88f5',
          500: '#1a6fdb',
          600: '#1258b8',
          700: '#0d4290',
          800: '#0a3070',
          900: '#061e4a',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
