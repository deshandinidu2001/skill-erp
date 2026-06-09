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
    <main className="grid min-h-screen bg-slate-100 px-4 py-8 lg:grid-cols-[1fr_480px]">
      <section className="hidden items-center justify-center bg-[linear-gradient(135deg,#0f766e,#155e75)] p-10 text-white lg:flex">
        <div className="max-w-xl">
          <div className="mb-8 grid h-16 w-16 place-items-center rounded-md bg-white text-xl font-bold text-cyan-800">
            SE
          </div>
          <h1 className="text-4xl font-semibold tracking-tight">Skill Engineering ERP</h1>
          <p className="mt-4 text-lg leading-8 text-cyan-50">
            Operations control for leads, estimates, projects, stock, HR, vehicles, accounting, and reports.
          </p>
        </div>
      </section>
      <section className="flex items-center justify-center">
        <div className="w-full max-w-md rounded-md border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="mb-4 grid h-12 w-12 place-items-center rounded-md bg-cyan-700 text-sm font-bold text-white lg:hidden">
              SE
            </div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">Skill Engineering ERP</h2>
            <p className="mt-1 text-sm text-slate-500">Select a demo role to enter the system.</p>
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
                className="h-11 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"
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
              className="mt-2 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-70"
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
