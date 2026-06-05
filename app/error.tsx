"use client";

export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <div className="rounded-md border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">Something went wrong</h1>
        <p className="mt-2 text-sm text-slate-500">Please retry the page.</p>
        <button onClick={reset} className="mt-4 rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white">Retry</button>
      </div>
    </div>
  );
}
