# Home Assistant Core Readiness (v1.0)

Goal: Make the integration Core-ready while staying on HACS. Submit to Core
when everything is solid and proven.

Target: Silver tier on the Integration Quality Scale, with select Gold rules.
Frontend card stays bundled; split only when submitting to Core.

## Current State

**Already passing:**
- Diagnostics (Gold: `diagnostics`)
- Entity unique IDs (Bronze: `entity-unique-id`)
- Config flow (Bronze: `config-flow`)
- Test before configure (Bronze: `test-before-configure`)
- Translations (10 languages)
- Brands repo submitted
- HACS default list

**Gaps to close (by workstream):**

## Workstream 1: Code Style Alignment

Reformat the entire codebase to match HA Core conventions before making
functional changes. This avoids mixing style and logic diffs.

### 1.1 Line length: 100 -> 79

Change `ruff.toml` line-length to 79. Run `ruff format` across the entire
codebase (Python). This touches nearly every file but is a pure formatting
change.

Frontend code stays at 100 chars (HA Core does not govern frontend style for
custom cards).

### 1.2 Expand ruff rule set

HA Core uses a broad rule set. Adopt at minimum:

```toml
extend-select = [
    "B",    # flake8-bugbear
    "C90",  # mccabe complexity (already have)
    "E",    # pycodestyle errors
    "F",    # pyflakes
    "I",    # isort
    "UP",   # pyupgrade
    "W",    # pycodestyle warnings
    "SIM",  # flake8-simplify
    "TCH",  # flake8-type-checking
]
```

Fix any new violations that surface.

### 1.3 Pyright strict compliance

Remove the four globally disabled rules from `pyrightconfig.json`:

- `reportUnknownParameterType`
- `reportUnknownArgumentType`
- `reportUnknownVariableType`
- `reportUnknownMemberType`

Fix resulting type errors by adding explicit annotations. Per-file
`# pyright:` suppressions for HA's untyped base classes are acceptable (this
is an HA ecosystem limitation, not ours).

## Workstream 2: Bronze Gaps

### 2.1 `has-entity-name`

All entity classes must set `_attr_has_entity_name = True` and use
`_attr_translation_key` instead of `_attr_name`. This changes how entity names
appear (they become "{device name} {entity name}").

Files: `sensor.py`, `binary_sensor.py`

### 2.2 `runtime-data`

Use `ConfigEntry.runtime_data` (typed via a `type` alias) instead of storing
the coordinator on `hass.data[DOMAIN]`. This is the modern HA pattern.

Files: `__init__.py`, `sensor.py`, `binary_sensor.py`, `http.py`,
`websocket.py`, any file accessing `hass.data[DOMAIN]`

### 2.3 `unique-config-entry`

Prevent duplicate config entries for the same controller+site. Add
`self._abort_if_unique_id_configured()` in the config flow using
`{url}_{site}` as the unique ID.

Files: `config_flow.py`

### 2.4 `common-modules`

Review that shared patterns are in dedicated modules (not duplicated). The
current module structure is already clean (`api.py`, `renderer.py`,
`coordinator.py`, `errors.py`, `utils.py`). Likely a pass.

### 2.5 `entity-event-setup`

Verify entity event subscriptions happen during the correct lifecycle phase
(`async_added_to_hass` / `async_will_remove_from_hass`). The coordinator
listener pattern should already handle this, but verify.

### 2.6 `test-before-setup`

Verify that `async_setup_entry` validates connectivity before completing setup.
Currently the coordinator does this on first refresh. May need to add an
explicit check.

### 2.7 Documentation (Bronze: 4 rules)

- `docs-high-level-description`
- `docs-installation-instructions`
- `docs-removal-instructions`
- `docs-actions` (if service actions exist)

These require a PR to `home-assistant/home-assistant.io`. Defer until code
changes are stable.

## Workstream 3: Silver Gaps

### 3.1 `reauthentication-flow`

Add `async_step_reauth` to the config flow. Triggered when the coordinator
gets an `InvalidAuth` error. Shows a form to re-enter username/password
without losing the config entry.

Files: `config_flow.py`, `__init__.py` (to trigger reauth on auth failure),
`strings.json`, `translations/*.json`

### 3.2 `parallel-updates`

Add `PARALLEL_UPDATES = 1` constant to `sensor.py` and `binary_sensor.py`.
This limits concurrent entity updates to 1 per platform (appropriate since all
entities share one coordinator).

### 3.3 `entity-unavailable`

Ensure entities mark themselves unavailable when the coordinator fails. The
`CoordinatorEntity` base class handles this automatically when
`coordinator.last_update_success` is False. Verify this works correctly for all
entity types.

### 3.4 `config-entry-unloading`

Verify `async_unload_entry` properly cleans up all resources (coordinator
listeners, WebSocket handlers, HTTP views). Test that reloading the entry
works without errors.

### 3.5 `log-when-unavailable`

Log transitions between available and unavailable states. The coordinator
already logs fetch failures, but verify the entity availability transitions
are logged.

