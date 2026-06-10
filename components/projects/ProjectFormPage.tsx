"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { SelectHTMLAttributes } from "react";
import { forwardRef, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { PageHeader } from "@/components/shared/PageHeader";
import { createProject } from "@/services/api/client/projects.service";
import { getUsers } from "@/services/api/client/users.service";
import { apiGet } from "@/services/api/client/http";

const requiredText = (message: string, min = 1) =>
  z.preprocess(
    (val) => (typeof val === "string" ? val : ""),
    z.string().trim().min(min, message),
  );

const projectSchema = z.object({
  projectName: requiredText("Project name is required", 2),
  clientId: requiredText("Customer is required"),
  budgetAmount: z.coerce.number().min(0, "Budget cannot be negative"),
  startDate: requiredText("Start date is required"),
  endDate: requiredText("End date is required"),
  assignedProjectManagerId: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

type ProjectInput = z.input<typeof projectSchema>;
type ProjectValues = z.output<typeof projectSchema>;

export function ProjectFormPage() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  // Fetch users
  const { data: users = [] } = useQuery({ queryKey: ["users"], queryFn: getUsers });
  
  // Fetch customers
  const { data: customers = [] } = useQuery({
    queryKey: ["customers"],
    queryFn: () => apiGet<any[]>("/api/customers").then(d => d ?? [])
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProjectInput, unknown, ProjectValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      projectName: "",
      clientId: "",
      budgetAmount: 0,
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      assignedProjectManagerId: "",
      priority: "medium",
    },
  });

  const mutation = useMutation({
    mutationFn: (values: ProjectValues) =>
      createProject({
        project_name: values.projectName,
        client_id: Number(values.clientId),
        budget_amount: Number(values.budgetAmount),
        start_date: values.startDate,
        end_date: values.endDate,
        assigned_project_manager_id: values.assignedProjectManagerId || undefined,
        priority: values.priority,
      }),
    onSuccess: () => {
      setToast("Project created successfully.");
      setTimeout(() => {
        router.push("/projects");
      }, 1500);
    },
    onError: (error) => setToast(error instanceof Error ? error.message : "Could not create project."),
  });

  function onSubmit(values: ProjectValues) {
    if (new Date(values.endDate) < new Date(values.startDate)) {
      setToast("End date cannot be before start date.");
      return;
    }
    mutation.mutate(values);
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="New Project" description="Create a project manually and assign a project manager." />
      {toast ? <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm font-medium text-cyan-800">{toast}</div> : null}
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
        <FormSection title="Project Details">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Project Name" error={errors.projectName?.message} {...register("projectName")} />
            
            <SelectField 
              label="Customer" 
              error={errors.clientId?.message} 
              {...register("clientId")} 
              options={customers.map((c) => ({ value: String(c.id), label: `${c.display_name} (${c.customer_code})` }))} 
              placeholder={customers.length ? "Select customer" : "No customers found"} 
            />

            <FormField label="Budget Amount (LKR)" type="number" error={errors.budgetAmount?.message} {...register("budgetAmount")} />
            
            <SelectField 
              label="Priority" 
              error={errors.priority?.message} 
              {...register("priority")} 
              options={[{ value: "low", label: "Low" }, { value: "medium", label: "Medium" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} 
            />
          </div>
        </FormSection>

        <FormSection title="Schedule & Management">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Start Date" type="date" error={errors.startDate?.message} {...register("startDate")} />
            <FormField label="End Date" type="date" error={errors.endDate?.message} {...register("endDate")} />
            
            <SelectField 
              label="Project Manager" 
              error={errors.assignedProjectManagerId?.message} 
              {...register("assignedProjectManagerId")} 
              options={users.map((u) => ({ value: u.id, label: `${u.name} (${u.role.replaceAll("_", " ")})` }))} 
              placeholder="Select project manager" 
            />
          </div>
        </FormSection>

        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800">
            <Save className="h-4 w-4" />
            Create Project
          </button>
          <Link href="/projects" className="inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; placeholder?: string; options: Array<{ value: string; label: string }> }>(function SelectField({ label, error, options, placeholder, ...props }, ref) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select {...props} ref={ref} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100">
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
});
