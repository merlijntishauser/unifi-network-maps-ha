import { DOMAIN } from "../shared/constants";
import type { CardConfig } from "./types";

export function normalizeConfig(config: CardConfig): CardConfig {
  if (config.entry_id) {
    const theme = config.theme ?? "dark";
    const themeSuffix = `?theme=${theme}`;
    return {
      entry_id: config.entry_id,
      theme,
      svg_url: `/api/${DOMAIN}/${config.entry_id}/svg${themeSuffix}`,
      data_url: `/api/${DOMAIN}/${config.entry_id}/payload`,
      card_height: config.card_height,
    };
  }
  return config;
}

export function startPolling(
  currentId: number | undefined,
  intervalMs: number,
  onTick: () => void,
): number {
  if (currentId !== undefined) {
    window.clearInterval(currentId);
  }
  return window.setInterval(onTick, intervalMs);
}

export function stopPolling(currentId: number | undefined): number | undefined {
  if (currentId !== undefined) {
    window.clearInterval(currentId);
  }
  return undefined;
}
