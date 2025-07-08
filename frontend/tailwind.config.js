/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        gray: "#333333",
        orange: "#fe9f22",
        greenCs: "#7ac810",
        darkness: "#161616",
        lightGray: "#9b9b9b",
      },
      fontFamily: {
        Sahar: ["SaharHeavy", "Arial", "sans-serif"],
        SaharHeavy: ["SaharHeavy", "Arial", "sans-serif"],
        HelvicaRegular: ["HelvicaRegular", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
