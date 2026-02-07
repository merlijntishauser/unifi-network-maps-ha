import type { AuthFetchResult } from "./auth";

export type FetchWithAuth = <T>(
  url: string,
  signal: AbortSignal,
  parseResponse: (response: Response) => Promise<T>,
) => Promise<AuthFetchResult<T>>;

export interface SvgLoadResult {
  svg: string;
  background: string | null;
}

export async function loadSvg(
  fetchWithAuth: FetchWithAuth,
  url: string,
  signal: AbortSignal,
): Promise<AuthFetchResult<SvgLoadResult>> {
  return fetchWithAuth(url, signal, async (response) => {
    const svg = await response.text();
    const background = response.headers.get("X-Theme-Background");
    return { svg, background };
  });
}

export async function loadPayload<T>(
  fetchWithAuth: FetchWithAuth,
  url: string,
  signal: AbortSignal,
): Promise<AuthFetchResult<T>> {
  return fetchWithAuth(url, signal, (response) => response.json());
}
