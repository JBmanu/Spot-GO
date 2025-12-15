import { defineConfig } from "vite";

export default defineConfig({
    root: "src/",
    server: {
        watch: { usePolling: true },
    },
    define: {
        __VITE_ENV__: JSON.stringify(process.env),
    },
});
