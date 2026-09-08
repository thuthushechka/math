import type { ManualRow } from "./types";
import { compareNamesRu } from "./format";

export type LessonEntrySort = "name" | "tasks";

const STORAGE_KEY = "math-club.lesson-entry-sort";

export function readLessonEntrySort(): LessonEntrySort {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    if (value === "tasks") return "tasks";
  } catch {
    // ignore
  }
  return "name";
}

export function saveLessonEntrySort(sort: LessonEntrySort): void {
  try {
    localStorage.setItem(STORAGE_KEY, sort);
  } catch {
    // ignore
  }
}

function emptyNameOrder(a: ManualRow, b: ManualRow): number | null {
  const aEmpty = !a.fullName.trim();
  const bEmpty = !b.fullName.trim();
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return -1;
  if (bEmpty) return 1;
  return null;
}

export function compareManualRows(a: ManualRow, b: ManualRow, sort: LessonEntrySort): number {
  const empty = emptyNameOrder(a, b);
  if (empty !== null) return empty;

  if (sort === "tasks") {
    const diff = b.tasks.length - a.tasks.length;
    if (diff !== 0) return diff;
  }

  return compareNamesRu(a.fullName, b.fullName);
}

export function sortManualRowIndices(rows: ManualRow[], sort: LessonEntrySort): number[] {
  const indices = rows.map((_, i) => i);
  indices.sort((ia, ib) => compareManualRows(rows[ia], rows[ib], sort));
  return indices;
}
