import Fuse from "fuse.js";
import { compareNamesRu } from "./format";

export interface StudentRef {
  id: number;
  fullName: string;
}

export function normalizeFullName(surname: string, initial?: string): string {
  const s = surname.trim().replace(/\s+/g, " ");
  if (!initial?.trim()) return s;
  const letter = initial.trim().replace(/\.$/, "").charAt(0).toUpperCase();
  return `${s} ${letter}.`;
}

export function parseBoardLine(line: string): {
  surname: string;
  initial?: string;
  digits: string;
  fullName: string;
} | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const regex =
    /^([А-Яа-яЁё\-]+)(?:\s+([А-Яа-яЁё])\.?)?(?:\s+([\d\s]+))?/;
  const match = trimmed.match(regex);
  if (!match) return null;

  const surname = match[1];
  const initial = match[2];
  const digitPart = match[3]?.replace(/\s/g, "") ?? "";
  const digits = digitPart.replace(/[^\d].*$/, "").replace(/\D/g, "");

  return {
    surname,
    initial,
    digits,
    fullName: normalizeFullName(surname, initial),
  };
}

function getInitial(fullName: string): string | null {
  const m = fullName.match(/\s([А-Яа-яЁё])\.$/);
  return m ? m[1].toUpperCase() : null;
}

function getSurname(fullName: string): string {
  return fullName.replace(/\s[А-Яа-яЁё]\.$/, "").trim();
}

export interface MatchResult {
  studentId: number | null;
  matchedName: string | null;
  boardName: string;
  isFuzzy: boolean;
  isNew: boolean;
}

export function matchStudent(
  boardName: string,
  students: StudentRef[],
  usedIds: Set<number>
): MatchResult {
  const available = students.filter((s) => !usedIds.has(s.id));
  const normalizedBoard = boardName.trim();

  const exact = available.find(
    (s) => s.fullName.toLowerCase() === normalizedBoard.toLowerCase()
  );
  if (exact) {
    return {
      studentId: exact.id,
      matchedName: exact.fullName,
      boardName: normalizedBoard,
      isFuzzy: false,
      isNew: false,
    };
  }

  const boardInitial = getInitial(normalizedBoard);
  const boardSurname = getSurname(normalizedBoard);

  const sameInitialPool = available.filter((s) => {
    const sInitial = getInitial(s.fullName);
    return sInitial === boardInitial;
  });

  if (sameInitialPool.length === 0) {
    return {
      studentId: null,
      matchedName: null,
      boardName: normalizedBoard,
      isFuzzy: false,
      isNew: true,
    };
  }

  const fuse = new Fuse(sameInitialPool, {
    keys: ["fullName"],
    threshold: 0.25,
    includeScore: true,
    getFn: (obj, path) => {
      if (path === "fullName") return getSurname(obj.fullName);
      return "";
    },
  });

  const results = fuse.search(boardSurname);
  const good = results.filter((r) => (r.score ?? 1) <= 0.25);

  if (good.length === 1) {
    return {
      studentId: good[0].item.id,
      matchedName: good[0].item.fullName,
      boardName: normalizedBoard,
      isFuzzy: true,
      isNew: false,
    };
  }

  return {
    studentId: null,
    matchedName: null,
    boardName: normalizedBoard,
    isFuzzy: false,
    isNew: true,
  };
}

export function sortStudents<T extends { fullName: string }>(students: T[]): T[] {
  return [...students].sort((a, b) => compareNamesRu(a.fullName, b.fullName));
}
