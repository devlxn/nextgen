/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#7C3AED",
          secondary: "#A78BFA",
          accent: "#F43F5E",
          success: "#22C55E",
          danger: "#EF4444",
          warning: "#F59E0B",
          info: "#3B82F6",
        },
        gaming: {
          black: "#0F0F23",
          dark: "#1E1C35",
          muted: "#27273B",
          border: "#4C1D95",
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Orbitron"', 'sans-serif'],
      },
      boxShadow: {
        'minimal': '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
        'neon-purple': '0 0 10px rgba(124, 58, 237, 0.3), 0 0 20px rgba(124, 58, 237, 0.2)',
        'neon-rose': '0 0 10px rgba(244, 63, 94, 0.3), 0 0 20px rgba(244, 63, 94, 0.2)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
      },
      backgroundImage: {
        'gaming-gradient': 'linear-gradient(135deg, #0F0F23 0%, #1E1C35 100%)',
        'neon-gradient': 'linear-gradient(90deg, #7C3AED 0%, #F43F5E 100%)',
      }
    },
  },
  plugins: [],
};