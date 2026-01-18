# Contributing

Thanks for helping improve UniFi Network Map for Home Assistant.

## Project layout
```
custom_components/unifi_network_map/   # HA integration
frontend/                               # Lovelace custom card source (TS)
custom_components/unifi_network_map/frontend/  # Built card bundle for HA
.github/workflows/                      # CI (hassfest + hacs)
hacs.json                               # HACS metadata
```

## Development setup
- Python: use `make install-dev` to create `.venv` and install dependencies.
- Python 3.12+ is required (3.13 preferred).
- Frontend: run `make frontend-install` to install Node dependencies.

## Pre-commit hooks
We use `pre-commit` to keep local checks consistent with CI. It runs:
- Hassfest via Docker (`ghcr.io/home-assistant/hassfest:latest`)
- Python tests (`make test`)
- Frontend tests (`make frontend-test`)

Enable it once:
```bash
pip install -r requirements-dev.txt
pre-commit install
```

Or use the Makefile (no activation required):
```bash
make pre-commit-install
make pre-commit-run
```

Run all hooks manually:
```bash
pre-commit run --all-files
```

## Testing
- Python: `make test`
- Frontend: `make frontend-test`
 - Build bundle for HA: `make frontend-build` (copies to `custom_components/unifi_network_map/frontend/`)

## Architecture notes
- The integration renders SVG + JSON via `unifi-network-maps`.
- Endpoints are served at `/api/unifi_network_map/<entry_id>/svg` and `/payload`.
- The card resource is auto-registered and served from
  `/unifi-network-map/unifi-network-map.js`.
- Keep the integration self-contained for HACS and avoid logging secrets.

## Workflow guidelines
- Preferred branch: `TBD` until we settle on a release flow.
- We prefer rebasing over merge commits.
- PRs are for unknown contributors; regular contributors can push directly.
- Commit style: small and focused. Many small commits are preferred; no squashing.
- Prefer opening PRs against `unifi-network-maps` instead of adding custom plumbing here.
