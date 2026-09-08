"use client";

import type { JournalData } from "@/lib/types";
import { formatRubles } from "@/lib/format";
import { monthName, parseDateKey } from "@/lib/dates";
import { getEntry, countPresent } from "@/lib/journal";
import { LessonDateHeader } from "./LessonDateHeader";
import { TrashIcon } from "./TrashIcon";

interface JournalMonthViewProps {
  data: JournalData;
  year: number;
  month: number;
  onCellClick: (lessonId: number, date: string) => void;
  showTotals?: boolean;
  adminMode?: boolean;
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

export function JournalMonthView({
  data,
  year,
  month,
  onCellClick,
  showTotals = true,
  adminMode = false,
  onDeleteLesson,
  onLessonDateChange,
  onDeleteStudent,
}: JournalMonthViewProps) {
  const monthLessons = lessonsInMonth(data, year, month);

  const renderCell = (studentId: number, lessonId: number, date: string) => {
    const entry = getEntry(data, studentId, lessonId);
    if (!entry?.present) return <span className="text-zinc-300 text-sm">—</span>;
    return (
      <button
        onClick={() => onCellClick(lessonId, date)}
        className="inline-flex min-h-9 min-w-9 items-center justify-center text-emerald-600 hover:text-emerald-800 font-bold cursor-pointer text-base sm:text-sm"
      >
        ✓
      </button>
    );
  };

  const classTotal = data.students.reduce(
    (sum, s) => sum + countPresent(data, s.id, monthLessons.map((l) => l.id)),
    0
  );

  return (
    <div className="-mx-3 sm:mx-0 overflow-x-auto overscroll-x-contain">
      <h3 className="mb-2 px-3 sm:px-0 text-base sm:text-sm font-semibold">{monthName(month)} {year}</h3>
      <p className="mb-2 px-3 sm:px-0 text-xs text-zinc-400 sm:hidden">Листайте таблицу влево →</p>
      <table className="w-full border-collapse text-sm min-w-[520px]">
        <thead>
          <tr className="border-b">
            <th className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-3 py-2 text-left min-w-[120px] shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.4)]">
              ФИО
            </th>
            {monthLessons.map((l) => (
              <th key={l.id} className="px-1 py-2 font-normal min-w-[44px]">
                <LessonDateHeader
                  lessonId={l.id}
                  date={l.date}
                  adminMode={adminMode}
                  onDateChange={onLessonDateChange}
                  onDelete={onDeleteLesson}
                />
              </th>
            ))}
            <th className="px-2 py-2 min-w-[36px]">Зан.</th>
            {showTotals && <th className="px-2 py-2 min-w-[72px]">К оплате</th>}
          </tr>
        </thead>
        <tbody>
          {data.students.map((student) => {
            const cnt = countPresent(data, student.id, monthLessons.map((l) => l.id));
            return (
              <tr key={student.id} className="border-b hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                <td className="sticky left-0 z-10 bg-white dark:bg-zinc-900 px-3 py-2 font-medium whitespace-nowrap shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)] dark:shadow-[4px_0_8px_-4px_rgba(0,0,0,0.4)]">
                  <div className="flex items-center gap-1">
                    <span className="flex-1 text-sm sm:text-base">{student.fullName}</span>
                    {adminMode && onDeleteStudent && (
                      <button
                        onClick={() => onDeleteStudent(student.id, student.fullName)}
                        className="p-1 text-red-400 hover:text-red-600 shrink-0"
                        title="Удалить ученика"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
                {monthLessons.map((l) => (
                  <td key={l.id} className="px-1 py-1 text-center">
                    {renderCell(student.id, l.id, l.date)}
                  </td>
                ))}
                <td className="px-2 py-2 text-center font-semibold">{cnt}</td>
                {showTotals && (
                  <td className="px-2 py-2 text-center font-semibold text-xs sm:text-sm whitespace-nowrap">
                    {formatRubles(cnt * data.pricePerLesson)}
                  </td>
                )}
              </tr>
            );
          })}
          {showTotals && (
            <tr className="border-t-2 font-bold bg-zinc-50 dark:bg-zinc-800">
              <td className="sticky left-0 z-10 bg-zinc-50 dark:bg-zinc-800 px-3 py-2 shadow-[4px_0_8px_-4px_rgba(0,0,0,0.1)]">
                Итого класса
              </td>
              {monthLessons.map((l) => (
                <td key={l.id} />
              ))}
              <td className="px-2 py-2 text-center">{classTotal}</td>
              <td className="px-2 py-2 text-center text-xs sm:text-sm whitespace-nowrap">
                {formatRubles(classTotal * data.pricePerLesson)}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
