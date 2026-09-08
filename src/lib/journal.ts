import { prisma } from "./db";
import { notDeleted } from "./soft-delete";
import { sortStudents } from "./name-matcher";
import { toDateKey } from "./dates";
import type { JournalData } from "./types";

export async function getJournalData(grade: number): Promise<JournalData> {
  const settings = await prisma.settings.findFirst();
  const pricePerLesson = settings?.pricePerLesson ?? 1200;
  const maxTaskNumber = settings?.maxTaskNumber ?? 20;

  const studentsRaw = await prisma.student.findMany({
    where: { grade, ...notDeleted, active: true },
  });

  const lessonsRaw = await prisma.lesson.findMany({
    where: { grade, ...notDeleted },
    orderBy: { date: "asc" },
  });

  const lessonIds = lessonsRaw.map((l) => l.id);

  const entriesRaw =
    lessonIds.length > 0
      ? await prisma.lessonEntry.findMany({
          where: {
            ...notDeleted,
            lessonId: { in: lessonIds },
          },
        })
      : [];

  const allStudents = sortStudents(studentsRaw);

  return {
    grade,
    pricePerLesson,
    maxTaskNumber,
    students: allStudents.map((s) => ({ id: s.id, fullName: s.fullName })),
    lessons: lessonsRaw.map((l) => ({
      id: l.id,
      date: toDateKey(l.date),
      grade: l.grade,
    })),
    entries: entriesRaw.map((e) => ({
      id: e.id,
      studentId: e.studentId,
      lessonId: e.lessonId,
      present: e.present,
      tasks: e.tasks,
    })),
  };
}

export function getEntry(
  data: JournalData,
  studentId: number,
  lessonId: number
) {
  return data.entries.find(
    (e) => e.studentId === studentId && e.lessonId === lessonId
  );
}

export function countPresent(
  data: JournalData,
  studentId: number,
  lessonIds: number[]
): number {
  return lessonIds.reduce((sum, lid) => {
    const e = getEntry(data, studentId, lid);
    return sum + (e?.present ? 1 : 0);
  }, 0);
}
