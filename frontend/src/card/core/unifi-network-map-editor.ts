import { DOMAIN } from "../shared/constants";
import {
  buildFormSchema,
  normalizeIconSet,
  normalizeSvgTheme,
  normalizeTheme,
} from "../shared/editor-helpers";
import { createLocalize } from "../shared/localize";
import type { CardConfig, ConfigEntry, FormSchemaEntry, Hass } from "./types";

export class UnifiNetworkMapEditor extends HTMLElement {
  private _config?: CardConfig;
  private _hass?: Hass;
  private _entries: ConfigEntry[] = [];
  private _localize = createLocalize();
  private _form?: HTMLElement & {
    schema: unknown;
    data: Record<string, unknown>;
    hass?: Hass;
    computeLabel?: (schema: FormSchemaEntry) => string;
  };
  private _boundOnChange = (event: Event) => this._onChange(event);

  set hass(hass: Hass) {
    this._hass = hass;
    this._localize = createLocalize(hass);
    this._loadEntries();
  }

  setConfig(config: CardConfig) {
    this._config = config;
    this._render();
  }

  private async _loadEntries() {
    if (!this._hass?.callWS) {
      return;
    }
    try {
      const entries = await this._hass.callWS<ConfigEntry[]>({
        type: "config_entries/get",
        domain: DOMAIN,
      });
      this._entries = entries;
      if (!this._config?.entry_id && this._entries.length > 0) {
        this._updateConfigEntry(this._entries[0].entry_id);
        return;
      }
      this._render();
    } catch {
      this._entries = [];
      this._render();
    }
  }

  private _render() {
    if (this._entries.length === 0) {
      this._renderNoEntries();
      return;
    }
    if (!this._form) {
      this._initializeForm();
      if (!this._form) {
        return;
      }
    }
    this._updateFormState();
  }

  private _updateFormState() {
    if (!this._form) {
      return;
    }
    this._form.hass = this._hass;
    this._form.computeLabel = (schema: FormSchemaEntry) =>
      schema.label ?? this._localize(`editor.${schema.name}`) ?? schema.name;
    this._form.schema = this._buildFormSchema();
    this._form.data = this._buildFormData();
  }

  private _buildFormData(): Record<string, unknown> {
    return {
      ...this._getFormDefaults(),
      ...this._getConfigFormValues(),
    };
  }

  private _getFormDefaults(): Record<string, unknown> {
    return {
      entry_id: "",
      theme: "unifi",
      svg_theme: "unifi",
      icon_set: "modern",
      card_height: "",
    };
  }

  private _getConfigFormValues(): Record<string, unknown> {
    const cfg = this._config;
    if (!cfg) {
      return {};
    }
    const result: Record<string, unknown> = {};
    if (cfg.entry_id !== undefined) result.entry_id = cfg.entry_id;
    if (cfg.theme !== undefined) result.theme = cfg.theme;
    if (cfg.svg_theme !== undefined) result.svg_theme = cfg.svg_theme;
    if (cfg.icon_set !== undefined) result.icon_set = cfg.icon_set;
    if (cfg.card_height !== undefined) result.card_height = cfg.card_height;
    return result;
  }

  private _renderNoEntries() {
    this.innerHTML = `
      <div style="padding: 16px;">
        <p style="color: var(--secondary-text-color);">
          ${this._localize("editor.no_entries")}
        </p>
      </div>
    `;
    this._form = undefined;
  }

  private _initializeForm() {
    this.innerHTML = `
      <div style="padding: 16px;">
        <ha-form></ha-form>
      </div>
    `;
    const form = this.querySelector("ha-form") as
      | (HTMLElement & { schema: unknown; data: Record<string, unknown> })
      | null;
    if (!form) {
      return;
    }
    this._form = form;
    this._form.addEventListener("value-changed", this._boundOnChange);
  }

  private _buildFormSchema(): FormSchemaEntry[] {
    return buildFormSchema(this._entries, this._localize);
  }

  private _onChange(e: Event) {
    const update = this._getConfigUpdate(e);
    if (!update || this._isConfigUnchanged(update)) {
      return;
    }
    this._updateConfig(update);
  }

  private _updateConfigEntry(entryId: string) {
    this._updateConfig({
      entry_id: entryId,
      theme: this._config?.theme ?? "unifi",
      svg_theme: this._config?.svg_theme ?? "unifi",
      icon_set: this._config?.icon_set ?? "modern",
    });
  }

  private _updateConfig(update: {
    entry_id: string;
    theme: NonNullable<CardConfig["theme"]>;
    svg_theme: NonNullable<CardConfig["svg_theme"]>;
    icon_set: NonNullable<CardConfig["icon_set"]>;
    card_height?: string | number;
  }) {
    this._config = {
      ...this._config,
      type: "custom:unifi-network-map",
      entry_id: update.entry_id,
      theme: update.theme,
      svg_theme: update.svg_theme,
      icon_set: update.icon_set,
      card_height: update.card_height,
    };
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _getConfigUpdate(e: Event): {
    entry_id: string;
    theme: NonNullable<CardConfig["theme"]>;
    svg_theme: NonNullable<CardConfig["svg_theme"]>;
    icon_set: NonNullable<CardConfig["icon_set"]>;
    card_height?: string | number;
  } | null {
    const detail = (
      e as CustomEvent<{
        value?: {
          entry_id?: string;
          theme?: string;
          svg_theme?: string;
          icon_set?: string;
          card_height?: string | number;
        };
      }>
    ).detail;
    const entryId = this._resolveEntryId(detail.value);
    const themeValue = this._resolveTheme(detail.value);
    const svgThemeValue = detail.value?.svg_theme ?? this._config?.svg_theme;
    const iconSetValue = detail.value?.icon_set ?? this._config?.icon_set;
    const cardHeight = this._resolveCardHeight(detail.value);
    return {
      entry_id: entryId,
      theme: normalizeTheme(themeValue),
      svg_theme: normalizeSvgTheme(svgThemeValue),
      icon_set: normalizeIconSet(iconSetValue),
      card_height: cardHeight,
    };
  }

  private _resolveEntryId(value?: {
    entry_id?: string;
    theme?: string;
    card_height?: string | number;
  }): string {
    return value?.entry_id ?? this._config?.entry_id ?? "";
  }

  private _resolveTheme(value?: {
    entry_id?: string;
    theme?: string;
    card_height?: string | number;
  }): string {
    return value?.theme ?? this._config?.theme ?? "unifi";
  }

  private _resolveCardHeight(value?: {
    entry_id?: string;
    theme?: string;
    card_height?: string | number;
  }): string | number | undefined {
    return value?.card_height ?? this._config?.card_height;
  }

  private _isConfigUnchanged(update: {
    entry_id: string;
    theme: NonNullable<CardConfig["theme"]>;
    svg_theme: NonNullable<CardConfig["svg_theme"]>;
    icon_set: NonNullable<CardConfig["icon_set"]>;
    card_height?: string | number;
  }): boolean {
    return (
      this._config?.entry_id === update.entry_id &&
      this._config?.theme === update.theme &&
      this._config?.svg_theme === update.svg_theme &&
      this._config?.icon_set === update.icon_set &&
      this._config?.card_height === update.card_height
    );
  }
}
