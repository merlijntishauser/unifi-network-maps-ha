# Roadmap (Prioritized)

## P1 - Security (Critical)

### Frontend
- ~~**XSS via innerHTML** (`unifi-network-map.ts:170, 217, 223, 230`) - SVG content and node names rendered via innerHTML without sanitization. Malicious SVG or node names could execute JavaScript.~~ ✓ Fixed: Added `escapeHtml()` and `sanitizeSvg()` helpers.
- ~~**Unescaped error messages** (`unifi-network-map.ts:71`) - Error text interpolated directly into HTML.~~ ✓ Fixed: Applied `escapeHtml()` to error messages.

### Backend
- ~~**URL embedded credentials not stripped** (`config_flow.py:152-155`) - URLs like `https://user:pass@host` accepted without warning.~~ ✓ Fixed: Added `UrlHasCredentials` validation error.

## P2 - Bugs (High Impact)

### Frontend
- ~~**Event listener leaks** (`unifi-network-map.ts:279-309`) - Listeners added on each render without cleanup. Memory leak grows with each node selection.~~ ✓ Fixed: Replaced with event delegation via `_onPanelClick`.
- ~~**Race condition in async loads** (`unifi-network-map.ts:91-126`) - Rapid config changes can cause old responses to overwrite new ones.~~ ✓ Fixed: Added AbortController to cancel in-flight requests.

### Backend
- ~~**KeyError on coordinator access** (`sensor.py:18`) - Direct dict access without null check can crash sensor setup.~~ ✓ Fixed: Use defensive `.get()` access.
- ~~**None return from _select_edges** (`renderer.py:102-103`) - Returns None if both edge lists are None, but signature promises list[Edge]. Causes TypeError downstream.~~ ✓ Fixed: Added empty list fallback.
- **MAC normalization inconsistent** (`renderer.py:157` vs `http.py:111`) - renderer uses `.lower()`, http uses `.strip().lower()`. Different formats (colons vs hyphens) won't match.
- **Race condition in Lovelace retry** (`__init__.py:213-217`) - Non-atomic counter increment can exceed 6-attempt limit.

## P2 - Quality & ops
- Add clients list to diagnostics endpoint (anonymized).
- **Silent Lovelace registration failure** (`__init__.py:276-310`) - If both registration paths fail, no error is logged.
- **Diagnostics missing timestamp** (`diagnostics.py:19-32`) - No indication of data freshness.

## P3 - Release & polish
- Add documentation with screenshots and example dashboards.
- ~~Re-enable HACS checks when brands PR is merged.~~ (done)

## P4 - Code quality & refactoring (XP alignment)

### Backend (Python)
- Split long functions (>15 lines) violating XP principles:
  - `__init__.py:15-30` `async_setup_entry` (16 lines) - extract setup steps
  - `__init__.py:40-59` `_register_refresh_service` (20 lines) - split service logic
  - `api.py:57-80` `validate_unifi_credentials` (24 lines) - extract validation steps
  - `config_flow.py:39-58` `async_step_user` (20 lines) - extract validation logic
  - `config_flow.py:103-135` `_build_options_schema` (33 lines) - abstract repetitive pattern
  - `http.py:90-107` `_mac_from_entity_entry` (18 lines) - split extraction strategies
  - `renderer.py:82-99` `_apply_clients` (18 lines) - extract client edge building
- Improve type hints: replace generic `object` types with proper types (ServiceCall, ModuleType, Client TypedDict/Protocol)
- Fix broad exception handling: `api.py:79`, `renderer.py:42` - catch specific errors and fail fast
- Extract duplicate registration flag patterns in `__init__.py:42-43,64-65`
- Simplify complex logic: Lovelace resource handling, MAC extraction, options schema building
- Improve naming: `_svg_size_validator` → `_create_svg_size_validator`, `call` → type-hinted `call: ServiceCall`
- **Validate entry.data keys exist** (`coordinator.py:52-60`) - Add defensive checks for required config keys.
- **Use inspect.iscoroutine()** (`__init__.py:243-256`) - Replace fragile `hasattr(x, "__await__")` check.

