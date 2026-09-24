-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'NOTULIS', 'STAFF', 'VIEWER');

-- CreateEnum
CREATE TYPE "MeetingStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'FINAL');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('INVITED', 'PRESENT', 'ABSENT', 'EXCUSED');

-- CreateTable
CREATE TABLE "Biro" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "shortName" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Biro_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'STAFF',
    "biroId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Meeting" (
    "id" TEXT NOT NULL,
    "meetingNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "primaryBiroId" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "chairpersonId" TEXT,
    "secretaryId" TEXT,
    "status" "MeetingStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Meeting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MeetingBiro" (
    "meetingId" TEXT NOT NULL,
    "biroId" TEXT NOT NULL,

    CONSTRAINT "MeetingBiro_pkey" PRIMARY KEY ("meetingId","biroId")
);

-- CreateTable
CREATE TABLE "MeetingParticipant" (
    "id" TEXT NOT NULL,
    "meetingId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "attendanceStatus" "AttendanceStatus" NOT NULL DEFAULT 'INVITED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MeetingParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BiroMeetingSequence" (
    "id" TEXT NOT NULL,
    "biroId" TEXT NOT NULL,
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BiroMeetingSequence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Biro_code_key" ON "Biro"("code");

-- CreateIndex
CREATE INDEX "Biro_code_idx" ON "Biro"("code");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_biroId_idx" ON "User"("biroId");

-- CreateIndex
CREATE UNIQUE INDEX "Meeting_meetingNumber_key" ON "Meeting"("meetingNumber");

-- CreateIndex
CREATE INDEX "Meeting_meetingNumber_idx" ON "Meeting"("meetingNumber");

-- CreateIndex
CREATE INDEX "Meeting_primaryBiroId_idx" ON "Meeting"("primaryBiroId");

-- CreateIndex
CREATE INDEX "Meeting_date_idx" ON "Meeting"("date");

-- CreateIndex
CREATE INDEX "Meeting_status_idx" ON "Meeting"("status");

-- CreateIndex
CREATE INDEX "Meeting_createdAt_idx" ON "Meeting"("createdAt");

-- CreateIndex
CREATE INDEX "MeetingBiro_meetingId_idx" ON "MeetingBiro"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingBiro_biroId_idx" ON "MeetingBiro"("biroId");

-- CreateIndex
CREATE INDEX "MeetingParticipant_meetingId_idx" ON "MeetingParticipant"("meetingId");

-- CreateIndex
CREATE INDEX "MeetingParticipant_userId_idx" ON "MeetingParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "MeetingParticipant_meetingId_userId_key" ON "MeetingParticipant"("meetingId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "BiroMeetingSequence_biroId_key" ON "BiroMeetingSequence"("biroId");

-- CreateIndex
CREATE INDEX "BiroMeetingSequence_biroId_idx" ON "BiroMeetingSequence"("biroId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_biroId_fkey" FOREIGN KEY ("biroId") REFERENCES "Biro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_primaryBiroId_fkey" FOREIGN KEY ("primaryBiroId") REFERENCES "Biro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_chairpersonId_fkey" FOREIGN KEY ("chairpersonId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Meeting" ADD CONSTRAINT "Meeting_secretaryId_fkey" FOREIGN KEY ("secretaryId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingBiro" ADD CONSTRAINT "MeetingBiro_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingBiro" ADD CONSTRAINT "MeetingBiro_biroId_fkey" FOREIGN KEY ("biroId") REFERENCES "Biro"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MeetingParticipant" ADD CONSTRAINT "MeetingParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BiroMeetingSequence" ADD CONSTRAINT "BiroMeetingSequence_biroId_fkey" FOREIGN KEY ("biroId") REFERENCES "Biro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
