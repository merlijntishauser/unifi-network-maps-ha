# Phase 5: Library Upgrade & Theme Support - Implementation Design

> Design document for upgrading to `unifi-network-maps` v1.5.0 and implementing theme/icon selection.

## Status: ✅ COMPLETED (2026-02-05)

## Overview

**Goal:** Upgrade to library v1.5.0, handle breaking changes, add theme and icon customization.

**Scope:**
- 5.1 Library upgrade + breaking changes (extended device types, PoE indicator, etc.) ✅
- 5.2 Theme selection (card theme, SVG theme, icon set) ✅
- 5.3 WAN upstream visualization ✅

**Actual changes:** ~400 lines across 12 files.

---

## 1. Library Upgrade Foundation

### Changes

**Version bump** in two files:
- `custom_components/unifi_network_map/manifest.json`: `"unifi-network-maps==1.5.0"`
- `requirements.txt`: `unifi-network-maps==1.5.0`

### Verification

- PoE bolt symbol (`#poe-bolt`) renders automatically (library embeds symbol definition)
- Client edges at 50% opacity - visual check
- VLAN endpoint markers - add minimal CSS if needed
- Check if `build_node_type_map` signature changed

### Testing

Run existing E2E tests. Manual visual inspection of rendered SVG.

---

## 2. Extended Device Types & Icons

### New Node Types from Library

The library now returns specific client types instead of generic "client":

| Type | Emoji | SVG Icon |
|------|-------|----------|
| `camera` | 📷 | camera |
| `tv` | 📺 | tv |
| `phone` | 📱 | phone |
| `printer` | 🖨️ | printer |
| `nas` | 💾 | hard-drive |
| `speaker` | 🔊 | speaker |
| `game_console` | 🎮 | gamepad |
| `iot` | 🔌 | plug |
| `client_cluster` | 👥 | users |

### File Changes

**`frontend/src/card/ui/icons.ts`:**
- Add entries to `EMOJI_ICONS` object for each new type
- Add entries to `HERO_SVGS` object with appropriate SVG paths
- Update `nodeTypeIcon()` to map new types to their icons

```typescript
// In nodeTypeIcon():
case "camera": return iconMarkup("node-camera", theme);
case "tv": return iconMarkup("node-tv", theme);
case "phone": return iconMarkup("node-phone", theme);
case "printer": return iconMarkup("node-printer", theme);
case "nas": return iconMarkup("node-nas", theme);
case "speaker": return iconMarkup("node-speaker", theme);
case "game_console": return iconMarkup("node-game_console", theme);
case "iot": return iconMarkup("node-iot", theme);
case "client_cluster": return iconMarkup("node-client_cluster", theme);
```

**`frontend/src/card/ui/filter-bar.ts`:**
- Keep existing 4 filter buttons (gateway, switch, ap, client)
- Add constant for client subtypes:

```typescript
const CLIENT_TYPES = [
  "client", "camera", "tv", "phone", "printer",
  "nas", "speaker", "game_console", "iot", "client_cluster"
];
```

- Update filter logic so "client" filter includes all `CLIENT_TYPES`

**`frontend/src/card/ui/styles.ts`:**
- Add CSS for new node type classes if needed (inherit from client styling)

### Testing

- Unit tests for `nodeTypeIcon()` with each new type
- Unit tests for filter logic with CLIENT_TYPES
- E2E test with mock data containing new device types

---

## 3. Theme & Icon Selection

### Design Decision

Three separate dropdowns for maximum flexibility:
1. **Card Theme** - UI styling (colors, backgrounds)
2. **SVG Theme** - Map rendering colors from library
3. **Icon Set** - Node icon style from library

### Defaults

| Option | Default |
|--------|---------|
| `theme` | `unifi` |
| `svg_theme` | `unifi` |
| `icon_set` | `modern` |

### Type Changes

**`frontend/src/card/core/types.ts`:**

```typescript
export type CardConfig = {
  type?: string;
  entry_id?: string;
  svg_url?: string;
  data_url?: string;
  theme?: "dark" | "light" | "unifi" | "unifi-dark";
  svg_theme?: "unifi" | "unifi-dark" | "minimal" | "minimal-dark" | "classic" | "classic-dark";
  icon_set?: "isometric" | "modern";
  card_height?: string | number;
};
```

