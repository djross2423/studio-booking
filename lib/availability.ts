import { Prisma, PrismaClient } from '@prisma/client'
import { prisma } from './prisma'

// Accepts either the base client or an interactive-transaction client, so the
// availability check can run inside the same transaction as the create.
type Db = PrismaClient | Prisma.TransactionClient

export async function isStudioAvailable(
  startTime: Date,
  endTime: Date,
  room: string,
  excludeBookingIds: number[] = [],
  client: Db = prisma
): Promise<boolean> {
  const conflict = await client.booking.findFirst({
    where: {
      room,
      status: { not: 'cancelled' },

      id: {
        notIn: excludeBookingIds,
      },

      startTime: {
        lt: endTime,
      },

      endTime: {
        gt: startTime,
      },
    },
  })

  return conflict === null
}
