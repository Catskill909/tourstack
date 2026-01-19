// Server-side Prisma client singleton
// Server-side Prisma client singleton
import { PrismaClient } from '../src/generated/prisma/index.js';
import path from 'path';

// Path to database file - use data directory for Docker volume compatibility
// Docker volumes can't mount to a file path, only directories
const dbPath = path.resolve(process.cwd(), 'data', 'dev.db');
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
