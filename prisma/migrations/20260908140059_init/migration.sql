-- CreateTable
CREATE TABLE "Student" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "fullName" TEXT NOT NULL,
    "grade" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Lesson" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "date" DATETIME NOT NULL,
    "grade" INTEGER NOT NULL,
    "note" TEXT NOT NULL DEFAULT '',
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "LessonEntry" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "present" BOOLEAN NOT NULL DEFAULT true,
    "tasks" TEXT NOT NULL DEFAULT '',
    "studentId" INTEGER NOT NULL,
    "lessonId" INTEGER NOT NULL,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "LessonEntry_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "LessonEntry_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "Lesson" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "pricePerLesson" INTEGER NOT NULL DEFAULT 1200,
    "maxTaskNumber" INTEGER NOT NULL DEFAULT 20,
    "adminLogin" TEXT NOT NULL DEFAULT 'admin',
    "adminPasswordHash" TEXT NOT NULL,
    "parentLogin" TEXT NOT NULL DEFAULT 'math',
    "parentPasswordHash" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Student_grade_deletedAt_idx" ON "Student"("grade", "deletedAt");

-- CreateIndex
CREATE INDEX "Lesson_grade_deletedAt_idx" ON "Lesson"("grade", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Lesson_date_grade_key" ON "Lesson"("date", "grade");

-- CreateIndex
CREATE INDEX "LessonEntry_deletedAt_idx" ON "LessonEntry"("deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "LessonEntry_studentId_lessonId_key" ON "LessonEntry"("studentId", "lessonId");
