# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[Unreleased]: https://github.com/merlijntishauser/unifi-network-maps-ha/compare/v0.1.7...HEAD
[0.1.7]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.7
[0.1.6]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.6
[0.1.5]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.5
[0.1.4]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.4
[0.1.3]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.3
[0.1.2]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.2
[0.1.1]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.1
[0.1.0]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.0
