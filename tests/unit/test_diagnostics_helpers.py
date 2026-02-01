"""Unit tests for diagnostics helper functions."""

from __future__ import annotations

from datetime import datetime, timezone, timedelta
from unittest.mock import MagicMock

from custom_components.unifi_network_map.diagnostics import (
    _calculate_data_age,
    _format_timestamp,
    _hash_mac_samples,
    _hash_name_samples,
    _hash_value,
    _normalize_mac_values,
    _summarize_ap_client_counts,
    _summarize_clients,
    _summarize_map_data,
)
from custom_components.unifi_network_map.data import UniFiNetworkMapData


class TestFormatTimestamp:
    """Tests for _format_timestamp function."""

    def test_returns_none_for_none(self) -> None:
        result = _format_timestamp(None)
        assert result is None

    def test_returns_iso_format(self) -> None:
        dt = datetime(2024, 1, 15, 10, 30, 45, tzinfo=timezone.utc)
        result = _format_timestamp(dt)
        assert result == "2024-01-15T10:30:45+00:00"

    def test_handles_naive_datetime(self) -> None:
        dt = datetime(2024, 1, 15, 10, 30, 45)
        result = _format_timestamp(dt)
        assert result == "2024-01-15T10:30:45"


class TestCalculateDataAge:
    """Tests for _calculate_data_age function."""

    def test_returns_none_for_none(self) -> None:
        result = _calculate_data_age(None)
        assert result is None

    def test_calculates_age_for_utc_datetime(self) -> None:
        # Set time to 1 minute ago
        dt = datetime.now(timezone.utc) - timedelta(seconds=60)
        result = _calculate_data_age(dt)
        assert result is not None
        # Allow 2 second tolerance for test execution time
        assert 58 < result < 62

    def test_handles_naive_datetime(self) -> None:
        # Naive datetime is converted to UTC by the function
        # Create a naive datetime that represents 30 seconds ago in UTC
        dt = datetime.now(timezone.utc).replace(tzinfo=None) - timedelta(seconds=30)
        result = _calculate_data_age(dt)
        assert result is not None
        # Should be around 30 seconds (allow for test execution time)
        assert 28 < result < 32


class TestHashValue:
    """Tests for _hash_value function."""

    def test_returns_10_char_hash(self) -> None:
        result = _hash_value("test")
        assert len(result) == 10

    def test_returns_consistent_hash(self) -> None:
        result1 = _hash_value("hello")
        result2 = _hash_value("hello")
        assert result1 == result2

    def test_different_values_different_hashes(self) -> None:
        result1 = _hash_value("hello")
        result2 = _hash_value("world")
        assert result1 != result2


class TestHashNameSamples:
    """Tests for _hash_name_samples function."""

    def test_returns_hashed_samples(self) -> None:
        names = ["alpha", "beta", "gamma"]
        result = _hash_name_samples(names)
        assert len(result) == 3
        assert all(len(h) == 10 for h in result)

    def test_limits_to_sample_size(self) -> None:
        names = [f"name{i}" for i in range(10)]
        result = _hash_name_samples(names, sample_size=3)
        assert len(result) == 3

    def test_sorts_before_sampling(self) -> None:
        names = ["zebra", "apple", "banana"]
        result = _hash_name_samples(names, sample_size=2)
        # Should get hashes for "apple" and "banana" (sorted first two)
        expected_apple = _hash_value("apple")
        expected_banana = _hash_value("banana")
        assert result == [expected_apple, expected_banana]


class TestHashMacSamples:
    """Tests for _hash_mac_samples function."""

    def test_returns_hashed_samples(self) -> None:
        macs = {"aa:bb:cc:dd:ee:ff", "11:22:33:44:55:66"}
        result = _hash_mac_samples(macs)
        assert len(result) == 2

    def test_limits_to_sample_size(self) -> None:
        macs = {f"aa:bb:cc:dd:ee:{i:02x}" for i in range(10)}
        result = _hash_mac_samples(macs, sample_size=3)
        assert len(result) == 3


class TestNormalizeMacValues:
    """Tests for _normalize_mac_values function."""

    def test_normalizes_mac_values(self) -> None:
        mac_map = {"client1": "AA:BB:CC:DD:EE:FF", "client2": "11:22:33:44:55:66"}
        result = _normalize_mac_values(mac_map)
        assert len(result) == 2

    def test_skips_empty_values(self) -> None:
        mac_map = {"client1": "AA:BB:CC:DD:EE:FF", "client2": "  "}
        result = _normalize_mac_values(mac_map)
        assert len(result) == 1

    def test_skips_non_string_values(self) -> None:
        mac_map = {"client1": "AA:BB:CC:DD:EE:FF", "client2": None, "client3": 123}
        result = _normalize_mac_values(mac_map)
        assert len(result) == 1


