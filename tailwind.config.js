module.exports = {
  mode: 'jit',
  purge: ['./public/**/*.html', './src/**/*.{js,jsx,ts,tsx}'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {},

    fontFamily: {
      ubuntu: ['Ubuntu-Bold', 'Ubuntu-BoldItalic', 'Ubuntu-Regular'],
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
}
