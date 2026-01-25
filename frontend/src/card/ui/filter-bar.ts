import type { DeviceType, DeviceTypeFilters } from "../core/types";

export type FilterBarOptions = {
  filters: DeviceTypeFilters;
  counts: Record<DeviceType, number>;
  getNodeTypeIcon: (type: string) => string;
  localize?: (key: string, replacements?: Record<string, string | number>) => string;
};

const DEVICE_TYPE_ORDER: DeviceType[] = ["gateway", "switch", "ap", "client", "other"];

const DEVICE_TYPE_LABELS: Record<DeviceType, string> = {
  gateway: "Gateways",
  switch: "Switches",
  ap: "APs",
  client: "Clients",
  other: "Other",
};

const DEVICE_TYPE_LABEL_KEYS: Record<DeviceType, string> = {
  gateway: "panel.device_type.gateways",
  switch: "panel.device_type.switches",
  ap: "panel.device_type.access_points",
  client: "panel.device_type.clients",
  other: "panel.device_type.other",
};

export function renderFilterBar(options: FilterBarOptions): string {
  const { filters, counts, getNodeTypeIcon, localize } = options;

  const buttons = DEVICE_TYPE_ORDER.map((type) => {
    const count = counts[type] ?? 0;
    const active = filters[type];
    const activeClass = active ? "filter-button--active" : "filter-button--inactive";
    const icon = getNodeTypeIcon(type);
    const label = localize ? localize(DEVICE_TYPE_LABEL_KEYS[type]) : DEVICE_TYPE_LABELS[type];
    const tooltipKey = active ? "card.filter.hide" : "card.filter.show";
    const title = localize ? localize(tooltipKey, { label }) : label;

    return `
      <button
        type="button"
        class="filter-button ${activeClass}"
        data-filter-type="${type}"
        title="${title}"
        aria-pressed="${active}"
      >
        <span class="filter-button__icon">${icon}</span>
        <span class="filter-button__count">${count}</span>
      </button>
    `;
  }).join("");

  return `<div class="filter-bar">${buttons}</div>`;
}

export function countDeviceTypes(nodeTypes: Record<string, string>): Record<DeviceType, number> {
  const counts: Record<DeviceType, number> = {
    gateway: 0,
    switch: 0,
    ap: 0,
    client: 0,
    other: 0,
  };

  for (const type of Object.values(nodeTypes)) {
    switch (type) {
      case "gateway":
        counts.gateway++;
        break;
      case "switch":
        counts.switch++;
        break;
      case "ap":
        counts.ap++;
        break;
      case "client":
        counts.client++;
        break;
      default:
        counts.other++;
    }
  }

  return counts;
}
