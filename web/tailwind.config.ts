import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1565C0',
          light: '#E3F2FD',
          dark: '#0d47a1',
        },
        secondary: '#00897B',
        danger: '#D32F2F',
        warning: '#F57C00',
        success: '#388E3C',
      },
    },
  },
  plugins: [],
};

export default config;
