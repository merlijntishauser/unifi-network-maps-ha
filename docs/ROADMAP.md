# Roadmap (Prioritized)

## P0 - MVP loop
- Expose a stable map payload schema (versioned) for the card. (done: `schema_version`)
- Add a service to force refresh the map (`unifi_network_map.refresh`). (done)
- Add basic error entity/state for connectivity/auth failures. (done)
- Bundle and publish the custom card build output (resource instructions). (done)
- "connect" clients to the entities of the "official" unifi integration

## P1 - Usable UX
- Add Lovelace card UI (zoom/pan, tooltip, device details panel). (done)
- Add map options flow (include ports/clients, isometric, only UniFi). (done)
- Cache rendered SVG/payload to avoid re-render on each request. (done)
- Fix UI controls visibility and node click selection in the card. (done)
- Link client nodes to official UniFi integration entities via MAC mapping. (done)

## P2 - Quality & ops
- Add diagnostics endpoint (anonymized) for support. (done)
- Add integration config options validation (client scope, sizes). (done)
- Add contract tests for renderer payload schema changes. (done)

## P3 - Release & polish
- Add CI packaging/build release for the card. (done)
- Add documentation with screenshots and example dashboards.
- Re-enable HACS checks when brands PR is merged.
