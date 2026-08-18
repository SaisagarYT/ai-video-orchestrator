import uuid
from datetime import datetime, timedelta, timezone
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import generate_secure_token, hash_password, hash_token, validate_password_strength, verify_password
from app.models.user import User
from app.services.auth_service import AuthService

auth_service = AuthService()


def test_argon2id_hashing():
    """Verify that password hashing utilizes Argon2id with unique salts."""
    raw_pwd = "SuperSecretPassword#2026!"
    hash1 = hash_password(raw_pwd)
    hash2 = hash_password(raw_pwd)

    # Must start with Argon2id identifier
    assert hash1.startswith("$argon2id$")
    assert hash2.startswith("$argon2id$")
    # Must use unique salts (hashes must not be identical)
    assert hash1 != hash2

    # Verification must succeed for raw password and fail for invalid password
    assert verify_password(raw_pwd, hash1) is True
    assert verify_password("WrongPassword123", hash1) is False


def test_password_strength_validator():
    """Verify NIST-compliant password strength evaluation."""
    # 1. Too short (< 8 chars)
    is_valid, err = validate_password_strength("Short1!")
    assert is_valid is False
    assert "8 characters" in err

    # 2. Known breached passwords
    is_valid, err = validate_password_strength("password123")
    assert is_valid is False
    assert "too common" in err.lower()

    is_valid, err = validate_password_strength("12345678")
    assert is_valid is False

    # 3. Matches user information
    is_valid, err = validate_password_strength(
        "johnfrancisco99!",
        user_inputs=["John Francisco", "johnfrancisco"],
    )
    assert is_valid is False
    assert "contain your name" in err.lower()

    # 4. Valid passphrase / strong password
    is_valid, err = validate_password_strength("quantum-forest-orbit-2026-safe")
    assert is_valid is True
    assert err is None


