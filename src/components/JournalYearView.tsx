"use client";

import type { JournalData } from "@/lib/types";
import { formatRubles } from "@/lib/format";
import { monthName, parseDateKey } from "@/lib/dates";
import { countPresent } from "@/lib/journal";

interface JournalYearViewProps {
  data: JournalData;
  months: { year: number; month: number }[];
  onMonthClick: (year: number, month: number) => void;
  showTotals?: boolean;
}

function lessonsInMonth(data: JournalData, year: number, month: number) {
  return data.lessons.filter((l) => {
    const d = parseDateKey(l.date);
    return d.getFullYear() === year && d.getMonth() === month;
  });
}

export function JournalYearView({
  data,
  months,
  onMonthClick,
  showTotals = false,
}: JournalYearViewProps) {
  const shortMonths = months.map((m) => monthName(m.month).slice(0, 3));

  return (
    <div className="space-y-4">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full border-collapse text-xs min-w-[800px]">
          <thead>
            <tr className="border-b">
              <th className="sticky left-0 bg-white dark:bg-zinc-900 z-10 p-2 text-left min-w-[120px]">
                ФИО
              </th>
              {months.map((m, i) => (
                <th key={i} className="p-1 text-center">
                  {shortMonths[i]}
                </th>
              ))}
              <th className="p-1">Σ</th>
              {showTotals && <th className="p-1">₽ год</th>}
            </tr>
          </thead>
          <tbody>
            {data.students.map((student) => {
              let yearTotal = 0;
              let yearSum = 0;
              return (
                <tr key={student.id} className="border-b">
                  <td className="sticky left-0 bg-white dark:bg-zinc-900 z-10 p-2 font-medium whitespace-nowrap">
                    {student.fullName}
                  </td>
                  {months.map((m, i) => {
                    const ml = lessonsInMonth(data, m.year, m.month);
                    const cnt = countPresent(data, student.id, ml.map((l) => l.id));
                    yearTotal += cnt;
                    yearSum += cnt * data.pricePerLesson;
                    return (
                      <td
                        key={i}
                        className="p-1 text-center cursor-pointer hover:bg-emerald-50 dark:hover:bg-emerald-950"
                        onClick={() => onMonthClick(m.year, m.month)}
                      >
                        {cnt > 0 ? (
                          <div>
                            <div className="font-semibold">{cnt}</div>
                            {showTotals && (
                              <div className="text-[10px]">{cnt * data.pricePerLesson}</div>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                    );
                  })}
                  <td className="p-1 text-center font-bold">{yearTotal}</td>
                  {showTotals && (
                    <td className="p-1 text-center font-bold">{formatRubles(yearSum)}</td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {months.map((m, i) => (
          <div
            key={i}
            className="rounded-lg border p-3 cursor-pointer hover:border-emerald-400 active:bg-emerald-50 dark:active:bg-emerald-950/30"
            onClick={() => onMonthClick(m.year, m.month)}
          >
            <div className="font-semibold mb-2">{monthName(m.month)} {m.year}</div>
            {data.students.map((s) => {
              const ml = lessonsInMonth(data, m.year, m.month);
              const cnt = countPresent(data, s.id, ml.map((l) => l.id));
              if (cnt === 0) return null;
              return (
                <div key={s.id} className="text-xs text-zinc-600">
                  {s.fullName}: {showTotals ? formatRubles(cnt * data.pricePerLesson) : `${cnt} зан.`}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
