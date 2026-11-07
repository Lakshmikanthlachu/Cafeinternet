/** Byteport — Tailwind configuration
 *  Rebuild CSS:  npm install  &&  npm run build   (or: npm run watch)
 */
module.exports = {
  darkMode: 'class',
  content: ['./*.html', './assets/js/**/*.js'],
  theme: {
    extend: {
      colors: {
        ink: {
          50: '#f4f6fb', 100: '#e7ebf4', 200: '#cdd4e4', 300: '#a3aec8', 400: '#7381a3',
          500: '#525f80', 600: '#3a4566', 700: '#253050', 800: '#17213a', 900: '#0e1526', 950: '#070b14',
        },
        signal: { DEFAULT: '#2ee6d6', 50: '#e8fdfb', 100: '#c7f9f4', 300: '#6ff0e4', 400: '#2ee6d6', 500: '#14c4b6', 600: '#0b9b91', 700: '#0a7a73', 800: '#0b5f5a' },
        pulse: { DEFAULT: '#ff3ea5', 300: '#ff8cc8', 400: '#ff3ea5', 500: '#e61f88', 600: '#c0146f', 700: '#97105a' },
        volt: { DEFAULT: '#ffb020', 300: '#ffd27a', 400: '#ffb020', 500: '#f09400', 600: '#c27500', 700: '#955900' },
        lime: { 300: '#d3ff86', 400: '#b6ff3b', 500: '#93e012', 600: '#6fae05', 700: '#567f0a' },
        violet: { 400: '#8b5cff', 500: '#7442f5', 600: '#5d2fd6' },
      },
      fontFamily: {
        display: ['"Chakra Petch"', 'Cairo', 'system-ui', 'sans-serif'],
        body: ['Manrope', 'Cairo', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      maxWidth: { '8xl': '88rem' },
      boxShadow: {
        neon: '0 0 0 1px rgba(46,230,214,.35), 0 10px 40px -10px rgba(46,230,214,.45)',
        neonp: '0 0 0 1px rgba(255,62,165,.35), 0 10px 40px -10px rgba(255,62,165,.45)',
        card: '0 1px 0 rgba(255,255,255,.04) inset, 0 20px 50px -30px rgba(7,11,20,.55)',
      },
      keyframes: {
        marquee: { to: { transform: 'translateX(-50%)' } },
        marqueeR: { to: { transform: 'translateX(50%)' } },
        floaty: { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-10px)' } },
        blink: { '0%,49%': { opacity: 1 }, '50%,100%': { opacity: 0 } },
        ping2: { '0%': { transform: 'scale(.8)', opacity: .8 }, '100%': { transform: 'scale(2.4)', opacity: 0 } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
      },
      animation: {
        marquee: 'marquee 38s linear infinite',
        marqueeR: 'marqueeR 38s linear infinite',
        floaty: 'floaty 6s ease-in-out infinite',
        blink: 'blink 1.1s steps(1) infinite',
        ping2: 'ping2 1.8s ease-out infinite',
        scan: 'scan 3.5s linear infinite',
      },
    },
  },
  plugins: [],
};
