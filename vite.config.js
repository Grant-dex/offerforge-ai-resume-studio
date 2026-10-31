import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { localAIPlugin } from "./server/ai-dev.mjs";
export default defineConfig(function (_a) {
    var mode = _a.mode;
    return ({
        plugins: [react(), localAIPlugin(loadEnv(mode, process.cwd(), ""))],
        server: { host: "127.0.0.1", port: 5173, strictPort: true }
    });
});
