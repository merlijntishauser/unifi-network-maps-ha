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
  logs:
    custom_components.unifi_network_map: debug
```

2. Run Home Assistant with the integration mounted:

```bash
docker run -d -it \
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
- The sensor reports `ready`, `error`, or `unavailable`, and includes `last_error`.
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
The integration registers the Lovelace resource on setup.

```yaml
type: custom:unifi-network-map
svg_url: /api/unifi_network_map/<entry_id>/svg
data_url: /api/unifi_network_map/<entry_id>/payload
```

## Controller connectivity notes
- If your UniFi controller is on the same host, consider `--network=host`.
- If it is on your LAN, ensure the controller URL you enter is reachable from
  the container.

## Force refresh
Use the service `unifi_network_map.refresh` to trigger a refresh. You can pass
`entry_id` to target a single entry, or omit it to refresh all entries.

## Current limitations
- The integration currently exposes only API endpoints and a sensor with URLs.

## Reloading changes
If you keep the Docker container running, you can restart Home Assistant and it
will pick up changes from the mounted `custom_components` directory. No rebuild
is needed.

The integration serves the bundle at `/unifi-network-map/unifi-network-map.js`
and registers the Lovelace resource on setup. If you need to override it during
local testing, you can copy the built file into the running container and use
`/local/`:

```bash
docker exec -it <container_name> mkdir -p /config/www
docker cp frontend/dist/unifi-network-map.js <container_name>:/config/www/unifi-network-map.js
```

Then add or reload the `/local/unifi-network-map.js` resource and hard refresh
the browser. Remove the `/local/` resource after testing so the auto-registered
resource is used again.

If you do not see the Resources menu, enable Advanced Mode in your user profile.
You can also add the resource to `configuration.yaml` (normally not required):

```yaml
lovelace:
  resources:
    - url: /unifi-network-map/unifi-network-map.js
      type: module
```
