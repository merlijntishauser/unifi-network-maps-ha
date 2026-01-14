# UniFi Network Map (Home Assistant Integration)

Skeleton repo for a Home Assistant integration + Lovelace custom card.
This is a starting point for a standalone repo.

## What it is
- HA integration (Python) that will query UniFi for LLDP + client data.
- Custom card (TypeScript) that renders SVG + drilldown panels.
- Config Flow for credentials (no `.env` in HA).

## Repository layout
```
custom_components/unifi_network_map/   # HA integration
frontend/                               # Lovelace custom card (TS)
.github/workflows/                      # CI (hassfest + hacs)
hacs.json                               # HACS metadata
```

## Next steps
- Wire Config Flow to UniFi auth + validation.
- Implement UniFi API client (auth, sites, devices, clients).
- Render SVG + JSON via core `unifi-network-maps` library.
- Expose SVG/JSON via HA endpoints or cached assets.
- Add card build tooling (vite/rollup) and release pipeline.

## Dependencies
- `unifi-network-maps` (https://pypi.org/project/unifi-network-maps/)

## Development notes
- Keep the integration code self-contained for HACS.
- Use HA storage for credentials and options.
- Avoid writing secrets into any JSON exports.

## Local testing
See `docs/LOCAL_TESTING.md` for a Docker-based smoke test flow.
