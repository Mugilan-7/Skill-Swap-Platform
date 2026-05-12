/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#101828",
        brand: "#0f766e",
        coral: "#f97316",
        mist: "#f4f7fb"
      },
      boxShadow: {
        soft: "0 16px 50px rgba(16, 24, 40, 0.08)"
      }
    }
  },
  plugins: []
};
