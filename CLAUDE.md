# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Home Assistant custom integration that displays UniFi network topology as a live SVG map with optional client visibility and drill-down details. Uses the `unifi-network-maps` Python library (currently 1.6.2) for rendering.

## Development Commands

```bash
# Python setup (requires Python 3.13)
make install-dev          # Create .venv and install all dependencies

# Dependencies
make dependency-update    # Sync requirements.txt from manifest.json and reinstall

# Testing
make test                 # Run pytest with coverage (unit + integration + contract)
make test-unit            # Run unit tests only
make test-integration     # Run integration tests only
make test-contract        # Run contract tests only
make test-e2e             # Run E2E tests with Docker (SKIP_E2E=1 to skip in release)
make test-e2e-reuse       # Run E2E tests, keep Docker stack running
make test-e2e-debug       # Run E2E tests with visible browser
make test-e2e-all         # Run E2E tests against all HA versions in ha-matrix.yaml
make frontend-test        # Run Jest tests

# Code quality
make pre-commit-run       # Run all pre-commit hooks
make ci                   # Alias for pre-commit-run
make format               # Run ruff format

# Frontend
make frontend-install     # Install Node dependencies
make frontend-build       # Build TypeScript and copy to custom_components/
make frontend-typecheck   # TypeScript strict checking
make frontend-lint        # ESLint check
make frontend-format      # Prettier format check

# Release
make version-bump         # Bump version across all files, build, tag, push
make release              # CI + E2E + version-bump + release zip
make release-hotfix       # Rebuild bundle, retag, upload asset
```

## Architecture

### Backend Modules (Python)

| Module | Purpose |
|--------|---------|
| `__init__.py` | Entry point; sets up coordinator, HTTP views, WebSocket, sensors |
| `config_flow.py` | Multi-step setup wizard: credentials, site selection, render options |
| `coordinator.py` | `DataUpdateCoordinator` subclass; polls UniFi API, manages auth backoff |
| `api.py` | Thin wrapper around `unifi-network-maps` library; handles SSL and caching |
| `renderer.py` | Transforms topology data into SVG + JSON payload with node metadata |
| `http.py` | Two `HomeAssistantView` endpoints: `/api/unifi_network_map/{entry_id}/svg` and `/payload` |
| `websocket.py` | WebSocket subscription (`unifi_network_map/subscribe`); pushes payload on coordinator updates |
| `sensor.py` | HA sensor entity with device count attributes; VLAN client count sensors |
| `binary_sensor.py` | Per-device binary sensors (gateway/switch/AP) and client connectivity sensors |
| `data.py` | Data class `UniFiNetworkMapData` wrapping SVG, payload, and WAN info |
| `payload_cache.py` | Payload caching with configurable TTL (0-300s, default 30s) |
| `entity_cache.py` | Caches entity registry index for MAC-to-entity lookups; rebuilds on registry changes |
| `errors.py` | Custom exception hierarchy |
| `diagnostics.py` | HA diagnostics support with redacted output |
| `const.py` | Configuration keys, defaults, model name fallback mapping |
| `utils.py` | Utility functions |

### Backend Data Flow
1. **Config Flow** - User enters UniFi controller credentials via HA UI
2. **Coordinator** - Polls UniFi API every 10 min (configurable 1-60 min)
3. **API Client** - Fetches devices, clients, networks from UniFi controller
4. **Renderer** - Builds topology, renders SVG + JSON payload via `unifi-network-maps`
5. **HTTP Views** - Serves SVG and enriched payload (with entity resolution)
6. **WebSocket** - Pushes payload updates to subscribed frontend cards in real-time
7. **Sensors** - Exposes device status, client connectivity, VLAN client counts

### Frontend Flow (TypeScript)
1. **WebComponent** (`frontend/src/unifi-network-map.ts`) - Lovelace custom card
2. Subscribes to WebSocket for real-time updates (falls back to HTTP polling at 30s)
3. Fetches SVG from HTTP endpoint on initial load
4. Renders interactive SVG with pan/zoom/selection
5. Detail panel shows device properties; links client MACs to HA UniFi integration entities

### Frontend Module Structure

```
frontend/src/card/
  core/             Main card, editor, types, state
  data/             Auth, data fetching, WebSocket, SVG annotation, sanitization
  interaction/      Pan/zoom, selection, filters, context menu, entity modal
  ui/               Panel, icons, styles, filter bar, context menu, modals, VLAN colors
  shared/           Constants, localization (10 locales), editor helpers, utilities
```

**`core/`**
- `unifi-network-map-card.ts` - Main card class with rendering and state management
- `unifi-network-map-editor.ts` - Card configuration editor
- `types.ts` - TypeScript type definitions (MapPayload, CardConfig, etc.)
- `state.ts` - Config normalization and polling utilities

**`data/`**
- `auth.ts` - Authenticated fetch wrapper
- `data.ts` - SVG and payload loaders
- `websocket.ts` - WebSocket subscription for real-time map updates
- `annotation-cache.ts` - SVG annotation caching based on content hashes
- `sanitize.ts` - HTML/SVG sanitization (DOMPurify)
- `svg.ts` - SVG edge annotation and tooltip rendering

**`interaction/`**
- `viewport.ts` - Pan/zoom/pinch gesture handling
- `selection.ts` - Node selection state
- `node.ts` - Node element utilities (find, highlight, annotate)
- `filter-state.ts` - Device type filter state management
- `context-menu-state.ts` - Right-click context menu controller
- `entity-modal-state.ts` - Entity details modal controller

