"use client";

interface ConfirmDeleteProps {
  open: boolean;
  title: string;
  message: string;
  details?: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDelete({
  open,
  title,
  message,
  details,
  onConfirm,
  onCancel,
}: ConfirmDeleteProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl dark:bg-zinc-900">
        <h3 className="mb-2 text-lg font-semibold text-red-600">{title}</h3>
        <p className={`text-sm text-zinc-600 dark:text-zinc-400 ${details?.length ? "mb-2" : "mb-4"}`}>{message}</p>
        {details && details.length > 0 && (
          <ul className="mb-4 list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400 space-y-0.5">
            {details.map((d) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        )}
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="rounded-lg px-4 py-2 text-sm text-zinc-600 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>
  );
}
