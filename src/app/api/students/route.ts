import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth";
import { notDeleted, softDeleteData } from "@/lib/soft-delete";
import { sortStudents } from "@/lib/name-matcher";

export async function GET(request: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(request.url);
    const grade = parseInt(searchParams.get("grade") ?? "0", 10);
    const all = searchParams.get("all") === "true";

    const where: Record<string, unknown> = { ...notDeleted, active: true };
    if (!all && grade) where.grade = grade;

    const students = await prisma.student.findMany({
      where,
    });

    return NextResponse.json(sortStudents(students));
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { fullName, grade } = await request.json();
    if (!fullName || !grade) {
      return NextResponse.json({ error: "fullName and grade required" }, { status: 400 });
    }

    const student = await prisma.student.create({
      data: { fullName: fullName.trim(), grade },
    });

    return NextResponse.json(student);
  } catch {
    return NextResponse.json({ error: "Failed to create" }, { status: 500 });
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

    return NextResponse.json({ ok: true, deleted: studentIds.length });
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
