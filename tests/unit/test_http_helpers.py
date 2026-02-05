"""Unit tests for http module helper functions."""

from __future__ import annotations

from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from custom_components.unifi_network_map.http import (
    _add_entities_by_device,
    _append_unique_entity,
    _build_device_entities_map,
    _build_svg_edges,
    _edge_from_payload,
    _entity_state_details,
    _extract_mac,
    _extract_mac_from_attributes,
    _format_mac,
    _get_mac_attribute_value,
    _has_mac_attribute,
    _is_entity_enabled,
    _is_state_mac_candidate,
    _iter_state_entries,
    _mac_from_state_entry,
    _mac_from_unique_id,
    _normalize_mac,
    _normalize_tracker_state,
    _should_render_svg,
    _sort_related_entities,
    _store_payload_field,
    _svg_options_from_settings,
    _valid_edge_payload,
    resolve_node_entity_map,
    resolve_node_status_map,
)


class TestNormalizeMac:
    """Tests for _normalize_mac function."""

    def test_normalizes_uppercase_mac(self) -> None:
        result = _normalize_mac("AA:BB:CC:DD:EE:FF")
        assert result == "aa:bb:cc:dd:ee:ff"

    def test_normalizes_hyphen_separator(self) -> None:
        result = _normalize_mac("AA-BB-CC-DD-EE-FF")
        assert result == "aa:bb:cc:dd:ee:ff"

    def test_strips_whitespace(self) -> None:
        result = _normalize_mac("  aa:bb:cc:dd:ee:ff  ")
        assert result == "aa:bb:cc:dd:ee:ff"


class TestExtractMac:
    """Tests for _extract_mac function."""

    def test_returns_none_for_empty_string(self) -> None:
        result = _extract_mac("")
        assert result is None

    def test_extracts_colon_separated_mac(self) -> None:
        result = _extract_mac("aa:bb:cc:dd:ee:ff")
        assert result == "aa:bb:cc:dd:ee:ff"

    def test_extracts_mac_from_text(self) -> None:
        result = _extract_mac("device_aa:bb:cc:dd:ee:ff_somesuffix")
        assert result == "aa:bb:cc:dd:ee:ff"

    def test_extracts_packed_mac(self) -> None:
        result = _extract_mac("AABBCCDDEEFF")
        assert result == "aa:bb:cc:dd:ee:ff"


class TestNormalizeTrackerState:
    """Tests for _normalize_tracker_state function."""

    def test_home_becomes_online(self) -> None:
        assert _normalize_tracker_state("home") == "online"

    def test_not_home_becomes_offline(self) -> None:
        assert _normalize_tracker_state("not_home") == "offline"

    def test_other_becomes_unknown(self) -> None:
        assert _normalize_tracker_state("away") == "unknown"
        assert _normalize_tracker_state("") == "unknown"


class TestStorePayloadField:
    """Tests for _store_payload_field function."""

    def test_stores_truthy_value(self) -> None:
        payload: dict[str, object] = {}
        _store_payload_field(payload, "key", {"data": True})
        assert payload["key"] == {"data": True}

    def test_skips_empty_dict(self) -> None:
        payload: dict[str, object] = {}
        _store_payload_field(payload, "key", {})
        assert "key" not in payload

    def test_skips_empty_list(self) -> None:
        payload: dict[str, object] = {}
        _store_payload_field(payload, "key", [])
        assert "key" not in payload


class TestSortRelatedEntities:
    """Tests for _sort_related_entities function."""

    def test_sorts_by_domain_priority(self) -> None:
        entities = [
            {"entity_id": "switch.test", "domain": "switch"},
            {"entity_id": "device_tracker.test", "domain": "device_tracker"},
            {"entity_id": "sensor.test", "domain": "sensor"},
        ]
        result = _sort_related_entities(entities)
        domains = [e["domain"] for e in result]
        assert domains == ["device_tracker", "sensor", "switch"]

    def test_sorts_by_entity_id_within_domain(self) -> None:
        entities = [
            {"entity_id": "sensor.zulu", "domain": "sensor"},
            {"entity_id": "sensor.alpha", "domain": "sensor"},
        ]
        result = _sort_related_entities(entities)
        ids = [e["entity_id"] for e in result]
        assert ids == ["sensor.alpha", "sensor.zulu"]

    def test_handles_unknown_domains(self) -> None:
        entities = [
            {"entity_id": "custom.test", "domain": "custom"},
            {"entity_id": "sensor.test", "domain": "sensor"},
        ]
        result = _sort_related_entities(entities)
        domains = [e["domain"] for e in result]
        assert domains == ["sensor", "custom"]


