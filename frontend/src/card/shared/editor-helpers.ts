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
          ],
        },
      },
      label: "Theme",
    },
  ];
}

export function normalizeTheme(value: string | undefined): "dark" | "light" | "unifi" {
  if (value === "light") return "light";
  if (value === "unifi") return "unifi";
  return "dark";
}
