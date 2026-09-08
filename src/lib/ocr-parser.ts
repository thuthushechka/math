import { parseBoardLine } from "./name-matcher";
import { parseTaskDigits, tasksToString } from "./task-digits";
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

export function parseOcrText(
  text: string,
  maxTask: number
): { date: Date | null; rows: ParsedBoardRow[] } {
  const date = extractDateFromOcr(text);
  const rows: ParsedBoardRow[] = [];

  for (const line of text.split("\n")) {
    const parsed = parseBoardLine(line);
    if (!parsed) continue;

    const taskNums = parsed.digits
      ? parseTaskDigits(parsed.digits, maxTask)
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