### Editor Changes

**`frontend/src/card/shared/editor-helpers.ts`:**

Add to form schema:

```typescript
{
  name: "theme",
  selector: {
    select: {
      mode: "dropdown",
      options: [
        { label: "Dark", value: "dark" },
        { label: "Light", value: "light" },
        { label: "UniFi", value: "unifi" },
        { label: "UniFi Dark", value: "unifi-dark" }
      ]
    }
  }
},
{
  name: "svg_theme",
  selector: {
    select: {
      mode: "dropdown",
      options: [
        { label: "UniFi", value: "unifi" },
        { label: "UniFi Dark", value: "unifi-dark" },
        { label: "Minimal", value: "minimal" },
        { label: "Minimal Dark", value: "minimal-dark" },
        { label: "Classic", value: "classic" },
        { label: "Classic Dark", value: "classic-dark" }
      ]
    }
  }
},
{
  name: "icon_set",
  selector: {
    select: {
      mode: "dropdown",
      options: [
        { label: "Modern", value: "modern" },
        { label: "Isometric", value: "isometric" }
      ]
    }
  }
}
```

Add normalization functions:

```typescript
export function normalizeTheme(value: string | undefined): CardConfig["theme"] {
  if (value === "dark" || value === "light" || value === "unifi-dark") return value;
  return "unifi";
}

export function normalizeSvgTheme(value: string | undefined): CardConfig["svg_theme"] {
  const valid = ["unifi", "unifi-dark", "minimal", "minimal-dark", "classic", "classic-dark"];
  return valid.includes(value ?? "") ? value as CardConfig["svg_theme"] : "unifi";
}

export function normalizeIconSet(value: string | undefined): CardConfig["icon_set"] {
  return value === "isometric" ? "isometric" : "modern";
}
```

### Backend Changes

**`custom_components/unifi_network_map/renderer.py`:**

Update RenderSettings:

```python
@dataclass(frozen=True)
class RenderSettings:
    include_ports: bool
    include_clients: bool
    client_scope: str
    only_unifi: bool
    svg_isometric: bool
    svg_width: int | None
    svg_height: int | None
    use_cache: bool
    svg_theme: str | None = None      # NEW
    icon_set: str | None = None       # NEW
```

Update `_render_svg()`:

```python
from unifi_network_maps.render.svg import SvgOptions, load_theme

def _render_svg(edges, node_types, settings):
    theme = load_theme(settings.svg_theme) if settings.svg_theme else None
    options = SvgOptions(
        width=settings.svg_width,
        height=settings.svg_height,
        theme=theme,
        icon_set=settings.icon_set,
    )
    if settings.svg_isometric:
        return render_svg_isometric(edges, node_types=node_types, options=options)
    return render_svg(edges, node_types=node_types, options=options)
```

**`custom_components/unifi_network_map/config_flow.py`:**

Add `svg_theme` and `icon_set` to options flow schema.

### Testing

- E2E: Both dropdowns appear in editor, values persist
- E2E: Changing svg_theme produces visibly different SVG colors
- E2E: Changing icon_set changes node icon style
- Visual: Manual inspection across theme combinations

---

## 4. WAN Upstream Visualization

### Config Options

| Option | Type | Example |
|--------|------|---------|
| `wan_label` | string | "KPN Fiber" |
| `wan_speed` | string | "1 Gbps ↓↑" |
| `wan2_label` | string | "Backup LTE" |
| `wan2_speed` | string | "100 Mbps ↓↑" |

### Type Changes

**`frontend/src/card/core/types.ts`:**

```typescript
export type CardConfig = {
  // ... existing fields
  wan_label?: string;
  wan_speed?: string;
  wan2_label?: string;
  wan2_speed?: string;
};
```

### Backend Changes

**`custom_components/unifi_network_map/renderer.py`:**

```python
@dataclass(frozen=True)
class RenderSettings:
    # ... existing fields
    wan_label: str | None = None
    wan_speed: str | None = None
    wan2_label: str | None = None
    wan2_speed: str | None = None
```

Pass to library via SvgOptions (verify exact API in v1.5.0).

### CSS Changes

**`frontend/src/card/ui/styles.ts`:**

