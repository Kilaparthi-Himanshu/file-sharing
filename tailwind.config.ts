// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{js,ts,jsx,tsx}'], // Adjust based on your project
  theme: {
    extend: {
      keyframes: {
        shine: {
          '0%': { backgroundPosition: '100%' },
          '100%': { backgroundPosition: '-100%' },
        },
        gradient: {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
        },
      },
      animation: {
        shine: 'shine 5s linear infinite',
        gradient: 'gradient 8s linear infinite'
      },
    },
  },
  plugins: [require('tailwindcss-motion')],
}
export default config
