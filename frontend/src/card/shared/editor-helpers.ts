import type { ConfigEntry, FormSchemaEntry } from "../core/types";
import type { LocalizeFunc } from "./localize";

export function buildFormSchema(entries: ConfigEntry[], localize: LocalizeFunc): FormSchemaEntry[] {
  const entryOptions = entries.map((entry) => ({
    label: entry.title,
    value: entry.entry_id,
  }));
  return [
    {
      name: "entry_id",
      required: true,
      selector: { select: { mode: "dropdown", options: entryOptions } },
      label: localize("editor.entry_id"),
    },
    {
      name: "theme",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { label: localize("editor.theme.dark"), value: "dark" },
            { label: localize("editor.theme.light"), value: "light" },
            { label: localize("editor.theme.unifi"), value: "unifi" },
            { label: localize("editor.theme.unifi_dark"), value: "unifi-dark" },
          ],
        },
      },
      label: localize("editor.theme"),
    },
    {
      name: "card_height",
      selector: {
        text: {
          type: "text",
          suffix: "px",
        },
      },
      label: localize("editor.card_height"),
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