### 3.6 `action-exceptions`

If the integration registers service actions (e.g. `refresh`), they must raise
`HomeAssistantError` on failure rather than silently failing.

### 3.7 `test-coverage`

Enforce 95%+ test coverage with `--cov-fail-under=95` in pytest config.
Current coverage is ~93% -- close but needs the gaps filled, especially after
the test infrastructure rewrite.

## Workstream 4: Gold Easy Wins

### 4.1 `reconfiguration-flow`

Add `async_step_reconfigure` to allow changing credentials (URL, username,
password, site) without removing the integration. Different from reauth --
this is user-initiated from the integration options.

Files: `config_flow.py`, `strings.json`, `translations/*.json`

### 4.2 `entity-category`

Assign `EntityCategory.DIAGNOSTIC` to entities that provide diagnostic info
(e.g. the main map sensor, device count attributes). Leave client presence
sensors without a category since they're user-facing.

### 4.3 `entity-device-class`

Use `BinarySensorDeviceClass.CONNECTIVITY` for device/client presence sensors.
Use `SensorDeviceClass` where appropriate for VLAN client count sensors.

### 4.4 `entity-translations` and `icon-translations`

Add translation keys for all entity names and icons in `strings.json` /
`icons.json`. Entities should use `_attr_translation_key` paired with entries
in the strings file.

### 4.5 `exception-translations`

Config flow and service action exceptions should use translatable strings
instead of hardcoded English messages.

### 4.6 Device sensor unique IDs

Change device binary sensor unique IDs from name-based
(`{entry_id}_device_{name}`) to MAC-based (`{entry_id}_device_{mac}`). More
stable across device renames. Requires a one-time migration for existing
users.

### 4.7 Config entry versioning

Add `MINOR_VERSION` to the config flow class. Implement
`async_migrate_entry` in `__init__.py` to handle future schema changes
gracefully (even if the body is currently a no-op, the structure must exist).

## Workstream 5: Test Infrastructure Rewrite

Big-bang rewrite of the test infrastructure. This is the largest single item.

### 5.1 Add `pytest-homeassistant-custom-component`

Add to `requirements-dev.txt`. This provides real HA fixtures:
`hass`, `MockConfigEntry`, entity/device registries, the event loop, and
proper async test support.

### 5.2 Remove hand-rolled stubs

Delete the stub system in `tests/conftest.py` (the ~400 lines of
`sys.modules` patching). Replace with real HA test fixtures.

### 5.3 Rewrite unit tests

Rewrite all tests in `tests/unit/` and `tests/integration/` to use the HA
test harness. Key patterns:

- Use `MockConfigEntry` for config entry fixtures
- Use `hass` fixture for HomeAssistant instance
- Use `async_setup_component` for integration setup
- Use `entity_registry` and `device_registry` fixtures
- Mock the `unifi-topology` library calls, not HA internals

### 5.4 Config flow test coverage

Full test coverage for all config flow paths:
- Initial setup (success, auth failure, connection error, validation errors)
- Options flow (all fields, validation)
- Reauth flow (success, failure)
- Reconfigure flow (success, failure)

### 5.5 Enforce coverage threshold

Add `--cov-fail-under=95` to pytest configuration.

### 5.6 Contract tests

Keep contract tests (`tests/contract/`) as-is -- these test the upstream
library interface and don't need HA fixtures.

## Execution Order

```
WS1: Code style alignment
  1.1 Line length 79
  1.2 Ruff rule set
  1.3 Pyright strict
  |
  v
WS2 + WS3 + WS4 (can overlap):
  2.1 has_entity_name
  2.2 runtime_data
  2.3 unique-config-entry
  3.1 reauthentication-flow
  3.2 parallel-updates
  4.1 reconfiguration-flow
  4.2 entity-category
  4.3 entity-device-class
  4.4 entity/icon translations
  4.5 exception-translations
  4.6 Device sensor unique ID migration
  4.7 Config entry versioning
  |
  v
WS5: Test infrastructure rewrite
  5.1 Add pytest-homeassistant-custom-component
  5.2 Remove stubs
  5.3 Rewrite tests
  5.4 Config flow coverage
  5.5 Enforce 95% threshold
  |
  v
Documentation PRs (deferred)
  docs-high-level-description
  docs-installation-instructions
  docs-removal-instructions
  docs-configuration-parameters
  docs-installation-parameters
```

## Out of Scope

- Frontend card separation (defer to Core submission time)
- Discovery/SSDP (Gold: `discovery`) -- requires hardware research
- Dynamic devices (Gold: `dynamic-devices`)
- Stale device removal (Gold: `stale-devices`)
- Platinum tier (async dependency, websession injection, strict typing)
- Documentation PRs (until code is stable)

## Verification

After all workstreams complete:

```bash
make pre-commit-run    # All hooks pass at 79-char line length
make test              # 95%+ coverage, all tests on real HA fixtures
```

Run the HA Core integration quality scale checker (if available) to confirm
Bronze + Silver + select Gold rules pass.
