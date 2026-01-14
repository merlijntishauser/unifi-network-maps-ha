# Local Testing (Docker)

This repo is an early Home Assistant integration skeleton. The easiest smoke test
is running Home Assistant in Docker and loading the custom component from this
repo.

## Prereqs
- Docker
- A UniFi controller reachable from your machine (optional but needed to pass auth)

## Quick smoke test
1. Create a minimal Home Assistant config:

```yaml
# configuration.yaml
default_config:
logger:
  default: info
```

2. Run Home Assistant with the integration mounted:

```bash
docker run --rm -it \
  -p 8123:8123 \
  -v "$PWD/custom_components":/config/custom_components \
  -v "$PWD/configuration.yaml":/config/configuration.yaml \
  ghcr.io/home-assistant/home-assistant:stable
```

3. Open http://localhost:8123, finish onboarding, and add the integration:
   Settings -> Devices & Services -> Add Integration -> "UniFi Network Map".

Note: If you already use Home Assistant in the same browser, open this in a
private/incognito window to avoid service worker collisions.

Expected results:
- If your UniFi controller is reachable and credentials are valid, the config
  entry is created.
- Check the HA logs for the entry-specific endpoints:
  `/api/unifi_network_map/<entry_id>/svg` and `/api/unifi_network_map/<entry_id>/payload`.
- These endpoints require auth. Use a long-lived token in the `Authorization`
  header, for example:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8123/api/unifi_network_map/<entry_id>/svg"
```
- A `sensor.unifi_network_map` entity exposes the same endpoint paths as attributes.
- If the controller is not reachable, you should see the `cannot_connect` error.
- If credentials are invalid, you should see the `invalid_auth` error.
- If the URL is malformed, you should see the `invalid_url` error.

## Lovelace snippet (raw SVG)
Replace `<entry_id>` with the value from `sensor.unifi_network_map` attributes.
This only works if the endpoint is public; the default `/api` endpoints require
auth and will be blocked by the browser.

```yaml
type: picture
image: /api/unifi_network_map/<entry_id>/svg
tap_action:
  action: url
  url_path: /api/unifi_network_map/<entry_id>/svg
```

## Lovelace snippet (custom card with auth)
This uses the custom card, which fetches the SVG with the HA auth token.
The card still needs to be bundled and added as a Lovelace resource.

```yaml
type: custom:unifi-network-map
svg_url: /api/unifi_network_map/<entry_id>/svg
data_url: /api/unifi_network_map/<entry_id>/payload
```

## Controller connectivity notes
- If your UniFi controller is on the same host, consider `--network=host`.
- If it is on your LAN, ensure the controller URL you enter is reachable from
  the container.

## Current limitations
- The custom card is not bundled yet; it must be built and added as a Lovelace resource.
- The integration currently exposes only API endpoints and a sensor with URLs.

## Reloading changes
If you keep the Docker container running, you can restart Home Assistant and it
will pick up changes from the mounted `custom_components` directory. No rebuild
is needed.
