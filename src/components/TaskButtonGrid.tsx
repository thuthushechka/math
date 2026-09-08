"use client";

import { tasksToString } from "@/lib/task-digits";

interface TaskButtonGridProps {
  maxTask: number;
  selected: number[];
  onChange: (tasks: number[]) => void;
  compact?: boolean;
}

export function TaskButtonGrid({ maxTask, selected, onChange, compact }: TaskButtonGridProps) {
  const toggle = (n: number) => {
    if (selected.includes(n)) {
      onChange(selected.filter((t) => t !== n));
    } else {
      onChange([...selected, n].sort((a, b) => a - b));
    }
  };

  const btnClass = compact
    ? "w-6 h-6 rounded text-xs font-medium transition"
    : "w-9 h-9 rounded-lg text-sm font-medium transition";

  return (
    <div className={`flex flex-wrap ${compact ? "gap-0.5" : "gap-1"}`}>
      {Array.from({ length: maxTask }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => toggle(n)}
          className={`${btnClass} ${
            selected.includes(n)
              ? "bg-emerald-600 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800"
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

export function tasksArrayToString(tasks: number[]): string {
  return tasksToString(tasks);
}
