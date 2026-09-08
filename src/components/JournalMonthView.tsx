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

  const mobileLessonDates = adminMode && monthLessons.length > 0 && (
    <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1">
      {monthLessons.map((l) => (
        <div key={l.id} className="shrink-0">
          <LessonDateHeader
            lessonId={l.id}
            date={l.date}
            adminMode={adminMode}
            onDateChange={onLessonDateChange}
            onDelete={onDeleteLesson}
          />
        </div>
      ))}
    </div>
  );

  return (
    <div>
      <h3 className="mb-3 text-base sm:text-sm font-semibold">{monthName(month)} {year}</h3>

      <div className="md:hidden space-y-3">
        {mobileLessonDates}
        {data.students.map((student) => {
          const cnt = countPresent(data, student.id, monthLessons.map((l) => l.id));
          return (
            <div
              key={student.id}
              className="rounded-lg border dark:border-zinc-700 p-3 bg-white dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2 mb-3">
                <span className="font-medium text-base">{student.fullName}</span>
                {adminMode && onDeleteStudent && (
                  <button
                    onClick={() => onDeleteStudent(student.id, student.fullName)}
                    className="p-1.5 text-red-400 hover:text-red-600 shrink-0"
                    title="Удалить ученика"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                )}
              </div>
              {monthLessons.length === 0 ? (
                <p className="text-sm text-zinc-400">Нет занятий в этом месяце</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {monthLessons.map((l) => (
                    <div
                      key={l.id}
                      className="flex flex-col items-center rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1.5 min-w-[2.75rem]"
                    >
                      <span className="text-[10px] text-zinc-400 mb-0.5 leading-none">
                        {parseDateKey(l.date).getDate().toString().padStart(2, "0")}
                      </span>
                      {renderCell(student.id, l.id, l.date)}
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 pt-2 border-t dark:border-zinc-700 flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
                <span>
                  Зан.: <strong>{cnt}</strong>
                </span>
                {showTotals && (
                  <span>
                    К оплате: <strong>{formatRubles(cnt * data.pricePerLesson)}</strong>
                  </span>
                )}
              </div>
            </div>
          );
        })}
        {showTotals && data.students.length > 0 && (
          <div className="rounded-lg bg-zinc-50 dark:bg-zinc-800 p-3 font-semibold flex flex-wrap justify-between gap-2 text-sm">
            <span>Итого класса</span>
            <span>
              {classTotal} зан. · {formatRubles(classTotal * data.pricePerLesson)}
            </span>
          </div>
        )}
      </div>

      <div className="hidden md:block -mx-3 sm:mx-0 overflow-x-auto overscroll-x-contain">
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
    </div>
  );
}
