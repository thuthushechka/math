"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

interface AdminNavProps {
  current?: string;
}

const links = [
  { href: "/admin", label: "Ввод урока" },
  { href: "/admin/journal", label: "Журнал" },
  { href: "/admin/students", label: "Ученики" },
  { href: "/admin/archive", label: "Архив" },
  { href: "/admin/settings", label: "Настройки" },
];

export function AdminNav({ current }: AdminNavProps) {
  const router = useRouter();

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <nav className="border-b border-zinc-200 dark:border-zinc-800 mb-6 -mx-3 sm:mx-0">
      <div className="flex items-start gap-2 sm:gap-3 py-3 px-3 sm:px-0">
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto overscroll-x-contain pb-0.5 sm:flex-wrap sm:overflow-visible">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`rounded-lg px-3 py-2 sm:py-1.5 text-sm whitespace-nowrap shrink-0 ${
                current === l.href
                  ? "bg-emerald-600 text-white"
                  : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
        <button
          type="button"
          onClick={logout}
          className="shrink-0 rounded-lg border border-zinc-200 px-3 py-2 sm:py-1.5 text-sm text-zinc-600 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Выйти
        </button>
      </div>
    </nav>
  );
}
