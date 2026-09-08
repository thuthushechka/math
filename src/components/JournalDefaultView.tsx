"use client";

import type { JournalData } from "@/lib/types";
import { formatRubles } from "@/lib/format";
import { monthName } from "@/lib/dates";
import { parseDateKey, isPastOrToday } from "@/lib/dates";
import { getEntry, countPresent } from "@/lib/journal";
import { TrashIcon } from "./TrashIcon";
import { LessonDateHeader } from "./LessonDateHeader";

interface JournalDefaultViewProps {
  data: JournalData;
  prev: { year: number; month: number };
  current: { year: number; month: number };
  onCellClick: (lessonId: number, date: string) => void;
  adminMode?: boolean;
  showTotals?: boolean;
  onDeleteLesson?: (lessonId: number, date: string) => void;
  onLessonDateChange?: (lessonId: number, oldDate: string, newDate: string) => void;
  onDeleteStudent?: (studentId: number, fullName: string) => void;
}

function lessonsInMonth(data: JournalData, year: number, month: number) {
  return data.lessons.filter((l) => {
    const d = parseDateKey(l.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function JournalDefaultView({
  data,
  prev,
  current,
  onCellClick,
  adminMode = false,
  showTotals = false,
  onDeleteLesson,
  onLessonDateChange,
  onDeleteStudent,
}: JournalDefaultViewProps) {
  const prevLessons = lessonsInMonth(data, prev.year, prev.month);
  const currentLessons = lessonsInMonth(data, current.year, current.month).filter(
    (l) => isPastOrToday(parseDateKey(l.date))
  );

  const prevLessonDays = prevLessons.length;
  const currentLessonDays = currentLessons.length;

  const prevTotal = data.students.reduce(
    (sum, s) => sum + countPresent(data, s.id, prevLessons.map((l) => l.id)),
    0
  );
  const currentTotal = data.students.reduce(
    (sum, s) => sum + countPresent(data, s.id, currentLessons.map((l) => l.id)),
    0
  );

  const renderCell = (studentId: number, lessonId: number, date: string) => {
    const entry = getEntry(data, studentId, lessonId);
    if (!entry?.present) {
      return <span className="text-zinc-300">—</span>;
    }
    return (
      <button
        onClick={() => onCellClick(lessonId, date)}
        className="inline-flex min-h-9 min-w-9 items-center justify-center text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer text-base sm:text-sm"
      >
        ✓
      </button>
    );
  };

  const renderLessonHeader = (l: { id: number; date: string }) => (
    <th key={l.id} className="px-0.5 py-0.5 font-normal">
      <LessonDateHeader
        lessonId={l.id}
        date={l.date}
        adminMode={adminMode}
        compact
        onDateChange={onLessonDateChange}
        onDelete={onDeleteLesson}
      />
    </th>
  );

  return (
    <div className="space-y-3">
      <div className="grid gap-2 sm:grid-cols-2">
        <div className="rounded-lg bg-zinc-100 dark:bg-zinc-800 p-3 text-sm">
          <strong>{monthName(prev.month)} {prev.year}</strong> (прошлый)
          {showTotals ? (
            <>
              {" "}→ к оплате:{" "}
              <strong>{formatRubles(prevTotal * data.pricePerLesson)}</strong> ({prevLessonDays} зан.)
            </>
          ) : (
            <>
              {" "}→ <strong>{prevLessonDays}</strong> зан.
            </>
          )}
        </div>
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950 p-3 text-sm border border-emerald-200 dark:border-emerald-800">
          <strong>{monthName(current.month)} {current.year}</strong> (текущий) → уже прошло:{" "}
          <strong>{currentLessonDays} зан.</strong>
          {showTotals && <> · {formatRubles(currentTotal * data.pricePerLesson)}</>}
        </div>
      </div>

      <p className="text-xs text-zinc-400 sm:hidden">Листайте таблицу влево →</p>
      <div className="-mx-3 sm:mx-0 overflow-x-auto overscroll-x-contain">
        <table className="w-full border-collapse text-sm min-w-[600px]">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 bg-white dark:bg-zinc-900 z-10 px-3 py-2 text-left min-w-[110px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.4)]">
                ФИО
              </th>
              <th colSpan={prevLessons.length + (showTotals ? 1 : 0)} className="px-1 py-1 text-center bg-zinc-50 dark:bg-zinc-800">
                {monthName(prev.month)}
              </th>
              <th colSpan={currentLessons.length + (showTotals ? 1 : 0)} className="px-1 py-1 text-center bg-emerald-50 dark:bg-emerald-950">
                {monthName(current.month)}
              </th>
            </tr>
            <tr className="border-b text-sm">
              <th className="sticky left-0 bg-white dark:bg-zinc-900 z-10 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]" />
              {prevLessons.map(renderLessonHeader)}
              {showTotals && <th className="px-0.5 py-0.5 font-semibold">₽</th>}
              {currentLessons.map(renderLessonHeader)}
              <th className="px-0.5 py-0.5 font-semibold">{showTotals ? "Зан./₽" : "Зан."}</th>
            </tr>
          </thead>
          <tbody>
            {data.students.map((student) => {
              const prevCount = countPresent(data, student.id, prevLessons.map((l) => l.id));
              const curCount = countPresent(data, student.id, currentLessons.map((l) => l.id));
              return (
                <tr key={student.id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                  <td className="sticky left-0 bg-white dark:bg-zinc-900 z-10 px-3 py-2 font-medium whitespace-nowrap shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.4)]">
                    <div className="flex items-center gap-1">
                      <span className="flex-1 text-sm sm:text-base">{student.fullName}</span>
                      {adminMode && onDeleteStudent && (
                        <button
                          onClick={() => onDeleteStudent(student.id, student.fullName)}
                          className="text-red-400 hover:text-red-600 shrink-0"
                          title="Удалить ученика"
                        >
                          <TrashIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </td>
                  {prevLessons.map((l) => (
                    <td key={l.id} className="px-0.5 py-0.5 text-center">
                      {renderCell(student.id, l.id, l.date)}
                    </td>
                  ))}
                  {showTotals && (
                    <td className="px-0.5 py-0.5 text-center font-semibold">
                      {formatRubles(prevCount * data.pricePerLesson)}
                    </td>
                  )}
                  {currentLessons.map((l) => (
                    <td key={l.id} className="px-0.5 py-0.5 text-center">
                      {renderCell(student.id, l.id, l.date)}
                    </td>
                  ))}
                  <td className="px-0.5 py-0.5 text-center font-semibold">
                    {showTotals
                      ? `${curCount} / ${formatRubles(curCount * data.pricePerLesson)}`
                      : curCount}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
