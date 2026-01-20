export type AuthFetchResult<T> = { data: T } | { error: string } | { aborted: true };

export async function fetchWithAuth<T>(
  url: string,
  token: string | undefined,
  signal: AbortSignal,
  parseResponse: (response: Response) => Promise<T>,
): Promise<AuthFetchResult<T>> {
  if (!token) {
    return { error: "Missing auth token" };
  }
  try {
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
      signal,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return { data: await parseResponse(response) };
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { aborted: true };
    }
    const message = err instanceof Error ? err.message : String(err);
    return { error: message };
  }
}
