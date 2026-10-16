import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'src/**/*.{js,ts,jsx,tsx}'),
    path.join(__dirname, '../shared/**/*.{js,ts}'),
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
    './client/index.html',
    './client/src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dialer: {
          dark: '#0f172a',
          card: '#1e293b',
          border: '#334155',
          green: '#10b981',
          red: '#ef4444',
          accent: '#3b82f6'
        }
      },
      keyframes: {
        pulseRing: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '50%': { transform: 'scale(1.15)', opacity: '0.3' },
          '100%': { transform: 'scale(0.95)', opacity: '0.8' },
        },
        wave: {
          '0%, 100%': { height: '8px' },
          '50%': { height: '36px' },
        }
      },
      animation: {
        pulseRing: 'pulseRing 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        wave: 'wave 1s ease-in-out infinite',
      }
    },
  },
  plugins: [],
}
