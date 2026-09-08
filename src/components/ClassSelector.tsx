"use client";

import { GRADES, type Grade } from "@/lib/format";

interface ClassSelectorProps {
  grade: Grade;
  onChange: (grade: Grade) => void;
}

export function ClassSelector({ grade, onChange }: ClassSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
      {GRADES.map((g) => (
        <button
          key={g}
          onClick={() => onChange(g)}
          className={`rounded-lg px-4 py-3 sm:py-2 text-base sm:text-sm font-medium ${
            grade === g
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200"
          }`}
        >
          {g} класс
        </button>
      ))}
    </div>
  );
}
