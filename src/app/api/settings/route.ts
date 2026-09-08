import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdmin, requireAuth } from "@/lib/auth";

export async function GET() {
  try {
    await requireAuth();
    const settings = await prisma.settings.findFirst();
    if (!settings) {
      return NextResponse.json({ error: "Settings not found" }, { status: 404 });
    }
    return NextResponse.json({
      pricePerLesson: settings.pricePerLesson,
      maxTaskNumber: settings.maxTaskNumber,
      adminLogin: settings.adminLogin,
      parentLogin: settings.parentLogin,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}

export async function PUT(request: Request) {
  try {
    await requireAdmin();
    const body = await request.json();
    const { hashPassword } = await import("@/lib/auth");

    const data: Record<string, unknown> = {};
    if (body.pricePerLesson !== undefined) data.pricePerLesson = body.pricePerLesson;
    if (body.maxTaskNumber !== undefined) data.maxTaskNumber = body.maxTaskNumber;
    if (body.adminLogin) data.adminLogin = body.adminLogin;
    if (body.parentLogin) data.parentLogin = body.parentLogin;
    if (body.adminPassword) data.adminPasswordHash = await hashPassword(body.adminPassword);
    if (body.parentPassword) data.parentPasswordHash = await hashPassword(body.parentPassword);

    const settings = await prisma.settings.update({
      where: { id: 1 },
      data,
    });

    return NextResponse.json({
      pricePerLesson: settings.pricePerLesson,
      maxTaskNumber: settings.maxTaskNumber,
      adminLogin: settings.adminLogin,
      parentLogin: settings.parentLogin,
    });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
