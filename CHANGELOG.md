# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.5] - 2026-02-24
### Fixed
- UXG-series devices (UXG-Pro, UXG-Max/UXGB) misclassified as "other" instead of gateway (#50)

### Changed
- Bumped unifi-network-maps from 1.6.3 to 1.6.4
- Added UXG-Max/UXGB to model name fallback mapping

## [0.3.3] - 2026-02-14
### Fixed
- UX7 AP still misclassified as gateway after v1.6.2 fix (upstream: in_gateway_mode field was dropped during Device normalization)

### Changed
- Bumped unifi-network-maps from 1.6.2 to 1.6.3

## [0.3.2] - 2026-02-11
### Added
- Pre-commit hook to validate requirements.txt stays in sync with manifest.json

### Fixed
- "Only UniFi devices" filter isn’t applied to clients (only_unifi not passed to build_client_edges)

## [0.3.1] - 2026-02-11
### Added
- Nordic translations (sv, nb, da, fi, is)

### Changed
- Bumped unifi-network-maps from 1.5.3 to 1.6.2
- Migrated all imports to upstream public API (sub-package exports)
- Removed legacy fetch_networks fallback for older library versions

### Fixed
- UX7 in AP mode misclassified as gateway instead of AP (upstream fix in 1.6.2)

## [0.3.0] - 2026-02-08
Release 0.3.0 upgrades to unifi-network-maps 1.5.3, bringing extended device type icons, built-in theme selection, WAN upstream visualization, and configurable WAN settings (custom ISP labels, speeds, WAN2 toggle).

### Added
- Extended device type icons: camera, TV, phone, printer, NAS, speaker, game console, IoT, client cluster
- SVG theme selection dropdown with 6 built-in themes: unifi, unifi-dark, minimal, minimal-dark, classic, classic-dark
- Icon set selection dropdown: modern (default), isometric
- WAN upstream visualization showing globe icon with link speeds, ISP info, and IP addresses
- WAN upstream configuration: toggle visibility, custom ISP names and speeds for WAN1/WAN2, WAN2 auto/enabled/disabled control
- Dynamic card background color matching the active SVG theme
- UCG Fiber (UDMA6A8) added to model name fallback mapping
- Translations for all new options in all 5 languages (en, de, es, fr, nl)

### Changed
- Upgraded unifi-network-maps from 1.4.15 to 1.5.3
- Client device subtypes now grouped under "Clients" filter button
- Default icon set changed to "modern"
- Card forwards svg_theme and icon_set selection to the backend renderer
- Cache-busting version query added to frontend JS resource URL

### Fixed
- Edge tooltips disappearing after tab switch, node click, or back navigation
- PoE bolt icons not hidden when their edge is filtered out
- Filter buttons appearing for device types with zero devices
- Device type breakdown miscounting client subtypes as "other"
- Card editor dropdowns for svg_theme and icon_set not working
- Theme loading failure in Docker-based Home Assistant environments
- Map view resetting pan/zoom when switching detail panel tabs
- WAN upstream not rendered when card requests a specific theme or icon set
- WAN upstream box clipped in isometric view (upstream fix in 1.5.3)
- Blocking file I/O warning when reading manifest version inside the event loop

## [0.2.0] - 2026-02-01
Release 0.2.0 expands the integration with new Home Assistant entities and automations: per-device binary sensors (gateway/switch/AP), client connectivity and VLAN client-count sensors, plus ready-to-use blueprints for common alerts (offline/online, AP overload, VLAN threshold). It also improves the underlying unifi-network-maps dependency and UI, with better related-entity discovery, more reliable VLAN reporting, and multiple rendering/visual fixes.

### Added
- Create binary_sensor entities for each UniFi network device (gateway, switch, AP)   
- Client Connectivity Sensors
- VLAN Client Count Sensors
- Blueprints for four common automation use cases, including:
  - Device Offline Alert: notify when a UniFi device goes offline (with optional delay).
  - Device Online Alert: notify when a UniFi device comes back online.
  - AP Overload Alert: notify when an access point exceeds a client threshold.
  - VLAN Client Alert: notify when a VLAN client count exceeds a threshold.
  Docs: [docs/BLUEPRINTS.md](docs/BLUEPRINTS.md)
- Improved navigation on modals and detail panels

### Changed
- Bumped unifi-network-maps to 1.4.15
- Improved related entity discovery
- Improved reliability of vlan reporting
- Bumped unifi-network-maps to 1.4.14
- Improved displaying of model names for UniFi devices

### Fixed
- Rendering of related entities
- Lots of visual improvements, esp. in the modal and detail panel
- Improved unit test coverage

## [0.1.11] - 2026-01-31
Lots of internal refactoring and cleanup. This release is mostly about performance improvements and stability improvements.
The upcoming 0.2 release will have some major new features.

### Added
- Cache entity registry index; rebuild only on entity changes
- SVG Annotation Caching
- Payload Caching with Configurable TTL
- Config entry data format validation

### Changed
- Implemented structured logging for debugging
- Standardized exception handling patterns across the codebase

## [0.1.10] - 2026-01-27
### Added
- Added to Hacs/default, w00p w00p!
- Warn users to hard-refresh when the custom lovelace card isn't listed after installation
- Improvement of listing related entities for a node/client
- (Configurable) 30s timeout for UniFi API calls to avoid hangs
- Added request IDs for SVG and payload fetches so stale responses can’t overwrite fresh data if concurrent fetches resolve out of order

### Changed
- SSL verification checkbox is unchecked by default, UniFi controllers ship with self-signed certificates that would cause connection failures if verification is    
  enabled
- Switched the default theme from "dark" to "UniFi"
- Logging at the info level is reduced
- When adding the custom card to Lovelace, the first known site is selected by default
- Reverted the (login) backoff to a proper exponential sequence (current delay, then double for next retry)
- Update filter buttons incrementally instead of full rebuild
- Addressed shallow payload copy by switching to deepcopy for payloads in both HTTP and WebSocket paths to prevent mutation of nested structures

### Fixed
- Possible race condition in Lovelace resource retry
- Prevent stale WebSocket subscriptions on config changes

## [0.1.9] - 2026-01-26
### Added
- Diagnostics timestamp added to show data freshness
- Diagnostics now includes an anonymized clients list
- Picture added to custom card preview in Lovelace card picker
- Dropped redundant and confusing wireless field, as Wireless clients is more accurate

### Changed
- Tooltip boundary detection: Prevent off-screen tooltips

### Fixed
- regression caused by safe path handling in unifi-network-maps 1.4.13

## [0.1.8] - 2026-01-25
### Added
- Filter by device type: Show only APs, only clients, etc.
- Translations (French, German, Spanish and Dutch)

### Changed
- Implemented websockets
- Less logging at Info level, enable debug level for more details
- For AP, the number of wireless clients is always shown, regardless of the config option for map
- Bumped unifi-network-maps to version 1.4.13

### Fixed
- Labels in lovelace editor not showing up
- PoE icons weren't removed when links are hidden by filtering
- Duplicate tooltips on nodes removed

## [0.1.7] - 2026-01-24
### Added
- An "unifi" theme (both light as dark mode)
- Port utilization: Show which ports are in use on switches
- VLAN visualization: Color-code nodes/edges by VLAN membership
- Copy-to-clipboard for MAC/IP: One-click copy in detail panel

### Fixed
- Selecting nodes and contextual menu regressions
- Subpixel rendering issues in browsers, resulting in blurry/pixelated SVG
- Issue with refresh overlay causing flickering
- Ip addresses not being displayed

## [0.1.6] - 2026-01-23
### Added
- Show spinner during payload fetches with retry button

### Fixed
- fixed regression on node selection and context menu

## [0.1.5] - 2026-01-21
### Changed
- Bump unifi-network-maps to 1.4.12

### Fixed 
- only show unifi devices when config option is enabled

## [0.1.4] - 2026-01-20
### Added
- Implemented mobile friendly touch gestures

### Fixed
- Race condition fix in Lovelace retry (atomic counter increment)

### Changed
- Refactored the lovelace card into different modules for improved maintainability

## [0.1.3] - 2026-01-19
### Added
- Custom entity modal with related entities overview.
- Edge hover tooltip showing connection details.
- Context menu with right-click actions

### Changed
- Improved Home Assistant artifacts (device registration, entry title, scan interval).
- Added auth backoff logging and tightened frontend types.
- Bump unifi-network-maps to 1.4.11
- Selected node only highlights the shapes, not labels

## [0.1.2] - 2026-01-18
### Added
- Visual feedback for selected nodes in SVG (blue glow highlight effect).
- HACS release zip automation (versioned filename + release asset builder).
- Expanded test coverage for API, config flow, and Lovelace resource registration.

### Changed
- Extracted CSS styles to `CARD_STYLES` constant (reduced `_ensureStyles()` from 164 to 9 lines).
- Harden card rendering. Replaced `innerHTML` for user-controlled content with DOMPurify.
- Refactoring on core functions to improve testability. 
- Ignore release zip artifacts under `dist/*.zip`.

### Fixed
- Auth/backoff handling: Avoid rapid re-auth attempts when UniFi returns 401/429.
- Log registration failures: If Lovelace auto-registration fails, log a clear error with next steps.

## [0.1.1] - 2026-01-17
- Validate GitHub workflows and HACS checks.

## [0.1.0] - 2026-01-17
- Initial public release.

[Unreleased]: https://github.com/merlijntishauser/unifi-network-maps-ha/compare/v0.3.5...HEAD
[0.3.5]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.3.5
[0.3.4]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.3.4
[0.3.3]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.3.3
[0.3.2]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.3.2
[0.3.1]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.3.1
[0.3.0]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.3.0
[0.2.0]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.2.0
[0.1.11]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.11
[0.1.10]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.10
[0.1.9]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.9
[0.1.8]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.8
[0.1.7]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.7
[0.1.6]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.6
[0.1.5]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.5
[0.1.4]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.4
[0.1.3]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.3
[0.1.2]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.2
[0.1.1]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.1
[0.1.0]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.0
