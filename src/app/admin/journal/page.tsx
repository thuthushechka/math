"use client";

import { useState, useEffect, useCallback } from "react";
import type { Grade } from "@/lib/format";
import type { JournalData } from "@/lib/types";
import { ClassSelector } from "@/components/ClassSelector";
import { AdminNav } from "@/components/AdminNav";
import { JournalTable } from "@/components/JournalTable";
import { ConfirmDelete } from "@/components/ConfirmDelete";
import { TrashIcon } from "@/components/TrashIcon";

export default function AdminJournalPage() {
  const [grade, setGrade] = useState<Grade>(5);
  const [data, setData] = useState<JournalData | null>(null);
  const [clearOpen, setClearOpen] = useState(false);

  const load = useCallback(() => {
    fetch(`/api/journal?grade=${grade}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error);
  }, [grade]);

  useEffect(() => {
    load();
  }, [load]);

  const handleClearJournal = async () => {
    await fetch(`/api/journal?grade=${grade}`, { method: "DELETE" });
    setClearOpen(false);
    load();
  };

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
      <AdminNav current="/admin/journal" />
      <h1 className="text-xl sm:text-2xl font-bold mb-4">Журнал посещений</h1>

      <div className="mb-4 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center justify-between gap-3">
        <ClassSelector grade={grade} onChange={setGrade} />
        <button
          onClick={() => setClearOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-sm text-red-600 hover:bg-red-100 dark:border-red-900 dark:bg-red-950 dark:hover:bg-red-900"
        >
          <TrashIcon className="w-4 h-4" />
          Очистить журнал
        </button>
      </div>

      {data && (
        <JournalTable
          data={data}
          defaultMode="month"
          showTotals
          adminMode
          onRefresh={load}
        />
      )}

      <ConfirmDelete
        open={clearOpen}
        title="Очистить журнал?"
        message={`Будут удалены все данные для ${grade} класса:`}
        details={[
          "Уроки и даты посещений",
          "Задачи учеников",
          "ФИО учеников из справочника",
        ]}
        onConfirm={handleClearJournal}
        onCancel={() => setClearOpen(false)}
      />
    </div>
  );
}
