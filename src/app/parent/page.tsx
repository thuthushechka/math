"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { Grade } from "@/lib/format";
import type { JournalData } from "@/lib/types";
import { JournalTable } from "@/components/JournalTable";

export default function ParentPage() {
  const [grade, setGrade] = useState<Grade | null>(null);
  const [data, setData] = useState<JournalData | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => {
        if (!r.ok) throw new Error("unauthorized");
        return r.json();
      })
      .then((session) => {
        if (session.role === "parent" && session.grade) {
          setGrade(session.grade as Grade);
        }
      })
      .catch(() => router.push("/login"))
      .finally(() => setLoading(false));
  }, [router]);

  const load = useCallback(() => {
    if (!grade) return;
    fetch(`/api/journal?grade=${grade}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [grade]);

  useEffect(() => {
    load();
  }, [load]);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-zinc-500">Загрузка…</p>
      </div>
    );
  }

  if (!grade) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center">
        <p className="text-zinc-600 mb-4">Не удалось определить класс. Войдите с паролем math4, math5, math6 или math7.</p>
        <button onClick={logout} className="text-sm text-emerald-700 hover:underline">
          Выйти
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold">Журнал — {grade} класс</h1>
        <button onClick={logout} className="text-sm text-zinc-500 hover:underline shrink-0">
          Выйти
        </button>
      </div>

      {data && <JournalTable data={data} defaultMode="default" showTotals={false} />}
    </div>
  );
}
