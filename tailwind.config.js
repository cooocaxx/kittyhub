/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: { dark: '#0f0f11', card: '#18181b', accent: '#8b5cf6' },
      },
      animation: {
        'bounce-in': 'bounceIn 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        blob: 'blob 7s infinite', // 极光流动
        'ping-slow': 'ping 3s cubic-bezier(0, 0, 0.2, 1) infinite', // 慢速雷达
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite', // 慢速呼吸
        float: 'float 6s ease-in-out infinite', // 悬浮感
      },
      keyframes: {
        blob: {
          '0%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
          '100%': { transform: 'translate(0px, 0px) scale(1)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
