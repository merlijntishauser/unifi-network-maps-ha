# Lovelace Card (frontend)

This is the TypeScript source for the UniFi Network Map Lovelace card. The
bundle is built with esbuild and copied into the integration as a static asset.

## Build
```bash
npm install
npm run build
```

Output: `dist/unifi-network-map.js`

The repo Make target `frontend-build` also copies the bundle into
`custom_components/unifi_network_map/frontend/unifi-network-map.js`.

## Dev scripts
```bash
npm run test
npm run typecheck
npm run lint
npm run format
npm run format:check
```

## Home Assistant resource
The integration registers the Lovelace resource on setup. If it does not show
up automatically, add the resource entry manually:

```yaml
resources:
  - url: /unifi-network-map/unifi-network-map.js
    type: module
```

## Features
- Pan/zoom (mouse wheel and touch pinch) with reset/zoom controls.
- Hover tooltips for nodes and edges with speed/PoE/channel hints.
- Filter bar to toggle device types (gateways, switches, APs, clients, other).
- Click a node to open a multi-tab details panel with live status and stats.
- Context menu + entity modal with quick actions and related entities.
- Port overview modal for compatible devices.

## Supported inputs
- Mouse: drag to pan, wheel to zoom, right-click for context menu.
- Touch: drag to pan, pinch to zoom.
