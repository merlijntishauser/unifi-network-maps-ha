from __future__ import annotations

import logging

import custom_components.unifi_network_map.api as api


class _ListHandler(logging.Handler):
    def __init__(self) -> None:
        super().__init__()
        self.records: list[logging.LogRecord] = []

    def emit(self, record: logging.LogRecord) -> None:
        self.records.append(record)


def test_ssl_warning_logged_once() -> None:
    logger = logging.getLogger("unifi_controller_api.api_client")
    handler = _ListHandler()
    logger.addHandler(handler)
    logger.setLevel(logging.WARNING)
    original_filters = list(logger.filters)

    try:
        ensure_filter = getattr(api, "_ensure_unifi_ssl_warning_filter")  # pyright: ignore[reportPrivateUsage]
        ensure_filter(False)
        logger.warning(api.SSL_WARNING_MESSAGE)
        logger.warning(api.SSL_WARNING_MESSAGE)

        messages = [record.getMessage() for record in handler.records]
        assert messages.count(api.SSL_WARNING_MESSAGE) == 1
    finally:
        logger.removeHandler(handler)
        logger.filters = original_filters
        setattr(api, "_ssl_warning_filter_added", False)  # pyright: ignore[reportPrivateUsage]
