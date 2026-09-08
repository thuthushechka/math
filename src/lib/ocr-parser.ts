import { parseBoardLine } from "./name-matcher";
import { normalizeOcrTaskDigits, parseTasksFromBoardText, tasksToString } from "./task-digits";
import { parseBoardDate } from "./dates";

export interface ParsedBoardRow {
  fullName: string;
  tasks: string;
  present: boolean;
  rawLine: string;
}

export function extractDateFromOcr(text: string): Date | null {
  const lines = text.split("\n").slice(0, 5);
  for (const line of lines) {
    const date = parseBoardDate(line);
    if (date) return date;
  }
  return parseBoardDate(text.slice(0, 50));
}

function isTaskOnlyLine(line: string): boolean {
  const normalized = normalizeOcrTaskDigits(line.trim());
  return normalized.length > 0 && /^[\d\s,./;:\-]+$/.test(normalized);
}

/** Merge OCR lines where task numbers appear on the line below the name. */
export function mergeOcrLines(text: string): string[] {
  const merged: string[] = [];

  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;

    if (parseBoardLine(line)) {
      merged.push(line);
      continue;
    }

    if (merged.length > 0 && isTaskOnlyLine(line)) {
      merged[merged.length - 1] += " " + line;
    }
  }

  return merged;
}

export function parseOcrText(
  text: string,
  maxTask: number
): { date: Date | null; rows: ParsedBoardRow[] } {
  const date = extractDateFromOcr(text);
  const rows: ParsedBoardRow[] = [];

  for (const line of mergeOcrLines(text)) {
    const parsed = parseBoardLine(line);
    if (!parsed) continue;

    const taskNums = parsed.taskText
      ? parseTasksFromBoardText(parsed.taskText, maxTask)
      : [];

    rows.push({
      fullName: parsed.fullName,
      tasks: tasksToString(taskNums),
      present: true,
      rawLine: line.trim(),
    });
  }

  return { date, rows };
}
