# AGENTS.md (HA Integration Skeleton)

## Top priority (XP values)
- Naming is critical; choose clear, intention-revealing names.
- Optimize for human readability and understandability over cleverness.
- Prefer small, safe refactors and commit often.
- Long functions/methods (>15 lines) are a code smell; split into smaller parts.

## Project
Home Assistant integration for UniFi Network Maps (separate repo).

Goals:
- Live updates from UniFi via Home Assistant.
- Credentials entered via HA UI (Config Flow), no `.env` in HA.
- Lovelace custom card (TypeScript) for SVG + drilldown.

## Architecture overview
- HA Config Flow -> Config Entry
- DataUpdateCoordinator polls UniFi API
- Core renderer/library produces SVG + JSON
- Custom card fetches HA endpoints or cached assets

## Technology choices
- Python (Home Assistant integration)
- TypeScript (Lovelace custom card)

## Security and permissions
- Never store secrets in exported JSON or logs.
- Use HA’s config entry storage for credentials.
- Validate URLs and SSL settings (verify SSL by default).

## Separation rules
- Keep this repo self-contained for extraction.
- Avoid tight coupling to the core CLI; call library functions instead.
- Keep frontend assets in `frontend/` and backend in `custom_components/`.
- Prefer upstreaming changes to `unifi-network-maps` over adding custom plumbing here.

## Code quality
- Typed functions where possible.
- Use logging via HA logger.
- Fail fast on missing UniFi connectivity; surface errors in HA.
