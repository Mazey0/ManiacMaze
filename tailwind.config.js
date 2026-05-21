/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        arabic: ['Tajawal', 'Cairo', 'sans-serif'],
      },
      colors: {
        maze: {
          bg: '#0a0a0f',
          surface: '#12121a',
          border: '#1e1e2e',
          accent: '#6c63ff',
          accentHover: '#7c74ff',
          gold: '#f0c040',
          text: '#e8e8f0',
          muted: '#6b6b8a',
          danger: '#ef4444',
          success: '#22c55e',
        },
      },
    },
  },
  plugins: [],
}
