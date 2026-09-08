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

  const renderMonthGrid = (
    lessons: { id: number; date: string }[],
    studentId: number,
    label: string,
    accent?: boolean
  ) => (
    <div className={accent ? "mt-3 pt-3 border-t dark:border-zinc-700" : ""}>
      <p className={`text-xs font-semibold mb-2 ${accent ? "text-emerald-700 dark:text-emerald-400" : "text-zinc-500"}`}>
        {label}
      </p>
      {lessons.length === 0 ? (
        <p className="text-xs text-zinc-400">Нет занятий</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {lessons.map((l) => (
            <div
              key={l.id}
              className="flex flex-col items-center rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-2 py-1.5 min-w-[2.75rem]"
            >
              <span className="text-[10px] text-zinc-400 mb-0.5 leading-none">
                {parseDateKey(l.date).getDate().toString().padStart(2, "0")}
              </span>
              {renderCell(studentId, l.id, l.date)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const mobileAdminHeaders = adminMode && (prevLessons.length > 0 || currentLessons.length > 0) && (
    <div className="md:hidden space-y-2 rounded-lg border dark:border-zinc-700 p-3 bg-zinc-50 dark:bg-zinc-800/50">
      {prevLessons.length > 0 && (
        <div>
          <p className="text-xs text-zinc-500 mb-1">{monthName(prev.month)} — даты уроков</p>
          <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1">
            {prevLessons.map((l) => (
              <div key={l.id} className="shrink-0">
                <LessonDateHeader
                  lessonId={l.id}
                  date={l.date}
                  adminMode={adminMode}
                  compact
                  onDateChange={onLessonDateChange}
                  onDelete={onDeleteLesson}
                />
              </div>
            ))}
          </div>
        </div>
      )}
      {currentLessons.length > 0 && (
        <div>
          <p className="text-xs text-emerald-700 dark:text-emerald-400 mb-1">{monthName(current.month)} — даты уроков</p>
          <div className="flex gap-2 overflow-x-auto overscroll-x-contain pb-1">
            {currentLessons.map((l) => (
              <div key={l.id} className="shrink-0">
                <LessonDateHeader
                  lessonId={l.id}
                  date={l.date}
                  adminMode={adminMode}
                  compact
                  onDateChange={onLessonDateChange}
                  onDelete={onDeleteLesson}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
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

      {mobileAdminHeaders}

      <div className="md:hidden space-y-3">
        {data.students.map((student) => {
          const prevCount = countPresent(data, student.id, prevLessons.map((l) => l.id));
          const curCount = countPresent(data, student.id, currentLessons.map((l) => l.id));
          return (
            <div
              key={student.id}
              className="rounded-lg border dark:border-zinc-700 p-3 bg-white dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-2 mb-1">
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
              {renderMonthGrid(
                prevLessons,
                student.id,
                `${monthName(prev.month)} (прошлый)${showTotals ? ` · ${formatRubles(prevCount * data.pricePerLesson)}` : ` · ${prevCount} зан.`}`
              )}
              {renderMonthGrid(
                currentLessons,
                student.id,
                `${monthName(current.month)} (текущий)`,
                true
              )}
              <div className="mt-3 pt-2 border-t dark:border-zinc-700 text-sm font-semibold">
                {showTotals
                  ? `${curCount} зан. / ${formatRubles(curCount * data.pricePerLesson)}`
                  : `${curCount} зан.`}
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden md:block -mx-3 sm:mx-0 overflow-x-auto overscroll-x-contain">
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
