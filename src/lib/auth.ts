import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { GRADES, type Grade } from "./format";

export type SessionRole = "admin" | "parent";

export interface Session {
  role: SessionRole;
  login: string;
  grade?: Grade;
}

const COOKIE_NAME = "math-club-session";

export function parentGradeFromPassword(password: string): Grade | null {
  const match = password.match(/^math([4-7])$/);
  if (!match) return null;
  const grade = parseInt(match[1], 10) as Grade;
  return GRADES.includes(grade) ? grade : null;
}

function getSecret() {
  return new TextEncoder().encode(
    process.env.SESSION_SECRET ?? "dev-secret-change-in-production"
  );
}

export async function createSession(session: Session): Promise<void> {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(getSecret());

  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      role: payload.role as SessionRole,
      login: payload.login as string,
      grade: payload.grade !== undefined ? (payload.grade as Grade) : undefined,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function verifyLogin(
  login: string,
  password: string
): Promise<Session | null> {
  const settings = await prisma.settings.findFirst();
  if (!settings) return null;

  if (login === settings.adminLogin) {
    const ok = await bcrypt.compare(password, settings.adminPasswordHash);
    if (ok) return { role: "admin", login };
  }

  if (login === settings.parentLogin) {
    const grade = parentGradeFromPassword(password);
    if (grade) return { role: "parent", login, grade };
  }

  return null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function requireAdmin(): Promise<Session> {
  const session = await getSession();
  if (!session || session.role !== "admin") {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function requireAuth(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export function assertJournalAccess(session: Session, grade: number): void {
  if (session.role === "parent") {
    if (!session.grade || session.grade !== grade) {
      throw new Error("Forbidden");
    }
  }
}
