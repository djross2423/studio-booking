-- CreateIndex
CREATE INDEX "Absence_bookingId_idx" ON "Absence"("bookingId");

-- CreateIndex
CREATE INDEX "Batch_status_idx" ON "Batch"("status");

-- CreateIndex
CREATE INDEX "Batch_courseId_idx" ON "Batch"("courseId");

-- CreateIndex
CREATE INDEX "Batch_facultyId_idx" ON "Batch"("facultyId");

-- CreateIndex
CREATE INDEX "BatchEnrolment_batchId_idx" ON "BatchEnrolment"("batchId");

-- CreateIndex
CREATE INDEX "BatchEnrolment_clientId_idx" ON "BatchEnrolment"("clientId");

-- CreateIndex
CREATE INDEX "Booking_room_startTime_endTime_idx" ON "Booking"("room", "startTime", "endTime");

-- CreateIndex
CREATE INDEX "Booking_startTime_idx" ON "Booking"("startTime");

-- CreateIndex
CREATE INDEX "Booking_status_idx" ON "Booking"("status");

-- CreateIndex
CREATE INDEX "Booking_clientId_idx" ON "Booking"("clientId");

-- CreateIndex
CREATE INDEX "Booking_batchId_idx" ON "Booking"("batchId");

-- CreateIndex
CREATE INDEX "Enrollment_clientId_idx" ON "Enrollment"("clientId");

-- CreateIndex
CREATE INDEX "Enrollment_courseId_idx" ON "Enrollment"("courseId");

-- CreateIndex
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

-- CreateIndex
CREATE INDEX "FacultyAttendance_bookingId_idx" ON "FacultyAttendance"("bookingId");

-- CreateIndex
CREATE INDEX "FeePayment_enrollmentId_idx" ON "FeePayment"("enrollmentId");
