/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: 'var(--paper)',
        'paper-2': 'var(--paper-2)',
        ink: 'var(--ink)',
        'ink-2': 'var(--ink-2)',
        red: 'var(--red)',
        'red-2': 'var(--red-2)',
        'red-soft': 'var(--red-soft)',
        gold: 'var(--gold)',
        'gold-2': 'var(--gold-2)',
      },
      fontFamily: {
        galmuri: ['Galmuri11', 'sans-serif'],
        geist: ['Geist', 'sans-serif'],
      },
    },
  },
  plugins: [],
}