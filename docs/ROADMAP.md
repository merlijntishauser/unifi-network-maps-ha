# UniFi Network Map - Roadmap

> **Vision**: A Home Assistant integration that provides network topology visualization and **network health monitoring** through automations. Not a replacement for UniFi's native dashboard, but a way to bring network awareness into your smart home.

## Design Philosophy

- **Visualization over Statistics**: UniFi's native dashboard excels at live throughput, latency, and device metrics. We focus on *topology understanding* and *integration with HA automations*.
- **Network as Infrastructure**: Treat the network like any other HA integration - expose meaningful states that can trigger automations.
- **Blueprints for Network Health**: Provide ready-to-use automation blueprints for common network monitoring scenarios.

---

## Current State (v0.2.x)

### Core Features
- Interactive SVG topology map with pan/zoom
- Device filtering by type (gateway, switch, AP, client)
- WebSocket push updates (no polling)
- Node selection with detail panel and entity modal
- Entity linking (MAC addresses to HA entities)
- VLAN visualization (node coloring)
- Port utilization display with PoE power consumption
- Theme support (dark, light, unifi, unifi-dark)
- Mobile touch gestures
- Binary sensors for devices, clients, and VLAN client counts
- Automation blueprints for network monitoring

### Recently Completed (v0.2.0)
- [x] Device presence binary sensors
- [x] Client connectivity binary sensors
- [x] VLAN client count sensors
- [x] Automation blueprints (offline/online alerts, AP overload, VLAN alerts)
- [x] Improved port modal with PoE power display
- [x] Navigation from modals to devices
- [x] Compact entity display with auto-units

---

## Phase 5: Network Segment Visualization (v0.3)

Focus: Transform VLAN/network visualization from simple node coloring to rich network segment awareness.

### 5.1 VLAN Legend & Controls
Add a visible VLAN legend to the map interface:
- Color-coded VLAN list with names and client counts
- Click VLAN to filter/highlight only devices on that network
- Toggle VLAN visibility (show/hide entire network segments)
- Quick stats: "IoT (12 clients) • Guest (3 clients) • Trusted (8 clients)"

### 5.2 Network Segment Grouping (Requires Upstream)
Visual clustering of devices by network segment:
- Optional visual boundaries around network segments
- Subnet-based grouping (192.168.1.x grouped together)
- Drag-to-collapse network segments for cleaner overview
- **Upstream Issue**: Layout engine support for logical grouping

### 5.3 Edge VLAN Coloring
Extend VLAN colors from nodes to connections:
- Color edges based on the VLAN of the traffic/connection
- Cross-VLAN connections shown with gradient or distinct style
- Highlight inter-VLAN routing paths

### 5.4 VLAN Details Panel
Dedicated panel view for network segments:
- List all devices on selected VLAN
- Show VLAN configuration (ID, name, purpose)
- Gateway/DHCP info if available
- Quick actions: "Show all on map", "Create alert for this VLAN"

### 5.5 Network Topology Modes
Different visualization modes for different needs:
- **Physical View**: Current topology (actual cable/wireless connections)
- **Logical View**: Group by VLAN/network segment regardless of physical location
- **Hybrid View**: Physical layout with VLAN coloring overlay

---

## Phase 6: Reliability & Error Handling (v0.3.x)

Focus: Production-grade reliability for 24/7 operation.

### 6.1 Connection Resilience
- Automatic reconnection with exponential backoff on WebSocket failures
- Graceful degradation to polling when WebSocket unavailable
- Connection status indicator in card UI
- Health check endpoint for monitoring

