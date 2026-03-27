/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Open Sans"', 'Comic Sans MS', 'cursive', 'sans-serif'],
      },
      colors: {
        koala: {
          green:  '#5BAD8F',
          teal:   '#3D9A8B',
          blue:   '#5B9BD5',
          sky:    '#A8D8EA',
          yellow: '#FFD166',
          pink:   '#FF9A9E',
          cream:  '#FFF8E7',
        },
      },
    },
  },
  plugins: [],
}
