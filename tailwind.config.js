/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}", /* <--- ESTA LINHA É A MÁGICA */
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};