### 6.2 Error Recovery
- Clear error states with actionable messages
- "Retry" buttons that actually work across all failure modes
- Partial data display (show what we have, indicate what's missing)
- Stale data indicator (show last-updated timestamp when data is old)

### 6.3 Data Validation
- Schema validation for all API responses
- Graceful handling of malformed UniFi data
- Warning indicators for inconsistent topology data
- Debug mode toggle for troubleshooting

### 6.4 Performance at Scale
- Lazy loading for large networks (100+ devices)
- Virtual scrolling in device lists
- Throttled updates during rapid changes
- Memory usage optimization for long-running sessions

---

## Phase 7: UX Refinements (v0.4)

Focus: Polish the user experience for daily use.

### 7.1 Search & Quick Navigation
- Global search: Find any device by name, MAC, IP, or VLAN
- Keyboard shortcuts (/, Esc, arrow keys for navigation)
- Recent devices list
- Favorites/pinned devices

### 7.2 Improved Tooltips & Hover States
- Richer tooltips showing key device info on hover
- Preview panel on hover (don't require click)
- Highlight connected devices on hover
- Show path to selected device from gateway

### 7.3 Card Configuration UX
- Visual theme preview in editor
- "Test Connection" button in setup
- Import/export card configuration
- Presets for common layouts

### 7.4 Accessibility
- Keyboard navigation throughout
- Screen reader support for topology
- High contrast mode
- Reduced motion option

### 7.5 Mobile Experience
- Responsive detail panel (bottom sheet on mobile)
- Better touch targets
- Swipe gestures for navigation
- Landscape optimization

---

## Phase 8: Advanced Features (v0.5+)

### 8.1 Path Visualization
- Highlight the network path between two selected devices
- Show which switches/APs traffic traverses
- Visualize redundant paths (if available)
- Useful for understanding latency/routing issues

### 8.2 Topology Diff & Alerts
- Compare current topology to a "known good" baseline
- Highlight new devices, missing devices, changed connections
- Integration with HA notifications for topology changes
- "Topology changed" event for automations

### 8.3 Network Zones
- Define logical zones (e.g., "Entertainment", "Security", "Work")
- Group devices regardless of physical location or VLAN
- Zone-based filtering and alerting
- Custom icons per zone

### 8.4 Device Insights
- Per-device connection history (when did it last connect?)
- Uptime tracking for network devices
- Connection quality indicators for wireless clients
- Port utilization trends (which ports are most used?)

### 8.5 Multi-Site Support
- View multiple UniFi sites in one card
- Cross-site topology visualization
- Site selector in card UI
- Unified search across sites

---

## Upstream Library Improvements

Features requiring changes to `unifi-network-maps` library.

**GitHub Issues Created:**

| Issue | Feature | Status |
|-------|---------|--------|
| [#19](https://github.com/merlijntishauser/unifi-network-maps/issues/19) | Network segment layout support | Open |
| [#20](https://github.com/merlijntishauser/unifi-network-maps/issues/20) | Edge metadata with VLAN info | Open |
| [#21](https://github.com/merlijntishauser/unifi-network-maps/issues/21) | Topology diff API | Open |
| [#22](https://github.com/merlijntishauser/unifi-network-maps/issues/22) | SVG theme system (UniFi colors) | Open |
| [#23](https://github.com/merlijntishauser/unifi-network-maps/issues/23) | Enhanced isometric icons | Open |
| [#24](https://github.com/merlijntishauser/unifi-network-maps/issues/24) | Connection quality data | Open |

### Visual Improvements (via Upstream)

#### SVG Theme System (#22)
- Built-in UniFi-aligned color theme
- Dark and light variants
- CSS variable support for easy customization
- Consistent with UniFi's modern dashboard aesthetic

#### Enhanced Icons (#23)
- Refreshed isometric icon designs
- More device types: cameras, doorbells, NVR, smart plugs, speakers, TVs, NAS, printers
- Device fingerprint detection for automatic icon selection
- Status variants (online/offline)
- Size variants for dense layouts

---

## Explicitly Out of Scope

These features are better served by UniFi's native dashboard:

- **Live throughput/bandwidth graphs** - UniFi does this excellently
- **Latency monitoring** - UniFi's built-in latency tests are comprehensive
- **DPI (Deep Packet Inspection)** - UniFi exclusive feature
- **Client roaming statistics** - Native UniFi dashboard feature
- **Speed tests** - UniFi integrates speedtest.net directly
- **Traffic analytics** - UniFi's traffic identification is best-in-class
- **Firewall rule management** - Use UniFi's native UI

---

## Implementation Notes

### Entity Naming Convention
```
{domain}.unifi_{type}_{normalized_name}
```
Examples:
- `binary_sensor.unifi_device_office_switch`
- `binary_sensor.unifi_client_sonos_kitchen`
- `sensor.unifi_vlan_iot_clients`

### Testing Strategy
- Unit tests for all new UI components
- Integration tests for HA entity creation
- E2E tests for user flows
- Contract tests for upstream library compatibility
- Visual regression tests for theme consistency

### Performance Targets
- Initial render: < 500ms for 50 devices
- WebSocket update: < 100ms to reflect change
- Memory usage: < 50MB for 200 devices
- Mobile: Smooth 60fps pan/zoom

---

## Contributing

Priority areas for contribution:
1. **VLAN visualization** - Legend, filtering, segment views
2. **Search & navigation** - Global search, keyboard shortcuts
3. **Accessibility** - Keyboard nav, screen readers
4. **Documentation** - Usage examples, troubleshooting guides
5. **Upstream improvements** - Enhance `unifi-network-maps` library

---

*Last updated: 2026-02-01*

## Version History

| Version | Focus | Status |
|---------|-------|--------|
| 0.1.x | Core functionality, stability | Complete |
| 0.2.x | Network health entities, blueprints | Current |
| 0.3.x | Network segment visualization | Next |
| 0.4.x | UX refinements | Planned |
| 0.5.x | Advanced features | Future |
