"use client";

import { useState, useRef } from "react";
import Tesseract from "tesseract.js";
import { parseOcrText } from "@/lib/ocr-parser";

interface PhotoUploadProps {
  maxTask: number;
  onParsed: (result: {
    date: Date | null;
    rows: { fullName: string; tasks: string; present: boolean; rawLine: string }[];
  }) => void;
}

export function PhotoUpload({ maxTask, onParsed }: PhotoUploadProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const processImage = async (file: File) => {
    setLoading(true);
    setProgress(0);
    try {
      const result = await Tesseract.recognize(file, "rus", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress) {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });

      const parsed = parseOcrText(result.data.text, maxTask);
      const date = parsed.date ?? new Date();
      onParsed({ date, rows: parsed.rows });
    } catch (e) {
      console.error(e);
      alert("Ошибка распознавания. Попробуйте другое фото или ручной ввод.");
    } finally {
      setLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-600 p-6 text-center">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) processImage(file);
        }}
      />
      {loading ? (
        <div>
          <p className="text-sm text-zinc-600">Распознавание… {progress}%</p>
          <div className="mt-2 h-2 bg-zinc-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      ) : (
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-emerald-600 px-6 py-3 text-white font-medium hover:bg-emerald-700"
        >
          📷 Загрузить фото доски
        </button>
      )}
      <p className="mt-2 text-xs text-zinc-500">
        Tesseract.js (rus) — проверьте результат на экране сопоставления
      </p>
    </div>
  );
}