### Frontend (TypeScript)
- Split long functions (>15 lines) violating XP principles:
  - `unifi-network-map.ts:55-89` `_render()` (35 lines) - extract view builders
  - `unifi-network-map.ts:91-126` `_loadSvg()` (36 lines) - extract fetch logic
  - `unifi-network-map.ts:128-159` `_loadPayload()` (32 lines) - extract fetch logic
  - `unifi-network-map.ts:201-236` `_renderNodeDetails()` (36 lines) - split into sections
  - `unifi-network-map.ts:238-265` `_ensureStyles()` (28 lines) - extract CSS constant
  - `unifi-network-map.ts:267-288` `_wireInteractions()` (22 lines) - split handlers
  - `unifi-network-map.ts:311-333` `_wireControls()` (23 lines) - individual handlers
  - `unifi-network-map.ts:351-375` `_onPointerMove()` (25 lines) - split pan/tooltip
  - `unifi-network-map.ts:409-431` `_resolveNodeName()` (23 lines) - extract strategies
  - `unifi-network-map.ts:450-480` `_inferNodeName()` (31 lines) - split fallback strategies
- Extract named interfaces: `CardConfig`, `PanState` instead of inline types
- Extract magic numbers to constants: `MIN_PAN_MOVEMENT_THRESHOLD`, `ZOOM_INCREMENT`, `MAX_ZOOM_SCALE`, `TOOLTIP_OFFSET_PX`
- Create `_getAuthToken()` helper to eliminate duplicate auth checks
- Extract generic `_fetchWithAuth<T>()` to eliminate duplicate fetch patterns
- Improve naming: `_panMoved` → `_hasPanMovedBeyondThreshold`, `_wireInteractions()` → `_attachEventListeners()`
- Add explicit return types to all private methods
- **Use textContent or DOMPurify** - Replace innerHTML with safer alternatives for user-controlled content.
- **Add AbortController to fetches** - Prevent race conditions in `_loadSvg`/`_loadPayload`.
- **Event delegation or proper cleanup** - Use single delegated listener or removeEventListener.

## P5 - Killer features

### UX Enhancements
- Add visual editor for card configuration
- Add keyboard navigation (arrow keys, Escape, Tab for accessibility)
- Add visual feedback for selected nodes (highlight in SVG)
- Add double-click to zoom-to-fit on viewport
- Add pinch-to-zoom for mobile/touch devices
- Add tooltip boundary detection (prevent off-screen tooltips)
- Add loading state indicator for payload fetches
- Add retry mechanism on fetch failures
- Add search/filter capability in detail panel
- Add "reset view" separate from "clear selection"
- Add config option for light/dark mode
- Add port for unifi controller

### Real-time Device Status
- Show online/offline status as color-coded halos on nodes
- Display bandwidth usage, connection quality, signal strength overlays
- Integrate with HA device tracker entities for live status
- Add animated data flow visualization along edges

### Interactive Network Exploration
- Add edge hover/click for link speed, POE status, wireless band details
- Add node grouping and collapsible groups (e.g., collapse all clients)
- Add filter by device type (gateways, switches, APs, clients)
- Add network path visualization (highlight path to gateway, show latency)
- Add context menu (right-click) with quick actions
- Show hop count and identify bottlenecks in path

### Enhanced Detail Panel
- Add tabs: Overview, Stats, History, Actions
- Add copy-to-clipboard for MAC/IP addresses
- Show all associated HA entities (not just device tracker)
- Add mini-graphs of bandwidth/signal over time
- Add POE/wireless connection quality display
- Add quick actions: restart device, block/unblock client, deep link to UniFi controller

### Advanced Features
- Add historical data visualization (bandwidth graphs, uptime tracking)
- Add smart notifications overlay (HA badges, alert icons for issues)
- Add custom node icons/avatars from HA entity pictures
- Add export current view as PNG
- Add multi-site support with dropdown switcher
- Add WebSocket connection for live updates (replace polling)
- Add card configuration UI editor (refresh interval, zoom level, colors, tooltip data)
- Add accessibility improvements (ARIA labels, keyboard shortcuts overlay, high contrast theme)

### Performance Optimizations
- Add virtual scrolling for large neighbor lists
- Add lazy loading for node details
- Add SVG viewport culling for huge networks
