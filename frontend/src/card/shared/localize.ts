import type { Hass } from "../core/types";
import { de } from "./locales/de";
import { en } from "./locales/en";
import { es } from "./locales/es";
import { fr } from "./locales/fr";
import { nl } from "./locales/nl";

export type LocalizeFunc = (key: string, replacements?: Record<string, string | number>) => string;

type TranslationMap = Record<string, string>;

const TRANSLATIONS: Record<string, TranslationMap> = {
  de,
  en,
  es,
  fr,
  nl,
};

function normalizeLanguage(language: string | undefined): string | undefined {
  if (!language) return undefined;
  const base = language.toLowerCase().split("-")[0];
  return base in TRANSLATIONS ? base : undefined;
}

function formatTemplate(
  template: string,
  replacements: Record<string, string | number> | undefined,
): string {
  if (!replacements) return template;
  let result = template;
  for (const [key, value] of Object.entries(replacements)) {
    const token = `{${key}}`;
    result = result.split(token).join(String(value));
  }
  return result;
}

type HassLocaleInfo = { locale?: { language?: string }; language?: string };

export function createLocalize(hass?: Hass & HassLocaleInfo): LocalizeFunc {
  const language =
    normalizeLanguage(hass?.locale?.language) ||
    normalizeLanguage(hass?.language) ||
    normalizeLanguage(navigator.language) ||
    "en";
  return (key, replacements) => {
    const dict = TRANSLATIONS[language] ?? TRANSLATIONS.en;
    const template = dict[key] ?? TRANSLATIONS.en[key] ?? key;
    return formatTemplate(template, replacements);
  };
}
