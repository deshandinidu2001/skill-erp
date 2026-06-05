"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Save } from "lucide-react";
import type { SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { PageHeader } from "@/components/shared/PageHeader";
import { getEmployees } from "@/services/api/client/hr.service";

const leadSchema = z
  .object({
    customerName: z.string().trim().min(2, "Customer name is required"),
    phone: z.string().trim().optional(),
    email: z.string().trim().email("Enter a valid email").optional().or(z.literal("")),
    alternatePhone: z.string().trim().optional(),
    companyName: z.string().trim().optional(),
    projectLocation: z.string().trim().min(2, "Project location is required"),
    projectType: z.enum(["DRAWING_ONLY", "2D_3D", "CONSTRUCTION_ONLY", "FULL_PROJECT"]),
    estimatedBudgetRange: z.string().trim().optional(),
    preferredStartDate: z.string().optional(),
    urgency: z.string().trim().optional(),
    requirementDescription: z.string().trim().min(10, "Requirement description is required"),
    drawingRequirements: z.string().trim().optional(),
    constructionRequirements: z.string().trim().optional(),
    additionalNotes: z.string().trim().optional(),
    leadSource: z.string().trim().optional(),
    assignedMarketingOwnerId: z.string().trim().min(1, "Owner is required"),
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    tags: z.string().trim().optional(),
  })
  .refine((value) => Boolean(value.phone?.trim() || value.email?.trim()), {
    message: "At least phone or email is required",
    path: ["phone"],
  });

type LeadInput = z.input<typeof leadSchema>;
type LeadValues = z.output<typeof leadSchema>;

export function LeadFormPage() {
  const { data: employees = [] } = useQuery({ queryKey: ["employees"], queryFn: getEmployees });
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput, unknown, LeadValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      projectType: "FULL_PROJECT",
      priority: "MEDIUM",
      assignedMarketingOwnerId: "usr_mkt",
    },
  });

  function onSubmit(values: LeadValues) {
    leadSchema.parse(values);
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="New Lead" description="Create a lead with customer, project, requirement, and internal routing details." />
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-5">
        <FormSection title="Customer" description="Search existing customer later; quick-create fields are captured now.">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Customer name" error={errors.customerName?.message} {...register("customerName")} />
            <FormField label="Phone" error={errors.phone?.message} {...register("phone")} />
            <FormField label="Email" type="email" error={errors.email?.message} {...register("email")} />
            <FormField label="Alternate phone" error={errors.alternatePhone?.message} {...register("alternatePhone")} />
            <FormField label="Company name" error={errors.companyName?.message} {...register("companyName")} />
          </div>
        </FormSection>
        <FormSection title="Project Information">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Project location" error={errors.projectLocation?.message} {...register("projectLocation")} />
            <SelectField label="Project type" error={errors.projectType?.message} {...register("projectType")} options={["DRAWING_ONLY", "2D_3D", "CONSTRUCTION_ONLY", "FULL_PROJECT"]} />
            <FormField label="Estimated budget range" error={errors.estimatedBudgetRange?.message} {...register("estimatedBudgetRange")} />
            <FormField label="Preferred start date" type="date" error={errors.preferredStartDate?.message} {...register("preferredStartDate")} />
            <FormField label="Urgency" error={errors.urgency?.message} {...register("urgency")} />
          </div>
        </FormSection>
        <FormSection title="Requirements">
          <TextareaField label="Requirement description" error={errors.requirementDescription?.message} {...register("requirementDescription")} />
          <TextareaField label="Drawing requirements" error={errors.drawingRequirements?.message} {...register("drawingRequirements")} />
          <TextareaField label="Construction requirements" error={errors.constructionRequirements?.message} {...register("constructionRequirements")} />
          <TextareaField label="Additional notes" error={errors.additionalNotes?.message} {...register("additionalNotes")} />
        </FormSection>
        <FormSection title="Internal">
          <div className="grid gap-4 md:grid-cols-2">
            <FormField label="Lead source" error={errors.leadSource?.message} {...register("leadSource")} />
            <SelectField label="Assigned marketing owner" error={errors.assignedMarketingOwnerId?.message} {...register("assignedMarketingOwnerId")} options={employees.filter((employee) => employee.department === "Marketing").map((employee) => ({ value: employee.id, label: employee.name }))} />
            <SelectField label="Priority" error={errors.priority?.message} {...register("priority")} options={["LOW", "MEDIUM", "HIGH", "URGENT"]} />
            <FormField label="Tags" placeholder="steel, urgent, tender" error={errors.tags?.message} {...register("tags")} />
          </div>
        </FormSection>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={isSubmitting} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button type="submit" disabled={isSubmitting} className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800">
            <Save className="h-4 w-4" />
            Create Lead
          </button>
          <Link href="/marketing/leads" className="inline-flex h-10 items-center rounded-md px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

function SelectField({ label, error, options, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; options: Array<string | { value: string; label: string }> }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select {...props} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100">
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const labelText = typeof option === "string" ? option : option.label;
          return <option key={value} value={value}>{labelText}</option>;
        })}
      </select>
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}

function TextareaField({ label, error, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea {...props} rows={4} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
}
