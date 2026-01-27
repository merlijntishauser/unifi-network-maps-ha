# UniFi Network Map for Home Assistant

[![HACS](https://img.shields.io/badge/HACS-Default-41BDF5.svg)](https://github.com/hacs/integration)
[![CI](https://github.com/merlijntishauser/unifi-network-maps-ha/actions/workflows/ci.yml/badge.svg)](https://github.com/merlijntishauser/unifi-network-maps-ha/actions/workflows/ci.yml)
[![E2E](https://github.com/merlijntishauser/unifi-network-maps-ha/actions/workflows/e2e.yml/badge.svg)](https://github.com/merlijntishauser/unifi-network-maps-ha/actions/workflows/e2e.yml)
[![CodeQL](https://github.com/merlijntishauser/unifi-network-maps-ha/actions/workflows/codeql.yml/badge.svg)](https://github.com/merlijntishauser/unifi-network-maps-ha/actions/workflows/codeql.yml)

A Home Assistant integration that visualizes your UniFi network topology as an interactive map. See how your devices connect, which clients are online, and understand your network structure at a glance.

This integration complements the UniFi native dashboard rather than replacing it. While UniFi excels at live statistics, throughput graphs, and traffic analytics, this integration brings your network topology into Home Assistant where it can be displayed alongside your other smart home controls.

![UniFi Network Map in Home Assistant](screenshots/lovelace-card.png)

---

## What You Get

The integration creates an interactive SVG map of your network that updates in real-time via WebSocket. You can pan and zoom to explore the topology, click on devices to see their details, and filter by device type to focus on what matters. The map shows your gateway, switches, access points, and optionally all connected clients.

Each device on the map links to its corresponding Home Assistant entity when you have the official UniFi integration installed. This means you can see device status, click through to more details, and understand how your network devices relate to the rest of your smart home.

The card supports four visual themes (dark, light, and two UniFi-inspired variants) and works well on both desktop and mobile with full touch gesture support for panning and zooming.

---

## Before You Start

You need Home Assistant 2024.12 or newer and access to a UniFi Network controller, either UniFi OS on a Dream Machine or a self-hosted controller. The integration connects directly to your controller's API, so cloud-only Ubiquiti accounts will not work.

**Creating a local UniFi account**: Open your UniFi Network application and navigate to Settings, then Admins & Users (on older versions this may be under System, then Users). Create a new local user with at least read-only access to the Network application. This account will be used by Home Assistant to fetch your network topology.

For the best experience, install the official Home Assistant UniFi integration first. This integration uses it to enrich the network map with entity data, showing you which Home Assistant entities correspond to which network devices and clients.

---

## Installation

The integration is available through HACS (Home Assistant Community Store). Open HACS, go to Integrations, search for "UniFi Network Map", and install it. After installation, restart Home Assistant.

**Manual HACS installation**: If the integration is not yet listed in the default HACS repository, you can add it manually. In HACS, click the three-dot menu in the top right, select Custom repositories, and add `https://github.com/merlijntishauser/unifi-network-maps-ha` with category Integration. The integration will then appear in the HACS integration list.

**Manual installation without HACS**: Download the latest release and copy the `custom_components/unifi_network_map` folder to your Home Assistant configuration directory under `custom_components`. Restart Home Assistant to load the integration.

---

## Configuration

After installation, add the integration through the Home Assistant UI. Go to Settings, then Devices & services, click Add Integration, and search for UniFi Network Map. Enter your controller URL (including the port, typically `https://192.168.1.1` for a Dream Machine), your local username and password, and the site name (usually "default").

Note that UniFi controllers ship with self-signed SSL certificates. The integration disables SSL verification by default to accommodate this. If you have installed a trusted certificate on your controller, you can enable verification in the configuration.

Once configured, you can adjust display options through the integration's configuration panel. Choose whether to show port labels on connections, include client devices on the map, filter to show only UniFi devices, use an isometric 3D-style layout, or override the default SVG dimensions.

---

## Adding the Card to Your Dashboard

The integration automatically registers its Lovelace card when Home Assistant starts. Simply edit your dashboard, add a new card, and search for "UniFi Network Map" in the card picker. Select your integration entry and the card will be configured automatically.

If the card does not appear in the picker after a fresh install, try clearing your browser cache with a hard refresh (Ctrl+Shift+R or Cmd+Shift+R). Home Assistant caches card resources aggressively and may need a manual refresh to pick up new cards.

**Manual card configuration**: If you prefer to configure the card through YAML, you will need the entry ID of your integration. Find this in Developer Tools under States by looking at the `sensor.unifi_network_map_status` entity and copying its `entry_id` attribute. Then add the card to your dashboard:

```yaml
type: custom:unifi-network-map
entry_id: your_entry_id_here
card_height: 600
```

The `card_height` option accepts a number (interpreted as pixels) or any valid CSS length value. Adjust this to fit your dashboard layout.

---

## Using the Map

**Navigation**: Click and drag to pan around the map. Use your scroll wheel or pinch gestures on mobile to zoom in and out. Double-click to reset the view.

**Selecting devices**: Click on any device to select it. The detail panel on the right shows device information including name, IP address, MAC address, model, and firmware version. For clients, you will also see connection details like signal strength and which access point or switch port they connect through.

**Filtering**: Use the filter bar at the top of the card to show or hide device types. Click on Gateway, Switch, AP, or Client to toggle visibility. This is useful when you want to focus on infrastructure devices without the clutter of all connected clients.

**Context menu**: Right-click (or long-press on mobile) on any device to access quick actions. You can copy the device's MAC or IP address to your clipboard, or jump directly to related Home Assistant entities.

---

## Troubleshooting

**The card shows "Missing auth token"**: This typically means you are viewing the dashboard in a browser that is not logged into Home Assistant. The card requires an authenticated session to fetch data from the API. Log into Home Assistant in the same browser window.

**The map appears empty**: The integration relies on LLDP (Link Layer Discovery Protocol) to understand your network topology. Ensure LLDP is enabled on your UniFi devices. If you have a very simple network with only a gateway and wireless clients, there may not be much topology to display.

**SSL certificate errors**: If you see connection failures related to SSL, verify that your controller URL is correct and that SSL verification is disabled in the integration options (which is the default). Only enable SSL verification if you have installed a trusted certificate on your controller.

**The card does not appear after installation**: Clear your browser cache with a hard refresh. If it still does not appear, manually add the resource in your Lovelace configuration under Resources with URL `/unifi-network-map/unifi-network-map.js` and type `module`.

---

## What This Integration Does Not Do

This integration focuses on network topology visualization within Home Assistant. It deliberately does not replicate features that UniFi's native dashboard already does well.

You will not find live throughput graphs, bandwidth statistics, latency monitoring, traffic analytics, DPI data, or speed test integration here. These features are core to the UniFi experience and are best viewed in the UniFi Network application where they receive full attention and polish.

Instead, this integration aims to make your network structure visible and accessible within Home Assistant, treating your network infrastructure as another part of your smart home that you can monitor and eventually automate.

---

## Future Direction

The roadmap focuses on deeper Home Assistant integration rather than competing with UniFi's statistics features. Planned additions include network health sensors that expose device connectivity as automatable entities, and blueprint templates for common monitoring scenarios like alerting when critical infrastructure goes offline or when devices cannot reach expected services across VLANs.

See [roadmap.md](docs/ROADMAP.md) for details.

---

## Contributing

Contributions are welcome. The project uses Python 3.13 with strict type checking (Pyright) and Ruff for formatting. The frontend is TypeScript with ESLint and Prettier. Run `make ci` to execute all checks before submitting a pull request.

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and architecture details.

---
 ## AI disclaimer
Yes, LLMs and coding agents are (and will be) used in this project. We integrate AI carefully and responsibly, and never in a way that compromises data integrity, privacy, or security.

Please be responsible and transparent when using AI tools, and always put user privacy and data security first.

When you submit a PR, make sure you fully understand what the code does and what it might affect. Keep PRs small, and always run the tests before opening or updating one.

And a small personal note: using AI tools doesn’t mean this project didn’t take a lot of time and effort. Built with care, and a big shout-out to the entire Home Assistant ecosystem and its community — and to Ubiquiti and the UniFi product line, which are genuinely great products for the home.

---

I really fancy coffee! and stars! and… oh wait…

If you enjoy this integration, starring the repository and actually using it is already a great reward.

If you have feedback, I’d love to hear it — what you like, and especially what you don’t, so I can keep improving things. Issues and PRs are very welcome.

And if you want to buy me a coffee: that’s hugely appreciated!

[![Buy me a coffee](https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png)](https://www.buymeacoffee.com/merlijntishauser)

---
## License

MIT License. See [LICENSE](LICENSE) for details.
