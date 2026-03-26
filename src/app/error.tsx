"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ reset }: ErrorProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
      <h1 className="text-2xl font-bold mb-2">Что-то пошло не так</h1>
      <p className="text-slate-600 mb-6">Попробуйте обновить страницу.</p>
      <button
        onClick={reset}
        className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition"
      >
        Обновить
      </button>
    </div>
  );
}

