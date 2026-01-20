/// <reference types="node" />
// Server-side Prisma client singleton
import { PrismaClient } from '../src/generated/prisma/index.js';
import path from 'path';

// Path to database file - MUST MATCH Coolify volume mount!
// Coolify mounts to /app/dev.db (not /app/data/dev.db)
const dbPath = path.resolve(process.cwd(), 'dev.db');
console.log(`📂 Database path: ${dbPath}`);

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

// Create standard Prisma Client without adapters
// We explicitly pass the URL to ensure it uses the volume path
function createPrismaClient() {
    return new PrismaClient({
        datasources: {
            db: {
                url: `file:${dbPath}`,
            },
        },
    });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
