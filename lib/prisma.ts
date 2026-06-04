import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

let prismaInstance: PrismaClient

if (process.env.NODE_ENV === 'production') {
  // Pass the connection string config directly to the adapter — no Pool wrapper needed
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  prismaInstance = new PrismaClient({ adapter })
} else {
  if (!globalForPrisma.prisma) {
    const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
    globalForPrisma.prisma = new PrismaClient({ adapter })
  }
  prismaInstance = globalForPrisma.prisma
}

export const prisma = prismaInstance