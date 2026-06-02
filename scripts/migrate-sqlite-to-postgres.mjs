/**
 * Migrates data from the SQLite backup into the Postgres database.
 * Run AFTER: npx prisma migrate dev --name init
 *
 * Usage:
 *   node scripts/migrate-sqlite-to-postgres.mjs [path/to/studio.db]
 *
 * Defaults to prisma/studio-backup.db if no path is given.
 */

import 'dotenv/config'
import { DatabaseSync } from 'node:sqlite'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dbPath = process.argv[2] ?? path.join(__dirname, '..', 'prisma', 'studio-backup.db')

if (!fs.existsSync(dbPath)) {
  console.error(`SQLite file not found: ${dbPath}`)
  process.exit(1)
}

const sqlite = new DatabaseSync(dbPath)
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

function rows(table) {
  try {
    return sqlite.prepare(`SELECT * FROM "${table}"`).all()
  } catch {
    return []
  }
}

function maybeDate(val) {
  if (!val) return null
  if (val instanceof Date) return val
  return new Date(val)
}

async function main() {
  console.log(`Reading from: ${dbPath}`)
  console.log('Migrating…\n')

  // --- Clients ---
  const clients = rows('Client')
  console.log(`Clients: ${clients.length}`)
  for (const c of clients) {
    await prisma.client.upsert({
      where: { id: Number(c.id) },
      update: {},
      create: {
        id: Number(c.id),
        name: String(c.name),
        phone: c.phone ? String(c.phone) : null,
        notes: c.notes ? String(c.notes) : null,
        active: c.active !== undefined ? Boolean(c.active) : true,
        createdAt: maybeDate(c.createdAt) ?? new Date(),
      },
    })
  }

  // --- Faculty ---
  const faculty = rows('Faculty')
  console.log(`Faculty: ${faculty.length}`)
  for (const f of faculty) {
    await prisma.faculty.upsert({
      where: { id: Number(f.id) },
      update: {},
      create: {
        id: Number(f.id),
        name: String(f.name),
        phone: f.phone ? String(f.phone) : null,
        active: f.active !== undefined ? Boolean(f.active) : true,
        createdAt: maybeDate(f.createdAt) ?? new Date(),
      },
    })
  }

  // --- Courses ---
  const courses = rows('Course')
  console.log(`Courses: ${courses.length}`)
  for (const c of courses) {
    await prisma.course.upsert({
      where: { id: Number(c.id) },
      update: {},
      create: {
        id: Number(c.id),
        name: String(c.name),
        totalSessions: Number(c.totalSessions),
        sessionDuration: Number(c.sessionDuration),
        fee: Number(c.fee),
        color: c.color ? String(c.color) : '#6C3CE1',
        description: c.description ? String(c.description) : null,
        active: c.active !== undefined ? Boolean(c.active) : true,
        createdAt: maybeDate(c.createdAt) ?? new Date(),
      },
    })
  }

  // --- Batches ---
  const batches = rows('Batch')
  console.log(`Batches: ${batches.length}`)
  for (const b of batches) {
    await prisma.batch.upsert({
      where: { id: Number(b.id) },
      update: {},
      create: {
        id: Number(b.id),
        name: String(b.name),
        room: String(b.room),
        startTime: String(b.startTime),
        duration: Number(b.duration),
        repeatDays: String(b.repeatDays),
        startDate: String(b.startDate),
        endDate: String(b.endDate),
        color: b.color ? String(b.color) : '#6C3CE1',
        status: b.status ? String(b.status) : 'active',
        facultyId: b.facultyId ? Number(b.facultyId) : null,
        courseId: b.courseId ? Number(b.courseId) : null,
        createdAt: maybeDate(b.createdAt) ?? new Date(),
      },
    })
  }

  // --- BatchEnrolments ---
  const enrolments = rows('BatchEnrolment')
  console.log(`BatchEnrolments: ${enrolments.length}`)
  for (const e of enrolments) {
    await prisma.batchEnrolment.upsert({
      where: { id: Number(e.id) },
      update: {},
      create: {
        id: Number(e.id),
        batchId: Number(e.batchId),
        clientId: Number(e.clientId),
      },
    })
  }

  // --- Bookings ---
  const bookings = rows('Booking')
  console.log(`Bookings: ${bookings.length}`)
  for (const b of bookings) {
    await prisma.booking.upsert({
      where: { id: Number(b.id) },
      update: {},
      create: {
        id: Number(b.id),
        clientId: b.clientId ? Number(b.clientId) : null,
        room: String(b.room),
        startTime: maybeDate(b.startTime),
        endTime: maybeDate(b.endTime),
        sessionType: b.sessionType ? String(b.sessionType) : null,
        status: b.status ? String(b.status) : 'confirmed',
        notes: b.notes ? String(b.notes) : null,
        googleEventId: b.googleEventId ? String(b.googleEventId) : null,
        batchId: b.batchId ? Number(b.batchId) : null,
        createdAt: maybeDate(b.createdAt) ?? new Date(),
      },
    })
  }

  // --- Absences ---
  const absences = rows('Absence')
  console.log(`Absences: ${absences.length}`)
  for (const a of absences) {
    await prisma.absence.upsert({
      where: { id: Number(a.id) },
      update: {},
      create: {
        id: Number(a.id),
        clientId: Number(a.clientId),
        bookingId: Number(a.bookingId),
        createdAt: maybeDate(a.createdAt) ?? new Date(),
      },
    })
  }

  // --- FacultyAttendance ---
  const attendance = rows('FacultyAttendance')
  console.log(`FacultyAttendance: ${attendance.length}`)
  for (const a of attendance) {
    await prisma.facultyAttendance.upsert({
      where: { id: Number(a.id) },
      update: {},
      create: {
        id: Number(a.id),
        facultyId: Number(a.facultyId),
        bookingId: Number(a.bookingId),
        present: a.present !== undefined ? Boolean(a.present) : true,
        createdAt: maybeDate(a.createdAt) ?? new Date(),
      },
    })
  }

  // --- Enrollments ---
  const enrollments = rows('Enrollment')
  console.log(`Enrollments: ${enrollments.length}`)
  for (const e of enrollments) {
    await prisma.enrollment.upsert({
      where: { id: Number(e.id) },
      update: {},
      create: {
        id: Number(e.id),
        clientId: Number(e.clientId),
        courseId: Number(e.courseId),
        totalFee: Number(e.totalFee),
        discount: Number(e.discount ?? 0),
        enrolledOn: maybeDate(e.enrolledOn) ?? new Date(),
        status: e.status ? String(e.status) : 'active',
      },
    })
  }

  // --- FeePayments ---
  const payments = rows('FeePayment')
  console.log(`FeePayments: ${payments.length}`)
  for (const p of payments) {
    await prisma.feePayment.upsert({
      where: { id: Number(p.id) },
      update: {},
      create: {
        id: Number(p.id),
        enrollmentId: Number(p.enrollmentId),
        amount: Number(p.amount),
        paymentDate: maybeDate(p.paymentDate) ?? new Date(),
        paymentMethod: String(p.paymentMethod),
        reference: p.reference ? String(p.reference) : null,
        notes: p.notes ? String(p.notes) : null,
      },
    })
  }

  // Reset sequences so new inserts don't collide with migrated IDs
  console.log('\nResetting sequences…')
  const tables = ['Client', 'Faculty', 'Course', 'Batch', 'BatchEnrolment',
    'Booking', 'Absence', 'FacultyAttendance', 'Enrollment', 'FeePayment']
  for (const table of tables) {
    try {
      await prisma.$executeRawUnsafe(
        `SELECT setval(pg_get_serial_sequence('"${table}"', 'id'), COALESCE((SELECT MAX(id) FROM "${table}"), 1))`
      )
    } catch (e) {
      console.warn(`  skipped sequence reset for ${table}: ${e.message}`)
    }
  }

  console.log('\nDone.')
  await prisma.$disconnect()
  sqlite.close()
}

main().catch(async (e) => {
  console.error(e)
  await prisma.$disconnect()
  process.exit(1)
})
