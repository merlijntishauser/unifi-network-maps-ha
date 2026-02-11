# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Home Assistant custom integration that displays UniFi network topology as a live SVG map with optional client visibility and drill-down details. Uses the `unifi-network-maps` Python library for rendering.

## Development Commands

```bash
# Python setup (requires Python 3.13)
make install-dev          # Create .venv and install all dependencies

# Dependencies
make dependency-update    # Sync requirements.txt from manifest.json and reinstall

# Testing
make test                 # Run pytest with coverage
make frontend-test        # Run Jest tests

# Code quality
make pre-commit-run       # Run all pre-commit hooks (hassfest, pytest, pyright, ruff, frontend checks)
make ci                   # Alias for pre-commit-run

# Frontend
make frontend-install     # Install Node dependencies
make frontend-build       # Build TypeScript and copy to custom_components/
make frontend-typecheck   # TypeScript strict checking
make frontend-lint        # ESLint check
```

## Architecture

### Backend Flow (Python)
1. **Config Flow** (`config_flow.py`) - User enters UniFi controller credentials via HA UI
2. **DataUpdateCoordinator** (`coordinator.py`) - Polls UniFi API every 60s (configurable)
3. **API Client** (`api.py`) - Wraps `unifi-network-maps` library
4. **Renderer** (`renderer.py`) - Transforms API data into SVG + JSON payload
5. **HTTP Views** (`http.py`) - Serves `/api/unifi_network_map/{entry_id}/svg` and `/payload`
6. **Sensor Entity** (`sensor.py`) - Exposes HA sensor with status info

### Frontend Flow (TypeScript)
1. **WebComponent** (`frontend/src/unifi-network-map.ts`) - Lovelace custom card
2. Fetches SVG and payload from HA API with auth token
3. Renders interactive SVG with pan/zoom/selection
4. Detail panel shows device properties; links client MACs to HA UniFi integration entities

### Frontend Module Structure
The frontend is organized into focused modules under `frontend/src/card/`:

- **`core/`** - Main card component and types
  - `unifi-network-map-card.ts` - Main card class with rendering and state management
  - `unifi-network-map-editor.ts` - Card configuration editor
  - `types.ts` - TypeScript type definitions (MapPayload, CardConfig, etc.)
  - `state.ts` - Config normalization and polling utilities

- **`interaction/`** - User interaction handlers
  - `viewport.ts` - Pan/zoom/pinch gesture handling
  - `selection.ts` - Node selection state
  - `node.ts` - Node element utilities (find, highlight, annotate)
  - `filter-state.ts` - Device type filter state management
  - `context-menu-state.ts` - Right-click context menu controller
  - `entity-modal-state.ts` - Entity details modal controller

- **`ui/`** - UI rendering functions (return HTML strings)
  - `panel.ts` - Side panel content rendering
  - `icons.ts` - Device type and domain icons (emoji + Heroicons)
  - `styles.ts` - CSS styles with theme variants (dark, light, unifi, unifi-dark)
  - `filter-bar.ts` - Filter bar rendering
  - `context-menu.ts` - Context menu rendering
  - `entity-modal.ts` - Entity modal rendering
  - `port-modal.ts` - Port details modal rendering

- **`data/`** - Data fetching and transformation
  - `auth.ts` - Authenticated fetch wrapper
  - `data.ts` - SVG and payload loaders
  - `sanitize.ts` - HTML/SVG sanitization
  - `svg.ts` - SVG edge annotation and tooltip rendering

- **`shared/`** - Shared utilities and constants

### Key Integration Points
- Built JS bundle is copied to `custom_components/unifi_network_map/frontend/`
- Card resource auto-registered at `/unifi-network-map/unifi-network-map.js`
- Official UniFi integration domain is `unifi` (built-in), not `unifi_network`

## Testing

### Unit/Integration Tests
- **Python tests** in `tests/unit/` and `tests/integration/` - run with `make test`
- **Frontend tests** in `frontend/src/__tests__/` - Jest tests run with `make frontend-test`

### E2E Tests
Located in `tests/e2e/`, using Playwright with Docker-based Home Assistant:

```bash
cd tests/e2e && pytest -v                    # Run all E2E tests
cd tests/e2e && pytest -v test_lovelace_card.py  # Run card interaction tests
```

**E2E Infrastructure:**
- `conftest.py` - Fixtures for Docker services, HA authentication, config entries
- `docker-compose.yml` - HA container + mock UniFi controller
- `mock-unifi/` - Mock UniFi API server with test topology fixture
- `ha-config-*/` - HA configuration directories for different versions

**Key E2E Fixtures:**
- `docker_services` - Starts/stops Docker stack (session-scoped)
- `ha_auth_token` - Obtains HA access token
- `authenticated_page` - Playwright page with HA auth cookies
- `entry_id` - Creates a config entry via HA API

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

## Frontend Patterns

### Theming
Four theme variants: `dark`, `light`, `unifi`, `unifi-dark`. Theme is set via `data-theme` attribute on `ha-card`. Theme-specific CSS uses attribute selectors:
```css
ha-card[data-theme="light"] .some-class { ... }
ha-card[data-theme="unifi"] .some-class { ... }
```

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

## Key Principles

This project values XP (Extreme Programming) and clean code practices:

- Naming is critical; choose clear, intention-revealing names
- Optimize for human readability over cleverness
- Prefer small, safe refactors and commit often
- Long functions (>15 lines) are a code smell; split into smaller parts
- Prefer upstreaming changes to `unifi-network-maps` library over adding custom plumbing here
- Use HA's config entry storage for credentials; never log secrets
- Fail fast on missing UniFi connectivity; surface errors in HA
