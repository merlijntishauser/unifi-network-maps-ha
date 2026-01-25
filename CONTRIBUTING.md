# Contributing

Thanks for helping improve UniFi Network Map for Home Assistant.

## Project layout
```
custom_components/unifi_network_map/   # HA integration
frontend/                               # Lovelace custom card source (TS)
custom_components/unifi_network_map/frontend/  # Built card bundle for HA
.github/workflows/                      # CI (hassfest + hacs)
hacs.json                               # HACS metadata
```

## Development setup
- Python: use `make install-dev` to create `.venv` and install dependencies.
- Python 3.12+ is required (3.13 preferred).
- Frontend: run `make frontend-install` to install Node dependencies.

## Pre-commit hooks
We use `pre-commit` to keep local checks consistent with CI. It runs:
- Hassfest via Docker (`ghcr.io/home-assistant/hassfest:latest`)
- Python tests (`make test`)
- Frontend tests (`make frontend-test`)

Enable it once:
```bash
pip install -r requirements-dev.txt
pre-commit install
```

Or use the Makefile (no activation required):
```bash
make pre-commit-install
make pre-commit-run
```

Run all hooks manually:
```bash
pre-commit run --all-files
```

## Testing
- Python: `make test`
- Frontend: `make frontend-test`
 - Build bundle for HA: `make frontend-build` (copies to `custom_components/unifi_network_map/frontend/`)

## Architecture notes
- The integration renders SVG + JSON via `unifi-network-maps`.
- Endpoints are served at `/api/unifi_network_map/<entry_id>/svg` and `/payload`.
- The card resource is auto-registered and served from
  `/unifi-network-map/unifi-network-map.js`.
- Keep the integration self-contained for HACS and avoid logging secrets.

### Architecture Diagram

```mermaid
flowchart TB
    subgraph External["External Systems"]
        UniFi["UniFi Controller API"]
        HAIntegration["HA UniFi Integration<br/><i>device_tracker entities</i>"]
    end

    subgraph Setup["Integration Setup"]
        ConfigFlow["config_flow.py<br/><i>Credentials & options UI</i>"]
        ConfigEntry["ConfigEntry<br/><i>Stored in HA</i>"]
    end

    subgraph Backend["Home Assistant Backend"]
        Init["__init__.py<br/><i>Entry point</i>"]

        subgraph Core["Core Components"]
            Coordinator["coordinator.py<br/>DataUpdateCoordinator<br/><i>Polls every 10 min</i>"]
            APIClient["api.py<br/>UniFiNetworkMapClient<br/><i>Wraps unifi-network-maps</i>"]
            Renderer["renderer.py<br/><i>SVG + JSON rendering</i>"]
        end

        subgraph Endpoints["API Endpoints"]
            HTTP["http.py<br/>/api/unifi_network_map/{id}/svg<br/>/api/unifi_network_map/{id}/payload"]
            WS["websocket.py<br/>unifi_network_map/subscribe"]
        end

        Sensor["sensor.py<br/><i>HA sensor entity</i>"]
        EntityRegistry["Entity/Device Registry<br/><i>MAC → entity_id mapping</i>"]
    end

    subgraph Frontend["Lovelace Card (TypeScript)"]
        subgraph CardCore["card/core/"]
            Card["unifi-network-map-card.ts<br/><i>Main card component</i>"]
            Editor["unifi-network-map-editor.ts<br/><i>Card config UI</i>"]
        end

        subgraph CardData["card/data/"]
            WSClient["websocket.ts<br/><i>WS subscription</i>"]
            DataLoader["data.ts<br/><i>HTTP fetch</i>"]
        end

        subgraph CardUI["card/ui/"]
            Panel["panel.ts<br/><i>Side panel</i>"]
            Icons["icons.ts"]
            Styles["styles.ts<br/><i>Theme variants</i>"]
        end

        subgraph CardInteraction["card/interaction/"]
            Viewport["viewport.ts<br/><i>Pan/zoom</i>"]
            Selection["selection.ts"]
            Filters["filter-state.ts"]
        end
    end

    %% Setup flow
    ConfigFlow -->|"validates credentials"| UniFi
    ConfigFlow -->|"creates"| ConfigEntry
    ConfigEntry -->|"loads"| Init

    %% Backend initialization
    Init -->|"creates"| Coordinator
    Init -->|"registers"| HTTP
    Init -->|"registers"| WS
    Init -->|"registers"| Sensor
    Coordinator -->|"uses"| APIClient
    APIClient -->|"fetch_map()"| UniFi
    APIClient -->|"renders via"| Renderer

    %% Entity resolution
    HTTP -->|"resolves MACs"| EntityRegistry
    WS -->|"resolves MACs"| EntityRegistry
    EntityRegistry -->|"links to"| HAIntegration

    %% Frontend data flow - Primary (WebSocket)
    Card -->|"connectedCallback()"| WSClient
    WSClient -->|"subscribe"| WS
    WS -->|"initial + push updates"| WSClient
    Coordinator -->|"async_add_listener()"| WS
    WSClient -->|"onUpdate(payload)"| Card

    %% Frontend data flow - Fallback (HTTP polling)
    Card -.->|"fallback: 30s poll"| DataLoader
    DataLoader -.->|"GET"| HTTP
    HTTP -.->|"response"| DataLoader

    %% SVG always via HTTP (initial load)
    Card -->|"loadSvg()"| DataLoader
    DataLoader -->|"GET /svg"| HTTP

    %% Card rendering
    Card --> Panel
    Card --> Viewport
    Card --> Selection
    Card --> Filters
    Panel --> Icons
    Card --> Styles

    %% Styling
    style WS fill:#e1f5fe
    style WSClient fill:#e1f5fe
    style DataLoader fill:#fff3e0
    style ConfigFlow fill:#e8f5e9
    style ConfigEntry fill:#e8f5e9
```

