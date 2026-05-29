import { prisma } from './prisma'

export async function isStudioAvailable(
  startTime: Date,
  endTime: Date,
  room: string,
  excludeBookingIds: number[] = []
): Promise<boolean> {
  const conflict = await prisma.booking.findFirst({
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
