# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Home Assistant custom integration that displays UniFi network topology as a live SVG map with optional client visibility and drill-down details. Uses the `unifi-network-maps` Python library for rendering.

## Development Commands

```bash
# Python setup (requires Python 3.13)
make install-dev          # Create .venv and install all dependencies

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

### Key Integration Points
- Built JS bundle is copied to `custom_components/unifi_network_map/frontend/`
- Card resource auto-registered at `/unifi-network-map/unifi-network-map.js`
- Official UniFi integration domain is `unifi` (built-in), not `unifi_network`

## Code Quality Standards

- **Python**: Ruff for formatting/linting, Pyright strict mode, target Python 3.13
- **Frontend**: Prettier + ESLint, TypeScript strict, 100 char line length
- Both use double quotes

## Key Principles

This project values XP (Extreme Programming) and clean code practices:

- Naming is critical; choose clear, intention-revealing names
- Optimize for human readability over cleverness
- Prefer small, safe refactors and commit often
- Long functions (>15 lines) are a code smell; split into smaller parts
- Prefer upstreaming changes to `unifi-network-maps` library over adding custom plumbing here
- Use HA's config entry storage for credentials; never log secrets
- Fail fast on missing UniFi connectivity; surface errors in HA