class TestSummarizeClients:
    """Tests for _summarize_clients function."""

    def test_counts_total_clients(self) -> None:
        node_types = {
            "gw": "gateway",
            "sw": "switch",
            "client1": "client",
            "client2": "client",
        }
        result = _summarize_clients(node_types, [], {})
        assert result["total_count"] == 2

    def test_counts_wired_clients(self) -> None:
        node_types = {"gw": "gateway", "client1": "client", "client2": "client"}
        edges = [
            {"left": "gw", "right": "client1", "wireless": False},
            {"left": "gw", "right": "client2", "wireless": False},
        ]
        result = _summarize_clients(node_types, edges, {})
        assert result["wired_count"] == 2
        assert result["wireless_count"] == 0

    def test_counts_wireless_clients(self) -> None:
        node_types = {"ap": "ap", "client1": "client", "client2": "client"}
        edges = [
            {"left": "ap", "right": "client1", "wireless": True},
            {"left": "ap", "right": "client2", "wireless": True},
        ]
        result = _summarize_clients(node_types, edges, {})
        assert result["wireless_count"] == 2
        assert result["wired_count"] == 0

    def test_counts_mixed_clients(self) -> None:
        node_types = {"sw": "switch", "ap": "ap", "wired": "client", "wireless": "client"}
        edges = [
            {"left": "sw", "right": "wired", "wireless": False},
            {"left": "ap", "right": "wireless", "wireless": True},
        ]
        result = _summarize_clients(node_types, edges, {})
        assert result["wired_count"] == 1
        assert result["wireless_count"] == 1

    def test_counts_clients_with_macs(self) -> None:
        node_types = {"client1": "client", "client2": "client"}
        client_macs = {"client1": "aa:bb:cc:dd:ee:ff"}
        result = _summarize_clients(node_types, [], client_macs)
        assert result["with_mac_count"] == 1

    def test_handles_client_on_left_side_of_edge(self) -> None:
        node_types = {"sw": "switch", "client1": "client"}
        edges = [{"left": "client1", "right": "sw", "wireless": False}]
        result = _summarize_clients(node_types, edges, {})
        assert result["wired_count"] == 1

    def test_deduplicates_clients_appearing_multiple_times(self) -> None:
        node_types = {"sw": "switch", "ap": "ap", "client1": "client"}
        edges = [
            {"left": "sw", "right": "client1", "wireless": False},
            {"left": "ap", "right": "client1", "wireless": False},
        ]
        result = _summarize_clients(node_types, edges, {})
        # Client should only be counted once even though it appears in two edges
        assert result["wired_count"] == 1


class TestSummarizeApClientCounts:
    """Tests for _summarize_ap_client_counts function."""

    def test_returns_zero_for_empty_dict(self) -> None:
        result = _summarize_ap_client_counts({})
        assert result["ap_count"] == 0
        assert result["total_wireless_clients"] == 0

    def test_counts_aps_and_total_clients(self) -> None:
        ap_counts = {"AP1": 10, "AP2": 5, "AP3": 3}
        result = _summarize_ap_client_counts(ap_counts)
        assert result["ap_count"] == 3
        assert result["total_wireless_clients"] == 18

    def test_includes_sample_hashes(self) -> None:
        ap_counts = {"AP1": 10, "AP2": 5}
        result = _summarize_ap_client_counts(ap_counts)
        assert "ap_sample_hashed" in result
        assert len(result["ap_sample_hashed"]) == 2
        # Verify structure of sample entries
        sample = result["ap_sample_hashed"][0]
        assert "name_hash" in sample
        assert "client_count" in sample

    def test_limits_samples_to_5(self) -> None:
        ap_counts = {f"AP{i}": i for i in range(10)}
        result = _summarize_ap_client_counts(ap_counts)
        assert len(result["ap_sample_hashed"]) == 5


class TestSummarizeMapData:
    """Tests for _summarize_map_data function."""

    def test_returns_none_for_none_data(self) -> None:
        hass = MagicMock()
        result = _summarize_map_data(hass, None)
        assert result is None

    def test_returns_summary_with_payload(self) -> None:
        hass = MagicMock()
        hass.states.get.return_value = None

        # Mock entity/device registries
        from unittest.mock import patch

        with patch(
            "custom_components.unifi_network_map.diagnostics.resolve_client_entity_map"
        ) as mock_resolve:
            mock_resolve.return_value = {}
            with patch(
                "custom_components.unifi_network_map.diagnostics.get_unifi_entity_mac_stats"
            ) as mock_stats:
                mock_stats.return_value = {"unifi_entities_scanned": 0}
                with patch(
                    "custom_components.unifi_network_map.diagnostics.get_unifi_entity_macs"
                ) as mock_macs:
                    mock_macs.return_value = set()
                    with patch(
                        "custom_components.unifi_network_map.diagnostics.get_state_entity_macs"
                    ) as mock_state_macs:
                        mock_state_macs.return_value = set()

                        data = UniFiNetworkMapData(
                            svg="<svg />",
                            payload={
                                "schema_version": "1.1",
                                "node_types": {"gw": "gateway"},
                                "edges": [],
                                "client_macs": {},
                                "device_macs": {},
                            },
                        )
                        result = _summarize_map_data(hass, data)

                        assert result is not None
                        assert result["svg_length"] == 7
                        assert result["node_count"] == 1
                        assert result["edge_count"] == 0
                        assert result["payload_schema_version"] == "1.1"
