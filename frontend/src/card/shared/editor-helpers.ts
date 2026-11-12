import type { CardConfig, ConfigEntry, FormSchemaEntry } from "../core/types";
import type { LocalizeFunc } from "./localize";
import { parseSsids, parseVlanIds } from "../interaction/network-filter";

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
    {
      name: "vlan_filter",
      selector: { text: { type: "text" } },
      label: localize("editor.vlan_filter"),
    },
    {
      name: "ssid_filter",
      selector: { text: { type: "text" } },
      label: localize("editor.ssid_filter"),
    },
  ];
}

export type NetworkFilterField = "vlan_filter" | "ssid_filter";

export const NETWORK_FILTER_FIELDS: readonly NetworkFilterField[] = ["vlan_filter", "ssid_filter"];

/** Comma-separated text from the editor field, as a list for the card config. */
export function parseFilterText(field: NetworkFilterField, text: unknown): Array<number | string> {
  const items = typeof text === "string" ? text.split(",") : [];
  return field === "vlan_filter" ? parseVlanIds(items) : parseSsids(items);
}

/** The card config's filter value (single value or list) as editor text. */
export function formatFilterText(field: NetworkFilterField, value: unknown): string {
  const items = field === "vlan_filter" ? parseVlanIds(value) : parseSsids(value);
  return items.join(", ");
}

export function sameFilterList(
  left: Array<number | string>,
  right: Array<number | string>,
): boolean {
  return left.length === right.length && left.every((item, index) => item === right[index]);
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