**`ui/`**
- `panel.ts` - Side panel content rendering
- `icons.ts` - Device type and domain icons (Heroicons)
- `styles.ts` - CSS styles with card theme variants (light, unifi, unifi-dark)
- `filter-bar.ts` - Filter bar rendering
- `context-menu.ts` - Context menu rendering
- `entity-modal.ts` - Entity modal rendering
- `port-modal.ts` - Port details modal rendering
- `vlan-colors.ts` - VLAN-to-color palette mapping

**`shared/`**
- `constants.ts` - Shared constants
- `localize.ts` - Localization helper
- `locales/` - 10 language files (en, de, es, fr, nl, sv, da, fi, is, nb)
- `feedback.ts` - Toast notification system
- `node-utils.ts` - Node IP resolution utilities
- `editor-helpers.ts` - Card editor form schema helpers

### Key Integration Points
- Built JS bundle is copied to `custom_components/unifi_network_map/frontend/`
- Card resource auto-registered at `/unifi-network-map/unifi-network-map.js`
- Official UniFi integration domain is `unifi` (built-in), not `unifi_network`
- Four automation blueprints in `custom_components/unifi_network_map/blueprints/automation/`

### Theming

Two separate theme systems:
- **Card theme** (HA UI): `light`, `unifi`, `unifi-dark` -- set via `data-theme` attribute on `ha-card`
- **SVG theme** (rendered map): `unifi`, `unifi-dark`, `minimal`, `minimal-dark`, `classic`, `classic-dark` -- passed to upstream renderer via `svg_theme` config option

Icon sets: `modern` (default), `isometric`

## Testing

### Test Structure
- `tests/unit/` - Unit tests
- `tests/integration/` - Integration tests
- `tests/contract/` - Contract tests (validates upstream library interface)
- `tests/e2e/` - E2E tests with Playwright + Docker-based Home Assistant
- `frontend/src/__tests__/` - Frontend Jest tests

### E2E Tests
Located in `tests/e2e/`, using Playwright with Docker-based Home Assistant:

```bash
make test-e2e                                    # Full run with Docker lifecycle
make test-e2e-reuse                              # Reuse running Docker stack
make test-e2e-debug                              # Visible browser, slow motion
cd tests/e2e && pytest -v test_lovelace_card.py  # Run specific test file
```

**E2E Infrastructure:**
- `conftest.py` - Fixtures for Docker services, HA authentication, config entries
- `docker-compose.yml` - HA container + mock UniFi controller
- `mock-unifi/` - Mock UniFi API server with test topology fixture
- `ha-config-*/` - HA configuration directories for different versions
- `ha-matrix.yaml` - HA version matrix for `test-e2e-all`

**E2E Test Pattern:**
```python
def test_something(authenticated_page: Page, entry_id: str, ha_auth_token: str):
    page = authenticated_page
    page.goto(f"{HA_URL}/lovelace/e2e-test")
    page.wait_for_function("customElements.get('unifi-network-map') !== undefined")
    _create_test_card(page, entry_id, ha_auth_token)
    # Test interactions...
```

## Dependency Management

- **`manifest.json`** is the single source of truth for Python dependencies (in the `requirements` array)
- **`requirements.txt`** is auto-generated from `manifest.json` -- never edit it directly
- After changing a dependency in `manifest.json`, run `make dependency-update` to sync `requirements.txt` and reinstall
- A pre-commit hook (`check-requirements`) will fail if the two files are out of sync
- The `version-bump` target also syncs `requirements.txt` automatically

## Code Quality Standards

- **Python**: Ruff for formatting/linting, Pyright strict mode, target Python 3.13
- **Frontend**: Prettier + ESLint, TypeScript strict, 100 char line length
- Both use double quotes
- Run `npm run format` in `frontend/` to fix Prettier issues
- Pre-commit hooks: check-requirements, hassfest, pytest (unit/integration/contract), pyright, ruff, pylint similarities, radon complexity, frontend (test/typecheck/lint/format)

## Frontend Patterns

### Node/Edge Filtering
Visibility is controlled via CSS classes, not DOM removal:
- `.node--filtered` - Hides node with `opacity: 0; pointer-events: none`
- `.edge--filtered` - Hides edge similarly
- This allows instant toggle without re-fetching data

### SVG Node Identification
Nodes are identified by `data-node-id` attribute added via `annotateNodeIds()`. The payload's `node_types` maps node names to types (gateway, switch, ap, client, other).

### State Management
The card uses simple property-based state (no external state library):
- `_filterState` - DeviceTypeFilters object
- `_selection` - Selection state (selectedNode, hoveredNode, hoveredEdge)
- `_viewportState` - Pan/zoom transform state
- `_payload` - MapPayload from API

UI updates call `_render()` for full re-render or targeted methods like `_updateSelectionOnly()` for partial updates.

## Utility Scripts

| Script | Purpose |
|--------|---------|
| `scripts/version_sync.py` | Syncs VERSION to manifest.json, requirements.txt, package.json, hacs.json |
| `scripts/build_release_zip.py` | Creates HACS release zip |
| `scripts/radon_report.py` | Code complexity reporting (cyclomatic complexity + maintainability index) |

## Key Principles

This project values XP (Extreme Programming) and clean code practices:

- Naming is critical; choose clear, intention-revealing names
- Optimize for human readability over cleverness
- Prefer small, safe refactors and commit often
- Long functions (>15 lines) are a code smell; split into smaller parts
- Prefer upstreaming changes to `unifi-network-maps` library over adding custom plumbing here
- Use HA's config entry storage for credentials; never log secrets
- Fail fast on missing UniFi connectivity; surface errors in HA
