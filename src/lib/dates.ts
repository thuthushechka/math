const MONTH_NAMES = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export function monthName(month: number): string {
  return MONTH_NAMES[month] ?? "";
}

export function formatDateShort(date: Date): string {
  const d = date.getDate().toString().padStart(2, "0");
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  return `${d}.${m}`;
}

export function formatDateFull(date: Date): string {
  return `${formatDateShort(date)}.${date.getFullYear()}`;
}

export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = (date.getMonth() + 1).toString().padStart(2, "0");
  const d = date.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Stable noon local time for DB storage and lesson lookup */
export function lessonDateFromKey(key: string): Date {
  const d = parseDateKey(key);
  d.setHours(12, 0, 0, 0);
  return d;
}

export function dayBoundsFromKey(key: string): { start: Date; end: Date } {
  const start = parseDateKey(key);
  start.setHours(0, 0, 0, 0);
  const end = parseDateKey(key);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function todayKey(): string {
  return toDateKey(new Date());
}

export function startOfMonth(year: number, month: number): Date {
  return new Date(year, month, 1);
}

export function endOfMonth(year: number, month: number): Date {
  return new Date(year, month + 1, 0, 23, 59, 59, 999);
}

export function getSchoolYearMonths(): { year: number; month: number }[] {
  const now = new Date();
  const startYear = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
  const months: { year: number; month: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const m = (8 + i) % 12;
    const y = m >= 8 ? startYear : startYear + 1;
    months.push({ year: y, month: m });
  }
  return months;
}

export function getPrevCurrentMonths(): {
  prev: { year: number; month: number };
  current: { year: number; month: number };
} {
  const now = new Date();
  const current = { year: now.getFullYear(), month: now.getMonth() };
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prev = { year: prevDate.getFullYear(), month: prevDate.getMonth() };
  return { prev, current };
}

export function parseBoardDate(text: string, refYear?: number): Date | null {
  const year = refYear ?? new Date().getFullYear();
  const match = text.match(/(\d{1,2})\.(\d{1,2})/);
  if (!match) return null;
  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return new Date(year, month, day);
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isPastOrToday(date: Date): boolean {
  const today = new Date();
  today.setHours(23, 59, 59, 999);
  return date <= today;
}
