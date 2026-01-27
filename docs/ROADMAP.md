# UniFi Network Map - Roadmap

> **Vision**: A Home Assistant integration that provides network topology visualization and **network health monitoring** through automations. Not a replacement for UniFi's native dashboard, but a way to bring network awareness into your smart home.

## Design Philosophy

- **Visualization over Statistics**: UniFi's native dashboard excels at live throughput, latency, and device metrics. We focus on *topology understanding* and *integration with HA automations*.
- **Network as Infrastructure**: Treat the network like any other HA integration - expose meaningful states that can trigger automations.
- **Blueprints for Network Health**: Provide ready-to-use automation blueprints for common network monitoring scenarios.

---

## Current State (v1.4.x)

### Core Features
- [x] Interactive SVG topology map with pan/zoom
- [x] Device filtering by type (gateway, switch, AP, client)
- [x] WebSocket push updates (no polling)
- [x] Node selection with detail panel
- [x] Entity linking (MAC addresses to HA entities)
- [x] VLAN visualization
- [x] Port utilization display
- [x] Theme support (dark, light, unifi, unifi-dark)
- [x] Mobile touch gestures

### Known Issues to Fix

| Priority | Issue | Impact |
|----------|-------|--------|
| High | Filter bar DOM churn on every update | Performance degrades on large networks |
| Medium | AbortController race in concurrent fetches | Stale data can overwrite fresh data |
| Medium | Shallow copy of payload dict | Potential data corruption risk |

---

## Phase 1: Stability & Performance (Next Release)

Focus: Fix critical bugs and improve performance before adding new features.

### 1.1 Bug Fixes
- [x] Fix Lovelace retry race condition with proper locking
- [x] Re-subscribe WebSocket on config change; cleanup on disconnect
- [x] Add 30s timeout to UniFi API calls
- [x] Fix exponential backoff calculation
- [ ] Use deep copy for payload modifications

### 1.2 Performance
- [ ] Cache entity registry index; rebuild only on entity changes
- [ ] Update filter buttons incrementally instead of full rebuild
- [ ] Cache SVG annotations; only re-annotate when content changes
- [ ] Add payload caching with configurable TTL

### 1.3 Code Quality
- [ ] Add structured logging for debugging (not verbose INFO)
- [ ] Validate config entry data format (URL, credentials)
- [ ] Standardize exception handling patterns

---

## Phase 2: Network Health Entities (v1.5)

Focus: Expose network topology data as HA entities suitable for automations.

### 2.1 Device Presence Sensors
Create binary sensors for each tracked device:
```yaml
# Example entities created
binary_sensor.unifi_device_living_room_ap:
  state: "on"  # device is connected and healthy
  attributes:
    mac: "00:11:22:33:44:03"
    ip: "192.168.1.3"
    model: "U6-LR"
    uplink_device: "Office Switch"
    clients_connected: 5
    last_seen: "2026-01-26T10:30:00Z"
```

### 2.2 Client Connectivity Sensors
Track important clients (user-configurable):
```yaml
binary_sensor.unifi_client_sonos_living_room:
  state: "on"  # client is connected
  attributes:
    mac: "aa:bb:cc:dd:ee:01"
    ip: "192.168.10.50"
    vlan: "IoT"
    connected_to: "Living Room AP"
    connection_type: "wireless"
    signal_strength: -45  # only for reference, not for graphing
```

### 2.3 Network Segment Sensors
Aggregate sensors for network segments:
```yaml
sensor.unifi_vlan_iot_clients:
  state: 12  # number of connected clients
  attributes:
    vlan_id: 10
    devices: ["Sonos", "Hue Bridge", "Denon AVR", ...]
```

### 2.4 Service Integration
For user's example use case (mDNS/HEOS discovery):
```yaml
# User defines "expected connections" in card config
expected_connections:
  - name: "AV System Reachability"
    source_vlan: "Trusted"
    target_devices: ["Denon AVR", "Heos Speaker"]
    protocol: "mdns"  # or "upnp", "http"
```

