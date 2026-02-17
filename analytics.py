import os
from datetime import datetime
from uuid import uuid4

import boto3
import httpx

from saas.logger import get_logger

logger = get_logger("analytics")

# In-memory cache: user_id -> {email, first_name, last_name}
_user_cache: dict[str, dict] = {}

# Tracks which user_ids have had a login event logged this server session
_session_users: set[str] = set()

DYNAMODB_TABLE_NAME = os.getenv("DYNAMODB_TABLE_NAME", "saas-user-analytics")
CLERK_SECRET_KEY = os.getenv("CLERK_SECRET_KEY", "")

dynamodb_table = boto3.resource("dynamodb").Table(DYNAMODB_TABLE_NAME)


def fetch_clerk_user(user_id: str) -> dict:
    """Return cached or freshly fetched Clerk user info for user_id.

    Never raises — returns a fallback dict on any error.
    """
    if user_id in _user_cache:
        return _user_cache[user_id]

    try:
        resp = httpx.get(
            f"https://api.clerk.com/v1/users/{user_id}",
            headers={"Authorization": f"Bearer {CLERK_SECRET_KEY}"},
            timeout=5,
        )
        resp.raise_for_status()
        data = resp.json()

        primary_id = data.get("primary_email_address_id")
        email_addresses = data.get("email_addresses", [])
        email = "unknown"
        if email_addresses:
            # Try to match primary; fall back to first entry
            match = next(
                (e for e in email_addresses if e.get("id") == primary_id),
                email_addresses[0],
            )
            email = match.get("email_address", "unknown")

        user_info = {
            "email": email,
            "first_name": data.get("first_name") or "",
            "last_name": data.get("last_name") or "",
        }
        _user_cache[user_id] = user_info
        return user_info

    except Exception as exc:
        logger.warning(
            "Failed to fetch Clerk user",
            extra={"user_id": user_id, "error": str(exc)},
        )
        return {"email": "unknown", "first_name": "", "last_name": ""}


def log_event(user_id: str, event_type: str, **kwargs) -> None:
    """Write a single analytics event to DynamoDB. Fire-and-forget; never raises."""
    try:
        user_info = fetch_clerk_user(user_id)
        now = datetime.utcnow().isoformat()
        item = {
            "user_id": user_id,
            "timestamp_event_id": f"{now}#{uuid4()}",
            "email": user_info["email"],
            "event_type": event_type,
            "timestamp": now,
            **kwargs,
        }
        dynamodb_table.put_item(Item=item)
    except Exception as exc:
        logger.error(
            "Failed to log analytics event",
            extra={"user_id": user_id, "event_type": event_type, "error": str(exc)},
        )


def log_login_if_new(user_id: str) -> None:
    """Log a login event the first time this user_id is seen in this server session."""
    if user_id in _session_users:
        return
    _session_users.add(user_id)
    log_event(user_id, "login")
