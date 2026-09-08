import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { readFile } from "fs/promises";
import path from "path";

export async function GET() {
  try {
    await requireAdmin();

    const url = process.env.DATABASE_URL ?? "file:./dev.db";

    if (url.startsWith("libsql://") || url.startsWith("https://")) {
      return NextResponse.json({
        message:
          "Для Turso используйте CLI: turso db shell <db-name> .dump > backup.sql",
        turso: true,
      });
    }

    const dbPath = url.replace("file:", "");
    const resolved = path.isAbsolute(dbPath)
      ? dbPath
      : path.join(process.cwd(), "prisma", dbPath.replace(/^\.\//, ""));

    const buffer = await readFile(resolved);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename="math-club-backup-${new Date().toISOString().slice(0, 10)}.db"`,
      },
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Backup failed" }, { status: 500 });
  }
}
