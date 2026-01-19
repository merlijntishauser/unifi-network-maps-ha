# UniFi Network Map (Home Assistant)

[![CI](https://github.com/merlijntishauser/unifi-network-maps-ha/actions/workflows/ci.yml/badge.svg)](https://github.com/merlijntishauser/unifi-network-maps-ha/actions/workflows/ci.yml)
[![CodeQL](https://github.com/merlijntishauser/unifi-network-maps-ha/actions/workflows/codeql.yml/badge.svg)](https://github.com/merlijntishauser/unifi-network-maps-ha/actions/workflows/codeql.yml)

See your UniFi network as a live SVG map in Home Assistant, with optional
client visibility and drill-down details.

![UniFi Network Map Lovelace card](screenshots/lovelace-card.png)

## Requirements
- Home Assistant 2024.12+
- UniFi Network controller (UniFi OS or self-hosted)
- A local UniFi account (read access to devices/clients)
- Strongly recommended: install the official UniFi Network integration
  (`unifi`) to enrich clients/devices with existing entity data.

### Local UniFi account (required)
Cloud-only credentials won’t work here. Create a local account in the UniFi
Network app:
1) Go to **Settings → Admins & Users** (or **System → Users** on newer UIs).
2) Add a **Local User** (not a cloud account).
3) Grant at least **Read** access to the Network application.

## Install (pre-HACS)
Until the repository is listed in HACS by default, install it as a custom
repository or manually.

### Option A: HACS custom repository
1) In HACS, go to **Integrations → ⋮ → Custom repositories**.
2) Add `https://github.com/merlijntishauser/unifi-network-maps-ha` as **Integration**.
3) Install **UniFi Network Map** and restart Home Assistant.

### Option B: Manual copy
1) Copy `custom_components/unifi_network_map` into your HA config at
   `config/custom_components/unifi_network_map`.
2) Restart Home Assistant.

## Set up the integration
1) Go to **Settings → Devices & services → Add integration**.
2) Search for **UniFi Network Map**.
3) Enter your controller URL, username, password, and site.

Options (after setup) let you:
- include ports
- include clients (wired/wireless/all)
- show only UniFi devices
- switch to isometric layout
- override SVG size
- cache rendered output

## Add the Lovelace card
The integration registers the card resource automatically. If it does not show
up, add it manually:

```yaml
resources:
  - url: /unifi-network-map/unifi-network-map.js
    type: module
```

Then add the card to a dashboard (replace `<entry_id>`):

```yaml
type: custom:unifi-network-map
svg_url: /api/unifi_network_map/<entry_id>/svg
data_url: /api/unifi_network_map/<entry_id>/payload
```

Find `<entry_id>` in **Developer Tools → States**:
1) Select `sensor.unifi_network_map`.
2) Copy the `entry_id` attribute.

## Troubleshooting
- If the card says missing auth, log in to HA in the same browser session.
- If the map is empty, ensure LLDP is enabled on UniFi devices.
- If you see SSL warnings, enable certificate verification or use a trusted cert.

## Documentation
- Local testing: `docs/LOCAL_TESTING.md`
- Roadmap: `docs/ROADMAP.md`