This creates:
```yaml
binary_sensor.unifi_connectivity_av_system:
  state: "on"  # all target devices are reachable from source VLAN
  attributes:
    missing_devices: []
    last_check: "2026-01-26T10:30:00Z"
```

---

## Phase 3: Automation Blueprints (v1.6)

Focus: Ready-to-use blueprints for common network monitoring scenarios.

### 3.1 Device Offline Alert
```yaml
# Blueprint: Notify when critical network device goes offline
blueprint:
  name: UniFi Device Offline Alert
  domain: automation
  input:
    device_entity:
      name: Device to Monitor
      selector:
        entity:
          domain: binary_sensor
          integration: unifi_network_map
    notify_service:
      name: Notification Service
      selector:
        target:
          entity:
            domain: notify
```

### 3.2 New Device on Network
```yaml
# Blueprint: Alert on unknown device joining network
blueprint:
  name: UniFi New Device Alert
  description: Get notified when an unknown device joins your network
  input:
    network_segment:
      name: Network/VLAN to Monitor
      selector:
        select:
          options: ["All", "Trusted", "IoT", "Guest"]
```

### 3.3 Cross-VLAN Connectivity Check
```yaml
# Blueprint: Verify devices in VLAN A can reach services in VLAN B
blueprint:
  name: UniFi Cross-VLAN Health Check
  description: Alert when expected cross-VLAN communication fails
  input:
    source_vlan:
      name: Source VLAN
    target_devices:
      name: Target Devices
      selector:
        entity:
          domain: binary_sensor
          integration: unifi_network_map
          multiple: true
```

### 3.4 AP Client Load Balancing Alert
```yaml
# Blueprint: Alert when AP has too many clients
blueprint:
  name: UniFi AP Overload Alert
  input:
    ap_entity:
      name: Access Point
    max_clients:
      name: Maximum Clients
      default: 30
```

---

## Phase 4: Advanced Topology Features (v1.7+)

### 4.1 Path Visualization
- Highlight the network path between two selected devices
- Show which switches/APs traffic traverses
- Useful for understanding latency/routing issues

### 4.2 Topology Diff
- Compare current topology to a "known good" baseline
- Highlight new devices, missing devices, changed connections
- Integration with HA notifications

### 4.3 Network Zones
- Define logical zones (e.g., "Entertainment", "Security", "Work")
- Group devices regardless of physical location
- Zone-based filtering and alerting

### 4.4 Historical View
- Show device presence over time (was it connected yesterday?)
- Not for statistics - for presence/availability patterns
- Useful for troubleshooting intermittent issues

---

## Explicitly Out of Scope

These features are better served by UniFi's native dashboard:

- **Live throughput/bandwidth graphs** - UniFi does this excellently
- **Latency monitoring** - UniFi's built-in latency tests are comprehensive
- **DPI (Deep Packet Inspection)** - UniFi exclusive feature
- **Client roaming statistics** - Native UniFi dashboard feature
- **Speed tests** - UniFi integrates speedtest.net directly
- **Traffic analytics** - UniFi's traffic identification is best-in-class

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

### Upstream Library Considerations
New features requiring API changes should be proposed to `unifi-network-maps` library first:
- Device state polling (beyond topology)
- VLAN membership queries
- Client-to-device mapping

### Testing Strategy
- Unit tests for entity state derivation
- Integration tests for HA entity creation
- E2E tests for blueprint validation
- Contract tests for upstream library compatibility

---

## Contributing

Priority areas for contribution:
1. **Bug fixes** - See "Known Issues" section
2. **Blueprint development** - Create and test automation blueprints
3. **Documentation** - Usage examples, troubleshooting guides
4. **Upstream improvements** - Enhance `unifi-network-maps` library

---

*Last updated: 2026-01-26*


## Recently Completed
- 

See [CHANGELOG.md](CHANGELOG.md) for full history.
