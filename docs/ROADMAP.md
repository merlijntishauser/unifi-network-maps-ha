# Roadmap (Prioritized)

## P1 - Security & stability (Critical)
- **Harden card rendering** - Replace `innerHTML` for user-controlled content with safe DOM APIs or DOMPurify.
- **Log registration failures** - If Lovelace auto-registration fails, log a clear error with next steps.
- **Auth/backoff handling** - Avoid rapid re-auth attempts when UniFi returns 401/429.

## P2 - Bugs & correctness (High Impact)
- **Race condition in Lovelace retry** (`__init__.py:213-217`) - Non-atomic counter increment can exceed 6-attempt limit.
- **Diagnostics timestamp** (`diagnostics.py:19-32`) - Add timestamp to show data freshness.
- **Diagnostics include clients list** (anonymized) - Include counts + sample names.

## P3 - UX polish (User-facing)
- **Search/filter in detail panel** - Find clients/devices quickly.
- **Separate reset vs clear selection** - Reset view shouldn't clear panel.
- **Tooltip boundary detection** - Prevent off-screen tooltips.
- **Docs improvements** - Add more screenshots + example dashboards.
- **Multi-site support** - Allow site selection from the UI.

## P4 - Code quality & refactoring (XP alignment)
- **Frontend split long methods** (>15 lines):
  - `_renderActionsTab()` - split into sections
  - `_render()` - extract view builders
  - `_renderNodePanel()` - split into sections
  - `_renderOverviewTab()` - split into sections
  - `_loadSvg()` - extract fetch logic
  - `_loadPayload()` - extract fetch logic
  - `_inferNodeName()` - split fallback strategies
  - `_onPointerMove()` - split pan/tooltip
  - `_wireInteractions()` - split handlers
  - `_resolveNodeName()` - extract strategies
  - `_wireControls()` - individual handlers
- **Frontend cleanup** - Extract named interfaces, add explicit return types, improve naming.
- **Event lifecycle cleanup** - Use delegated handlers or remove listeners properly.

## P5 - Feature expansion (Nice-to-have)
### UX Enhancements
- Keyboard navigation and accessibility improvements.
- Double-click zoom-to-fit; pinch-to-zoom on touch.
- Loading state + retry for payload fetches.
- Export current view as PNG.

### Real-time Device Status
- Online/offline halos, bandwidth/signal overlays.
- Animated data flow on edges.

### Interactive Network Exploration
- Edge hover/click (link speed, PoE, wireless band).
- Group/collapse nodes; filter by type.
- Path visualization and bottleneck hints.
- Context menu for quick actions.

### Enhanced Detail Panel
- Copy-to-clipboard for MAC/IP.
- Show all related HA entities.
- Mini-graphs over time.
- Quick actions (restart, block, open controller).

### Advanced/Performance
- Historical data visualization.
- Custom node icons from HA entity pictures.
- WebSocket updates (replace polling).
- Virtualize large lists; lazy-load details; SVG culling.

## Done
- **Card configuration UI editor** - Visual editor for entry + theme selection.
