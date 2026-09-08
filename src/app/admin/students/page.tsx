"use client";

import { useState, useEffect, useCallback } from "react";
import { GRADES } from "@/lib/format";
import { AdminNav } from "@/components/AdminNav";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { TrashIcon } from "@/components/TrashIcon";

interface Student {
  id: number;
  fullName: string;
  grade: number;
  active: boolean;
}

type DeleteTarget =
  | { type: "student"; id: number; name: string }
  | { type: "grade"; grade: number };

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [newNames, setNewNames] = useState<Record<number, string>>({});
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  const load = useCallback(() => {
    fetch("/api/students?all=true")
      .then((r) => r.json())
      .then(setStudents)
      .catch(console.error);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const addStudent = async (grade: number) => {
    const name = newNames[grade]?.trim();
    if (!name) return;
    await fetch("/api/students", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: name, grade }),
    });
    setNewNames((prev) => ({ ...prev, [grade]: "" }));
    load();
  };

  const saveEdit = async (id: number) => {
    const student = students.find((s) => s.id === id);
    if (!student) return;
    await fetch(`/api/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: editName.trim(), grade: student.grade }),
    });
    setEditingId(null);
    load();
  };

  const changeGrade = async (id: number, newGrade: number) => {
    const student = students.find((s) => s.id === id);
    if (!student || student.grade === newGrade) return;
    await fetch(`/api/students/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fullName: student.fullName, grade: newGrade }),
    });
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.type === "student") {
      await fetch(`/api/students/${deleteTarget.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    } else {
      await fetch(`/api/students?grade=${deleteTarget.grade}`, { method: "DELETE" });
    }
    setDeleteTarget(null);
    load();
  };

  const deleteTitle =
    deleteTarget?.type === "grade"
      ? `Удалить всех учеников ${deleteTarget.grade} класса?`
      : "Удалить ученика?";

  const deleteMessage =
    deleteTarget?.type === "grade"
      ? `Будут удалены все ученики ${deleteTarget.grade} класса и их записи посещений.`
      : `Удалить ${deleteTarget?.name ?? ""} со всеми записями посещений и задачами?`;

  const renderEditName = (s: Student) => (
    <div className="flex items-center gap-2">
      <input
        value={editName}
        onChange={(e) => setEditName(e.target.value)}
        className="flex-1 rounded-lg border px-3 py-2 text-base md:text-sm dark:border-zinc-600 dark:bg-zinc-800"
        onKeyDown={(e) => {
          if (e.key === "Enter") saveEdit(s.id);
          if (e.key === "Escape") setEditingId(null);
        }}
        autoFocus
      />
      <button onClick={() => saveEdit(s.id)} className="text-emerald-600 text-lg px-1">
        ✓
      </button>
      <button onClick={() => setEditingId(null)} className="text-zinc-400 text-lg px-1">
        ×
      </button>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <AdminNav current="/admin/students" />
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Справочник учеников</h1>

      <div className="space-y-5 sm:space-y-4">
        {GRADES.map((g) => {
          const list = students.filter((s) => s.grade === g);
          return (
            <div key={g}>
              <h2 className="text-base sm:text-sm font-semibold mb-2">{g} класс ({list.length})</h2>

              <div className="mb-3 flex flex-col sm:flex-row gap-2">
                <input
                  value={newNames[g] ?? ""}
                  onChange={(e) =>
                    setNewNames((prev) => ({ ...prev, [g]: e.target.value }))
                  }
                  placeholder="Фамилия [И.]"
                  className="flex-1 rounded-lg border px-3 py-2.5 text-base sm:text-sm dark:border-zinc-600 dark:bg-zinc-800"
                  onKeyDown={(e) => e.key === "Enter" && addStudent(g)}
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => addStudent(g)}
                    className="flex-1 sm:flex-none rounded-lg bg-emerald-600 px-4 py-2.5 text-sm text-white hover:bg-emerald-700"
                  >
                    + Добавить
                  </button>
                  {list.length > 0 && (
                    <button
                      onClick={() => setDeleteTarget({ type: "grade", grade: g })}
                      className="flex items-center justify-center gap-1 rounded-lg border border-red-200 px-3 py-2.5 text-sm text-red-600 dark:border-red-900"
                    >
                      <TrashIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">Удалить всех</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="md:hidden space-y-2">
                {list.length === 0 ? (
                  <p className="text-sm text-zinc-400 py-2">Нет учеников</p>
                ) : (
                  list.map((s) => (
                    <div
                      key={s.id}
                      className="rounded-lg border dark:border-zinc-700 p-3 bg-white dark:bg-zinc-900"
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        {editingId === s.id ? (
                          <div className="flex-1">{renderEditName(s)}</div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(s.id);
                              setEditName(s.fullName);
                            }}
                            className="text-left text-base font-medium hover:text-emerald-700 flex-1"
                          >
                            {s.fullName}
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteTarget({ type: "student", id: s.id, name: s.fullName })}
                          className="p-2 text-red-400 hover:text-red-600 shrink-0"
                          title="Удалить"
                        >
                          <TrashIcon className="w-5 h-5" />
                        </button>
                      </div>
                      <label className="text-xs text-zinc-500 block mb-1">Класс</label>
                      <select
                        value={s.grade}
                        onChange={(e) => changeGrade(s.id, parseInt(e.target.value, 10))}
                        className="w-full rounded-lg border px-3 py-2.5 text-base dark:border-zinc-600 dark:bg-zinc-800"
                      >
                        {GRADES.map((gr) => (
                          <option key={gr} value={gr}>{gr} класс</option>
                        ))}
                      </select>
                    </div>
                  ))
                )}
              </div>

              <div className="hidden md:block overflow-x-auto rounded-lg border dark:border-zinc-700">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500">
                      <th className="px-3 py-2 text-left">ФИО</th>
                      <th className="px-3 py-2 text-left w-24">Класс</th>
                      <th className="w-10 px-2 py-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {list.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-3 text-zinc-400">
                          Нет учеников
                        </td>
                      </tr>
                    ) : (
                      list.map((s) => (
                        <tr key={s.id} className="border-b last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                          <td className="px-3 py-1.5">
                            {editingId === s.id ? (
                              renderEditName(s)
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingId(s.id);
                                  setEditName(s.fullName);
                                }}
                                className="text-left hover:text-emerald-700"
                              >
                                {s.fullName}
                              </button>
                            )}
                          </td>
                          <td className="px-3 py-1.5">
                            <select
                              value={s.grade}
                              onChange={(e) => changeGrade(s.id, parseInt(e.target.value, 10))}
                              className="rounded border px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                            >
                              {GRADES.map((gr) => (
                                <option key={gr} value={gr}>{gr}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-2 py-1.5 text-center">
                            <button
                              onClick={() => setDeleteTarget({ type: "student", id: s.id, name: s.fullName })}
                              className="p-1 text-red-400 hover:text-red-600"
                              title="Удалить"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          );
        })}
      </div>

      <ConfirmDelete
        open={deleteTarget !== null}
        title={deleteTitle}
        message={deleteMessage}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
