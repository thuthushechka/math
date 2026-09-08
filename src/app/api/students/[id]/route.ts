import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { softDeleteData, restoreData } from "@/lib/soft-delete";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    const student = await prisma.student.update({
      where: { id: parseInt(id, 10) },
      data: {
        fullName: body.fullName?.trim(),
        grade: body.grade,
        active: body.active,
      },
    });

    return NextResponse.json(student);
  } catch {
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const studentId = parseInt(id, 10);
    await prisma.lessonEntry.updateMany({
      where: { studentId },
      data: softDeleteData(),
    });
    const student = await prisma.student.update({
      where: { id: studentId },
      data: softDeleteData(),
    });

    return NextResponse.json(student);
  } catch {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const { action } = await request.json();

    if (action === "restore") {
      const student = await prisma.student.update({
        where: { id: parseInt(id, 10) },
        data: restoreData(),
      });
      return NextResponse.json(student);
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
