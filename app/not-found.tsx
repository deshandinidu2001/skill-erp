import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center bg-slate-100 p-6">
      <div className="rounded-md border border-slate-200 bg-white p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold text-slate-950">Page not found</h1>
        <Link href="/dashboard" className="mt-4 inline-block rounded-md bg-cyan-700 px-3 py-2 text-sm font-semibold text-white">Go to dashboard</Link>
      </div>
    </div>
  );
}
