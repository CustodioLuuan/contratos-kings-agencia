/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/react-app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'space': ['Space Grotesk', 'system-ui', 'sans-serif'],
      },
      colors: {
        kings: {
          primary: '#dbfb36',
          'primary-dark': '#c8e831',
          'bg-primary': '#050505',
          'bg-secondary': '#0a0a0a',
          'bg-tertiary': '#0f0f0f',
          border: '#191919',
          'text-primary': '#ffffff',
          'text-secondary': '#e6e6e6',
          'text-muted': '#999999',
          'text-subtle': '#666666',
        }
      },
    },
  },
  plugins: [],
};
