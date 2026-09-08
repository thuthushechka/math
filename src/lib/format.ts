export function formatRubles(amount: number): string {
  return `${amount.toLocaleString("ru-RU")} ₽`;
}

export function compareNamesRu(a: string, b: string): number {
  return a.localeCompare(b, "ru", { sensitivity: "base" });
}

export const GRADES = [4, 5, 6, 7] as const;
export type Grade = (typeof GRADES)[number];
