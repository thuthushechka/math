"use client";

import { parseDateKey } from "@/lib/dates";
import { TrashIcon } from "./TrashIcon";

interface LessonDateHeaderProps {
  lessonId: number;
  date: string;
  adminMode?: boolean;
  compact?: boolean;
  onDateChange?: (lessonId: number, oldDate: string, newDate: string) => void;
  onDelete?: (lessonId: number, date: string) => void;
}

export function LessonDateHeader({
  lessonId,
  date,
  adminMode = false,
  compact = false,
  onDateChange,
  onDelete,
}: LessonDateHeaderProps) {
  const parsed = parseDateKey(date);
  const label = compact
    ? parsed.getDate().toString().padStart(2, "0")
    : parsed.toLocaleDateString("ru", { day: "2-digit", month: "2-digit" });

  if (!adminMode || !onDateChange) {
    return <span className="text-xs sm:text-sm whitespace-nowrap">{label}</span>;
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <input
        type="date"
        value={date}
        onChange={(e) => {
          const next = e.target.value;
          if (next && next !== date) onDateChange(lessonId, date, next);
        }}
        className="w-[5.5rem] sm:w-[6.25rem] rounded border border-zinc-200 px-0.5 py-0.5 text-[10px] sm:text-xs dark:border-zinc-600 dark:bg-zinc-800"
        title="Изменить дату урока"
      />
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(lessonId, date)}
          className="text-red-400 hover:text-red-600"
          title="Удалить урок за день"
        >
          <TrashIcon className={compact ? "w-3 h-3" : "w-4 h-4"} />
        </button>
      )}
    </div>
  );
}
