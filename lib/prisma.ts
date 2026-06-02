import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { ws } from '@neondatabase/serverless'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

let prismaInstance: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // Pass a configured WebSocket client configuration safely to the adapter
  const client = new ws.Client({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaNeon(client)
  prismaInstance = new PrismaClient({ adapter })
} else {
  if (!globalForPrisma.prisma) {
    const client = new ws.Client({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaNeon(client)
    globalForPrisma.prisma = new PrismaClient({ adapter })
  }
  prismaInstance = globalForPrisma.prisma
}

export const prisma = prismaInstance