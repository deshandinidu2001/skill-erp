"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, LogIn } from "lucide-react";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { INTERNAL_ROLES, roleLabels } from "@/constants/roles";

const loginSchema = z.object({
  role: z.enum(INTERNAL_ROLES, { message: "Select a role" }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [toast, setToast] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      role: "super_admin",
    },
  });

  async function onSubmit(values: LoginFormValues) {
    const parsed = loginSchema.parse(values);
    const result = await signIn("credentials", {
      ...parsed,
      redirect: false,
    });

    if (result?.error) {
      setToast("Could not start the demo session.");
      return;
    }

    router.push(searchParams.get("callbackUrl") || "/dashboard");
  }

  return (
    <main className="grid min-h-screen bg-[#f6f8fb] p-3 sm:p-5 lg:grid-cols-[1fr_480px]">
      <section className="hidden items-center justify-center overflow-hidden rounded-[28px] bg-[#102d36] p-12 text-white lg:flex">
        <div className="max-w-xl">
          <div className="mb-10 grid h-16 w-16 place-items-center rounded-2xl bg-[#c6f36b] text-xl font-black text-[#102d36]">
            SE
          </div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.24em] text-[#c6f36b]">One connected workspace</p>
          <h1 className="text-5xl font-bold leading-tight tracking-tight">Build better work, together.</h1>
          <p className="mt-5 text-lg leading-8 text-slate-300">
            Operations control for leads, estimates, projects, stock, HR, vehicles, accounting, and reports.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center px-3 py-12 sm:px-8">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-7 shadow-[0_20px_60px_rgba(16,45,54,0.06)] sm:p-9">
          <div className="mb-8">
            <div className="mb-6 grid h-12 w-12 place-items-center rounded-xl bg-[#102d36] text-sm font-black text-[#c6f36b] lg:hidden">
              SE
            </div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#257565]">Welcome back</p>
            <h2 className="text-3xl font-bold tracking-tight text-[#102d36]">Sign in to your workspace</h2>
            <p className="mt-2 text-sm text-slate-500">Select a demo role to explore Skill Engineering ERP.</p>
          </div>
          {toast ? (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
              {toast}
            </div>
          ) : null}
          <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-slate-700">
              Role
              <select
                className="h-12 rounded-xl border border-slate-200 bg-[#f6f8fb] px-4 text-sm text-slate-950 outline-none focus:border-teal-600 focus:ring-4 focus:ring-teal-50"
                {...register("role")}
              >
                {INTERNAL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {roleLabels[role]}
                  </option>
                ))}
              </select>
              {errors.role?.message ? (
                <span className="text-xs font-medium text-red-600">{errors.role.message}</span>
              ) : null}
            </label>
            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-3 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#102d36] px-4 text-sm font-semibold text-white hover:bg-[#1c4950] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {!isSubmitting ? <LogIn className="h-4 w-4" /> : null}
              Start demo
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
