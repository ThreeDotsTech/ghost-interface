const plugin = require('tailwindcss/plugin');

module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx,jsx,js}",
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
    }
  },
  plugins: [
    plugin(function({ addUtilities, e, theme, variants }) {
      const colors = theme('colors');
      const boxShadowUtilities = {};

      Object.keys(colors).forEach(colorName => {
        const color = colors[colorName];

        if (typeof color === 'string') {
          boxShadowUtilities[`.${e(`shadow-neu-${colorName}`)}`] = {
            boxShadow: `8px 8px 0 0 ${color}`,
            transition: 'box-shadow 0.2s ease-in-out',
            '&:hover': {
              boxShadow: `12px 12px 0 0 ${color}`,
              transition: 'box-shadow 0.2s ease-in-out',
            },
          };
          boxShadowUtilities[`.${e(`shadow-neu-active-${colorName}`)}`] = {
              boxShadow: `4px 4px 0 0 ${color}`,
              transition: 'box-shadow 0.2s ease-in-out',
          };
        } else {
          Object.keys(color).forEach(shade => {
            boxShadowUtilities[`.${e(`shadow-neu-${colorName}-${shade}`)}`] = {
              boxShadow: `8px 8px 0 0 ${color[shade]}`,
              transition: 'box-shadow 0.2s ease-in-out',
              '&:hover': {
                boxShadow: `12px 12px 0 0 ${color[shade]}`,
                transition: 'box-shadow 0.2s ease-in-out',
              },
            };
            boxShadowUtilities[`.${e(`shadow-neu-active-${colorName}-${shade}`)}`] = {
                boxShadow: `4px 4px 0 0 ${color[shade]}`,
                transition: 'box-shadow 0.2s ease-in-out',
            };
          });
        }
      });
      addUtilities(boxShadowUtilities, variants('boxShadow'));
    }),
  ],
};