class TestEntityStateDetails:
    """Tests for _entity_state_details function."""

    def test_returns_minimal_for_no_state(self) -> None:
        hass = MagicMock()
        hass.states.get.return_value = None
        result = _entity_state_details(hass, "sensor.test")
        assert result["entity_id"] == "sensor.test"
        assert result["domain"] == "sensor"
        assert result["state"] is None

    def test_includes_state_value(self) -> None:
        state = MagicMock()
        state.state = "on"
        state.last_changed = datetime(2024, 1, 15, tzinfo=timezone.utc)
        state.attributes = {}
        hass = MagicMock()
        hass.states.get.return_value = state

        result = _entity_state_details(hass, "switch.test")
        assert result["state"] == "on"
        assert "2024-01-15" in result["last_changed"]

    def test_includes_ip_attribute(self) -> None:
        state = MagicMock()
        state.state = "home"
        state.last_changed = None
        state.attributes = {"ip": "192.168.1.100"}
        hass = MagicMock()
        hass.states.get.return_value = state

        result = _entity_state_details(hass, "device_tracker.test")
        assert result["ip"] == "192.168.1.100"

    def test_includes_ip_address_attribute(self) -> None:
        state = MagicMock()
        state.state = "home"
        state.last_changed = None
        state.attributes = {"ip_address": "10.0.0.50"}
        hass = MagicMock()
        hass.states.get.return_value = state

        result = _entity_state_details(hass, "device_tracker.test")
        assert result["ip"] == "10.0.0.50"

    def test_includes_friendly_name(self) -> None:
        state = MagicMock()
        state.state = "on"
        state.last_changed = None
        state.attributes = {"friendly_name": "Living Room Light"}
        hass = MagicMock()
        hass.states.get.return_value = state

        result = _entity_state_details(hass, "light.test")
        assert result["friendly_name"] == "Living Room Light"


class TestResolveNodeEntityMap:
    """Tests for resolve_node_entity_map function."""

    def test_merges_device_and_client_entities(self) -> None:
        client = {"client1": "device_tracker.client1"}
        device = {"switch1": "device_tracker.switch1"}
        result = resolve_node_entity_map(client, device)
        assert result["client1"] == "device_tracker.client1"
        assert result["switch1"] == "device_tracker.switch1"

    def test_client_overwrites_device(self) -> None:
        client = {"node1": "device_tracker.client"}
        device = {"node1": "device_tracker.device"}
        result = resolve_node_entity_map(client, device)
        assert result["node1"] == "device_tracker.client"


class TestAppendUniqueEntity:
    """Tests for _append_unique_entity function."""

    def test_adds_new_entity(self) -> None:
        mac_to_entities: dict[str, list[str]] = {}
        _append_unique_entity(mac_to_entities, "aa:bb:cc:dd:ee:ff", "sensor.test")
        assert mac_to_entities["aa:bb:cc:dd:ee:ff"] == ["sensor.test"]

    def test_does_not_duplicate(self) -> None:
        mac_to_entities: dict[str, list[str]] = {"aa:bb:cc:dd:ee:ff": ["sensor.test"]}
        _append_unique_entity(mac_to_entities, "aa:bb:cc:dd:ee:ff", "sensor.test")
        assert len(mac_to_entities["aa:bb:cc:dd:ee:ff"]) == 1

    def test_adds_multiple_entities(self) -> None:
        mac_to_entities: dict[str, list[str]] = {}
        _append_unique_entity(mac_to_entities, "aa:bb:cc:dd:ee:ff", "sensor.test1")
        _append_unique_entity(mac_to_entities, "aa:bb:cc:dd:ee:ff", "sensor.test2")
        assert len(mac_to_entities["aa:bb:cc:dd:ee:ff"]) == 2


class TestIsEntityEnabled:
    """Tests for _is_entity_enabled function."""

    def test_enabled_when_no_disabled_by(self) -> None:
        entry = MagicMock()
        entry.disabled_by = None
        assert _is_entity_enabled(entry) is True

    def test_disabled_when_disabled_by_set(self) -> None:
        entry = MagicMock()
        entry.disabled_by = "user"
        assert _is_entity_enabled(entry) is False


