# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.3]
### Added
- Custom entity modal with related entities overview.
- Edge hover tooltip showing connection details.
- Context menu with right-click actions

### Changed
- Improved Home Assistant artifacts (device registration, entry title, scan interval).
- Added auth backoff logging and tightened frontend types.
- Bump unifi-network-maps to 1.4.11

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

[Unreleased]: https://github.com/merlijntishauser/unifi-network-maps-ha/compare/v0.1.3...HEAD
[0.1.3]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.3
[0.1.2]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.2
[0.1.1]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.1
[0.1.0]: https://github.com/merlijntishauser/unifi-network-maps-ha/releases/tag/v0.1.0
