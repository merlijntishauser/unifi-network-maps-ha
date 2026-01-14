# Roadmap (Prioritized)

## P0 - MVP loop
- Expose a stable map payload schema (versioned) for the card.
- Add a service to force refresh the map (`unifi_network_map.refresh`).
- Add basic error entity/state for connectivity/auth failures.
- Bundle and publish the custom card build output (resource instructions).

## P1 - Usable UX
- Add Lovelace card UI (zoom/pan, tooltip, device details panel).
- Add map options flow (include ports/clients, isometric, only UniFi).
- Cache rendered SVG/payload to avoid re-render on each request.

## P2 - Quality & ops
- Add diagnostics endpoint (anonymized) for support.
- Add integration config options validation (client scope, sizes).
- Add contract tests for renderer payload schema changes.

## P3 - Release & polish
- Add CI packaging/build release for the card.
- Add documentation with screenshots and example dashboards.
- Re-enable HACS checks when brands PR is merged.
