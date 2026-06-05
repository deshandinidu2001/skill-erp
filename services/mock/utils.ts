import { includesText } from "@/lib/utils";
import type { FilterParams } from "@/types";

export async function mockDelay() {
  const wait = 300 + Math.floor(Math.random() * 301);
  await new Promise((resolve) => setTimeout(resolve, wait));
  if (Math.floor(Math.random() * 20) === 0) {
    throw new Error("Mock service unavailable. Try again.");
  }
}

export function filterRecords<T extends object>(
  records: T[],
  params: FilterParams = {},
  searchable: (keyof T)[],
) {
  return records.filter((record) => {
    const values = record as Record<string, unknown>;
    const matchesSearch =
      !params.search ||
      searchable.some((key) => includesText(values[String(key)], params.search));
    const matchesStatus = !params.status || values.status === params.status;
    const matchesOwner = !params.owner || values.owner === params.owner;
    const matchesDepartment =
      !params.department || values.department === params.department;

    return matchesSearch && matchesStatus && matchesOwner && matchesDepartment;
  });
}
