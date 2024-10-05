/** @type {import('tailwindcss').Config} */
export default {
  content: ["views/*.ejs","views/partials/*.ejs"],
  theme: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/aspect-ratio'),
  ],
}

