import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { restoreData } from "@/lib/soft-delete";

export async function GET() {
  try {
    await requireAdmin();

    const [students, lessons, entries] = await Promise.all([
      prisma.student.findMany({ where: { deletedAt: { not: null } } }),
      prisma.lesson.findMany({ where: { deletedAt: { not: null } } }),
      prisma.lessonEntry.findMany({
        where: { deletedAt: { not: null } },
        include: { student: true, lesson: true },
      }),
    ]);

    return NextResponse.json({ students, lessons, entries });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function POST(request: Request) {
  try {
    await requireAdmin();
    const { type, id } = await request.json();

    if (type === "student") {
      const item = await prisma.student.update({
        where: { id },
        data: restoreData(),
      });
      return NextResponse.json(item);
    }
    if (type === "lesson") {
      await prisma.lessonEntry.updateMany({
        where: { lessonId: id },
        data: restoreData(),
      });
      const item = await prisma.lesson.update({
        where: { id },
        data: restoreData(),
      });
      return NextResponse.json(item);
    }
    if (type === "entry") {
      const item = await prisma.lessonEntry.update({
        where: { id },
        data: restoreData(),
      });
      return NextResponse.json(item);
    }

    return NextResponse.json({ error: "Unknown type" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
