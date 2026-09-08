import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const MIGRATION_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS "Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "Lesson" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "grade" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS "LessonEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "tasks" TEXT NOT NULL DEFAULT '',
    "studentId" INTEGER NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LessonEntry_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
  )`,
  `CREATE TABLE IF NOT EXISTS "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "pricePerLesson" INTEGER NOT NULL DEFAULT 1200,
    "maxTaskNumber" INTEGER NOT NULL DEFAULT 20,
    "adminLogin" TEXT NOT NULL DEFAULT 'admin',
    "adminPasswordHash" TEXT NOT NULL,
    "parentLogin" TEXT NOT NULL DEFAULT 'math',
    "parentPasswordHash" TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS "Student_grade_deletedAt_idx" ON "Student"("grade", "deletedAt")`,
  `CREATE INDEX IF NOT EXISTS "Lesson_grade_deletedAt_idx" ON "Lesson"("grade", "deletedAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Lesson_date_grade_key" ON "Lesson"("date", "grade")`,
  `CREATE INDEX IF NOT EXISTS "LessonEntry_deletedAt_idx" ON "LessonEntry"("deletedAt")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "LessonEntry_studentId_lessonId_key" ON "LessonEntry"("studentId", "lessonId")`,
];

let bootstrapped: Promise<void> | null = null;

export function ensureDb(): Promise<void> {
  if (!bootstrapped) {
    bootstrapped = bootstrap();
  }
  return bootstrapped;
}

async function bootstrap(): Promise<void> {
  for (const sql of MIGRATION_STATEMENTS) {
    await prisma.$executeRawUnsafe(sql);
  }

  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (existing) return;

  const adminHash = await bcrypt.hash("admin", 10);
  const parentHash = await bcrypt.hash("math14", 10);
  await prisma.settings.create({
    data: {
      id: 1,
      pricePerLesson: 1200,
      maxTaskNumber: 20,
      adminLogin: "admin",
      adminPasswordHash: adminHash,
      parentLogin: "math",
      parentPasswordHash: parentHash,
    },
  });
}
