/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  theme: {
    extend: {
      colors: {
        siteBlue: 'var(--SiteBlue, #2F5596)',
        disabledGrey: 'var(--DisabledGrey, #918D8D)',
        borderGrey: 'var(--BorderGrey, #DDDDDD)',
        lightBgGrey: 'var(--LightBgGrey, #F0F0F0)',
        textBlack: 'var(--TextBlack, #333333)',
      }
    },
  },
  safelist: [
    // Dynamic background and text colors
    {
      pattern: /bg-(red|green|blue|yellow|purple|pink|gray|indigo|blue-50\/30|black\/20|black\/40)-(50|100|200|300|400|500|600|700|800|900)/,
      variants: ['hover', 'focus', 'active'],
    },
    {
      pattern: /text-(red|green|blue|yellow|purple|pink|gray|indigo)-(50|100|200|300|400|500|600|700|800|900)/,
      variants: ['hover', 'focus', 'active'],
    },
    // Custom variable-based colors
    {
      pattern: /(bg|text|border)-\[var\(--.*\)]/,
      variants: ['hover', 'focus', 'active'],
    },
    // Layout utilities
    {
      pattern: /(p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr)-(0|1|2|3|4|5|6|8|10|12|16|20)/,
      variants: ['sm', 'md', 'lg', 'xl'],
    },
    {
      pattern: /text-(xs|sm|base|lg|xl|2xl|3xl|4xl)/,
    },
    {
      pattern: /(w|h)-(full|screen|auto|1\/2|1\/3|2\/3|1\/4|3\/4|1\/5|2\/5|3\/5|4\/5)/,
    },
    {
      pattern: /max-w-(xs|sm|md|lg|xl|2xl|3xl|4xl|5xl|6xl|7xl|full|min|max|fit)/,
    },
    // Flex & Grid
    "flex", "flex-col", "flex-row", "flex-wrap", "items-center", "items-start", "items-end", "justify-center", "justify-between", "justify-start", "justify-end",
    "grid", "grid-cols-1", "grid-cols-2", "grid-cols-3", "grid-cols-4", "grid-cols-5", "grid-cols-6",
    // Borders & rounded
    {
      pattern: /rounded(-(sm|md|lg|xl|2xl|full|none))?/,
    },
    {
      pattern: /border(-(0|2|4|8))?/,
    },
    // Opacity
    {
      pattern: /opacity-(0|5|10|20|25|30|40|50|60|70|75|80|90|95|100)/,
    },
    // Z-index
    {
      pattern: /z-(0|10|20|30|40|50|auto)/,
    },
    // Display
    "block", "inline-block", "inline", "flex", "inline-flex", "grid", "inline-grid", "hidden",
    // Special
    "no-scrollbar",
    "animate-spin",
  ],
  plugins: [],
};