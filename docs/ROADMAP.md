# Roadmap (Prioritized)

## P1 - Security & stability (Critical)
- no current issues known

## P2 - Bugs & correctness (High Impact)
- **Race condition in Lovelace retry** (`__init__.py:213-217`) - Non-atomic counter increment can exceed 6-attempt limit.
- **Diagnostics timestamp** (`diagnostics.py:19-32`) - Add timestamp to show data freshness.
- **Diagnostics include clients list** (anonymized) - Include counts + sample names.

## P3 - UX polish (User-facing)
- **Docs improvements** - Add more screenshots + example dashboards.
- **Tooltip boundary detection** - Prevent off-screen tooltips.
- **Multi-site support** - Allow site selection from the UI.
- **Search/filter in detail panel** - Find clients/devices quickly.
- **Separate reset vs clear selection** - Reset view shouldn't clear panel.

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
- Export current view as PNG.
- Loading state + retry for payload fetches.
- Double-click zoom-to-fit; pinch-to-zoom on touch.
- Keyboard navigation and accessibility improvements.
- Improve highlighting of selected nodes in the svg, the blue outline looks ugly on label text
- Add picture to custom card chooser in lovelace

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
- show custom popup when clicking the device tracker entity, with all relevant info nicely formatted, instead of just the device tracker entity
- Show all related HA entities.
- Mini-graphs over time.
- Quick actions (restart, block, open controller).

### Advanced/Performance
- Historical data visualization.
- Custom node icons from HA entity pictures.
- WebSocket updates (replace polling).
- Virtualize large lists; lazy-load details; SVG culling.

## Done
- All completed items added to the [changelog](CHANGELOG.md)