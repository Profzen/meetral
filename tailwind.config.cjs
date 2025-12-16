module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx,mdx}',
    './app/**/*.{js,jsx,ts,tsx,mdx}'
  ],
  theme: { 
    extend: {
      colors: {
        brand: {
          DEFAULT: '#D4AF37',
          600: '#B8860B',
          700: '#9B6F05'
        },
        gold: {
          DEFAULT: '#D4AF37',
          600: '#B8860B'
        },
        surface: {
          DEFAULT: '#0b0b0b',
          800: '#121212',
          900: '#070707'
        }
      }
    }
  },
  plugins: [],
};
