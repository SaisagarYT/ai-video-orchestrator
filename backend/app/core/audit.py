import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from sqlalchemy.orm import Session

logger = logging.getLogger("app.security.audit")

SENSITIVE_KEYS = {
    "password", "password_hash", "token", "raw_token", "secret",
    "authorization", "cookie", "session_id", "otp", "key", "access_token"
}


def sanitize_metadata(data: dict[str, Any] | None) -> dict[str, Any]:
    """Ensure no passwords, tokens, or raw secrets are present in audit metadata."""
    if not data:
        return {}
    sanitized = {}
    for k, v in data.items():
        if any(sensitive in k.lower() for sensitive in SENSITIVE_KEYS):
            sanitized[k] = "[REDACTED]"
        elif isinstance(v, dict):
            sanitized[k] = sanitize_metadata(v)
        else:
            sanitized[k] = v
    return sanitized


def log_security_event(
    event_type: str,
    status: str,
    user_id: uuid.UUID | str | None = None,
    ip_address: str | None = None,
    user_agent: str | None = None,
    metadata: dict[str, Any] | None = None,
    db: Session | None = None,
):
    """
    Record a security audit log event both to structured logs and the security_events DB table.
    """
    safe_metadata = sanitize_metadata(metadata)
    event_payload = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "status": status,
        "user_id": str(user_id) if user_id else None,
        "ip_address": ip_address,
        "user_agent": user_agent[:255] if user_agent else None,
        "metadata": safe_metadata,
    }

    # Structured application log
    log_level = logging.WARNING if status in ("FAILURE", "BLOCKED") else logging.INFO
    logger.log(log_level, f"AUDIT_EVENT: {json.dumps(event_payload)}")

    # Database audit log persistence if DB session provided
    if db is not None:
        try:
            from app.models.security_event import SecurityEvent
            u_id = uuid.UUID(str(user_id)) if user_id else None
            evt = SecurityEvent(
                user_id=u_id,
                event_type=event_type,
                status=status,
                ip_address=ip_address,
                user_agent=user_agent[:512] if user_agent else None,
                metadata_json=json.dumps(safe_metadata),
            )
            db.add(evt)
            db.commit()
        except Exception as exc:
            logger.error(f"Failed to persist security event to DB: {exc}")
            # Audit logging failure should not break critical auth flows
            try:
                db.rollback()
            except Exception:
                pass
