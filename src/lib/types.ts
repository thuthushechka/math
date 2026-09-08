export interface JournalStudent {
  id: number;
  fullName: string;
}

export interface JournalLesson {
  id: number;
  date: string;
  grade: number;
}

export interface JournalEntry {
  id: number;
  studentId: number;
  lessonId: number;
  present: boolean;
  tasks: string;
}

export interface JournalData {
  grade: number;
  pricePerLesson: number;
  maxTaskNumber: number;
  students: JournalStudent[];
  lessons: JournalLesson[];
  entries: JournalEntry[];
}

export type ViewMode = "default" | "month" | "period" | "year";

export interface ReviewRow {
  boardName: string;
  studentId: number | null;
  matchedName: string | null;
  isFuzzy: boolean;
  isNew: boolean;
  tasks: string;
  present: boolean;
  rawLine?: string;
}

export interface ManualRow {
  fullName: string;
  studentId: number | null;
  tasks: number[];
  present: boolean;
  savedPresent?: boolean;
}
