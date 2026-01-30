# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]
### Added
- Cache entity registry index; rebuild only on entity changes
- SVG Annotation Caching
- Payload Caching with Configurable TTL

### Changed
- Implemented structured logging for debugging

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

[Unreleased]: https://github.com/merlijntishauser/unifi-network-maps-ha/compare/v0.1.10...HEAD
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
