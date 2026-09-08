"use client";

import type { JournalData } from "@/lib/types";
import { formatRubles } from "@/lib/format";
import { monthName, parseDateKey } from "@/lib/dates";
import { getEntry, countPresent } from "@/lib/journal";

interface JournalPeriodViewProps {
  data: JournalData;
  months: { year: number; month: number }[];
  onCellClick: (lessonId: number, date: string) => void;
  showTotals?: boolean;
}

function lessonsInMonth(data: JournalData, year: number, month: number) {
  return data.lessons.filter((l) => {
    const d = parseDateKey(l.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function JournalPeriodView({
  data,
  months,
  onCellClick,
  showTotals = false,
}: JournalPeriodViewProps) {
  const renderCell = (studentId: number, lessonId: number, date: string) => {
    const entry = getEntry(data, studentId, lessonId);
    if (!entry?.present) return <span className="text-zinc-300">—</span>;
    return (
      <button
        onClick={() => onCellClick(lessonId, date)}
        className="text-emerald-600 font-bold cursor-pointer text-xs"
      >
        ✓
      </button>
    );
  };

  return (
    <div>
      <div className="md:hidden space-y-3">
        {data.students.map((student) => (
          <div
            key={student.id}
            className="rounded-lg border dark:border-zinc-700 p-3 bg-white dark:bg-zinc-900"
          >
            <p className="font-medium text-base mb-3">{student.fullName}</p>
            <div className="grid grid-cols-1 gap-2">
              {months.map((m) => {
                const ml = lessonsInMonth(data, m.year, m.month);
                const cnt = countPresent(data, student.id, ml.map((l) => l.id));
                return (
                  <button
                    key={`${m.year}-${m.month}`}
                    type="button"
                    className="flex items-center justify-between rounded-lg bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2.5 text-left active:bg-emerald-50 dark:active:bg-emerald-950/30"
                    onClick={() => {
                      if (ml[0]) onCellClick(ml[0].id, ml[0].date);
                    }}
                  >
                    <span className="text-sm font-medium">
                      {monthName(m.month)} {m.year}
                    </span>
                    <span className="text-sm">
                      <strong className="text-emerald-700 dark:text-emerald-400">{cnt}</strong>
                      {showTotals && (
                        <span className="text-zinc-500 ml-2">{formatRubles(cnt * data.pricePerLesson)}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-sm min-w-[700px]">
        <thead>
          <tr className="border-b">
            <th className="sticky left-0 bg-white dark:bg-zinc-900 z-10 p-2 text-left min-w-[120px]">
              ФИО
            </th>
            {months.map((m) => (
              <th
                key={`${m.year}-${m.month}`}
                colSpan={4}
                className="p-2 text-center border-l"
              >
                {monthName(m.month)} {m.year}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.students.map((student) => (
            <tr key={student.id} className="border-b">
              <td className="sticky left-0 bg-white dark:bg-zinc-900 z-10 p-2 font-medium whitespace-nowrap text-xs">
                {student.fullName}
              </td>
              {months.map((m) => {
                const ml = lessonsInMonth(data, m.year, m.month);
                const display = ml.slice(0, 3);
                const cnt = countPresent(data, student.id, ml.map((l) => l.id));
                return (
                  <td
                    key={`${m.year}-${m.month}`}
                    colSpan={4}
                    className="border-l p-1"
                  >
                    <div className="flex gap-1 items-center justify-center flex-wrap">
                      {ml.length > 4 ? (
                        <button
                          className="text-xs text-emerald-700 font-semibold"
                          onClick={() => {
                            if (ml[0]) onCellClick(ml[0].id, ml[0].date);
                          }}
                        >
                          {cnt}✓
                        </button>
                      ) : (
                        display.map((l) => (
                          <span key={l.id}>{renderCell(student.id, l.id, l.date)}</span>
                        ))
                      )}
                      {showTotals && (
                        <span className="text-xs font-semibold ml-1">
                          {formatRubles(cnt * data.pricePerLesson)}
                        </span>
                      )}
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}
