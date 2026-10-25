import { PrismaClient, type Prisma } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma?: PrismaClient };

function prismaLogConfig(): Prisma.LogLevel[] {
  if (process.env.NODE_ENV === 'production') {
    return ['error'];
  }
  if (process.env.PRISMA_LOG_QUERIES === '1') {
    return ['query', 'warn', 'error'];
  }
  return ['warn', 'error'];
}

function createPrismaClient() {
  return new PrismaClient({
    log: prismaLogConfig(),
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
}

/** Dev hot-reload can keep an old client missing newly generated models — recreate if needed. */
function getPrismaClient(): PrismaClient {
  const cached = globalForPrisma.prisma;
  if (cached && 'sysUserNotification' in cached) {
    return cached;
  }
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

export const prisma = getPrismaClient();
