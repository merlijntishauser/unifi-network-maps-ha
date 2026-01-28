import { DOMAIN } from "../shared/constants";
import { buildFormSchema, normalizeTheme } from "../shared/editor-helpers";
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
    this._form.hass = this._hass;
    this._form.computeLabel = (schema: FormSchemaEntry) =>
      schema.label ?? this._localize(`editor.${schema.name}`) ?? schema.name;
    this._form.schema = this._buildFormSchema();
    this._form.data = {
      entry_id: this._config?.entry_id ?? "",
      theme: this._config?.theme ?? "unifi",
      card_height: this._config?.card_height ?? "",
    };
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
    const selectedTheme = this._config?.theme ?? "unifi";
    this._updateConfig({ entry_id: entryId, theme: selectedTheme });
  }

  private _updateConfig(update: {
    entry_id: string;
    theme: "dark" | "light" | "unifi" | "unifi-dark";
    card_height?: string | number;
  }) {
    this._config = {
      ...this._config,
      type: "custom:unifi-network-map",
      entry_id: update.entry_id,
      theme: update.theme,
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
    theme: "dark" | "light" | "unifi" | "unifi-dark";
    card_height?: string | number;
  } | null {
    const detail = (
      e as CustomEvent<{
        value?: { entry_id?: string; theme?: string; card_height?: string | number };
      }>
    ).detail;
    const entryId = this._resolveEntryId(detail.value);
    const themeValue = this._resolveTheme(detail.value);
    const cardHeight = this._resolveCardHeight(detail.value);
    return {
      entry_id: entryId,
      theme: normalizeTheme(themeValue),
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
    theme: "dark" | "light" | "unifi" | "unifi-dark";
    card_height?: string | number;
  }): boolean {
    return (
      this._config?.entry_id === update.entry_id &&
      this._config?.theme === update.theme &&
      this._config?.card_height === update.card_height
    );
  }
}
