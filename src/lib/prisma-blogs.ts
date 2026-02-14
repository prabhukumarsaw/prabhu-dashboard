import { PrismaClient } from '../../prisma/blogs/client';
import { logger } from './logger';

const globalForPrismaBlogs = globalThis as unknown as { prismaBlogs: PrismaClient };

export const prismaBlogs =
    globalForPrismaBlogs.prismaBlogs ||
    new PrismaClient({
        log:
            process.env.NODE_ENV === 'development'
                ? ['query', 'error', 'warn']
                : ['error'],
    });

if (process.env.NODE_ENV !== 'production') globalForPrismaBlogs.prismaBlogs = prismaBlogs;

prismaBlogs.$connect().catch((e) => {
    logger.error('Prisma Blogs connect error', e);
    // We don't necessarily want to exit the whole app if the secondary DB fails, 
    // but for now we follow the core pattern.
});
