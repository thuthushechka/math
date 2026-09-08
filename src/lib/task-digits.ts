function uniqueSorted(nums: number[]): number[] {
  return [...new Set(nums)].sort((a, b) => a - b);
}

/** Normalize common OCR digit misreads in the task-number part of a board line. */
export function normalizeOcrTaskDigits(text: string): string {
  return text
    .replace(/[ОоO]/g, "0")
    .replace(/[Зз]/g, "3")
    .replace(/[І|lI]/g, "1")
    .replace(/[Вв]/g, "8")
    .replace(/[Бб]/g, "6");
}

function hasTaskSeparators(text: string): boolean {
  return /[\s,./;:\-]/.test(text);
}

/** Parse space/comma-separated task numbers (e.g. "1 2 3 10" or "1,2,3,10"). */
function parseSeparatedTaskDigits(text: string, maxTask: number): number[] {
  const tokens = normalizeOcrTaskDigits(text).match(/\d+/g) ?? [];
  return uniqueSorted(
    tokens
      .map((token) => parseInt(token, 10))
      .filter((n) => n >= 1 && n <= maxTask)
  );
}

/**
 * Parse concatenated digits by preferring the longest valid partition
 * (e.g. "12345" → [1,2,3,4,5], not [12,3,4,5]).
 */
function parseConcatenatedTaskDigits(digits: string, maxTask: number): number[] {
  const clean = digits.replace(/\D/g, "");
  if (!clean) return [];

  const memo = new Map<number, number[] | null>();

  const partition = (start: number): number[] | null => {
    if (start === clean.length) return [];
    if (memo.has(start)) return memo.get(start)!;

    let best: number[] | null = null;

    for (const len of [1, 2]) {
      if (start + len > clean.length) continue;
      const num = parseInt(clean.slice(start, start + len), 10);
      if (num < 1 || num > maxTask) continue;

      const rest = partition(start + len);
      if (!rest) continue;

      const candidate = [num, ...rest];
      if (!best || candidate.length > best.length) {
        best = candidate;
      }
    }

    memo.set(start, best);
    return best;
  };

  return uniqueSorted(partition(0) ?? []);
}

/** Parse task numbers from the board line tail (after the student's name). */
export function parseTasksFromBoardText(text: string, maxTask: number): number[] {
  const trimmed = normalizeOcrTaskDigits(text.trim());
  if (!trimmed) return [];

  if (hasTaskSeparators(trimmed)) {
    return parseSeparatedTaskDigits(trimmed, maxTask);
  }

  return parseConcatenatedTaskDigits(trimmed, maxTask);
}

/** Backward-compatible alias for stored digit strings and legacy callers. */
export function parseTaskDigits(digits: string, maxTask: number): number[] {
  const trimmed = digits.trim();
  if (!trimmed) return [];

  if (hasTaskSeparators(trimmed) || !/^\d+$/.test(trimmed)) {
    return parseTasksFromBoardText(trimmed, maxTask);
  }

  return parseConcatenatedTaskDigits(trimmed, maxTask);
}

export function tasksToString(tasks: number[]): string {
  return tasks.join("");
}

export function tasksFromString(tasks: string, maxTask: number): number[] {
  if (!tasks) return [];
  return parseTaskDigits(tasks, maxTask);
}

export function formatTasksDisplay(tasks: string, maxTask: number): string {
  const nums = tasksFromString(tasks, maxTask);
  if (nums.length === 0) return "—";
  return nums.join(" ");
}
