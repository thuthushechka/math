"use client";

import { useState } from "react";
import type { ReviewRow } from "@/lib/types";
import type { StudentRef } from "@/lib/name-matcher";
import { TaskButtonGrid, tasksArrayToString } from "./TaskButtonGrid";
import { tasksFromString } from "@/lib/task-digits";

interface ReviewScreenProps {
  rows: ReviewRow[];
  students: StudentRef[];
  maxTask: number;
  date: string;
  onDateChange: (date: string) => void;
  onRowsChange: (rows: ReviewRow[]) => void;
  onSave: () => void;
  onCancel: () => void;
  saving?: boolean;
}

export function ReviewScreen({
  rows,
  students,
  maxTask,
  date,
  onDateChange,
  onRowsChange,
  onSave,
  onCancel,
  saving,
}: ReviewScreenProps) {
  const updateRow = (index: number, patch: Partial<ReviewRow>) => {
    const next = [...rows];
    next[index] = { ...next[index], ...patch };
    onRowsChange(next);
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (!saving) onSave();
      }}
    >
      <div className="flex flex-wrap gap-4 items-center">
        <label className="text-sm">
          Дата урока:
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="ml-2 rounded-lg border px-3 py-1.5 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </label>
        <span className="text-sm text-zinc-500">{rows.length} учеников на доске</span>
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`rounded-lg border p-4 ${
              row.isFuzzy ? "border-amber-400 bg-amber-50 dark:bg-amber-950/30" : ""
            }`}
          >
            <div className="grid gap-3 sm:grid-cols-3 items-start">
              <div>
                <label className="text-xs text-zinc-500">С доски</label>
                <input
                  value={row.boardName}
                  onChange={(e) => updateRow(i, { boardName: e.target.value })}
                  className="w-full rounded-lg border px-2 py-1.5 mt-1 dark:border-zinc-600 dark:bg-zinc-800"
                />
              </div>
              <div>
                <label className="text-xs text-zinc-500">→ Ученик</label>
                <select
                  value={row.studentId ?? "new"}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "new") {
                      updateRow(i, { studentId: null, matchedName: null, isNew: true, isFuzzy: false });
                    } else {
                      const s = students.find((st) => st.id === parseInt(val, 10));
                      updateRow(i, {
                        studentId: parseInt(val, 10),
                        matchedName: s?.fullName ?? null,
                        isNew: false,
                        isFuzzy: false,
                      });
                    }
                  }}
                  className="w-full rounded-lg border px-2 py-1.5 mt-1 dark:border-zinc-600 dark:bg-zinc-800"
                >
                  <option value="new">+ Новый ученик</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>{s.fullName}</option>
                  ))}
                </select>
                {row.isFuzzy && row.matchedName && (
                  <p className="text-xs text-amber-700 mt-1">Сопоставлено с: {row.matchedName}</p>
                )}
              </div>
              <div>
                <label className="text-xs text-zinc-500">Задачи</label>
                <TaskButtonGrid
                  maxTask={maxTask}
                  selected={tasksFromString(row.tasks, maxTask)}
                  onChange={(tasks) => updateRow(i, { tasks: tasksArrayToString(tasks) })}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 justify-end">
        <button type="button" onClick={onCancel} className="rounded-lg px-4 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800">
          Отмена
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-emerald-600 px-6 py-2 text-white font-medium disabled:opacity-50 hover:bg-emerald-700"
        >
          {saving ? "Сохранение…" : "Сохранить урок"}
        </button>
      </div>
    </form>
  );
}
