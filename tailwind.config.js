/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"DM Mono"', '"Fira Code"', 'monospace'],
      },
      colors: {
        'bg-primary': '#FFFFFF',
        'bg-secondary': '#F7F7F7',
        'bg-tertiary': '#F0F0F0',
        'text-primary': '#6B1A2A',
        'text-secondary': '#6B6B6B',
        'text-tertiary': '#9B9B9B',
        'accent-success': '#16A34A',
        'accent-warning': '#D97706',
        'accent-danger': '#DC2626',
        'accent-info': '#2563EB',
      },
      borderRadius: {
        DEFAULT: '4px',
        sm: '2px',
        md: '6px',
        lg: '6px',
        xl: '6px',
        '2xl': '6px',
      },
      boxShadow: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        DEFAULT: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 1px 3px 0 rgb(0 0 0 / 0.07)',
      },
    },
  },
  plugins: [],
}
