/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: '#08090D',
          surface: '#11141B',
          card: '#171B24',
          accent: '#E50914',
          'accent-hover': '#f40612',
          muted: '#A1A1AA',
          border: 'rgba(255, 255, 255, 0.08)',
          gold: '#f59e0b',
        },
        tv: {
          bg: '#08090D',
          surface: '#11141B',
          card: '#171B24',
          hover: '#1F2430',
          accent: '#E50914',
          gold: '#f59e0b',
          cyan: '#06b6d4',
          border: 'rgba(255, 255, 255, 0.08)'
        }
      },
      fontFamily: {
        sans: ['Inter', 'Manrope', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      scale: {
        '102': '1.02',
        '105': '1.05',
        '106': '1.06',
        '108': '1.08',
      },
      boxShadow: {
        'cinema-glow': '0 0 30px rgba(229, 9, 20, 0.45)',
        'tv-card': '0 12px 35px rgba(0, 0, 0, 0.75)',
        'hero-vignette': 'inset 0 0 100px rgba(8, 9, 13, 0.9)',
      }
    },
  },
  plugins: [],
}
