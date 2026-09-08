import { NextResponse } from "next/server";
import { verifyLogin, createSession } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { login, password } = await request.json();
    if (!login || !password) {
      return NextResponse.json({ error: "Введите логин и пароль" }, { status: 400 });
    }

    const session = await verifyLogin(login, password);
    if (!session) {
      return NextResponse.json({ error: "Неверный логин или пароль" }, { status: 401 });
    }

    await createSession(session);
    return NextResponse.json({
      role: session.role,
      redirect: session.role === "admin" ? "/admin" : "/parent",
    });
  } catch {
    return NextResponse.json({ error: "Ошибка входа" }, { status: 500 });
  }
}
