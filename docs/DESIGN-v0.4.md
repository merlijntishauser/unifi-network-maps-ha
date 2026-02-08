# Design: Phase 6 -- Network Segment Visualization (v0.4)

> Transforms VLAN/network visualization from simple node coloring to rich
> network segment awareness with filtering, edge coloring, segment grouping,
> a dedicated panel tab, and switchable topology modes.

*Created: 2026-02-08*

---

## Table of Contents

1. [Scope](#1-scope)
2. [Design Decisions](#2-design-decisions)
3. [Feature Toggles](#3-feature-toggles)
4. [Upstream Library Changes](#4-upstream-library-changes-unifi-network-maps)
5. [HA Backend Changes](#5-ha-backend-changes)
6. [Frontend Changes](#6-frontend-changes)
7. [VLAN Legend Bar (6.1)](#7-vlan-legend-bar-61)
8. [Network Segment Grouping (6.2)](#8-network-segment-grouping-62)
9. [Edge VLAN Coloring (6.3)](#9-edge-vlan-coloring-63)
10. [VLAN Details Panel Tab (6.4)](#10-vlan-details-panel-tab-64)
11. [Topology Modes (6.5)](#11-topology-modes-65)
12. [Localization](#12-localization)
13. [Testing Strategy](#13-testing-strategy)
14. [Migration & Rollout](#14-migration--rollout)
15. [Documentation Updates](#15-documentation-updates)

---

## 1. Scope

All five sub-sections from the roadmap are in scope for v0.4:

| Section | Feature | Summary |
|---------|---------|---------|
| 6.1 | VLAN Legend & Controls | Color-coded VLAN chips with filtering |
| 6.2 | Network Segment Grouping | Visual boundaries, click-to-collapse |
| 6.3 | Edge VLAN Coloring | Color edges by primary VLAN, trunk indicators |
| 6.4 | VLAN Details Panel | Dedicated "VLANs" tab in the detail panel |
| 6.5 | Network Topology Modes | Physical / Logical / Hybrid view switcher |

Changes span three repositories:

- **unifi-network-maps** (upstream library) -- layout and SVG generation
- **unifi-network-maps-ha** (this repo, backend) -- integration options, renderer, HTTP views
- **unifi-network-maps-ha** (this repo, frontend) -- card UI, editor, interactions

---

## 2. Design Decisions

Decisions made during brainstorming, captured here for future reference.

| Decision | Choice | Alternatives Considered |
|----------|--------|------------------------|
| Segment grouping layer | Upstream SVG `<g>` groups with VLAN metadata | Frontend-only overlays; hybrid payload+frontend |
| Topology mode switching | Cached dual SVGs (instant swap) | Re-render on backend per switch; frontend CSS/transform rearrangement |
| VLAN legend placement | Bottom bar (compact chips) + panel tab (full details) | Bottom bar only; side panel only; floating legend |
| Cross-VLAN edge style | Primary VLAN color with trunk badge | Gradient stroke; dashed multi-color; neutral gray |
| VLAN color mapping | Auto from VLAN ID with user overrides | Fully automatic; fully user-configured |
| Segment collapse UX | Click-to-collapse on group label | Drag-to-collapse; toggle in VLAN bar; deferred |
| Feature toggle system | HA built-in config/options flow | Lightweight internal module; external toggle library |
| Toggle lifespan | Mix: UI toggles permanent, backend toggles temporary | All permanent; all temporary |

---

## 3. Feature Toggles

Two layers of toggles using HA's native configuration infrastructure. No
external feature-flag libraries.

### 3.1 Backend Toggles (Integration Options Flow)

Added to the HA options flow (`config_flow.py`). Stored in the config entry.

| Option | Type | Default | Lifespan | Effect |
|--------|------|---------|----------|--------|
| `enable_vlan_grouping` | `bool` | `false` | Temporary | Renders VLAN-grouped SVG alongside physical SVG |
| `enable_topology_modes` | `bool` | `false` | Temporary | Serves dual SVGs via `/svg?mode=` query param |

**Temporary** means these options exist during the v0.4.x cycle for safe
rollout. In v0.5, a config entry migration removes them and makes dual
rendering always-on.

When both toggles are off, the integration behaves identically to v0.3.x.

### 3.2 Frontend Toggles (Card Config, Lovelace Editor)

Added to the card configuration object. Shown as checkboxes in the card editor.

| Option | Type | Default | Lifespan | Effect |
|--------|------|---------|----------|--------|
| `show_vlan_legend` | `bool` | `true` | Permanent | Show/hide VLAN chips in the bottom bar |
| `show_vlan_edge_coloring` | `bool` | `true` | Permanent | Color edges by primary VLAN |
| `show_segment_boundaries` | `bool` | `true` | Permanent | Show visual boundaries around VLAN groups |

These are permanent user preferences. Users with simple setups can disable
VLAN visuals without affecting backend data generation.

### 3.3 Graceful Degradation

The frontend checks the payload for VLAN data before rendering VLAN features.
If backend toggles are off (no VLAN-grouped SVG, no edge VLAN data), the
frontend toggles have no effect and the VLAN-related editor options are hidden.

The topology mode switcher only appears when the backend provides dual SVGs
(detected via a `topology_modes` field in the payload). When absent, the card
renders physical-only with no switcher -- identical to v0.3.x.

### 3.4 Toggle Interaction Matrix

| Backend state | Frontend state | Result |
|---------------|----------------|--------|
| Toggles off | Any | v0.3.x behavior, VLAN editor options hidden |
| `enable_vlan_grouping` on | `show_segment_boundaries` on | VLAN lane layout with visible boundaries |
| `enable_vlan_grouping` on | `show_segment_boundaries` off | VLAN lane layout, no boundaries drawn |
| `enable_topology_modes` on | -- | Mode switcher appears (Physical/Logical/Hybrid) |
| Both on | `show_vlan_legend` off | Mode switcher visible, no VLAN bar |

---

## 4. Upstream Library Changes (unifi-network-maps)

Three additive changes. No breaking modifications to existing APIs.

### 4.1 VLAN-Based Grouping Mode

**New layout mode: `layout_mode="vlan"`**

The existing `layout_mode="grouped"` groups nodes by device type
(gateway/switch/ap/client). The new `"vlan"` mode groups nodes by VLAN
membership instead.

- Reuses the existing `_layout_grouped_nodes()` lane-based layout engine.
- Partitions nodes by VLAN ID instead of device type.
- Nodes without a VLAN assignment go into an "Unassigned" lane.
- SVG output uses the same `<g class="network-group">` structure but with:
  - `data-group-name` set to the VLAN name
  - New `data-vlan-id` attribute on each group element
- Group ordering follows VLAN ID (ascending).
- Works with both flat and isometric renderers.

**CLI addition:**
```
--svg-layout-mode vlan
```

### 4.2 Dual SVG Rendering

**New function: `render_dual()`**

Produces both physical and VLAN-grouped SVGs in a single call, sharing the
same topology fetch. Avoids double-fetching the UniFi API.

```python
def render_dual(
    topology: TopologyResult,
    options: SvgOptions,
    theme: SvgTheme,
    *,
    vlan_node_map: dict[str, int | None],
    vlan_names: dict[int, str],
) -> dict[str, str]:
    """Return {"physical": svg_str, "vlan": svg_str}."""
```

- The physical SVG uses `layout_mode="physical"` (existing behavior).
- The VLAN SVG uses the new `layout_mode="vlan"`.
- Both share the same `TopologyResult` and `SvgTheme`.
- If `vlan_node_map` is empty, the `"vlan"` key contains `None`.

### 4.3 Edge VLAN Metadata in Payload

The SVG renderer already writes `data-vlans`, `data-active-vlans`, and
`data-trunk` attributes on edge `<path>` elements. The Python `Edge` dataclass
needs matching fields so the HA payload can expose this data without SVG
parsing.

**Edge dataclass additions:**
```python
@dataclass
class Edge:
    left: str
    right: str
    label: str | None = None
    poe: bool = False
    wireless: bool = False
    speed: int | None = None
    channel: int | None = None
    # New fields:
    vlans: tuple[int, ...] = ()
    active_vlans: tuple[int, ...] = ()
    is_trunk: bool = False
```

Populated during `build_topology()` from port profile VLAN configuration,
and during `build_client_edges()` from client VLAN membership.

Always populated when data is available. No toggle needed -- it is just data.

---

## 5. HA Backend Changes

### 5.1 Integration Options Flow

Add two new boolean options to `config_flow.py` options step:

```python
vol.Optional(CONF_ENABLE_VLAN_GROUPING, default=False): bool,
vol.Optional(CONF_ENABLE_TOPOLOGY_MODES, default=False): bool,
```

Add `data` and `data_description` translations for all 10 supported languages.
Group under an "Experimental features" heading in the options UI via
`data_description`.

### 5.2 Renderer Changes

When `enable_vlan_grouping` is enabled:

1. `renderer.py` calls the new upstream `render_dual()` instead of
   `render_svg()` / `render_svg_isometric()`.
2. The returned data stores both SVGs in `UniFiNetworkMapData`.
3. `_build_payload()` includes edge VLAN fields from the new `Edge` fields.

When disabled: current single-SVG rendering is unchanged. Edge VLAN fields
are still included in the payload if the upstream library provides them.

### 5.3 Data Structure

```python
@dataclass
class UniFiNetworkMapData:
    svg: str
    svg_vlan: str | None  # New: VLAN-grouped SVG (None when toggle is off)
    payload: dict
    wan_info: WanInfo | None
```

### 5.4 HTTP View Expansion

**SVG endpoint** gains a `mode` query parameter:

```
GET /api/unifi_network_map/{entry_id}/svg?mode=physical   (default)
GET /api/unifi_network_map/{entry_id}/svg?mode=vlan
```

- `mode=physical`: Returns the physical SVG (current behavior).
- `mode=vlan`: Returns the VLAN-grouped SVG. Returns 404 if dual rendering
  is not enabled or no VLAN SVG is available.

**Payload endpoint** additions:

- Edge objects gain `vlans`, `active_vlans`, and `is_trunk` fields.
- New top-level field `topology_modes: list[str]` indicating available modes.
  Example: `["physical"]` when only physical SVG exists,
  `["physical", "vlan"]` when dual rendering is active.

### 5.5 Coordinator

Passes the `enable_vlan_grouping` and `enable_topology_modes` settings from
the config entry to the renderer. No other coordinator changes needed.

---

## 6. Frontend Changes

### 6.1 Type Expansions

**`types.ts` additions:**

```typescript
// Card config
export type CardConfig = {
  // ... existing fields ...
  show_vlan_legend?: boolean;        // default: true
  show_vlan_edge_coloring?: boolean; // default: true
  show_segment_boundaries?: boolean; // default: true
  vlan_color_overrides?: Record<number, string>; // VLAN ID -> hex color
};

// Edge type
export type Edge = {
  // ... existing fields ...
  vlans?: number[];
  active_vlans?: number[];
  is_trunk?: boolean;
};

// Payload
export type MapPayload = {
  // ... existing fields ...
  topology_modes?: string[]; // ["physical"] or ["physical", "vlan"]
};
```

### 6.2 Card Config Editor

Add three checkboxes to `unifi-network-map-editor.ts`:

- "Show VLAN Legend" (`show_vlan_legend`)
- "Show VLAN Edge Coloring" (`show_vlan_edge_coloring`)
- "Show Segment Boundaries" (`show_segment_boundaries`)

These checkboxes are only visible when the payload contains VLAN data
(`vlan_info` is non-empty). Hidden otherwise to avoid confusing users who
don't have VLANs configured.

### 6.3 State Additions

New state properties on the card component:

```typescript
private _vlanFilterState: VlanFilterState;  // VLAN visibility + collapse
private _topologyMode: "physical" | "vlan" | "hybrid";  // default: "physical"
private _svgVlan: string | null;  // Cached VLAN-grouped SVG
```

### 6.4 SVG Fetching

On initial load, if `topology_modes` contains `"vlan"`, the card fetches
both SVGs in parallel:

```typescript
const [svgPhysical, svgVlan] = await Promise.all([
  loadSvg(baseUrl, { mode: "physical", ...themeParams }),
  loadSvg(baseUrl, { mode: "vlan", ...themeParams }),
]);
```

Both are cached in memory. Switching modes swaps the displayed SVG
instantly with no network request.

---

## 7. VLAN Legend Bar (6.1)

### 7.1 Layout

The VLAN legend bar sits above the existing device-type filter bar, at the
bottom of the map area. It is a horizontal scrollable row of color-coded
VLAN chips.

### 7.2 Chip Design

Each chip contains:
- A small colored circle (8px) using the VLAN's assigned color
- The VLAN name (truncated to ~12 characters on narrow cards)
- Client count in parentheses

Example rendering: `[*] IoT (12)  [*] Guest (3)  [*] Trusted (8)`

Colors are assigned by `assignVlanColors()` from the existing
`vlan-colors.ts`, using the auto-with-overrides strategy. The
`vlan_color_overrides` card config field allows users to pin specific colors.

### 7.3 Interactions

| Action | Effect |
|--------|--------|
| Click chip | Toggle VLAN visibility (hide/show all nodes + edges in that VLAN) |
| Long-press / right-click chip | "Show only this VLAN" -- hides all other VLANs |
| Click active chip again | Reset to show all VLANs |

### 7.4 State Management

New `VlanFilterState` in `filter-state.ts`:

```typescript
export type VlanFilterState = {
  visible: Record<number, boolean>;   // VLAN ID -> visible
  collapsed: Record<number, boolean>; // VLAN ID -> collapsed (for 6.2)
};
```

Filtering uses the same CSS-class mechanism as device type filtering:
- `.node--filtered` and `.edge--filtered` classes
- A node must pass both device-type AND VLAN filters to be visible
- Composing filters: `isVisible = deviceTypeVisible && vlanVisible`

### 7.5 Responsive Behavior

On narrow cards, chips overflow horizontally with CSS `overflow-x: auto`.
No wrapping -- keeps the bar at a single-row height.

### 7.6 Gating

The VLAN bar is hidden when:
- `show_vlan_legend` is `false` in card config, OR
- `vlan_info` is empty or absent in the payload

---

## 8. Network Segment Grouping (6.2)

### 8.1 SVG Group Structure

The upstream library (section 4.1) renders VLAN groups as:

```xml
<g class="network-group" data-group-name="IoT" data-vlan-id="10">
  <rect class="group-boundary" x="..." y="..." width="..." height="..." />
  <text class="group-label">IoT</text>
  <!-- nodes within this VLAN -->
</g>
```

### 8.2 Segment Boundary Styling

The frontend styles group boundaries with:
- Semi-transparent fill: VLAN color at 10% opacity
- Border: 1px solid, VLAN color at 30% opacity
- Corner radius: 8px
- Group label: VLAN name, positioned in the top-left corner of the boundary

Controlled by `show_segment_boundaries` card config. When off, group boundary
rectangles are hidden via `display: none`, but the grouped layout is
preserved -- nodes stay in their VLAN lanes.

### 8.3 Click-to-Collapse

Each segment group label is clickable. Clicking it:

1. Hides all nodes and edges within the group (`.node--collapsed`,
   `.edge--collapsed` CSS classes).
2. Shows a dynamically created summary node at the group's center position.
3. The summary node displays: VLAN name, device count, and an expand icon.
4. The summary node uses the VLAN color as fill.
5. Clicking the summary node expands the group back.

This avoids re-rendering the SVG. Pure CSS class toggling plus a small
DOM insertion for the summary node.

Collapse state is stored in `VlanFilterState.collapsed`.

### 8.4 Hybrid Mode Boundaries

In Hybrid topology mode (section 11), the physical SVG does not contain
upstream-rendered group boundaries. Instead, the frontend computes them
client-side:

1. Iterate all `[data-node-id]` elements in the SVG.
2. Group by VLAN using `node_vlans` from the payload.
3. Compute padded bounding rectangles per VLAN via `getBBox()`.
4. Insert `<rect>` elements into a new `<g class="vlan-overlay">` group,
   positioned behind nodes but above edges.

---

## 9. Edge VLAN Coloring (6.3)

### 9.1 Color Application

When `show_vlan_edge_coloring` is enabled, edges are colored based on their
primary VLAN:

- **Access ports** (single VLAN): Use that VLAN's color.
- **Trunk ports**: Use the native/untagged VLAN color (`active_vlans[0]`).
- **No VLAN data**: Edge retains its default theme color.

Colors come from the same `assignVlanColors()` palette used by nodes and
the legend bar.

### 9.2 CSS Implementation

New function `generateVlanEdgeStyles()` produces CSS rules:

```css
path[data-edge-left="Switch"][data-edge-right="AP-Office"] {
  stroke: #60a5fa;
}
```

Targets edge paths by `data-edge-left` + `data-edge-right` attribute
selectors. Applied via a dynamic `<style>` element, same pattern as
`generateVlanStyles()` for nodes.

### 9.3 Trunk Indicator

Trunk edges (`is_trunk === true`) display a small badge near the edge
midpoint -- a double-line indicator. Hovering the badge shows a tooltip
listing all carried VLANs by name:

```
Trunk: IoT (10), Guest (20), Trusted (30)
```

### 9.4 Edge Tooltip Expansion

The existing `renderEdgeTooltip()` in `svg.ts` gains a VLAN section when
edge VLAN data is present:

- **Access edge**: `VLAN: IoT (10)`
- **Trunk edge**: `Trunk: IoT (10), Guest (20), Trusted (30)`

Displayed below the existing speed/PoE/channel information.

### 9.5 Filter Interaction

When a VLAN is hidden via the legend bar:
- Access edges belonging to that VLAN get `.edge--filtered`.
- Trunk edges are only hidden if ALL their carried VLANs are hidden.

---

## 10. VLAN Details Panel Tab (6.4)

### 10.1 Tab Addition

A new "VLANs" tab is added to the detail panel, alongside the existing
Overview, Stats, and Actions tabs.

### 10.2 Network Overview Mode (No Node Selected)

When no node is selected, the VLANs tab shows a list of all VLANs:

- Color dot, VLAN name, VLAN ID, client count
- Sorted by VLAN ID
- Click a VLAN row to expand it inline, showing up to 20 client names
  (from `vlan_info[id].clients`)
- Each client name is clickable: selects that node on the map and switches
  to the Overview tab

### 10.3 Node Selected Mode

When a node is selected, the VLANs tab shows:

- The selected node's VLAN membership (name, ID, color dot)
- Other devices on the same VLAN ("neighbors")
- If the node is a switch or gateway: list of VLANs it carries, derived
  from trunk edge data (`is_trunk` edges connected to this node)

### 10.4 Rendering

Follows the existing `renderPanelContent()` pattern in `panel.ts`. New
`renderVlanTab()` function returns an HTML string. Uses the same
`panel-section`, `stats-list`, `stats-row` CSS classes.

---

## 11. Topology Modes (6.5)

### 11.1 Mode Switcher UI

A segmented control (three-button toggle) in the top-right corner of the
map, below the existing zoom/reset controls.

Buttons: **Physical** | **Logical** | **Hybrid**

Styled consistently with the zoom/reset button group.

### 11.2 Physical Mode

Displays the standard physical topology SVG. No segment boundaries. VLAN
edge coloring still applies if enabled. This is the default mode and
matches v0.3.x behavior exactly.

### 11.3 Logical Mode

Displays the VLAN-grouped SVG from the backend. Nodes are arranged in
VLAN lanes. Segment boundaries shown (unless `show_segment_boundaries`
is off). All VLAN visual features are active.

### 11.4 Hybrid Mode

Displays the physical SVG layout with VLAN segment boundaries overlaid.
The boundaries are computed client-side from node positions + VLAN
membership (see section 8.4). Edge VLAN coloring is active.

This gives the "best of both" -- physical cable topology with VLAN
awareness. No third SVG is needed; it is a frontend-only composition.

### 11.5 SVG Switching Behavior

- Physical and Logical modes swap the entire SVG innerHTML from cache.
- Switching is instant -- no network request.
- Viewport state (pan/zoom) resets on mode switch because layouts differ.
- Selection state is preserved if the selected node exists in both views.
- Hybrid mode uses the physical SVG with an overlay; no swap needed.

### 11.6 Gating

The mode switcher only appears when `topology_modes` in the payload contains
more than one entry. When the backend only provides `["physical"]`, no
switcher is rendered.

---

## 12. Localization

### 12.1 Frontend Locale Keys (All 10 Languages)

New keys added to all locale files (`en`, `de`, `es`, `fr`, `nl`, `sv`,
`nb`, `da`, `fi`, `is`):

```typescript
// VLAN legend bar
"vlan_legend.chip_label": "{name} ({count})",
"vlan_legend.show_only": "Show only {name}",
"vlan_legend.show_all": "Show all VLANs",

// VLAN panel tab
"panel.tabs.vlans": "VLANs",
"panel.vlans.client_count": "{count} clients",
"panel.vlans.no_vlans": "No VLAN data available",
"panel.vlans.same_network": "Same network",
"panel.vlans.carried_vlans": "Carried VLANs",
"panel.vlans.unassigned": "Unassigned",

// Edge VLAN tooltip
"edge_tooltip.vlan": "VLAN: {name} ({id})",
"edge_tooltip.trunk": "Trunk",
"edge_tooltip.trunk_vlans": "Carried VLANs: {vlans}",

// Topology mode switcher
"topology_mode.physical": "Physical",
"topology_mode.logical": "Logical",
"topology_mode.hybrid": "Hybrid",

// Editor toggles
"editor.show_vlan_legend": "Show VLAN Legend",
"editor.show_vlan_edge_coloring": "Show VLAN Edge Coloring",
"editor.show_segment_boundaries": "Show Segment Boundaries",

// Segment grouping
"segment.collapse": "Collapse {name}",
"segment.expand": "Expand {name}",
"segment.device_count": "{count} devices",
```

### 12.2 Backend Translation Keys (All 10 Languages)

New keys in `translations/*.json` for the options flow:

```json
{
  "options": {
    "step": {
      "init": {
        "data": {
          "enable_vlan_grouping": "Enable VLAN grouping",
          "enable_topology_modes": "Enable topology modes"
        },
        "data_description": {
          "enable_vlan_grouping": "Render a VLAN-grouped layout alongside the physical topology. Increases rendering time.",
          "enable_topology_modes": "Allow switching between Physical, Logical, and Hybrid views in the card."
        }
      }
    }
  }
}
```

---

## 13. Testing Strategy

### 13.1 Upstream Library (unifi-network-maps)

- Unit tests for `layout_mode="vlan"` layout computation.
- Unit tests for `render_dual()` producing two valid SVGs.
- Unit tests for `Edge` dataclass VLAN field population.
- Verify `data-vlan-id` attributes on SVG group elements.

### 13.2 HA Backend (Python)

- Unit tests for new config flow options (validation, defaults).
- Unit tests for renderer dual-SVG path vs single-SVG path.
- Unit tests for HTTP view `mode` query parameter routing.
- Unit tests for payload `topology_modes` field generation.
- Integration test: config entry with toggles on/off produces correct data.

### 13.3 Frontend (Jest)

- `vlan-filter-state.test.ts` -- VLAN filter toggle, compose with device filters.
- `vlan-legend.test.ts` -- chip rendering, click handlers, responsive overflow.
- `vlan-edge-coloring.test.ts` -- CSS generation, trunk detection, filter interaction.
- `vlan-panel.test.ts` -- tab rendering in both overview and node-selected modes.
- `topology-mode.test.ts` -- mode switcher rendering, SVG swap, state preservation.
- `segment-boundaries.test.ts` -- boundary rendering, collapse/expand.
- Existing `vlan-colors.test.ts` extended with override tests.

### 13.4 E2E (Playwright)

- VLAN legend bar visible when payload contains VLANs.
- Click VLAN chip toggles node visibility.
- Topology mode switcher appears when dual SVGs enabled.
- Mode switch swaps SVG content.
- VLAN panel tab shows correct data.
- Feature toggles: verify hidden when toggles are off.

---

## 14. Migration & Rollout

### 14.1 v0.4.0 Release

- Backend toggles default to `false`. Existing users see no change.
- Frontend toggles default to `true` but have no effect until backend
  toggles are enabled.
- Users opt-in to new features via integration options.

### 14.2 v0.4.x Patch Releases

- Bug fixes and polish based on user feedback.
- Backend toggle defaults may change to `true` once stable.

### 14.3 v0.5.0 Migration

Config entry migration removes temporary backend toggles:

```python
async def async_migrate_entry(hass, config_entry):
    if config_entry.version < 5:
        new_options = dict(config_entry.options)
        new_options.pop("enable_vlan_grouping", None)
        new_options.pop("enable_topology_modes", None)
        # Dual rendering becomes always-on
        config_entry.version = 5
        hass.config_entries.async_update_entry(config_entry, options=new_options)
    return True
```

---

## 15. Documentation Updates

### 15.1 CONTRIBUTING.md Additions

Add a "Feature Toggles" section after the existing "Architecture notes":

```markdown
## Feature toggles

New features may ship behind feature toggles for safe rollout. Toggles
exist at two levels:

**Backend toggles** (integration options flow):
- Stored in the HA config entry options.
- Control data generation (e.g., whether dual SVGs are rendered).
- Temporary: removed via config entry migration once stable.
- Added in `config_flow.py` options step with `vol.Optional(..., default=False)`.
- Require translations in all 10 supported languages.

**Frontend toggles** (card config):
- Stored in the Lovelace card configuration object.
- Control UI presentation (e.g., whether VLAN legend is shown).
- Permanent: remain as user preferences.
- Added to `CardConfig` type in `types.ts` and rendered in the editor.
- Require localization keys in all 10 locale files.

**Current toggles (v0.4.x):**

| Toggle | Layer | Default | Lifespan |
|--------|-------|---------|----------|
| `enable_vlan_grouping` | Backend | `false` | Temporary (removed in v0.5) |
| `enable_topology_modes` | Backend | `false` | Temporary (removed in v0.5) |
| `show_vlan_legend` | Frontend | `true` | Permanent |
| `show_vlan_edge_coloring` | Frontend | `true` | Permanent |
| `show_segment_boundaries` | Frontend | `true` | Permanent |

When adding a new toggle:
1. Decide layer (backend vs frontend) and lifespan (temporary vs permanent).
2. Add the option with a sensible default.
3. Add translations for all 10 languages.
4. Document in this table.
5. If temporary, plan the migration that removes it.
```

### 15.2 ROADMAP.md Updates

Update the Phase 6 section to reflect design decisions and add toggle
references. Mark sub-sections with implementation status as work progresses.

### 15.3 CLAUDE.md Additions

Add to the "State Management" section under "Frontend Patterns":

```markdown
### Feature Toggles

Features may be gated behind toggles at two levels:

- **Backend toggles**: Integration options in `config_flow.py`. Control data
  generation. Temporary toggles are removed via config entry migration.
- **Frontend toggles**: Card config fields in `types.ts`. Control UI
  presentation. Permanent user preferences.

Frontend code must check both payload data availability AND card config
toggles before rendering gated features. Use graceful degradation: if data
is missing, hide the UI element regardless of toggle state.
```

Add `_vlanFilterState` and `_topologyMode` to the state management list:

```markdown
- `_vlanFilterState` - VlanFilterState (VLAN visibility + collapse state)
- `_topologyMode` - Topology view mode (physical, vlan, hybrid)
- `_svgVlan` - Cached VLAN-grouped SVG string
```

Add `vlan-legend.ts` and `topology-mode.ts` to the `ui/` module listing.
Add `vlan-filter-state.ts` to the `interaction/` module listing.
