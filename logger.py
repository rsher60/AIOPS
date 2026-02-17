import logging
import os
from contextvars import ContextVar

from pythonjsonlogger import jsonlogger

# Stores a unique UUID for each request, propagated through all log records
correlation_id_var: ContextVar[str] = ContextVar("correlation_id", default="")


class CorrelationIdFilter(logging.Filter):
    """Injects the current request's correlation_id into every log record."""

    def filter(self, record: logging.LogRecord) -> bool:
        record.correlation_id = correlation_id_var.get("")
        return True


def setup_logging(log_level: str | None = None) -> None:
    """
    Configure the root 'saas' logger to emit JSON to stdout.
    stdout is automatically collected by AWS App Runner and shipped to CloudWatch Logs.

    Args:
        log_level: Override log level. Falls back to LOG_LEVEL env var, then INFO.
    """
    level_str = log_level or os.getenv("LOG_LEVEL", "INFO")
    level = getattr(logging, level_str.upper(), logging.INFO)

    logger = logging.getLogger("saas")
    logger.setLevel(level)

    if logger.handlers:
        return  # Already configured — avoid duplicate handlers on reload

    handler = logging.StreamHandler()
    handler.setLevel(level)

    formatter = jsonlogger.JsonFormatter(
        fmt="%(asctime)s %(name)s %(levelname)s %(message)s %(correlation_id)s",
        rename_fields={
            "asctime": "timestamp",
            "levelname": "level",
            "name": "logger",
        },
        datefmt="%Y-%m-%dT%H:%M:%S",
    )
    handler.setFormatter(formatter)
    handler.addFilter(CorrelationIdFilter())

    logger.addHandler(handler)
    logger.propagate = False


def get_logger(name: str) -> logging.Logger:
    """
    Return a child logger under the 'saas' namespace.

    Args:
        name: Submodule name, e.g. 'api' → logger name 'saas.api'
    """
    return logging.getLogger(f"saas.{name}")
