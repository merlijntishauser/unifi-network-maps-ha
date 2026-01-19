# Roadmap (Prioritized)

## P1 - Security & Stability (Critical)
- No current issues known

## P2 - Bugs & Correctness (High Impact)
- **Race condition in Lovelace retry** (`__init__.py`) - Non-atomic counter increment can exceed 6-attempt limit
- **Diagnostics timestamp** - Add timestamp to show data freshness
- **Diagnostics include clients list** (anonymized) - Include counts + sample names

## P3 - UX Polish (User-facing)

### Quick Wins (Low effort, high impact)
- **Tooltip boundary detection** - Prevent off-screen tooltips
- **Copy-to-clipboard for MAC/IP** - One-click copy in detail panel
- **Separate reset vs clear selection** - Reset view shouldn't clear panel
- **Loading state + retry** - Show spinner during payload fetches with retry button
- **Card availability after install** - Warn users to hard-refresh when card isn't listed after install

### Medium Effort
- **Search/filter in detail panel** - Find clients/devices quickly
- **Keyboard navigation** - Arrow keys to navigate nodes, Escape to deselect
- **Add picture to custom card chooser** - Show preview in Lovelace card picker
- **Export current view as PNG** - Download button for documentation/sharing
- **Dashboard layout guidance** - Recommend sections view or 4-column layout for wide cards

### Larger Scope
- **Multi-site support** - Allow site selection from the UI
- **Docs improvements** - Add more screenshots + example dashboards

## P4 - Code Quality & Refactoring (XP Alignment)

### Frontend Split Long Methods (>15 lines)
Methods to break down for readability:
- `_render()` - extract view builders
- `_renderNodePanel()` - split into sections
- `_renderOverviewTab()` - split into sections
- `_renderActionsTab()` - split into sections
- `_loadSvg()` / `_loadPayload()` - extract fetch logic
- `_wireInteractions()` - split handlers
- `_onPointerMove()` - split pan/tooltip logic

### Other Cleanup
- **Event lifecycle cleanup** - Use delegated handlers or remove listeners properly
- **Extract shared utilities** - DRY up fetch, formatting, and DOM helpers

## P5 - Feature Expansion (Nice-to-have)

### Network Visualization Enhancements
| Feature | Description | Effort |
|---------|-------------|--------|
| Online/offline halos | Visual indicator around nodes based on status | S |
| Bandwidth overlays | Show throughput on edges with thickness/color | M |
| Animated data flow | Pulse animation on edges showing traffic direction | M |
| VLAN visualization | Color-code nodes/edges by VLAN membership | M |
| Guest network highlight | Distinguish guest network clients visually | S |
| Firmware status badges | Show update-available indicator on nodes | S |
| Improve node selection highlight | Blue outline looks ugly on label text | S |

### Interactive Features
| Feature | Description | Effort |
|---------|-------------|--------|
| Double-click zoom-to-fit | Quick navigation gesture | S |
| Pinch-to-zoom on touch | Mobile/tablet support | S |
| Group/collapse nodes | Collapse switches with all their clients | L |
| Path visualization | Highlight route between two selected nodes | M |
| Drag-to-rearrange | Custom node positioning with save/restore | L |
| Filter by device type | Show only APs, only clients, etc. | S |

### Detail Panel Enhancements
| Feature | Description | Effort |
|---------|-------------|--------|
| Show all related HA entities | List device_tracker, sensors, switches | S |
| Mini-graphs over time | Sparklines for bandwidth/signal history | L |
| Quick actions | Restart device, block client, open controller | M |
| Connection history | Show when client was last seen, connection duration | M |
| Port utilization | Show which ports are in use on switches | S |

### Integration & Performance
| Feature | Description | Effort |
|---------|-------------|--------|
| WebSocket updates | Replace polling with push updates | L |
| HA theme sync | Auto dark/light based on HA theme | S |
| Full-screen mode | Expand card to full viewport | S |
| Mobile-optimized view | Responsive layout for small screens | M |
| Custom node icons | Use HA entity pictures for client icons | M |
| Virtualize large lists | Lazy-load for networks with 100+ clients | L |

### Future Considerations
- **Multi-controller support** - Manage multiple UniFi controllers
- **Network health score** - Aggregate health metric in card header
- **Alert integration** - HA notifications for offline devices
- **Historical timeline** - Scrubber to view network state over time
- **Threat detection overlay** - Highlight suspicious traffic patterns
- **Bandwidth usage trends** - Daily/weekly graphs per device
- **Connection quality metrics** - Signal strength, retry rates for wireless

## Recently Completed
- Context menu with right-click actions (select, details, copy MAC, restart, block)


See [CHANGELOG.md](CHANGELOG.md) for full history.
