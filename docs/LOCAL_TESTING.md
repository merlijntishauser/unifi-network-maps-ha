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

Expected results:
- If your UniFi controller is reachable and credentials are valid, the config
  entry is created.
- If the controller is not reachable, you should see the `cannot_connect` error.
- If credentials are invalid, you should see the `invalid_auth` error.
- If the URL is malformed, you should see the `invalid_url` error.

## Controller connectivity notes
- If your UniFi controller is on the same host, consider `--network=host`.
- If it is on your LAN, ensure the controller URL you enter is reachable from
  the container.

## Current limitations
- The integration only validates credentials and renders a map when the
  coordinator runs. There is no UI entity yet.
- Lovelace card and renderer endpoints are still TODO.