class TestBuildDeviceEntitiesMap:
    """Tests for _build_device_entities_map function."""

    def test_groups_by_device_id(self) -> None:
        entry1 = MagicMock()
        entry1.device_id = "device1"
        entry1.entity_id = "sensor.temp"
        entry1.disabled_by = None

        entry2 = MagicMock()
        entry2.device_id = "device1"
        entry2.entity_id = "sensor.humidity"
        entry2.disabled_by = None

        result = _build_device_entities_map([entry1, entry2])
        assert "device1" in result
        assert len(result["device1"]) == 2

    def test_skips_disabled_entries(self) -> None:
        entry = MagicMock()
        entry.device_id = "device1"
        entry.entity_id = "sensor.test"
        entry.disabled_by = "user"

        result = _build_device_entities_map([entry])
        assert "device1" not in result

    def test_skips_entries_without_device_id(self) -> None:
        entry = MagicMock()
        entry.device_id = None
        entry.entity_id = "sensor.test"
        entry.disabled_by = None

        result = _build_device_entities_map([entry])
        assert len(result) == 0


class TestMacFromUniqueId:
    """Tests for _mac_from_unique_id function."""

    def test_extracts_mac_from_unique_id(self) -> None:
        entry = MagicMock()
        entry.unique_id = "aa:bb:cc:dd:ee:ff"
        result = _mac_from_unique_id(entry)
        assert result == "aa:bb:cc:dd:ee:ff"

    def test_returns_none_for_no_unique_id(self) -> None:
        entry = MagicMock()
        entry.unique_id = None
        result = _mac_from_unique_id(entry)
        assert result is None

    def test_returns_none_for_non_mac_unique_id(self) -> None:
        entry = MagicMock()
        entry.unique_id = "some_other_id"
        result = _mac_from_unique_id(entry)
        assert result is None


class TestIsStateMacCandidate:
    """Tests for _is_state_mac_candidate function."""

    def test_device_tracker_is_candidate(self) -> None:
        state = MagicMock()
        state.entity_id = "device_tracker.test"
        state.attributes = {}
        assert _is_state_mac_candidate(state) is True

    def test_router_source_type_is_candidate(self) -> None:
        state = MagicMock()
        state.entity_id = "sensor.test"
        state.attributes = {"source_type": "router"}
        assert _is_state_mac_candidate(state) is True

    def test_mac_attribute_is_candidate(self) -> None:
        state = MagicMock()
        state.entity_id = "sensor.test"
        state.attributes = {"mac": "aa:bb:cc:dd:ee:ff"}
        assert _is_state_mac_candidate(state) is True

    def test_non_candidate_returns_false(self) -> None:
        state = MagicMock()
        state.entity_id = "sensor.test"
        state.attributes = {"value": 42}
        assert _is_state_mac_candidate(state) is False


class TestHasMacAttribute:
    """Tests for _has_mac_attribute function."""

    def test_detects_mac_key(self) -> None:
        attrs = {"mac": "aa:bb:cc:dd:ee:ff"}
        assert _has_mac_attribute(attrs) is True

    def test_detects_mac_address_key(self) -> None:
        attrs = {"mac_address": "aa:bb:cc:dd:ee:ff"}
        assert _has_mac_attribute(attrs) is True

    def test_returns_false_for_no_mac(self) -> None:
        attrs = {"ip": "192.168.1.1"}
        assert _has_mac_attribute(attrs) is False

    def test_returns_false_for_empty_mac(self) -> None:
        attrs = {"mac": "  "}
        assert _has_mac_attribute(attrs) is False


class TestGetMacAttributeValue:
    """Tests for _get_mac_attribute_value function."""

    def test_returns_mac_value(self) -> None:
        attrs = {"mac": "aa:bb:cc:dd:ee:ff"}
        result = _get_mac_attribute_value(attrs)
        assert result == "aa:bb:cc:dd:ee:ff"

    def test_prefers_mac_address(self) -> None:
        attrs = {"mac_address": "11:22:33:44:55:66", "mac": "aa:bb:cc:dd:ee:ff"}
        result = _get_mac_attribute_value(attrs)
        # Should return first found key
        assert result is not None

    def test_returns_none_for_non_string(self) -> None:
        attrs = {"mac": 12345}
        result = _get_mac_attribute_value(attrs)
        assert result is None


class TestMacFromStateEntry:
    """Tests for _mac_from_state_entry function."""

    def test_extracts_mac_from_attributes(self) -> None:
        state = MagicMock()
        state.attributes = {"mac": "aa:bb:cc:dd:ee:ff"}
        result = _mac_from_state_entry(state)
        assert result == "aa:bb:cc:dd:ee:ff"

    def test_returns_none_for_no_attributes(self) -> None:
        state = MagicMock()
        state.attributes = None
        result = _mac_from_state_entry(state)
        assert result is None

    def test_returns_none_for_non_dict_attributes(self) -> None:
        state = MagicMock()
        state.attributes = "not a dict"
        result = _mac_from_state_entry(state)
        assert result is None


