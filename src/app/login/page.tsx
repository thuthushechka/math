"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Ошибка входа");
        return;
      }
      router.push(data.redirect);
    } catch {
      setError("Ошибка соединения");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-emerald-50 to-zinc-100 dark:from-zinc-900 dark:to-zinc-950">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center mb-2">Математический кружок</h1>
        <p className="text-center text-zinc-500 text-sm mb-6">
          {isAdmin ? "Вход для учителя" : "Вход для родителей"}
        </p>
        {!isAdmin && (
          <p className="text-center text-zinc-400 text-xs mb-4">
            Логин: math · пароль: math4, math5, math6 или math7 (номер класса)
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Логин</label>
            <input
              type="text"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              placeholder={isAdmin ? "admin" : "math"}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Пароль</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-800"
              placeholder={isAdmin ? "" : "math5"}
              autoComplete="current-password"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-emerald-600 py-2.5 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? "Вход…" : "Войти"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsAdmin(!isAdmin)}
            className="text-sm text-emerald-700 hover:underline"
          >
            {isAdmin ? "← Вход для родителей" : "Вход для учителя →"}
          </button>
        </div>
      </div>
    </div>
  );
}
