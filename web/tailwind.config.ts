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
          DEFAULT: '#2563eb', // blue-600
          light:   '#dbeafe', // blue-100
          dark:    '#1d4ed8', // blue-700
        },
        secondary: '#00897B',
        danger:    '#ef4444', // red-500
        warning:   '#f59e0b', // amber-500
        success:   '#22c55e', // green-500
      },
    },
  },
  plugins: [],
};

export default config;
