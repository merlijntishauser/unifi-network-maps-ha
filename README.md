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
- Implement DataUpdateCoordinator + API wrapper.
- Render SVG + JSON via core `unifi-network-maps` library.
- Add card build tooling (vite/rollup) and release pipeline.

## Development notes
- Keep the integration code self-contained for HACS.
- Use HA storage for credentials and options.
- Avoid writing secrets into any JSON exports.
