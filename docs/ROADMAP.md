# Roadmap (Prioritized)

## P1 - Security (Critical)

### Frontend

### Backend

## P2 - Bugs (High Impact)

### Frontend

### Backend
- **Race condition in Lovelace retry** (`__init__.py:213-217`) - Non-atomic counter increment can exceed 6-attempt limit.

## P2 - Quality & ops
- **Add clients list to diagnostics endpoint** (anonymized).
- **Silent Lovelace registration failure** (`__init__.py:276-310`) - If both registration paths fail, no error is logged.
- **Diagnostics missing timestamp** (`diagnostics.py:19-32`) - No indication of data freshness.

## P3 - Release & polish
- Add documentation with screenshots and example dashboards.

## P4 - Code quality & refactoring (XP alignment)

### Backend (Python)

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
- Add port for unifi controller in configuration

### Real-time Device Status
- Show online/offline status as color-coded halos on nodes
- Display bandwidth usage, connection quality, signal strength overlays
- Add animated data flow visualization along edges

### Interactive Network Exploration
- Add edge hover/click for link speed, POE status, wireless band details
- Add node grouping and collapsible groups (e.g., collapse all clients)
- Add filter by device type (gateways, switches, APs, clients)
- Add network path visualization (highlight path to gateway, show latency)
- Add context menu (right-click) with quick actions
- Show hop count and identify bottlenecks in path

### Enhanced Detail Panel
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
