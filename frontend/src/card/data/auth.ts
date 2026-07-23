export type AuthFetchResult<T> = { data: T } | { error: string } | { aborted: true };

// Sentinel error shared with the card: auth recovery compares against this
// exact value, so it must never be reworded in one place only.
export const MISSING_AUTH_ERROR = "Missing auth token";

export async function fetchWithAuth<T>(
  url: string,
  token: string | undefined,
  signal: AbortSignal,
  parseResponse: (response: Response) => Promise<T>,
): Promise<AuthFetchResult<T>> {
  if (!token) {
    return { error: MISSING_AUTH_ERROR };
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
