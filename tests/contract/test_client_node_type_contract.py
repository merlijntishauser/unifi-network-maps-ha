"""Contract: unifi-topology decides which payload node types are clients.

Diagnostics and the card rely on every client subtype (camera, phone,
tv, ...) being recognised as a client, not only the literal ``client``
type.
"""

from __future__ import annotations

from unifi_topology.model.classify import is_client_node_type

CLIENT_SUBTYPES = ("client", "camera", "tv", "phone", "printer", "nas")
INFRASTRUCTURE_TYPES = ("gateway", "switch", "ap", None)


def test_client_subtypes_are_clients() -> None:
    for node_type in CLIENT_SUBTYPES:
        assert is_client_node_type(node_type), node_type


def test_infrastructure_types_are_not_clients() -> None:
    for node_type in INFRASTRUCTURE_TYPES:
        assert not is_client_node_type(node_type), node_type