```css
.wan-upstream {
  /* container positioning */
}

.wan-label {
  font-weight: 600;
  fill: var(--text-primary);
}

.wan-speed {
  font-size: 0.85em;
  fill: var(--text-secondary);
}

.wan-ip {
  font-size: 0.8em;
  fill: var(--text-muted);
  opacity: 0.8;
}
```

Add theme-specific overrides for light vs dark backgrounds.

### Config Flow

Add optional WAN fields to options flow (power-user feature, not required).

### Testing

- E2E: WAN labels appear in SVG when configured
- Visual: Globe icon and labels render correctly

---

## Implementation Order

1. **Library upgrade** (5.1) - Foundation for everything else
2. **Device types & icons** (5.1) - Required for visual correctness
3. **Theme & icon selection** (5.2) - Independent feature
4. **WAN visualization** (5.3) - Independent feature, lowest priority

---

## Files to Modify

| File | Changes |
|------|---------|
| `manifest.json` | Version bump to 1.5.0 |
| `requirements.txt` | Version bump to 1.5.0 |
| `renderer.py` | Add svg_theme, icon_set, WAN fields; pass to library |
| `config_flow.py` | Add svg_theme, icon_set, WAN options to schema |
| `types.ts` | Add svg_theme, icon_set, WAN fields to CardConfig |
| `editor-helpers.ts` | Add dropdowns, normalization functions |
| `icons.ts` | Add 9 new icon mappings |
| `filter-bar.ts` | Add CLIENT_TYPES constant, update filter logic |
| `styles.ts` | Add .wan-* CSS, optional .node-* CSS |

---

## Test Matrix

| Area | Test Type | What to verify |
|------|-----------|----------------|
| Library upgrade | E2E | Existing tests pass, SVG renders |
| New device types | Unit | `nodeTypeIcon()` returns correct markup |
| Filter bar | Unit | CLIENT_TYPES filters correctly |
| Icon rendering | Unit | New icons have emoji + SVG variants |
| Theme dropdowns | E2E | All 3 dropdowns appear, values persist |
| SVG theme | E2E | Changing produces different SVG colors |
| Icon set | E2E | Changing produces different node icons |
| WAN config | E2E | Labels appear when configured |
| CSS styling | Visual | Manual inspection across combinations |

---

## Implementation Summary

### Completed Tasks

1. **Library Upgrade** - Updated `unifi-network-maps` from 1.4.15 to 1.5.0, fixed all import paths for reorganized module structure

2. **Extended Device Type Icons** - Added 9 new icons (camera, tv, phone, printer, nas, speaker, game_console, iot, client_cluster) with both emoji and Heroicons SVG variants

3. **Filter Bar Updates** - Client subtypes now grouped under "Clients" filter via `CLIENT_SUBTYPES` constant

4. **Theme & Icon Selection** - Added three dropdowns to card editor:
   - Card theme: dark, light, unifi, unifi-dark
   - SVG theme: unifi, unifi-dark, minimal, minimal-dark, classic, classic-dark
   - Icon set: modern (default), isometric

5. **Backend Wiring** - Extended `RenderSettings` dataclass with `svg_theme`, `icon_set`, and `show_wan` fields. Coordinator passes config options to renderer.

6. **WAN Visualization** - Extracts WAN info from gateway device via `extract_wan_info()`, passes to both `render_svg()` and `render_svg_isometric()`. Displays globe icon with WAN1/WAN2 link speeds, ISP info, and IP addresses.

### Files Modified

| File | Changes |
|------|---------|
| `manifest.json` | Version bump to 1.5.0 |
| `const.py` | Added CONF_SVG_THEME, CONF_ICON_SET, CONF_SHOW_WAN constants |
| `coordinator.py` | Pass theme/icon/WAN options to RenderSettings |
| `renderer.py` | Theme resolution, WAN extraction, updated render calls |
| `http.py` | Fixed import paths for library 1.5.0 |
| `types.ts` | Added svg_theme, icon_set to CardConfig |
| `editor-helpers.ts` | Added dropdowns, normalization functions |
| `icons.ts` | Added 9 new icon mappings |
| `filter-state.ts` | Added CLIENT_SUBTYPES constant |
| `locales/*.ts` | Translations for all 5 languages |

---

*Created: 2026-02-05*
*Completed: 2026-02-05*
