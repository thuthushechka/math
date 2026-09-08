"use client";

import { useState, useEffect } from "react";
import { AdminNav } from "@/components/AdminNav";

export default function SettingsPage() {
  const [form, setForm] = useState({
    pricePerLesson: 1200,
    maxTaskNumber: 20,
    adminLogin: "admin",
    parentLogin: "math",
    adminPassword: "",
  });
  const [saved, setSaved] = useState(false);
  const [backupMsg, setBackupMsg] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((s) =>
        setForm((f) => ({
          ...f,
          pricePerLesson: s.pricePerLesson,
          maxTaskNumber: s.maxTaskNumber,
          adminLogin: s.adminLogin,
          parentLogin: s.parentLogin,
        }))
      )
      .catch(console.error);
  }, []);

  const save = async () => {
    const body: Record<string, unknown> = {
      pricePerLesson: form.pricePerLesson,
      maxTaskNumber: form.maxTaskNumber,
      adminLogin: form.adminLogin,
      parentLogin: form.parentLogin,
    };
    if (form.adminPassword) body.adminPassword = form.adminPassword;

    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaved(true);
    setForm((f) => ({ ...f, adminPassword: "" }));
    setTimeout(() => setSaved(false), 3000);
  };

  const downloadBackup = async () => {
    const res = await fetch("/api/backup");
    if (res.headers.get("content-type")?.includes("json")) {
      const data = await res.json();
      setBackupMsg(data.message ?? "Используйте Turso CLI для бэкапа");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `math-club-backup-${new Date().toISOString().slice(0, 10)}.db`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      <AdminNav current="/admin/settings" />
      <h1 className="text-2xl font-bold mb-6">Настройки</h1>

      <div className="space-y-4">
        <label className="block">
          <span className="text-sm font-medium">Цена за занятие (₽)</span>
          <input
            type="number"
            value={form.pricePerLesson}
            onChange={(e) =>
              setForm({ ...form, pricePerLesson: parseInt(e.target.value, 10) })
            }
            className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Макс. номер задачи</span>
          <input
            type="number"
            value={form.maxTaskNumber}
            onChange={(e) =>
              setForm({ ...form, maxTaskNumber: parseInt(e.target.value, 10) })
            }
            className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </label>

        <hr className="dark:border-zinc-700" />

        <label className="block">
          <span className="text-sm font-medium">Логин учителя</span>
          <input
            value={form.adminLogin}
            onChange={(e) => setForm({ ...form, adminLogin: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Новый пароль учителя (пусто = не менять)</span>
          <input
            type="password"
            value={form.adminPassword}
            onChange={(e) => setForm({ ...form, adminPassword: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Логин родителей</span>
          <input
            value={form.parentLogin}
            onChange={(e) => setForm({ ...form, parentLogin: e.target.value })}
            className="mt-1 w-full rounded-lg border px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
          />
        </label>
        <p className="text-sm text-zinc-500">
          Пароль родителей: <strong>math4</strong>, <strong>math5</strong>, <strong>math6</strong> или <strong>math7</strong> — в зависимости от класса ребёнка.
        </p>

        <button
          onClick={save}
          className="w-full rounded-lg bg-emerald-600 py-2.5 text-white font-medium hover:bg-emerald-700"
        >
          {saved ? "Сохранено ✓" : "Сохранить"}
        </button>

        <hr className="dark:border-zinc-700" />

        <div>
          <h2 className="font-semibold mb-2">Резервное копирование</h2>
          <button
            onClick={downloadBackup}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-600 dark:hover:bg-zinc-800"
          >
            Скачать бэкап БД
          </button>
          {backupMsg && <p className="mt-2 text-sm text-zinc-500">{backupMsg}</p>}
          <p className="mt-2 text-xs text-zinc-500">
            Рекомендуется еженедельный экспорт через Turso CLI:{" "}
            <code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded">
              turso db shell &lt;db&gt; .dump &gt; backup.sql
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
