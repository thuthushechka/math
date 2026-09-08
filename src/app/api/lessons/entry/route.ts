import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { restoreData, softDeleteData } from "@/lib/soft-delete";

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const { entryId, present, tasks } = await request.json();

    const entry = await prisma.lessonEntry.update({
      where: { id: entryId },
      data: { present, tasks },
    });

    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await requireAdmin();
    const { lessonId, action } = await request.json();

    if (action === "restore") {
      await prisma.lessonEntry.updateMany({
        where: { lessonId },
        data: restoreData(),
      });
      const lesson = await prisma.lesson.update({
        where: { id: lessonId },
        data: restoreData(),
      });
      return NextResponse.json(lesson);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await requireAdmin();
    const { entryId } = await request.json();
    if (!entryId) {
      return NextResponse.json({ error: "entryId required" }, { status: 400 });
    }

    const entry = await prisma.lessonEntry.update({
      where: { id: entryId },
      data: softDeleteData(),
    });

    return NextResponse.json(entry);
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
