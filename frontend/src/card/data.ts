import type { AuthFetchResult } from "./auth";

export type FetchWithAuth = <T>(
  url: string,
  signal: AbortSignal,
  parseResponse: (response: Response) => Promise<T>,
) => Promise<AuthFetchResult<T>>;

export async function loadSvg(
  fetchWithAuth: FetchWithAuth,
  url: string,
  signal: AbortSignal,
): Promise<AuthFetchResult<string>> {
  return fetchWithAuth(url, signal, (response) => response.text());
}

export async function loadPayload<T>(
  fetchWithAuth: FetchWithAuth,
  url: string,
  signal: AbortSignal,
): Promise<AuthFetchResult<T>> {
  return fetchWithAuth(url, signal, (response) => response.json());
}
