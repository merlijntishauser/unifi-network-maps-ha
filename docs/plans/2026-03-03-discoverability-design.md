# Discoverability Improvements

Goal: Make the integration easier to find and evaluate via GitHub/HACS search,
and easier to understand at a glance for people landing on the repository.

## Scope

Three vectors:

1. **GitHub/HACS metadata** -- repository description and topics
2. **README feature list** -- replace prose intro with a scannable bullet list
3. **README structure** -- move screenshot higher, add complementary-integration
   blurb, reserve slot for dark-theme screenshot

## 1. GitHub Repository Metadata

**Description:**
> Interactive UniFi network topology map for Home Assistant. Visualize device
> connections, monitor client presence, and display your network structure in a
> live Lovelace card.

**Topics:**
`home-assistant`, `hacs`, `hacs-integration`, `unifi`, `unifi-network`,
`lovelace`, `lovelace-card`, `network-topology`, `svg`, `home-automation`

Set via `gh repo edit`.

## 2. README Feature List

Replace the current "What You Get" prose paragraph with a scannable bullet
list immediately after the one-liner introduction:

- Interactive SVG topology map with pan, zoom, and touch gesture support
- Real-time updates via WebSocket (no polling)
- Device type filtering (gateway, switch, AP, clients)
- Node selection with detail panel showing IP, MAC, model, firmware
- Entity linking to the official UniFi integration for click-through context
- VLAN coloring on nodes and edges
- Port utilization display with PoE power consumption
- 6 SVG themes (unifi, unifi-dark, minimal, minimal-dark, classic, classic-dark)
- 2 icon sets (modern, isometric)
- Binary sensors for device and client presence
- VLAN client-count sensors
- 4 automation blueprints (device offline/online, AP overload, VLAN threshold)

## 3. README Structure Changes

**Screenshot placement:** Move the existing `lovelace-card.png` screenshot to
immediately after the one-liner description (before any other content). Add a
second screenshot slot for a dark theme + node-selected view once the asset is
available.

**Complementary integration blurb:** Add a short section after the feature list:

> The built-in `unifi` integration handles device tracking, presence detection,
> and switch control. This integration adds network topology visualization --
> it shows how your devices connect to each other, which clients are on which
> AP or switch port, and how your network is structured. They share the same
> UniFi controller but serve different purposes. Entity linking works best when
> both are installed: clicking a device in the map opens its HA entity directly.

## Out of Scope

- `hacs.json` does not have a keywords field -- topics are set on the GitHub
  repo directly, not in the file.
- Screenshot creation (dark theme + node selected) requires a running HA
  instance; a placeholder comment is added in the README to mark the slot.
- README restructuring beyond the three targeted changes above.
