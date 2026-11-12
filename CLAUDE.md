# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Home Assistant custom integration that displays UniFi network topology as a live SVG map with optional client visibility and drill-down details. Rendering and topology come from the `unifi-topology` Python library (pinned in `manifest.json`).

## Commands worth knowing

- `make ci` runs every pre-commit hook (tests, pyright, ruff, pylint, radon, frontend checks, hassfest).
- `make test-e2e-all` runs the Docker-based E2E suite against every HA version in `tests/e2e/ha-matrix.yaml`.
- `SKIP_E2E=1 make release` bumps the version (reads it from stdin), tags, pushes and builds the release zip; publish it with `gh release create`.

## Gotchas

- The official UniFi integration's domain is `unifi` (built-in), not `unifi_network`.
- The built JS bundle is committed: `make frontend-build` copies it to `custom_components/unifi_network_map/frontend/`, and that copy is what ships. Rebuild and commit it with any frontend change.
- Two separate theme systems: the card theme (`light`, `unifi`, `unifi-dark`, set via `data-theme` on `ha-card`) and the SVG theme passed to the upstream renderer (`svg_theme`).
- Node/edge filtering in the card uses CSS classes (`.node--filtered`, `.edge--filtered`), not DOM removal, so toggles are instant without refetching.

## Dependency Management

- **`manifest.json`** is the single source of truth for Python dependencies (in the `requirements` array)
- **`requirements.txt`** is auto-generated from `manifest.json` -- never edit it directly
- After changing a dependency in `manifest.json`, run `make dependency-update` to sync `requirements.txt` and reinstall
- A pre-commit hook (`check-requirements`) will fail if the two files are out of sync
- The `version-bump` target also syncs `requirements.txt` automatically

## Key Principles

This project values XP (Extreme Programming) and clean code practices:

- Naming is critical; choose clear, intention-revealing names
- Optimize for human readability over cleverness
- Prefer small, safe refactors and commit often
- Long functions (>15 lines) are a code smell; split into smaller parts
- Prefer upstreaming changes to the `unifi-topology` library over adding custom plumbing here
- Use HA's config entry storage for credentials; never log secrets
- Fail fast on missing UniFi connectivity; surface errors in HA