### Component Reference

| File | Purpose |
|------|---------|
| **config_flow.py** | Multi-step setup wizard: credentials validation, site selection, render options |
| **coordinator.py** | `DataUpdateCoordinator` subclass; polls UniFi API, manages auth backoff, notifies listeners |
| **api.py** | Thin wrapper around `unifi-network-maps` library; handles SSL and caching options |
| **renderer.py** | Transforms topology data into SVG string and JSON payload with node metadata |
| **http.py** | Two `HomeAssistantView` endpoints for SVG and payload; resolves MAC→entity mappings |
| **websocket.py** | WebSocket subscription command; pushes payload on coordinator updates |
| **sensor.py** | Exposes integration status as HA sensor entity with device count attributes |

### Data Flow

```mermaid
sequenceDiagram
    participant U as UniFi Controller
    participant C as Coordinator
    participant R as Renderer
    participant W as WebSocket API
    participant F as Frontend Card

    Note over C: Every 10 minutes (configurable)
    C->>U: fetch_map()
    U-->>C: topology data
    C->>R: render(data)
    R-->>C: SVG + payload
    C->>C: cache data
    C->>W: notify listeners
    W->>F: push payload (event_message)
    F->>F: update state & re-render
```

### Key Integration Points

| Integration Point | Details |
|-------------------|---------|
| **UniFi Integration** | Official HA `unifi` domain provides `device_tracker` entities; we link via MAC address |
| **Entity Registry** | Maps MAC addresses to entity IDs for status badges and "View in HA" links |
| **Lovelace Resources** | Card JS bundle auto-registered at `/unifi-network-map/unifi-network-map.js` |
| **WebSocket** | Uses HA's built-in WebSocket infrastructure; `resubscribe: true` handles reconnects |

### Frontend Module Structure

```
frontend/src/card/
├── core/           # Main card, editor, types, state
├── data/           # Auth, data fetching, WebSocket, sanitization
├── interaction/    # Pan/zoom, selection, filters, context menu
├── ui/             # Panel, icons, styles, modals
└── shared/         # Constants, localization, utilities
```

### Update Mechanisms

| Mechanism | Trigger | Latency | Use Case |
|-----------|---------|---------|----------|
| **WebSocket push** | Coordinator refresh | Instant | Primary update path |
| **HTTP polling** | 30s interval | Up to 30s | Fallback if WS unavailable |
| **Manual refresh** | Service call `unifi_network_map.refresh` | Instant | User-triggered refresh |

### Theming

Four theme variants controlled by card config:
- `dark` - Dark background, light text
- `light` - Light background, dark text
- `unifi` - UniFi brand colors (dark)
- `unifi-dark` - UniFi brand colors (darker)

Theme is applied via `data-theme` attribute on `ha-card` element.

## Workflow guidelines
- Preferred branch: `TBD` until we settle on a release flow.
- We prefer rebasing over merge commits.
- PRs are for unknown contributors; regular contributors can push directly.
- Commit style: small and focused. Many small commits are preferred; no squashing.
- Prefer opening PRs against `unifi-network-maps` instead of adding custom plumbing here.
