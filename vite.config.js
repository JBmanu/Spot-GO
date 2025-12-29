import { defineConfig } from "vite";

export default defineConfig({
    root: "src/",
    server: {
        watch: {
            ignored: ['**/node_modules/**', '**/.git/**']
        },
        hmr: true,
    },
});
