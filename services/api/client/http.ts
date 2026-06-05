async function parseResponse<T>(res: Response): Promise<T> {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? "Request failed");
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
