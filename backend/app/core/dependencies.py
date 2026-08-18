from datetime import datetime, timedelta, timezone
from typing import Callable

from fastapi import Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.session import get_db
from app.models.session import Session as SessionModel
from app.models.user import User
from app.services.auth_service import AuthService

auth_service = AuthService()


def get_raw_session_token(request: Request) -> str | None:
    """
    Extract session token from Authorization Bearer header if explicitly provided,
    or from the primary HttpOnly session cookie.
    """
    # 1. Check Authorization Bearer header (for explicit tokens or API clients)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        return auth_header[7:].strip()

    # 2. Check primary session cookie
    token = request.cookies.get(settings.SESSION_COOKIE_NAME)
    if token:
        return token

    # 3. Check __Host- prefixed cookie if configured
    token = request.cookies.get(f"__Host-{settings.SESSION_COOKIE_NAME}")
    if token:
        return token

    return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    """
    Authenticate request via server-managed session.
    Validates token, checks idle & absolute timeout, updates last_used_at.
    """
    raw_token = get_raw_session_token(request)
    if not raw_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please log in.",
        )

    result = auth_service.validate_session_token(db, raw_token)
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session has expired or is invalid. Please log in again.",
        )

    user, session = result

    # Cache user and session on request state
    request.state.user = user
    request.state.session = session
    request.state.raw_session_token = raw_token

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user account.",
        )
    return current_user


def get_current_verified_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.email_verified_at is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email address must be verified to access this resource.",
        )
    return current_user


def get_current_admin_user(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions.",
        )
    return current_user


def require_recent_authentication(max_age_minutes: int = 15) -> Callable:
    """
    Dependency factory to require recent authentication for sensitive actions
    (e.g., password change, email change, session revocation).
    """
    def dependency(request: Request, current_user: User = Depends(get_current_user)) -> User:
        session: SessionModel | None = getattr(request.state, "session", None)
        if not session:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Not authenticated.",
            )

        now = datetime.now(timezone.utc)
        created_at = session.created_at
        if created_at.tzinfo is None:
            created_at = created_at.replace(tzinfo=timezone.utc)

        if now - created_at > timedelta(minutes=max_age_minutes):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This sensitive operation requires recent authentication. Please re-authenticate.",
            )
        return current_user

    return dependency
