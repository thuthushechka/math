"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { ManualRow } from "@/lib/types";
import type { StudentRef } from "@/lib/name-matcher";
import { TaskButtonGrid, tasksArrayToString } from "./TaskButtonGrid";
import { ConfirmDelete } from "./ConfirmDelete";
import { TrashIcon } from "./TrashIcon";
import { todayKey } from "@/lib/dates";

interface LessonEntryFormProps {
  grade: number;
  maxTask: number;
  onSave: (
    rows: { fullName: string; studentId: number | null; tasks: string; present: boolean }[],
    date: string,
    options?: { silent?: boolean }
  ) => void | Promise<boolean>;
  saving?: boolean;
}

export function LessonEntryForm({ grade, maxTask, onSave, saving }: LessonEntryFormProps) {
  const [date, setDate] = useState(() => todayKey());
  const [students, setStudents] = useState<StudentRef[]>([]);
  const [rows, setRows] = useState<ManualRow[]>([]);
  const [suggestions, setSuggestions] = useState<StudentRef[]>([]);
  const [activeRow, setActiveRow] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ index: number; studentId: number | null; fullName: string } | null>(null);
  const hydratingRef = useRef(false);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const studentIdsKey = students.map((s) => s.id).sort((a, b) => a - b).join(",");

  const loadRows = useCallback(async (forDate: string) => {
    hydratingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/lessons?grade=${grade}&date=${forDate}`);
      const data = await res.json();
      if (data.rows?.length) {
        setRows(
          data.rows.map((r: ManualRow & { present: boolean }) => ({
            ...r,
            savedPresent: r.present,
          }))
        );
      } else {
        setRows([{ fullName: "", studentId: null, tasks: [], present: false }]);
      }
      setDirty(false);
    } catch {
      setRows([{ fullName: "", studentId: null, tasks: [], present: false }]);
      setDirty(false);
    } finally {
      setLoading(false);
      hydratingRef.current = false;
    }
  }, [grade]);

  useEffect(() => {
    fetch(`/api/students?grade=${grade}`)
      .then((r) => r.json())
      .then(setStudents)
      .catch(console.error);
  }, [grade]);

  useEffect(() => {
    loadRows(date);
  }, [date, loadRows, studentIdsKey]);

  const resolveStudentId = useCallback(
    (row: ManualRow): number | null => {
      if (row.studentId) return row.studentId;
      const name = row.fullName.trim().toLowerCase();
      if (!name) return null;
      const exact = students.find((s) => s.fullName.trim().toLowerCase() === name);
      return exact?.id ?? null;
    },
    [students]
  );

  const updateRow = (index: number, patch: Partial<ManualRow>, markDirty = true) => {
    const next = [...rows];
    next[index] = { ...next[index], ...patch };
    setRows(next);
    if (markDirty) setDirty(true);
  };

  const handleNameInput = (index: number, value: string) => {
    const row = rows[index];
    const matched =
      row.studentId != null ? students.find((s) => s.id === row.studentId) : null;
    const studentId =
      matched && matched.fullName === value ? row.studentId : null;
    updateRow(index, { fullName: value, studentId });
    setActiveRow(index);
    if (value.length > 0) {
      const filtered = students.filter((s) =>
        s.fullName.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered.slice(0, 6));
    } else {
      setSuggestions([]);
    }
  };

  const selectStudent = (index: number, student: StudentRef) => {
    updateRow(index, { fullName: student.fullName, studentId: student.id });
    setSuggestions([]);
    setActiveRow(null);
  };

  const addRow = () => {
    setRows([...rows, { fullName: "", studentId: null, tasks: [], present: false }]);
  };

  const removeRow = (index: number) => {
    setRows(rows.filter((_, i) => i !== index));
  };

  const handleDeleteClick = (index: number) => {
    const row = rows[index];
    if (row.studentId) {
      setDeleteTarget({ index, studentId: row.studentId, fullName: row.fullName });
    } else {
      removeRow(index);
    }
  };

  const confirmDeleteStudent = async () => {
    if (!deleteTarget) return;
    if (deleteTarget.studentId) {
      await fetch(`/api/students/${deleteTarget.studentId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
    }
    setDeleteTarget(null);
    fetch(`/api/students?grade=${grade}`)
      .then((r) => r.json())
      .then(setStudents)
      .catch(console.error);
    await loadRows(date);
  };

  const handleTasksChange = (index: number, tasks: number[]) => {
    const patch: Partial<ManualRow> = { tasks };
    if (tasks.length > 0) patch.present = true;
    updateRow(index, patch);
  };

  const handlePresentChange = (index: number, present: boolean) => {
    if (present) {
      updateRow(index, { present });
    } else {
      updateRow(index, { present, tasks: [] });
    }
  };

  const buildEntries = useCallback(
    () =>
      rows
        .filter((r) => r.fullName.trim())
        .filter((r) => r.present || r.savedPresent)
        .map((r) => ({
          fullName: r.fullName.trim(),
          studentId: resolveStudentId(r),
          tasks: r.present ? tasksArrayToString(r.tasks) : "",
          present: r.present,
        })),
    [rows, resolveStudentId]
  );

  const canSave = useMemo(
    () =>
      rows.some((r) => r.present && r.fullName.trim()) ||
      rows.some((r) => r.savedPresent && !r.present),
    [rows]
  );

  const persistRows = useCallback(
    async (manual: boolean) => {
      if (saving) return false;
      const entries = buildEntries();

      if (entries.length === 0) {
        if (manual) alert("Отметьте хотя бы одного ученика");
        return false;
      }

      const result = await onSave(entries, date, { silent: !manual });
      if (result === false) return false;

      const studentsRes = await fetch(`/api/students?grade=${grade}`);
      if (studentsRes.ok) {
        setStudents(await studentsRes.json());
      }
      await loadRows(date);
      return true;
    },
    [saving, buildEntries, onSave, date, grade, loadRows]
  );

  const handleSave = async () => {
    await persistRows(true);
  };

  useEffect(() => {
    if (loading || hydratingRef.current || !dirty || !canSave || saving) return;

    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      void persistRows(false);
    }, 700);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [dirty, canSave, rows, loading, saving, persistRows]);

  const handleNameKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key !== "Enter") return;
    if (activeRow === index && suggestions.length > 0) {
      e.preventDefault();
      selectStudent(index, suggestions[0]);
    }
  };

  const presentCount = rows.filter((r) => r.present).length;

  if (loading) {
    return <p className="text-sm text-zinc-500">Загрузка списка учеников…</p>;
  }

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        handleSave();
      }}
    >
      <div className="flex flex-wrap items-center gap-3 text-sm">
        <label>
          Дата:
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="ml-2 rounded border px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
          />
        </label>
        <button
          type="submit"
          disabled={saving || !dirty || !canSave}
          className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm text-white font-medium disabled:opacity-50 hover:bg-emerald-700"
        >
          {saving ? "Сохранение…" : "Сохранить"}
        </button>
        <span className="text-xs text-zinc-500">
          {saving ? "Сохраняем…" : dirty ? "Есть несохранённые изменения" : "Сохранено"}
        </span>
        <button
          type="button"
          onClick={addRow}
          className="rounded border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950"
        >
          + Добавить ученика
        </button>
        <span className="text-zinc-500">
          Отмечено: {presentCount} из {rows.length}
        </span>
      </div>

      <div className="overflow-x-auto rounded-lg border dark:border-zinc-700">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-500">
              <th className="w-8 p-1.5 text-center">✓</th>
              <th className="p-1.5 text-left min-w-[120px]">Фамилия</th>
              <th className="p-1.5 text-left">Задачи</th>
              <th className="w-8 p-1.5" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr
                key={i}
                className={`border-b last:border-0 ${
                  row.present ? "bg-emerald-50/50 dark:bg-emerald-950/20" : ""
                }`}
              >
                <td className="p-1 text-center">
                  <input
                    type="checkbox"
                    checked={row.present}
                    onChange={(e) => handlePresentChange(i, e.target.checked)}
                    className="w-4 h-4 accent-emerald-600"
                  />
                </td>
                <td className="p-1 relative">
                  <input
                    value={row.fullName}
                    onChange={(e) => handleNameInput(i, e.target.value)}
                    onFocus={() => setActiveRow(i)}
                    onBlur={() => setTimeout(() => setActiveRow(null), 150)}
                    onKeyDown={(e) => handleNameKeyDown(i, e)}
                    placeholder="Фамилия [И.]"
                    className="w-full rounded border px-2 py-1 text-sm dark:border-zinc-600 dark:bg-zinc-800"
                  />
                  {activeRow === i && suggestions.length > 0 && (
                    <div className="absolute z-20 top-full left-0 right-0 mt-0.5 bg-white dark:bg-zinc-900 border rounded shadow-lg max-h-32 overflow-y-auto">
                      {suggestions.map((s) => (
                        <button
                          key={s.id}
                          onMouseDown={() => selectStudent(i, s)}
                          className="w-full text-left px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-xs"
                        >
                          {s.fullName}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
                <td className="p-1">
                  <TaskButtonGrid
                    maxTask={maxTask}
                    selected={row.tasks}
                    onChange={(tasks) => handleTasksChange(i, tasks)}
                    compact
                  />
                </td>
                <td className="p-1 text-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteClick(i)}
                    className="text-red-400 hover:text-red-600"
                    title={row.studentId ? "Удалить ученика" : "Убрать строку"}
                  >
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-zinc-400">
        Выбор задачи автоматически отмечает посещение и сохраняет данные. Без задач — поставьте галочку вручную.
        Кнопка «Сохранить» — для ручного сохранения изменений.
      </p>

      <ConfirmDelete
        open={deleteTarget !== null && deleteTarget.studentId !== null}
        title="Удалить ученика?"
        message={`Удалить ${deleteTarget?.fullName ?? ""} из справочника со всеми записями посещений?`}
        onConfirm={confirmDeleteStudent}
        onCancel={() => setDeleteTarget(null)}
      />
    </form>
  );
}