class TestValidEdgePayload:
    """Tests for _valid_edge_payload function."""

    def test_valid_edge(self) -> None:
        edge = {"left": "nodeA", "right": "nodeB"}
        assert _valid_edge_payload(edge) is True

    def test_invalid_non_dict(self) -> None:
        assert _valid_edge_payload("not a dict") is False

    def test_invalid_missing_left(self) -> None:
        edge = {"right": "nodeB"}
        assert _valid_edge_payload(edge) is False

    def test_invalid_missing_right(self) -> None:
        edge = {"left": "nodeA"}
        assert _valid_edge_payload(edge) is False

    def test_invalid_non_string_left(self) -> None:
        edge = {"left": 123, "right": "nodeB"}
        assert _valid_edge_payload(edge) is False


class TestEdgeFromPayload:
    """Tests for _edge_from_payload function."""

    def test_creates_basic_edge(self) -> None:
        payload = {"left": "nodeA", "right": "nodeB"}
        edge = _edge_from_payload(payload)
        assert edge.left == "nodeA"
        assert edge.right == "nodeB"

    def test_includes_label(self) -> None:
        payload = {"left": "nodeA", "right": "nodeB", "label": "Port 1"}
        edge = _edge_from_payload(payload)
        assert edge.label == "Port 1"

    def test_includes_poe_flag(self) -> None:
        payload = {"left": "nodeA", "right": "nodeB", "poe": True}
        edge = _edge_from_payload(payload)
        assert edge.poe is True

    def test_includes_wireless_flag(self) -> None:
        payload = {"left": "nodeA", "right": "nodeB", "wireless": True}
        edge = _edge_from_payload(payload)
        assert edge.wireless is True

    def test_includes_speed(self) -> None:
        payload = {"left": "nodeA", "right": "nodeB", "speed": 1000}
        edge = _edge_from_payload(payload)
        assert edge.speed == 1000

    def test_includes_channel(self) -> None:
        payload = {"left": "nodeA", "right": "nodeB", "channel": 36}
        edge = _edge_from_payload(payload)
        assert edge.channel == 36

    def test_ignores_invalid_types(self) -> None:
        payload = {
            "left": "nodeA",
            "right": "nodeB",
            "label": 123,  # Should be string
            "poe": "yes",  # Should be bool
            "speed": "fast",  # Should be int
        }
        edge = _edge_from_payload(payload)
        assert edge.label is None
        assert edge.poe is False
        assert edge.speed is None


class TestShouldRenderSvg:
    """Tests for _should_render_svg function."""

    def test_returns_true_with_edges_and_types(self) -> None:
        edges = [{"left": "a", "right": "b"}]
        node_types = {"a": "gateway"}
        assert _should_render_svg(edges, node_types) is True

    def test_returns_false_without_edges(self) -> None:
        node_types = {"a": "gateway"}
        assert _should_render_svg([], node_types) is False

    def test_returns_false_without_node_types(self) -> None:
        edges = [{"left": "a", "right": "b"}]
        assert _should_render_svg(edges, {}) is False


class TestFormatMac:
    """Tests for _format_mac function."""

    def test_formats_valid_mac(self) -> None:
        with patch("custom_components.unifi_network_map.http.dr") as mock_dr:
            mock_dr.format_mac.return_value = "aa:bb:cc:dd:ee:ff"
            result = _format_mac("AA:BB:CC:DD:EE:FF")
            assert result == "aa:bb:cc:dd:ee:ff"

    def test_returns_none_for_invalid_mac(self) -> None:
        with patch("custom_components.unifi_network_map.http.dr") as mock_dr:
            mock_dr.format_mac.side_effect = ValueError("Invalid MAC")
            result = _format_mac("invalid")
            assert result is None

    def test_returns_none_when_formatter_unavailable(self) -> None:
        with patch("custom_components.unifi_network_map.http.dr") as mock_dr:
            mock_dr.format_mac = None
            result = _format_mac("aa:bb:cc:dd:ee:ff")
            assert result is None

    def test_returns_none_for_empty_result(self) -> None:
        with patch("custom_components.unifi_network_map.http.dr") as mock_dr:
            mock_dr.format_mac.return_value = "   "
            result = _format_mac("aa:bb:cc:dd:ee:ff")
            assert result is None


