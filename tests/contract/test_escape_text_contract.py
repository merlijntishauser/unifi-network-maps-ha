"""Contract tests for upstream `unifi_topology.render.svg_labels._escape_text`.

These guard the fix for #226 (upstream unifi-topology#51): a single device
or client name containing an XML-invalid control character (e.g. U+0003)
must not break the rendered SVG. Future upstream bumps that silently
regress the strip-then-escape behavior will fail this contract.
"""

from __future__ import annotations

import re

from unifi_topology.render.svg_labels import _escape_text

_XML_INVALID = re.compile(r"[\x00-\x08\x0B\x0C\x0E-\x1F]")


def test_escape_text_strips_xml_invalid_control_chars() -> None:
    assert _escape_text("My\x03Phone") == "MyPhone"
    assert _escape_text("a\x00b\x08c") == "abc"


def test_escape_text_preserves_xml_legal_whitespace() -> None:
    """Tab, newline, and carriage return are valid XML characters."""
    assert _escape_text("a\tb\nc\rd") == "a\tb\nc\rd"


def test_escape_text_still_escapes_xml_entities() -> None:
    assert _escape_text("a & b < c > d") == "a &amp; b &lt; c &gt; d"


def test_escape_text_strips_and_escapes_together() -> None:
    assert _escape_text("A&\x03B") == "A&amp;B"


def test_escape_text_output_is_xml_text_content_safe() -> None:
    """Sweep BMP control range -- output must never contain forbidden chars."""
    raw = "".join(chr(i) for i in range(0x20)) + "name"
    cleaned = _escape_text(raw)
    assert not _XML_INVALID.search(cleaned)
    assert "name" in cleaned
