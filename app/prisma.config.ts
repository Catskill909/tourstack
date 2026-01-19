import { defineConfig } from "prisma/config";

// Detailed debug logging to understand why env var might be missing
const envUrl = process.env["DATABASE_URL"];
console.log("Creating Prisma Config...");
console.log("Found DATABASE_URL:", envUrl ? "YES (Leng: " + envUrl.length + ")" : "NO");

// Fallback logic for production if env var is somehow dropped (though start.sh exports it)
// Docker container typically runs in /app
const isProd = process.cwd() === "/app";
const finalUrl = envUrl || (isProd ? "file:/app/data/dev.db" : "file:./dev.db");

console.log("Using Final URL:", finalUrl);

export default defineConfig({
    schema: "prisma/schema.prisma",
    datasource: {
        url: finalUrl,
    },
});
