# Lovelace Card

This is a placeholder TypeScript card for the UniFi Network Map integration.

## Build
```bash
npm install
npm run build
```

Output: `dist/unifi-network-map.js`

## Home Assistant resource
Copy `dist/unifi-network-map.js` into your HA `/config/www/` folder and add it
as a Lovelace resource:

```yaml
resources:
  - url: /local/unifi-network-map.js
    type: module
```

## Features
- Pan/zoom on the SVG map.
- Hover tooltip and click-to-open details panel.
