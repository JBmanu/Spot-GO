import forms from "@tailwindcss/forms";
import typography from "@tailwindcss/typography";
import animate from "tailwindcss-animate";
import containerQueries from "@tailwindcss/container-queries";

/** @type {import('tailwindcss').Config} */
export default {
    content: ["./src/**/*.{html,js}"],

    // theme: {
    //     extend: {
    //         colors: {
    //
    //             // "main-paper": "var(--color-main_paper)",
    //             "text-color": "var(--color-text_color)",
    //             "primary-color": "var(--color-primary_color)",
    //             "secondary-color": "var(--color-secondary_color)",
    //             "accent-color": "var(--color-accent_color)"
    //         }
    //     }
    // },

    plugins: [
        forms,
        typography,
        animate,
        containerQueries,
    ],
};
