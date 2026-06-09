"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save } from "lucide-react";
import type { SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { forwardRef } from "react";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { FormField } from "@/components/forms/FormField";
import { FormSection } from "@/components/forms/FormSection";
import { PageHeader } from "@/components/shared/PageHeader";
import { createLead } from "@/services/api/client/leads.service";
import { getUsers } from "@/services/api/client/users.service";

const optionalText = z.preprocess(
  (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
  z.string().trim().optional(),
);

const requiredText = (message: string, min = 1) =>
  z.preprocess(
    (val) => (typeof val === "string" ? val : ""),
    z.string().trim().min(min, message),
  );

const leadSchema = z
  .object({
    customerName: requiredText("Customer name must be at least 2 characters", 2),
    phone: optionalText,
    email: z.preprocess(
      (val) => (typeof val === "string" && val.trim() === "" ? undefined : val),
      z.string().trim().email("Enter a valid email").optional()
    ),
    alternatePhone: optionalText,
    companyName: optionalText,
    projectLocation: requiredText("Project location must be at least 2 characters", 2),
    projectType: z.enum(["DRAWING_ONLY", "2D_3D", "CONSTRUCTION_ONLY", "FULL_PROJECT"]),
    estimatedBudgetRange: optionalText,
    preferredStartDate: optionalText,
    urgency: optionalText,
    requirementDescription: requiredText("Requirement description must be at least 10 characters", 10),
    drawingRequirements: optionalText,
    constructionRequirements: optionalText,
    additionalNotes: optionalText,
    leadSource: optionalText,
    assignedMarketingOwnerId: optionalText,
    priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]),
    tags: optionalText,
  });

type LeadInput = z.input<typeof leadSchema>;
type LeadValues = z.output<typeof leadSchema>;

export function LeadFormPage() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);
  const { data: users = [] } = useQuery({ queryKey: ["lead-owner-users"], queryFn: getUsers });
  const marketingOwners = useMemo(
    () => users.filter((user) => user.role === "marketing_executive" || user.role === "marketing_manager" || user.role === "super_admin"),
    [users],
  );
  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LeadInput, unknown, LeadValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      projectType: "FULL_PROJECT",
      priority: "MEDIUM",
      assignedMarketingOwnerId: "",
    },
  });

  useEffect(() => {
    if (marketingOwners[0]?.id) setValue("assignedMarketingOwnerId", marketingOwners[0].id, { shouldValidate: true });
  }, [marketingOwners, setValue]);

  const mutation = useMutation({
    mutationFn: (values: LeadValues) =>
      createLead({
        customer_name: values.customerName,
        phone: values.phone,
        email: values.email,
        alternate_phone: values.alternatePhone,
        company_name: values.companyName,
        project_location: values.projectLocation,
        project_type: toDbProjectType(values.projectType),
        requirement_description: values.requirementDescription,
        drawing_requirements: values.drawingRequirements,
        construction_requirements: values.constructionRequirements,
        additional_notes: values.additionalNotes,
        lead_source: values.leadSource,
        priority: values.priority.toLowerCase(),
        assigned_marketing_owner_id: values.assignedMarketingOwnerId,
        preferred_start_date: values.preferredStartDate,
        estimated_budget_range: values.estimatedBudgetRange,
        urgency: values.urgency || undefined,
        tags: values.tags,
      }),
    onSuccess: () => {
      setToast("Lead created successfully.");
      router.push("/marketing/leads");
    },
    onError: (error) => setToast(error instanceof Error ? error.message : "Could not create lead."),
  });

  function onSubmit(values: LeadValues) {
    mutation.mutate(values);
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="New Lead" description="Create a lead with customer, project, requirement, and internal routing details." />
      {toast ? <div className="rounded-md border border-cyan-200 bg-cyan-50 p-3 text-sm font-medium text-cyan-800">{toast}</div> : null}
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
            <SelectField label="Project type" error={errors.projectType?.message} {...register("projectType")} options={[{ value: "DRAWING_ONLY", label: "Drawing only" }, { value: "2D_3D", label: "2D / 3D" }, { value: "CONSTRUCTION_ONLY", label: "Construction only" }, { value: "FULL_PROJECT", label: "Full project" }]} />
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
            <SelectField label="Assigned marketing owner" error={errors.assignedMarketingOwnerId?.message} {...register("assignedMarketingOwnerId")} options={marketingOwners.map((owner) => ({ value: owner.id, label: `${owner.name} (${owner.role.replaceAll("_", " ")})` }))} placeholder={marketingOwners.length ? "Select owner" : "No marketing owners found"} />
            <SelectField label="Priority" error={errors.priority?.message} {...register("priority")} options={[{ value: "LOW", label: "Low" }, { value: "MEDIUM", label: "Medium" }, { value: "HIGH", label: "High" }, { value: "URGENT", label: "Urgent" }]} />
            <FormField label="Tags" placeholder="steel, urgent, tender" error={errors.tags?.message} {...register("tags")} />
          </div>
        </FormSection>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-300 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50">
            <Save className="h-4 w-4" />
            Save Draft
          </button>
          <button type="submit" disabled={isSubmitting || mutation.isPending} className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-sm font-semibold text-white hover:bg-cyan-800">
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

const SelectField = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; placeholder?: string; options: Array<string | { value: string; label: string }> }>(function SelectField({ label, error, options, placeholder, ...props }, ref) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select {...props} ref={ref} className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100">
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((option) => {
          const value = typeof option === "string" ? option : option.value;
          const labelText = typeof option === "string" ? option : option.label;
          return <option key={value} value={value}>{labelText}</option>;
        })}
      </select>
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
});

function toDbProjectType(value: LeadValues["projectType"]) {
  const map = {
    DRAWING_ONLY: "drawing_only",
    "2D_3D": "2d_3d",
    CONSTRUCTION_ONLY: "construction_only",
    FULL_PROJECT: "full_project",
  } as const;
  return map[value];
}

const TextareaField = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }>(function TextareaField({ label, error, ...props }, ref) {
  return (
    <label className="grid gap-1.5">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <textarea {...props} ref={ref} rows={4} className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100" />
      {error ? <span className="text-xs font-medium text-red-600">{error}</span> : null}
    </label>
  );
});
