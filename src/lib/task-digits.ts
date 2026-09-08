/** Greedy parse of concatenated task digits (e.g. "1234971058" → [1,2,3,4,9,7,10,5,8]) */
export function parseTaskDigits(digits: string, maxTask: number): number[] {
  const clean = digits.replace(/\D/g, "");
  const result: number[] = [];
  let i = 0;

  while (i < clean.length) {
    if (i + 1 < clean.length) {
      const two = parseInt(clean.slice(i, i + 2), 10);
      if (two >= 10 && two <= maxTask) {
        result.push(two);
        i += 2;
        continue;
      }
    }
    const one = parseInt(clean[i], 10);
    if (one >= 1 && one <= maxTask) {
      result.push(one);
    }
    i += 1;
  }

  return [...new Set(result)].sort((a, b) => a - b);
}

export function tasksToString(tasks: number[]): string {
  return tasks.join("");
}

export function tasksFromString(tasks: string, maxTask: number): number[] {
  if (!tasks) return [];
  if (/^\d+$/.test(tasks)) {
    return parseTaskDigits(tasks, maxTask);
  }
  return tasks
    .split(/[\s,]+/)
    .map((t) => parseInt(t, 10))
    .filter((n) => n >= 1 && n <= maxTask);
}

export function formatTasksDisplay(tasks: string, maxTask: number): string {
  const nums = tasksFromString(tasks, maxTask);
  if (nums.length === 0) return "—";
  return nums.join(" ");
}
