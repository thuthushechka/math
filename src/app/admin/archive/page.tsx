"use client";

import { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";
import { parseDateKey, toDateKey } from "@/lib/dates";

interface ArchiveData {
  students: { id: number; fullName: string; grade: number; deletedAt: string }[];
  lessons: { id: number; date: string; grade: number; deletedAt: string }[];
  entries: {
    id: number;
    deletedAt: string;
    student: { fullName: string };
    lesson: { date: string; grade: number };
  }[];
}

function formatDeletedAt(value: string) {
  const d = new Date(value);
  return d.toLocaleDateString("ru", { day: "2-digit", month: "2-digit", year: "2-digit" });
}

function formatLessonDate(value: string) {
  const key = value.includes("T") ? toDateKey(new Date(value)) : value.slice(0, 10);
  return parseDateKey(key).toLocaleDateString("ru", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function ArchivePage() {
  const [data, setData] = useState<ArchiveData | null>(null);

  const load = () => {
    fetch("/api/archive")
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  };

  useEffect(() => {
    load();
  }, []);

  const restore = async (type: string, id: number) => {
    await fetch("/api/archive", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, id }),
    });
    load();
  };

  const total =
    (data?.students.length ?? 0) + (data?.lessons.length ?? 0) + (data?.entries.length ?? 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <AdminNav current="/admin/archive" />
      <div className="mb-4 flex items-baseline justify-between gap-2">
        <h1 className="text-2xl font-bold">Архив</h1>
        {data && <span className="text-xs text-zinc-500">{total} записей</span>}
      </div>

      {!data ? (
        <p className="text-sm text-zinc-500">Загрузка…</p>
      ) : (
        <div className="space-y-4">
          <section>
            <h2 className="mb-1 text-sm font-semibold">Ученики ({data.students.length})</h2>
            <div className="overflow-x-auto rounded-lg border dark:border-zinc-700">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500">
                    <th className="px-2 py-1 text-left">ФИО</th>
                    <th className="px-2 py-1 text-left w-14">Кл.</th>
                    <th className="px-2 py-1 text-left w-20">Удалён</th>
                    <th className="w-24 px-1 py-1" />
                  </tr>
                </thead>
                <tbody>
                  {data.students.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 py-2 text-zinc-400">Пусто</td>
                    </tr>
                  ) : (
                    data.students.map((s) => (
                      <tr key={s.id} className="border-b last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-2 py-0.5">{s.fullName}</td>
                        <td className="px-2 py-0.5">{s.grade}</td>
                        <td className="px-2 py-0.5 text-zinc-500">{formatDeletedAt(s.deletedAt)}</td>
                        <td className="px-1 py-0.5 text-right">
                          <button
                            onClick={() => restore("student", s.id)}
                            className="text-emerald-600 hover:underline"
                          >
                            Восстановить
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="mb-1 text-sm font-semibold">Уроки ({data.lessons.length})</h2>
            <div className="overflow-x-auto rounded-lg border dark:border-zinc-700">
              <table className="w-full border-collapse text-xs">
                <thead>
                  <tr className="border-b bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500">
                    <th className="px-2 py-1 text-left">Дата</th>
                    <th className="px-2 py-1 text-left w-14">Кл.</th>
                    <th className="px-2 py-1 text-left w-20">Удалён</th>
                    <th className="w-24 px-1 py-1" />
                  </tr>
                </thead>
                <tbody>
                  {data.lessons.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-2 py-2 text-zinc-400">Пусто</td>
                    </tr>
                  ) : (
                    data.lessons.map((l) => (
                      <tr key={l.id} className="border-b last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-2 py-0.5">{formatLessonDate(l.date)}</td>
                        <td className="px-2 py-0.5">{l.grade}</td>
                        <td className="px-2 py-0.5 text-zinc-500">{formatDeletedAt(l.deletedAt)}</td>
                        <td className="px-1 py-0.5 text-right">
                          <button
                            onClick={() => restore("lesson", l.id)}
                            className="text-emerald-600 hover:underline"
                          >
                            Восстановить
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {data.entries.length > 0 && (
            <section>
              <h2 className="mb-1 text-sm font-semibold">Записи посещений ({data.entries.length})</h2>
              <div className="overflow-x-auto rounded-lg border dark:border-zinc-700">
                <table className="w-full border-collapse text-xs">
                  <thead>
                    <tr className="border-b bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500">
                      <th className="px-2 py-1 text-left">Ученик</th>
                      <th className="px-2 py-1 text-left">Урок</th>
                      <th className="px-2 py-1 text-left w-20">Удалён</th>
                      <th className="w-24 px-1 py-1" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.map((e) => (
                      <tr key={e.id} className="border-b last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                        <td className="px-2 py-0.5">{e.student.fullName}</td>
                        <td className="px-2 py-0.5">
                          {formatLessonDate(e.lesson.date)}, {e.lesson.grade} кл.
                        </td>
                        <td className="px-2 py-0.5 text-zinc-500">{formatDeletedAt(e.deletedAt)}</td>
                        <td className="px-1 py-0.5 text-right">
                          <button
                            onClick={() => restore("entry", e.id)}
                            className="text-emerald-600 hover:underline"
                          >
                            Восстановить
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
