import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'
import { Pool } from '@neondatabase/serverless'

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

let prismaInstance: PrismaClient

if (process.env.NODE_ENV === 'production') {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const adapter = new PrismaNeon(pool)
  prismaInstance = new PrismaClient({ adapter })
} else {
  if (!globalForPrisma.prisma) {
    const pool = new Pool({ connectionString: process.env.DATABASE_URL })
    const adapter = new PrismaNeon(pool)
    globalForPrisma.prisma = new PrismaClient({ adapter })
  }
  prismaInstance = globalForPrisma.prisma
}

export const prisma = prismaInstance