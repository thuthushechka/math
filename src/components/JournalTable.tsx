"use client";

import { useState } from "react";
import type { JournalData, ViewMode } from "@/lib/types";
import { getPrevCurrentMonths, getSchoolYearMonths } from "@/lib/dates";
import { JournalDefaultView } from "./JournalDefaultView";
import { JournalMonthView } from "./JournalMonthView";
import { JournalPeriodView } from "./JournalPeriodView";
import { JournalYearView } from "./JournalYearView";
import { DayTasksModal } from "./DayTasksModal";
import { ConfirmDelete } from "./ConfirmDelete";

interface JournalTableProps {
  data: JournalData;
  defaultMode?: ViewMode;
  showTotals?: boolean;
  adminMode?: boolean;
  onRefresh?: () => void;
}

export function JournalTable({
  data,
  defaultMode = "default",
  showTotals = false,
  adminMode = false,
  onRefresh,
}: JournalTableProps) {
  const [mode, setMode] = useState<ViewMode>(defaultMode);
  const { prev, current } = getPrevCurrentMonths();
  const [pairOffset, setPairOffset] = useState(0);
  const [monthView, setMonthView] = useState({ year: current.year, month: current.month });
  const [periodStart, setPeriodStart] = useState(current.month);
  const [periodYear, setPeriodYear] = useState(current.year);
  const [modal, setModal] = useState<{ lessonId: number; date: string } | null>(null);
  const [deleteLesson, setDeleteLesson] = useState<{ id: number; date: string } | null>(null);
  const [deleteStudent, setDeleteStudent] = useState<{ id: number; fullName: string } | null>(null);

  const pairPrev = new Date(current.year, current.month - 1 - pairOffset, 1);
  const pairCurrent = new Date(current.year, current.month - pairOffset, 1);
  const pair = {
    prev: { year: pairPrev.getFullYear(), month: pairPrev.getMonth() },
    current: { year: pairCurrent.getFullYear(), month: pairCurrent.getMonth() },
  };

  const periodMonths = [0, 1, 2].map((i) => {
    const d = new Date(periodYear, periodStart + i, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const schoolMonths = getSchoolYearMonths();

  const handleCellClick = (lessonId: number, date: string) => {
    setModal({ lessonId, date });
  };

  const handleMonthClick = (year: number, month: number) => {
    setMonthView({ year, month });
    setMode("month");
  };

  const handleDeleteLesson = async () => {
    if (!deleteLesson) return;
    await fetch("/api/lessons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: deleteLesson.id }),
    });
    setDeleteLesson(null);
    onRefresh?.();
  };

  const handleLessonDateChange = async (
    lessonId: number,
    _oldDate: string,
    newDate: string
  ) => {
    const res = await fetch("/api/lessons", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId, date: newDate }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error ?? "Не удалось изменить дату урока");
      return;
    }
    if (modal?.lessonId === lessonId) {
      setModal({ lessonId, date: newDate });
    }
    onRefresh?.();
  };

  const handleDeleteStudent = async () => {
    if (!deleteStudent) return;
    await fetch(`/api/students/${deleteStudent.id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    setDeleteStudent(null);
    onRefresh?.();
  };

  const handleDeleteEntry = async (entryId: number) => {
    await fetch("/api/lessons/entry", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entryId }),
    });
    setModal(null);
    onRefresh?.();
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
          {(["default", "month", "period", "year"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-2.5 py-2.5 sm:px-3 sm:py-1.5 text-sm ${
                mode === m
                  ? "bg-emerald-600 text-white"
                  : "bg-zinc-100 dark:bg-zinc-800"
              }`}
            >
              {m === "default" ? "2 мес." : m === "month" ? "1 мес." : m === "period" ? "3 мес." : "Год"}
            </button>
          ))}
        </div>
        {(mode === "default" || mode === "period" || mode === "month") && (
          <div className="flex gap-2">
            <button
              onClick={() => {
                if (mode === "default") setPairOffset((o) => o + 1);
                else if (mode === "period") setPeriodStart((s) => s - 3);
                else setMonthView((m) => {
                  const d = new Date(m.year, m.month - 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                });
              }}
              className="flex-1 sm:flex-none rounded-lg bg-zinc-100 px-4 py-2.5 sm:py-1 text-base sm:text-sm dark:bg-zinc-800"
              aria-label="Предыдущий период"
            >
              ◀
            </button>
            <button
              onClick={() => {
                if (mode === "default") setPairOffset((o) => Math.max(0, o - 1));
                else if (mode === "period") setPeriodStart((s) => s + 3);
                else setMonthView((m) => {
                  const d = new Date(m.year, m.month + 1, 1);
                  return { year: d.getFullYear(), month: d.getMonth() };
                });
              }}
              className="flex-1 sm:flex-none rounded-lg bg-zinc-100 px-4 py-2.5 sm:py-1 text-base sm:text-sm dark:bg-zinc-800"
              aria-label="Следующий период"
            >
              ▶
            </button>
          </div>
        )}
      </div>

      {mode === "default" && (
        <JournalDefaultView
          data={data}
          prev={pair.prev}
          current={pair.current}
          onCellClick={handleCellClick}
          adminMode={adminMode}
          showTotals={showTotals}
          onDeleteLesson={(id, date) => setDeleteLesson({ id, date })}
          onLessonDateChange={adminMode ? handleLessonDateChange : undefined}
          onDeleteStudent={(id, fullName) => setDeleteStudent({ id, fullName })}
        />
      )}
      {mode === "month" && (
        <JournalMonthView
          data={data}
          year={monthView.year}
          month={monthView.month}
          onCellClick={handleCellClick}
          showTotals={showTotals}
          adminMode={adminMode}
          onDeleteLesson={(id, date) => setDeleteLesson({ id, date })}
          onLessonDateChange={adminMode ? handleLessonDateChange : undefined}
          onDeleteStudent={(id, fullName) => setDeleteStudent({ id, fullName })}
        />
      )}
      {mode === "period" && (
        <JournalPeriodView
          data={data}
          months={periodMonths}
          onCellClick={handleCellClick}
          showTotals={showTotals}
        />
      )}
      {mode === "year" && (
        <JournalYearView
          data={data}
          months={schoolMonths}
          onMonthClick={handleMonthClick}
          showTotals={showTotals}
        />
      )}

      <DayTasksModal
        open={!!modal}
        date={modal?.date ?? null}
        lessonId={modal?.lessonId ?? null}
        data={data}
        onClose={() => setModal(null)}
        adminMode={adminMode}
        onDeleteEntry={handleDeleteEntry}
        onLessonDateChange={adminMode ? handleLessonDateChange : undefined}
      />

      <ConfirmDelete
        open={deleteLesson !== null}
        title="Удалить урок за день?"
        message={`Удалить урок от ${deleteLesson?.date ?? ""} со всеми отметками посещения и задачами за этот день?`}
        onConfirm={handleDeleteLesson}
        onCancel={() => setDeleteLesson(null)}
      />

      <ConfirmDelete
        open={deleteStudent !== null}
        title="Удалить ученика?"
        message={`Удалить ${deleteStudent?.fullName ?? ""} со всеми записями посещений и задачами?`}
        onConfirm={handleDeleteStudent}
        onCancel={() => setDeleteStudent(null)}
      />
    </div>
  );
}
