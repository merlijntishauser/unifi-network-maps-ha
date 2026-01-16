# Lovelace Card

This is a placeholder TypeScript card for the UniFi Network Map integration.

## Build
```bash
npm install
npm run build
```

Output: `dist/unifi-network-map.js`

## Home Assistant resource
The integration registers the Lovelace resource on setup. If it does not show
up automatically, add the resource entry manually:

```yaml
resources:
  - url: /unifi-network-map/unifi-network-map.js
    type: module
```

## Features
- Pan/zoom on the SVG map.
- Hover tooltip and click-to-open details panel.
