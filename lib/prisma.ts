import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

// IMPORTANT for serverless (Vercel): DATABASE_URL must point at Neon's POOLED
// endpoint (host contains `-pooler`, e.g. ep-xxx-pooler.<region>.aws.neon.tech).
// The direct endpoint opens a new Postgres connection per function invocation
// and will exhaust connections under concurrency.

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrismaClient() {
  const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL })
  return new PrismaClient({ adapter })
}

// Reuse a single client across hot reloads (dev) and warm invocations (prod)
// instead of creating a new one each time the module is evaluated.
export const prisma = globalForPrisma.prisma ?? createPrismaClient()

globalForPrisma.prisma = prisma
