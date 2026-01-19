// Server-side Prisma client singleton
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/index.js';
import path from 'path';

// Path to database file - use data directory for Docker volume compatibility
// Docker volumes can't mount to a file path, only directories
const dbPath = path.resolve(process.cwd(), 'data', 'dev.db');
console.log(`📂 Database path: ${dbPath}`);

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function createPrismaClient() {
    const adapter = new PrismaBetterSqlite3({ url: `file:${dbPath}` });
    return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = prisma;
}

export default prisma;
