/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        sans: ['"DM Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        ink: {
          DEFAULT: '#0d0d0d',
          soft: '#1a1a1a',
          muted: '#3a3a3a',
        },
        paper: {
          DEFAULT: '#f7f5f0',
          soft: '#ece9e2',
          muted: '#d9d5cc',
        },
        accent: '#e8440a',
        cheers: {
          cream: '#F5F0A0',
          'light-cream': '#FDFAE8',
          brown: '#6B2D2D',
          'dark-brown': '#4A1F1F',
          red: '#BC002D',
          snow: '#F8F8FF',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.4s ease forwards',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
      },
    },
  },
  plugins: [],
}
