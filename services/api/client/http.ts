async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const body = contentType.includes("application/json") ? await res.json().catch(() => undefined) : undefined;
  if (!res.ok) throw new Error((body as { error?: string } | undefined)?.error ?? "Request failed");
  if (body === undefined) throw new Error("Expected JSON response from API");
  return (body.data ?? body) as T;
}

export async function apiGet<T>(url: string) {
  return parseResponse<T>(await fetch(url));
}

export async function apiPost<T>(url: string, body: unknown) {
  return parseResponse<T>(
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export async function apiPatch<T>(url: string, body: unknown) {
  return parseResponse<T>(
    await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

export function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === "object" && Array.isArray((value as { data?: unknown }).data)) {
    return (value as { data: T[] }).data;
  }
  return [];
}
