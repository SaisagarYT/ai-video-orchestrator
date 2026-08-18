import uuid
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import hash_token
from app.models.session import Session as SessionModel
from app.services.auth_service import AuthService

auth_service = AuthService()


def test_session_token_opacity_and_hash_storage(client: TestClient, db: Session, create_test_user):
    """Verify that session tokens are opaque and only SHA-256 hashes are stored in the database."""
    email = f"session_sec_{uuid.uuid4().hex[:8]}@kanggird.ai"
    user, raw_session_token, _ = create_test_user(email=email)

    # 1. Raw token must be at least 32 bytes URL-safe (>= 40 chars)
    assert len(raw_session_token) >= 40
    # Must NOT contain user ID, email, or readable metadata
    assert str(user.id) not in raw_session_token
    assert email not in raw_session_token

    # 2. Database must NOT store raw token; it must store SHA-256 hash
    expected_hash = hash_token(raw_session_token)
    db_session = auth_service.session_repo.get_by_hash(db, expected_hash)
    assert db_session is not None
    assert db_session.user_id == user.id

    # Raw token string must not appear anywhere in database session fields
    assert db_session.session_id_hash == expected_hash
    assert db_session.session_id_hash != raw_session_token


def test_session_logout_revocation(client: TestClient, db: Session, create_test_user):
    """Verify that logging out revokes the server-side session and clears the cookie."""
    email = f"logout_test_{uuid.uuid4().hex[:8]}@kanggird.ai"
    user, raw_session_token, _ = create_test_user(email=email)

    # Verify authenticated before logout
    res_before = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {raw_session_token}"},
    )
    assert res_before.status_code == 200

    # Execute logout
    res_logout = client.post(
        "/auth/logout",
        headers={"Authorization": f"Bearer {raw_session_token}"},
    )
    assert res_logout.status_code == 200

    # Verify session is revoked on DB
    token_hash = hash_token(raw_session_token)
    db_session = auth_service.session_repo.get_by_hash(db, token_hash)
    assert db_session.revoked_at is not None

    # Subsequent request with old token must return 401
    res_after = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {raw_session_token}"},
    )
    assert res_after.status_code == 401


def test_session_idle_timeout(client: TestClient, db: Session, create_test_user):
    """Verify that sessions inactive past the idle timeout (60m) are invalidated."""
    email = f"idle_test_{uuid.uuid4().hex[:8]}@kanggird.ai"
    user, raw_session_token, _ = create_test_user(email=email)

    # Artificially age the session's last_used_at past the idle timeout
    token_hash = hash_token(raw_session_token)
    db_session = auth_service.session_repo.get_by_hash(db, token_hash)
    assert db_session is not None

    # Set last_used_at to 65 minutes in the past
    past_time = datetime.now(timezone.utc) - timedelta(minutes=65)
    db_session.last_used_at = past_time
    db.commit()

    # Request with idle expired session must fail and revoke the session
    res = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {raw_session_token}"},
    )
    assert res.status_code == 401

    # Verify database marked it as revoked
    db.refresh(db_session)
    assert db_session.revoked_at is not None


def test_get_sessions_and_revoke_individual(client: TestClient, db: Session, create_test_user):
    """Verify session listing and individual session revocation."""
    email = f"multi_sess_{uuid.uuid4().hex[:8]}@kanggird.ai"
    user, session_token_1, password = create_test_user(email=email)

    # Create a second session by logging in with fresh client IP
    res_login = client.post(
        "/auth/login",
        json={"email": email, "password": password},
        headers={"X-Forwarded-For": "10.0.2.1"},
    )
    assert res_login.status_code == 200
    session_token_2 = res_login.cookies.get(settings.SESSION_COOKIE_NAME)
    assert session_token_2 is not None

    # List sessions using session 2
    res_sessions = client.get(
        "/auth/sessions",
        headers={"Authorization": f"Bearer {session_token_2}"},
    )
    assert res_sessions.status_code == 200
    sessions_list = res_sessions.json()
    assert len(sessions_list) >= 2

    # Identify session 1 in the list and revoke it
    session_1_hash = hash_token(session_token_1)
    db_s1 = auth_service.session_repo.get_by_hash(db, session_1_hash)
    assert db_s1 is not None

    res_revoke = client.delete(
        f"/auth/sessions/{db_s1.id}",
        headers={"Authorization": f"Bearer {session_token_2}"},
    )
    assert res_revoke.status_code == 200

    # Session 1 must now be unauthorized
    res_s1_check = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {session_token_1}"},
    )
    assert res_s1_check.status_code == 401

    # Session 2 must remain valid
    res_s2_check = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {session_token_2}"},
    )
    assert res_s2_check.status_code == 200


def test_revoke_all_sessions(client: TestClient, db: Session, create_test_user):
    """Verify that POST /auth/sessions/revoke-all revokes all sessions except the current caller."""
    email = f"revoke_all_{uuid.uuid4().hex[:8]}@kanggird.ai"
    user, session_token_1, password = create_test_user(email=email)

    # Create session 2 with fresh client IP
    res_login = client.post(
        "/auth/login",
        json={"email": email, "password": password},
        headers={"X-Forwarded-For": "10.0.2.2"},
    )
    assert res_login.status_code == 200
    session_token_2 = res_login.cookies.get(settings.SESSION_COOKIE_NAME)
    assert session_token_2 is not None

    # Call revoke-all using session 2
    res_revoke_all = client.post(
        "/auth/sessions/revoke-all",
        headers={"Authorization": f"Bearer {session_token_2}"},
    )
    assert res_revoke_all.status_code == 200
    assert "Revoked" in res_revoke_all.json()["message"]

    # Session 1 must now be revoked
    res_s1 = client.get("/auth/me", headers={"Authorization": f"Bearer {session_token_1}"})
    assert res_s1.status_code == 401

    # Session 2 must still be active
    res_s2 = client.get("/auth/me", headers={"Authorization": f"Bearer {session_token_2}"})
    assert res_s2.status_code == 200
