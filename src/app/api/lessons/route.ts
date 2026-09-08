import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { notDeleted } from "@/lib/soft-delete";
import { tasksToString, tasksFromString } from "@/lib/task-digits";
import { matchStudent, sortStudents } from "@/lib/name-matcher";
import {
  dayBoundsFromKey,
  isDateKeyAfterToday,
  lessonDateFromKey,
  toDateKey,
} from "@/lib/dates";

export async function GET(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const grade = parseInt(searchParams.get("grade") ?? "0", 10);
    const dateParam = searchParams.get("date");
    if (!grade || grade < 4 || grade > 7) {
      return NextResponse.json({ error: "Invalid grade" }, { status: 400 });
    }

    const settings = await prisma.settings.findFirst();
    const maxTask = settings?.maxTaskNumber ?? 20;

    const allStudents = await prisma.student.findMany({
      where: { grade, ...notDeleted, active: true },
    });

    let lessonForDate = null;
    if (dateParam) {
      const { start, end } = dayBoundsFromKey(dateParam);
      lessonForDate = await prisma.lesson.findFirst({
        where: {
          grade,
          date: { gte: start, lte: end },
          ...notDeleted,
        },
        include: {
          entries: {
            where: notDeleted,
          },
        },
      });
    }

    const rows = sortStudents(allStudents).map((student) => {
      const entry = lessonForDate?.entries.find((e) => e.studentId === student.id);
      return {
        fullName: student.fullName,
        studentId: student.id,
        tasks: entry ? tasksFromString(entry.tasks, maxTask) : [],
        present: entry?.present ?? false,
      };
    });

    return NextResponse.json({
      rows,
      lessonDate: lessonForDate?.date ?? null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { grade, date, entries, undoToken } = body;

    if (!grade || !date || !entries?.length) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const lessonDate = lessonDateFromKey(date);
    const { start, end } = dayBoundsFromKey(date);

    const existingStudents = await prisma.student.findMany({
      where: { grade, ...notDeleted, active: true },
    });

    const usedIds = new Set<number>();

    const existingLesson = await prisma.lesson.findFirst({
      where: { grade, date: { gte: start, lte: end } },
    });

    const lesson = existingLesson
      ? await prisma.lesson.update({
          where: { id: existingLesson.id },
          data: { date: lessonDate, deletedAt: null },
        })
      : await prisma.lesson.create({
          data: { date: lessonDate, grade },
        });

    const savedEntries = [];

    for (const entry of entries) {
      let studentId = entry.studentId;

      if (!studentId && entry.fullName) {
        const match = matchStudent(entry.fullName, existingStudents, usedIds);
        if (match.studentId) {
          studentId = match.studentId;
        } else {
          const newStudent = await prisma.student.create({
            data: { fullName: entry.fullName, grade },
          });
          studentId = newStudent.id;
          existingStudents.push(newStudent);
        }
      }

      if (!studentId) continue;
      usedIds.add(studentId);

      const tasks =
        typeof entry.tasks === "string"
          ? entry.tasks
          : tasksToString(entry.tasks ?? []);

      const lessonEntry = await prisma.lessonEntry.upsert({
        where: {
          studentId_lessonId: { studentId, lessonId: lesson.id },
        },
        create: {
          studentId,
          lessonId: lesson.id,
          present: entry.present ?? true,
          tasks,
        },
        update: {
          present: entry.present ?? true,
          tasks,
          deletedAt: null,
        },
      });

      savedEntries.push(lessonEntry);
    }

    return NextResponse.json({
      lesson,
      entries: savedEntries,
      undoToken: undoToken ?? `lesson-${lesson.id}-${Date.now()}`,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to save lesson" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const { lessonId, date } = await request.json();

    if (!lessonId || !date) {
      return NextResponse.json({ error: "lessonId and date required" }, { status: 400 });
    }

    if (isDateKeyAfterToday(date)) {
      return NextResponse.json(
        { error: "Нельзя выбрать дату позже сегодняшнего дня" },
        { status: 400 }
      );
    }

    const lesson = await prisma.lesson.findFirst({
      where: { id: lessonId, ...notDeleted },
    });
    if (!lesson) {
      return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
    }

    const lessonDate = lessonDateFromKey(date);
    const { start, end } = dayBoundsFromKey(date);

    const conflict = await prisma.lesson.findFirst({
      where: {
        grade: lesson.grade,
        id: { not: lessonId },
        date: { gte: start, lte: end },
        ...notDeleted,
      },
    });
    if (conflict) {
      return NextResponse.json(
        { error: "На эту дату уже есть урок для этого класса" },
        { status: 409 }
      );
    }

    const updated = await prisma.lesson.update({
      where: { id: lessonId },
      data: { date: lessonDate },
    });

    return NextResponse.json({
      lesson: updated,
      date: toDateKey(updated.date),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update lesson date" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { lessonId } = await request.json();
    if (!lessonId) {
      return NextResponse.json({ error: "lessonId required" }, { status: 400 });
    }

    const { softDeleteData } = await import("@/lib/soft-delete");
    await prisma.lessonEntry.updateMany({
      where: { lessonId },
      data: softDeleteData(),
    });
    await prisma.lesson.update({
      where: { id: lessonId },
      data: softDeleteData(),
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
