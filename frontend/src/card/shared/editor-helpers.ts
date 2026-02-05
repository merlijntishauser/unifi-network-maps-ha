import type { CardConfig, ConfigEntry, FormSchemaEntry } from "../core/types";
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
      name: "svg_theme",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { label: localize("editor.svg_theme.unifi"), value: "unifi" },
            { label: localize("editor.svg_theme.unifi_dark"), value: "unifi-dark" },
            { label: localize("editor.svg_theme.minimal"), value: "minimal" },
            { label: localize("editor.svg_theme.minimal_dark"), value: "minimal-dark" },
            { label: localize("editor.svg_theme.classic"), value: "classic" },
            { label: localize("editor.svg_theme.classic_dark"), value: "classic-dark" },
          ],
        },
      },
      label: localize("editor.svg_theme"),
    },
    {
      name: "icon_set",
      selector: {
        select: {
          mode: "dropdown",
          options: [
            { label: localize("editor.icon_set.modern"), value: "modern" },
            { label: localize("editor.icon_set.isometric"), value: "isometric" },
          ],
        },
      },
      label: localize("editor.icon_set"),
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

export function normalizeTheme(value: string | undefined): NonNullable<CardConfig["theme"]> {
  if (value === "dark" || value === "light" || value === "unifi-dark") return value;
  return "unifi";
}

export function normalizeSvgTheme(value: string | undefined): NonNullable<CardConfig["svg_theme"]> {
  const valid = ["unifi", "unifi-dark", "minimal", "minimal-dark", "classic", "classic-dark"];
  return valid.includes(value ?? "") ? (value as NonNullable<CardConfig["svg_theme"]>) : "unifi";
}

export function normalizeIconSet(value: string | undefined): NonNullable<CardConfig["icon_set"]> {
  return value === "isometric" ? "isometric" : "modern";
}