class TestAddEntitiesByDevice:
    """Tests for _add_entities_by_device function."""

    def test_adds_entities_for_known_device(self) -> None:
        device_to_mac = {"device1": "aa:bb:cc:dd:ee:ff"}
        device_to_entities = {"device1": ["sensor.temp", "sensor.humidity"]}
        mac_to_entities: dict[str, list[str]] = {}

        _add_entities_by_device(device_to_mac, device_to_entities, mac_to_entities)

        assert "aa:bb:cc:dd:ee:ff" in mac_to_entities
        assert len(mac_to_entities["aa:bb:cc:dd:ee:ff"]) == 2

    def test_skips_unknown_devices(self) -> None:
        device_to_mac = {"device1": "aa:bb:cc:dd:ee:ff"}
        device_to_entities = {"device2": ["sensor.temp"]}  # Unknown device
        mac_to_entities: dict[str, list[str]] = {}

        _add_entities_by_device(device_to_mac, device_to_entities, mac_to_entities)

        assert len(mac_to_entities) == 0


class TestBuildSvgEdges:
    """Tests for _build_svg_edges function."""

    def test_builds_edges_from_payload(self) -> None:
        payload = [
            {"left": "nodeA", "right": "nodeB"},
            {"left": "nodeB", "right": "nodeC"},
        ]
        result = _build_svg_edges(payload)
        assert len(result) == 2

    def test_filters_invalid_edges(self) -> None:
        payload = [
            {"left": "nodeA", "right": "nodeB"},
            {"left": "nodeA"},  # Invalid - missing right
            "not a dict",  # Invalid - not a dict
        ]
        result = _build_svg_edges(payload)
        assert len(result) == 1


class TestSvgOptionsFromSettings:
    """Tests for _svg_options_from_settings function."""

    def test_extracts_width_and_height(self) -> None:
        from custom_components.unifi_network_map.renderer import RenderSettings

        settings = RenderSettings(
            include_ports=True,
            include_clients=True,
            client_scope="all",
            only_unifi=False,
            svg_isometric=True,
            svg_width=800,
            svg_height=600,
            use_cache=True,
        )
        options = _svg_options_from_settings(settings)
        assert options.width == 800
        assert options.height == 600


class TestExtractMacFromAttributes:
    """Tests for _extract_mac_from_attributes function."""

    def test_extracts_mac_from_attributes(self) -> None:
        attrs = {"mac": "aa:bb:cc:dd:ee:ff"}
        result = _extract_mac_from_attributes(attrs)
        assert result == "aa:bb:cc:dd:ee:ff"

    def test_returns_none_for_no_mac(self) -> None:
        attrs = {"ip": "192.168.1.1"}
        result = _extract_mac_from_attributes(attrs)
        assert result is None


class TestIterStateEntries:
    """Tests for _iter_state_entries function."""

    def test_uses_async_all_if_available(self) -> None:
        hass = MagicMock()
        hass.states.async_all.return_value = ["state1", "state2"]
        result = list(_iter_state_entries(hass))
        assert result == ["state1", "state2"]

    def test_uses_all_if_no_async(self) -> None:
        hass = MagicMock()
        del hass.states.async_all  # Remove async_all
        hass.states.all.return_value = ["state1"]
        result = list(_iter_state_entries(hass))
        assert result == ["state1"]

    def test_returns_empty_if_neither(self) -> None:
        hass = MagicMock()
        del hass.states.async_all
        del hass.states.all
        result = list(_iter_state_entries(hass))
        assert result == []


class TestResolveNodeStatusMap:
    """Tests for resolve_node_status_map function."""

    def test_resolves_device_tracker_states(self) -> None:
        hass = MagicMock()
        state = MagicMock()
        state.state = "home"
        state.last_changed = datetime(2024, 1, 15, tzinfo=timezone.utc)
        hass.states.get.return_value = state

        node_entities = {"my_phone": "device_tracker.my_phone"}
        result = resolve_node_status_map(hass, node_entities)

        assert "my_phone" in result
        assert result["my_phone"]["state"] == "online"
        assert result["my_phone"]["entity_id"] == "device_tracker.my_phone"

    def test_skips_non_device_tracker(self) -> None:
        hass = MagicMock()
        node_entities = {"my_sensor": "sensor.my_sensor"}
        result = resolve_node_status_map(hass, node_entities)
        assert "my_sensor" not in result

    def test_skips_missing_states(self) -> None:
        hass = MagicMock()
        hass.states.get.return_value = None
        node_entities = {"my_phone": "device_tracker.my_phone"}
        result = resolve_node_status_map(hass, node_entities)
        assert "my_phone" not in result
