import hashlib
import hmac
import re
import secrets
from datetime import datetime, timedelta, timezone

from argon2 import PasswordHasher, Type
from argon2.exceptions import InvalidHash, VerifyMismatchError
import jwt

from app.core.config import settings

# Initialize Argon2id password hasher with configured parameters
_argon2_hasher = PasswordHasher(
    time_cost=settings.ARGON2_TIME_COST,
    memory_cost=settings.ARGON2_MEMORY_COST,
    parallelism=settings.ARGON2_PARALLELISM,
    hash_len=32,
    salt_len=16,
    type=Type.ID,
)

# Common breached / weak passwords list for fast offline rejection
COMMON_WEAK_PASSWORDS = {
    "password", "password1", "password123", "123456", "12345678", "123456789",
    "1234567890", "qwerty", "qwerty123", "letmein", "welcome", "admin123",
    "admin", "iloveyou", "monkey", "dragon", "master", "sunshine", "princess",
    "football", "shadow", "superman", "secret", "pass1234", "trustno1",
    "kanggird", "kanggird123", "orchestrator", "aiorchestrator",
}


def hash_password(password: str) -> str:
    """Hash a plaintext password using Argon2id with unique salt."""
    return _argon2_hasher.hash(password)


def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against an Argon2id or legacy hash securely."""
    if not hashed_password or not password:
        return False
    try:
        return _argon2_hasher.verify(hashed_password, password)
    except (VerifyMismatchError, InvalidHash):
        return False
    except Exception:
        return False


def needs_rehash(hashed_password: str) -> bool:
    """Check if the password hash needs updating to newer Argon2id parameters."""
    try:
        return _argon2_hasher.check_needs_rehash(hashed_password)
    except Exception:
        return True


def generate_secure_token(num_bytes: int = 32) -> str:
    """Generate an unpredictable, cryptographically secure opaque token (256-bit default)."""
    return secrets.token_urlsafe(num_bytes)


def hash_token(raw_token: str) -> str:
    """Compute SHA-256 hex digest of a token for secure database lookup."""
    return hashlib.sha256(raw_token.encode("utf-8")).hexdigest()


def compare_digest_secure(val_a: str, val_b: str) -> bool:
    """Timing-attack resistant comparison of two strings."""
    return hmac.compare_digest(val_a.encode("utf-8"), val_b.encode("utf-8"))


def validate_password_strength(
    password: str,
    user_inputs: list[str] | None = None,
) -> tuple[bool, str | None]:
    """
    Validate password strength according to NIST SP 800-63B guidelines.
    - Minimum length: 8 characters (12+ recommended).
    - Maximum length: 128 characters (to mitigate DoS).
    - Checks against common/breached dictionary passwords.
    - Rejects passwords matching user's email, handle, or name.
    - Allows full Unicode, spaces, and passphrases.
    """
    if len(password) < 8:
        return False, "Password must be at least 8 characters long."

    if len(password) > 128:
        return False, "Password must not exceed 128 characters."

    # Check against known breached passwords
    cleaned_lower = password.strip().lower()
    if cleaned_lower in COMMON_WEAK_PASSWORDS:
        return False, "This password is too common and insecure. Please choose a stronger password or passphrase."

    # Check for simple numeric or repetitive sequences
    if re.match(r"^\d+$", password):
        return False, "Password cannot consist entirely of numbers."
    if re.match(r"^(.)\1+$", password):
        return False, "Password cannot consist of a single repeated character."

    # Check for matching user information (email username, full name parts)
    if user_inputs:
        for val in user_inputs:
            if not val or len(val) < 3:
                continue
            normalized_val = val.strip().lower()
            if normalized_val in cleaned_lower:
                return False, "Password must not contain your name or email address."

    return True, None


# Legacy JWT token creation (kept for legacy support or stateless API integrations)
def create_access_token(user_id: str) -> str:
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.jwt_access_token_expire_minutes
    )
    payload = {
        "sub": user_id,
        "exp": expires_at,
    }
    return jwt.encode(
        payload,
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )


def decode_access_token(token: str) -> str:
    payload = jwt.decode(
        token,
        settings.jwt_secret_key,
        algorithms=[settings.jwt_algorithm],
    )
    user_id = payload.get("sub")
    if not user_id:
        raise ValueError("Invalid token")
    return user_id
