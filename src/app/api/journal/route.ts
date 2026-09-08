import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth, requireAdmin, assertJournalAccess } from "@/lib/auth";
import { getJournalData } from "@/lib/journal";
import { notDeleted } from "@/lib/soft-delete";
import { softDeleteData } from "@/lib/soft-delete";

export async function GET(request: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(request.url);
    const grade = parseInt(searchParams.get("grade") ?? "0", 10);
    if (!grade || grade < 4 || grade > 7) {
      return NextResponse.json({ error: "Invalid grade" }, { status: 400 });
    }

    assertJournalAccess(session, grade);

    const data = await getJournalData(grade);
    return NextResponse.json(data);
  } catch (e) {
    if (e instanceof Error && e.message === "Forbidden") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(request.url);
    const grade = parseInt(searchParams.get("grade") ?? "0", 10);
    if (!grade || grade < 4 || grade > 7) {
      return NextResponse.json({ error: "Invalid grade" }, { status: 400 });
    }

    const students = await prisma.student.findMany({
      where: { grade, ...notDeleted },
      select: { id: true },
    });
    const studentIds = students.map((s) => s.id);

    const lessons = await prisma.lesson.findMany({
      where: { grade, ...notDeleted },
      select: { id: true },
    });
    const lessonIds = lessons.map((l) => l.id);

    if (studentIds.length > 0) {
      await prisma.lessonEntry.updateMany({
        where: { studentId: { in: studentIds } },
        data: softDeleteData(),
      });
      await prisma.student.updateMany({
        where: { id: { in: studentIds } },
        data: softDeleteData(),
      });
    }

    if (lessonIds.length > 0) {
      await prisma.lessonEntry.updateMany({
        where: { lessonId: { in: lessonIds } },
        data: softDeleteData(),
      });
      await prisma.lesson.updateMany({
        where: { id: { in: lessonIds } },
        data: softDeleteData(),
      });
    }

    return NextResponse.json({
      ok: true,
      deletedLessons: lessonIds.length,
      deletedStudents: studentIds.length,
    });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
