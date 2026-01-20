import { DOMAIN } from "./constants";
import { buildFormSchema, normalizeTheme } from "./editor-helpers";
import type { CardConfig, ConfigEntry, FormSchemaEntry, Hass } from "./types";

export class UnifiNetworkMapEditor extends HTMLElement {
  private _config?: CardConfig;
  private _hass?: Hass;
  private _entries: ConfigEntry[] = [];
  private _form?: HTMLElement & { schema: unknown; data: Record<string, unknown> };
  private _boundOnChange = (event: Event) => this._onChange(event);

  set hass(hass: Hass) {
    this._hass = hass;
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
      if (!this._config?.entry_id && this._entries.length === 1) {
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
    this._form.schema = this._buildFormSchema();
    this._form.data = {
      entry_id: this._config?.entry_id ?? "",
      theme: this._config?.theme ?? "dark",
    };
  }

  private _renderNoEntries() {
    this.innerHTML = `
      <div style="padding: 16px;">
        <p style="color: var(--secondary-text-color);">
          No UniFi Network Map integrations found. Please add one first.
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
    return buildFormSchema(this._entries);
  }

  private _onChange(e: Event) {
    const detail = (e as CustomEvent<{ value?: { entry_id?: string; theme?: string } }>).detail;
    const entryId = detail.value?.entry_id ?? this._config?.entry_id ?? "";
    const themeValue = detail.value?.theme ?? this._config?.theme ?? "dark";
    const theme = normalizeTheme(themeValue);
    if (this._config?.entry_id === entryId && this._config?.theme === theme) {
      return;
    }
    this._updateConfig({ entry_id: entryId, theme });
  }

  private _updateConfigEntry(entryId: string) {
    const selectedTheme = this._config?.theme ?? "dark";
    this._updateConfig({ entry_id: entryId, theme: selectedTheme });
  }

  private _updateConfig(update: { entry_id: string; theme: "dark" | "light" }) {
    this._config = {
      ...this._config,
      type: "custom:unifi-network-map",
      entry_id: update.entry_id,
      theme: update.theme,
    };
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }),
    );
  }
}
