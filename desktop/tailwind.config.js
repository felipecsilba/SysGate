// Cores vêm de variáveis CSS (index.css) — o tema claro/escuro troca só as variáveis.
const cor = nome => `rgb(var(--${nome}) / <alpha-value>)`

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        fundo: cor('fundo'),
        painel: cor('painel'),
        rail: cor('rail'),
        borda: cor('borda'),
        texto: cor('texto'),
        suave: cor('suave'),
        acento: cor('acento'),
        'acento-suave': cor('acento-suave'),
        perigo: cor('perigo'),
      },
      fontFamily: {
        sans: ['"Segoe UI Variable Text"', '"Segoe UI"', 'system-ui', 'sans-serif'],
        mono: ['"Cascadia Code"', 'Consolas', 'monospace'],
      },
    },
  },
  plugins: [],
}
