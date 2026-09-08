"use client";

import { useState, useEffect, useCallback } from "react";
import type { Grade } from "@/lib/format";
import type { ReviewRow } from "@/lib/types";
import type { StudentRef } from "@/lib/name-matcher";
import { matchStudent } from "@/lib/name-matcher";
import { todayKey, toDateKey } from "@/lib/dates";
import { ClassSelector } from "@/components/ClassSelector";
import { AdminNav } from "@/components/AdminNav";
import { PhotoUpload } from "@/components/PhotoUpload";
import { LessonEntryForm } from "@/components/LessonEntryForm";
import { ReviewScreen } from "@/components/ReviewScreen";

type Tab = "photo" | "manual";

const VALID_TABS: Tab[] = ["photo", "manual"];

function readTabFromUrl(): Tab {
  if (typeof window === "undefined") return "manual";
  const value = new URLSearchParams(window.location.search).get("tab");
  return VALID_TABS.includes(value as Tab) ? (value as Tab) : "manual";
}

export default function AdminPage() {
  const [grade, setGrade] = useState<Grade>(5);
  const [tab, setTabState] = useState<Tab>("manual");
  const [maxTask, setMaxTask] = useState(20);
  const [students, setStudents] = useState<StudentRef[]>([]);
  const [reviewRows, setReviewRows] = useState<ReviewRow[] | null>(null);
  const [reviewDate, setReviewDate] = useState(() => todayKey());
  const [saving, setSaving] = useState(false);
  const [undoInfo, setUndoInfo] = useState<{ lessonId: number } | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const setTab = (next: Tab) => {
    setTabState(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    window.history.replaceState(null, "", url.toString());
  };

  const loadStudents = useCallback(() => {
    fetch(`/api/students?grade=${grade}`)
      .then((r) => r.json())
      .then(setStudents)
      .catch(console.error);
  }, [grade]);

  useEffect(() => {
    setTabState(readTabFromUrl());
  }, []);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) => setMaxTask(s.maxTaskNumber ?? 20))
      .catch(console.error);
  }, []);

  useEffect(() => {
    loadStudents();
  }, [grade, loadStudents]);

  const handlePhotoParsed = (result: {
    date: Date | null;
    rows: { fullName: string; tasks: string; present: boolean }[];
  }) => {
    if (result.date) {
      setReviewDate(toDateKey(result.date));
    }
    const usedIds = new Set<number>();
    const rows: ReviewRow[] = result.rows.map((r) => {
      const match = matchStudent(r.fullName, students, usedIds);
      if (match.studentId) usedIds.add(match.studentId);
      return {
        boardName: r.fullName,
        studentId: match.studentId,
        matchedName: match.matchedName,
        isFuzzy: match.isFuzzy,
        isNew: match.isNew,
        tasks: r.tasks,
        present: r.present,
      };
    });
    setReviewRows(rows);
  };

  const saveLesson = async (
    entries: { fullName: string; studentId: number | null; tasks: string; present: boolean }[],
    date: string,
    options?: { silent?: boolean }
  ): Promise<boolean> => {
    setSaving(true);
    try {
      const res = await fetch("/api/lessons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ grade, date, entries }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setReviewRows(null);
      if (!options?.silent) {
        setToast("Урок сохранён");
        setTimeout(() => setToast(null), 3000);
      }
      setUndoInfo({ lessonId: data.lesson.id });
      setTimeout(() => setUndoInfo(null), 30000);
      return true;
    } catch {
      if (!options?.silent) alert("Ошибка сохранения");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleUndo = async () => {
    if (!undoInfo) return;
    await fetch("/api/lessons", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lessonId: undoInfo.lessonId }),
    });
    setUndoInfo(null);
    setToast(null);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <AdminNav current="/admin" />
      <h1 className="text-2xl font-bold mb-4">Быстрый ввод за урок</h1>

      <div className="mb-6">
        <ClassSelector grade={grade} onChange={setGrade} />
      </div>

      <div className="flex gap-2 mb-6">
        {(["photo", "manual"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-2 text-sm ${
              tab === t ? "bg-emerald-600 text-white" : "bg-zinc-100 dark:bg-zinc-800"
            }`}
          >
            {t === "photo" ? "Фото доски" : "Ручной ввод"}
          </button>
        ))}
      </div>

      {tab === "photo" && !reviewRows && (
        <PhotoUpload maxTask={maxTask} onParsed={handlePhotoParsed} />
      )}

      {tab === "photo" && reviewRows && (
        <ReviewScreen
          rows={reviewRows}
          students={students}
          maxTask={maxTask}
          date={reviewDate}
          onDateChange={setReviewDate}
          onRowsChange={setReviewRows}
          onSave={() =>
            saveLesson(
              reviewRows.map((r) => ({
                fullName: r.boardName,
                studentId: r.studentId,
                tasks: r.tasks,
                present: r.present,
              })),
              reviewDate
            )
          }
          onCancel={() => setReviewRows(null)}
          saving={saving}
        />
      )}

      {tab === "manual" && (
        <LessonEntryForm
          grade={grade}
          maxTask={maxTask}
          onSave={saveLesson}
          saving={saving}
        />
      )}

      {toast && (
        <div className="fixed bottom-4 right-4 bg-zinc-900 text-white px-4 py-3 rounded-lg shadow-lg flex gap-3 items-center">
          {toast}
          {undoInfo && (
            <button onClick={handleUndo} className="text-amber-400 underline text-sm">
              Отменить
            </button>
          )}
        </div>
      )}
    </div>
  );
}
