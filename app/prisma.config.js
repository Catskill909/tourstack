// Plain JS config to avoid module resolution issues in Docker
// (Since 'prisma' package is a devDependency and might be pruned)

console.log("--> Loading prisma.config.js");

const envUrl = process.env.DATABASE_URL;
// Check for Prod environment (Docker WORKDIR /app)
const isProd = process.cwd() === "/app";
const finalUrl = envUrl || (isProd ? "file:/app/data/dev.db" : "file:./dev.db");

console.log("--> DB Configuration:");
console.log("    Environment URL: " + (envUrl ? "Present" : "Missing"));
console.log("    Using URL:       " + finalUrl);

export default {
    // Explicitly point to schema
    schema: "prisma/schema.prisma",
    datasource: {
        url: finalUrl,
    },
};
