import type { ConfigEntry, FormSchemaEntry } from "../core/types";

export function buildFormSchema(entries: ConfigEntry[]): FormSchemaEntry[] {
  const entryOptions = entries.map((entry) => ({
    label: entry.title,
    value: entry.entry_id,
  }));
  return [
    {
      name: "entry_id",
      required: true,
      selector: { select: { mode: "dropdown", options: entryOptions } },
      label: "UniFi Network Map Instance",
    },
    {
      name: "theme",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { label: "Dark (default)", value: "dark" },
            { label: "Light", value: "light" },
            { label: "UniFi", value: "unifi" },
            { label: "UniFi Dark", value: "unifi-dark" },
          ],
        },
      },
      label: "Theme",
    },
    {
      name: "card_height",
      selector: {
        text: {
          type: "text",
          suffix: "px",
        },
      },
      label: "Card height (optional)",
    },
  ];
}

export function normalizeTheme(
  value: string | undefined,
): "dark" | "light" | "unifi" | "unifi-dark" {
  if (value === "light") return "light";
  if (value === "unifi") return "unifi";
  if (value === "unifi-dark") return "unifi-dark";
  return "dark";
}
