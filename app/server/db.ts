// Server-side Prisma client singleton
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import { PrismaClient } from '../src/generated/prisma/index.js';
import path from 'path';

// Path to database file - use process.cwd() for Docker compatibility
// In Docker, cwd is /app, so this becomes /app/dev.db
const dbPath = path.resolve(process.cwd(), 'dev.db');
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
