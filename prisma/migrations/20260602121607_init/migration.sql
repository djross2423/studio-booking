-- CreateTable
CREATE TABLE "Client" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "notes" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Course" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "totalSessions" INTEGER NOT NULL,
    "sessionDuration" DOUBLE PRECISION NOT NULL,
    "fee" DOUBLE PRECISION NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6C3CE1',
    "description" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Course_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Batch" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "room" TEXT NOT NULL,
    "startTime" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "repeatDays" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6C3CE1',
    "status" TEXT NOT NULL DEFAULT 'active',
    "facultyId" INTEGER,
    "courseId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Batch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BatchEnrolment" (
    "id" SERIAL NOT NULL,
    "batchId" INTEGER NOT NULL,
    "clientId" INTEGER NOT NULL,

    CONSTRAINT "BatchEnrolment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Booking" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER,
    "room" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "sessionType" TEXT,
    "status" TEXT NOT NULL DEFAULT 'confirmed',
    "notes" TEXT,
    "googleEventId" TEXT,
    "batchId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Booking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Absence" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Absence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FacultyAttendance" (
    "id" SERIAL NOT NULL,
    "facultyId" INTEGER NOT NULL,
    "bookingId" INTEGER NOT NULL,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyAttendance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" SERIAL NOT NULL,
    "clientId" INTEGER NOT NULL,
    "courseId" INTEGER NOT NULL,
    "totalFee" DOUBLE PRECISION NOT NULL,
    "discount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "enrolledOn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'active',

    CONSTRAINT "Enrollment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FeePayment" (
    "id" SERIAL NOT NULL,
    "enrollmentId" INTEGER NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" TEXT NOT NULL,
    "reference" TEXT,
    "notes" TEXT,

    CONSTRAINT "FeePayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Absence_clientId_bookingId_key" ON "Absence"("clientId", "bookingId");

-- CreateIndex
CREATE UNIQUE INDEX "FacultyAttendance_facultyId_bookingId_key" ON "FacultyAttendance"("facultyId", "bookingId");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchEnrolment" ADD CONSTRAINT "BatchEnrolment_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchEnrolment" ADD CONSTRAINT "BatchEnrolment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Absence" ADD CONSTRAINT "Absence_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyAttendance" ADD CONSTRAINT "FacultyAttendance_facultyId_fkey" FOREIGN KEY ("facultyId") REFERENCES "Faculty"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FacultyAttendance" ADD CONSTRAINT "FacultyAttendance_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeePayment" ADD CONSTRAINT "FeePayment_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "Enrollment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
