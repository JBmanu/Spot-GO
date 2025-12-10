import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";
import containerQueries from "@tailwindcss/container-queries";

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{html,js}"],

    plugins: [
        forms,
        typography,
        animate,
        containerQueries,
    ],
};
