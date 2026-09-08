"use client";

import type { JournalData } from "@/lib/types";
import { formatTasksDisplay } from "@/lib/task-digits";
import { formatDateFull } from "@/lib/dates";
import { parseDateKey } from "@/lib/dates";
import { TrashIcon } from "./TrashIcon";

interface DayTasksModalProps {
  open: boolean;
  date: string | null;
  lessonId: number | null;
  data: JournalData;
  onClose: () => void;
  adminMode?: boolean;
  onDeleteEntry?: (entryId: number) => void;
  onLessonDateChange?: (lessonId: number, oldDate: string, newDate: string) => void;
}

export function DayTasksModal({
  open,
  date,
  lessonId,
  data,
  onClose,
  adminMode = false,
  onDeleteEntry,
  onLessonDateChange,
}: DayTasksModalProps) {
  if (!open || !date || !lessonId) return null;

  const presentEntries = data.entries
    .filter((e) => e.lessonId === lessonId && e.present)
    .map((e) => {
      const student = data.students.find((s) => s.id === e.studentId);
      return { ...e, fullName: student?.fullName ?? "?" };
    })
    .sort((a, b) => a.fullName.localeCompare(b.fullName, "ru"));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-4 shadow-xl dark:bg-zinc-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
          {adminMode && onLessonDateChange ? (
            <label className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-sm font-semibold">
              <span>Дата урока:</span>
              <input
                type="date"
                value={date}
                onChange={(e) => {
                  const next = e.target.value;
                  if (next && next !== date) onLessonDateChange(lessonId, date, next);
                }}
                className="rounded border px-2 py-2 sm:py-1 text-base sm:text-sm font-normal dark:border-zinc-600 dark:bg-zinc-800"
              />
            </label>
          ) : (
            <h3 className="text-base font-semibold">
              {formatDateFull(parseDateKey(date))}
            </h3>
          )}
          <button onClick={onClose} className="self-end sm:self-auto text-zinc-500 hover:text-zinc-800 text-xl p-1">
            ×
          </button>
        </div>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {presentEntries.length === 0 ? (
            <p className="text-sm text-zinc-500">Нет записей о посещении</p>
          ) : (
            presentEntries.map((e) => (
              <div
                key={e.id}
                className="flex justify-between items-center border-b border-zinc-100 dark:border-zinc-800 py-1.5 text-sm"
              >
                <span className="font-medium">{e.fullName}</span>
                <div className="flex items-center gap-2">
                  <span className="text-emerald-700 dark:text-emerald-400 font-mono text-xs">
                    {formatTasksDisplay(e.tasks, data.maxTaskNumber)}
                  </span>
                  {adminMode && onDeleteEntry && (
                    <button
                      onClick={() => onDeleteEntry(e.id)}
                      className="text-red-400 hover:text-red-600"
                      title="Удалить запись"
                    >
                      <TrashIcon className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
