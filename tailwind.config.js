const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        text: 'var(--color-text)',
        primary: 'var(--color-primary)',
        secondary: 'var(--color-secondary)',
        accent: 'var(--color-accent)',
        border: 'var(--color-border)',
        shadows: 'var(--color-shadows)',
      },
      boxShadow: {
        neu: '8px 8px 0px 0px rgba(0, 0, 0, 1)', // Custom shadow for neubrutalism
        'neu-hover': '12px 12px 0px 0px rgba(0, 0, 0, 1)', // Hover shadow for neubrutalism
        'neu-active': '4px 4px 0px 0px rgba(0, 0, 0, 1)', 
      },
    },
  },
  plugins: [
    plugin(function({ addUtilities, theme, e }) {
      const colors = theme('colors');
      const newUtilities = Object.entries(colors).reduce((acc, [colorName, colorValue]) => {
        if (typeof colorValue === 'string') {
          return {
            ...acc,
            [`.shadow-neu-${e(colorName)}`]: {
              boxShadow: `8px 8px 0px 0px ${colorValue}`,
            },
            [`.hover\\:shadow-neu-${e(colorName)}`]: {
              '&:hover': {
                boxShadow: `12px 12px 0px 0px ${colorValue}`,
              },
            },
          };
        }
        return acc;
      }, {});

      addUtilities(newUtilities, ['responsive', 'hover']);
    }),
  ],
}
