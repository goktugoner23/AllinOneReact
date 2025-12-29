/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED',
          light: '#A78BFA',
          dark: '#6D28D9',
        },
        secondary: {
          DEFAULT: '#7C3AED',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#232136',
        },
        background: {
          light: '#FFFFFF',
          dark: '#18181B',
        },
        income: '#4CAF50',
        expense: '#F44336',
        investment: '#FF9800',
        registration: '#2196F3',
        border: {
          light: '#EEEEEE',
          dark: '#232136',
        },
        divider: {
          light: '#E0E0E0',
          dark: '#2D2A45',
        },
        chip: {
          light: '#F3F0FF',
          dark: '#2D2A45',
        },
        text: {
          primary: '#333333',
          secondary: '#666666',
          muted: '#888888',
          light: '#FFFFFF',
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
      },
      fontSize: {
        'xxs': '0.625rem',
      },
    },
  },
  plugins: [],
};