def test_register_flow(client: TestClient, db: Session):
    """Test user registration sets HttpOnly session cookie and hashes password with Argon2id."""
    unique_email = f"security_reg_{uuid.uuid4().hex[:8]}@kanggird.ai"
    payload = {
        "full_name": "Security Tester",
        "email": unique_email,
        "password": "Correct-Horse-Battery-2026!",
    }

    response = client.post(
        "/auth/register",
        json=payload,
        headers={"X-Forwarded-For": "10.0.1.1"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["email"] == unique_email
    assert "password_hash" not in data  # Never leak password hash

    # Verify session cookie was set
    cookie = response.cookies.get(settings.SESSION_COOKIE_NAME)
    assert cookie is not None

    # Verify DB record
    user = db.get(User, uuid.UUID(data["id"]))
    assert user is not None
    assert user.password_hash.startswith("$argon2id$")
    assert user.password_hash != payload["password"]


def test_register_weak_password_rejected(client: TestClient):
    """Test registration rejects weak/breached passwords."""
    unique_email = f"weak_{uuid.uuid4().hex[:8]}@kanggird.ai"
    payload = {
        "full_name": "Weak Password User",
        "email": unique_email,
        "password": "password",
    }
    response = client.post(
        "/auth/register",
        json=payload,
        headers={"X-Forwarded-For": "10.0.1.2"},
    )
    assert response.status_code == 400
    assert "password" in response.json()["detail"].lower()


def test_register_duplicate_email_rejected(client: TestClient, create_test_user):
    """Test registration rejects duplicate email."""
    email = f"dup_{uuid.uuid4().hex[:8]}@kanggird.ai"
    create_test_user(email=email)

    payload = {
        "full_name": "Duplicate User",
        "email": email,
        "password": "ValidPassword#2026",
    }
    response = client.post(
        "/auth/register",
        json=payload,
        headers={"X-Forwarded-For": "10.0.1.3"},
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


def test_login_success_sets_session_cookie(client: TestClient, create_test_user):
    """Test login authenticates with Argon2id and sets HttpOnly session cookie."""
    email = f"login_ok_{uuid.uuid4().hex[:8]}@kanggird.ai"
    password = "MySecurePassword#2026"
    create_test_user(email=email, password=password)

    response = client.post(
        "/auth/login",
        json={"email": email, "password": password},
        headers={"X-Forwarded-For": "10.0.1.4"},
    )
    assert response.status_code == 200
    assert response.json()["email"] == email
    cookie = response.cookies.get(settings.SESSION_COOKIE_NAME)
    assert cookie is not None


def test_account_enumeration_prevention_on_login(client: TestClient, create_test_user):
    """Test that login returns identical error message for wrong password and non-existent email."""
    existing_email = f"enum_exist_{uuid.uuid4().hex[:8]}@kanggird.ai"
    create_test_user(email=existing_email, password="CorrectPassword#2026")

    # 1. Existing user with wrong password
    res1 = client.post(
        "/auth/login",
        json={"email": existing_email, "password": "WrongPassword#999"},
        headers={"X-Forwarded-For": "10.0.1.5"},
    )
    assert res1.status_code == 401
    err1 = res1.json()["detail"]

    # 2. Non-existent user
    non_existent_email = f"enum_nonexist_{uuid.uuid4().hex[:8]}@kanggird.ai"
    res2 = client.post(
        "/auth/login",
        json={"email": non_existent_email, "password": "AnyPassword#999"},
        headers={"X-Forwarded-For": "10.0.1.6"},
    )
    assert res2.status_code == 401
    err2 = res2.json()["detail"]

    # Messages must be identical to prevent enumeration
    assert err1 == err2
    assert "Invalid email or password" in err1


def test_forgot_password_enumeration_prevention(client: TestClient, create_test_user):
    """Test that forgot password returns identical non-revealing response for all emails."""
    existing_email = f"forgot_exist_{uuid.uuid4().hex[:8]}@kanggird.ai"
    create_test_user(email=existing_email)

    res1 = client.post(
        "/auth/forgot-password",
        json={"email": existing_email},
        headers={"X-Forwarded-For": "10.0.1.7"},
    )
    assert res1.status_code == 200

    non_existent_email = f"forgot_nonexist_{uuid.uuid4().hex[:8]}@kanggird.ai"
    res2 = client.post(
        "/auth/forgot-password",
        json={"email": non_existent_email},
        headers={"X-Forwarded-For": "10.0.1.8"},
    )
    assert res2.status_code == 200

    assert res1.json()["message"] == res2.json()["message"]


def test_email_verification_flow(client: TestClient, db: Session, create_test_user):
    """Test single-use email verification flow."""
    email = f"verify_{uuid.uuid4().hex[:8]}@kanggird.ai"
    user, _, _ = create_test_user(email=email)
    assert user.email_verified_at is None

    raw_vtoken = generate_secure_token(32)
    auth_service.token_repo.create_verification_token(
        db=db,
        user_id=user.id,
        token_hash=hash_token(raw_vtoken),
        expires_at=datetime.now(timezone.utc) + timedelta(hours=1),
    )

    # Verify email
    res = client.post("/auth/verify-email", json={"token": raw_vtoken})
    assert res.status_code == 200
    assert "verified" in res.json()["message"].lower()

    # Second attempt with same token must fail (single-use)
    res_reuse = client.post("/auth/verify-email", json={"token": raw_vtoken})
    assert res_reuse.status_code == 400


def test_password_reset_and_session_invalidation(client: TestClient, db: Session, create_test_user):
    """Test password reset flow and verify all active sessions are revoked."""
    email = f"reset_flow_{uuid.uuid4().hex[:8]}@kanggird.ai"
    user, old_session_token, old_pwd = create_test_user(email=email, password="OldPassword#2026")

    # Generate reset token
    raw_reset_token = auth_service.request_password_reset(db, email, ip_address="10.0.1.9")
    assert raw_reset_token is not None

    # Reset password
    new_pwd = "BrandNewSuperSecret#2026"
    res = client.post(
        "/auth/reset-password",
        json={"token": raw_reset_token, "new_password": new_pwd},
        headers={"X-Forwarded-For": "10.0.1.10"},
    )
    assert res.status_code == 200

    # 1. Old session token must now be invalid
    res_me = client.get(
        "/auth/me",
        headers={"Authorization": f"Bearer {old_session_token}"},
    )
    assert res_me.status_code == 401

    # 2. Login with old password must fail
    res_old_login = client.post(
        "/auth/login",
        json={"email": email, "password": old_pwd},
        headers={"X-Forwarded-For": "10.0.1.11"},
    )
    assert res_old_login.status_code == 401

    # 3. Login with new password must succeed
    res_new_login = client.post(
        "/auth/login",
        json={"email": email, "password": new_pwd},
        headers={"X-Forwarded-For": "10.0.1.12"},
    )
    assert res_new_login.status_code == 200
