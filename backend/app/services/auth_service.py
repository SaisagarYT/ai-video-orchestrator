import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy.orm import Session

from app.core.audit import log_security_event
from app.core.config import settings
from app.core.security import (
    generate_secure_token,
    hash_password,
    hash_token,
    needs_rehash,
    validate_password_strength,
    verify_password,
)
from app.models.session import Session as SessionModel
from app.models.user import User
from app.repositories.auth_token_repository import AuthTokenRepository
from app.repositories.session_repository import SessionRepository
from app.repositories.user_repository import UserRepository


class AuthService:
    def __init__(self):
        self.user_repo = UserRepository()
        self.session_repo = SessionRepository()
        self.token_repo = AuthTokenRepository()

    def register_user(
        self,
        db: Session,
        full_name: str,
        email: str,
        password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[User, str]:
        normalized_email = email.strip().lower()
        clean_name = full_name.strip()

        # 1. Validate password strength against policy & user info
        is_strong, error_msg = validate_password_strength(
            password=password,
            user_inputs=[clean_name, normalized_email.split("@")[0]],
        )
        if not is_strong:
            raise ValueError(error_msg or "Password does not meet security requirements.")

        # 2. Check existing user
        existing = self.user_repo.get_by_email(db, normalized_email)
        if existing:
            log_security_event(
                event_type="REGISTER_DUPLICATE",
                status="FAILURE",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"email": normalized_email},
                db=db,
            )
            # Generic error to prevent enumeration during signup if configured,
            # or explicit conflict error as standard for registration.
            raise ValueError("An account with this email address already exists.")

        # 3. Hash password using Argon2id
        pwd_hash = hash_password(password)

        # 4. Create User
        user = self.user_repo.create(
            db=db,
            full_name=clean_name,
            email=normalized_email,
            password_hash=pwd_hash,
            role="user",
        )

        # 5. Create initial authenticated session
        raw_session_token = generate_secure_token(32)
        session_hash = hash_token(raw_session_token)
        abs_expiry = datetime.now(timezone.utc) + timedelta(
            days=settings.SESSION_ABSOLUTE_TIMEOUT_DAYS
        )

        self.session_repo.create_session(
            db=db,
            user_id=user.id,
            session_id_hash=session_hash,
            expires_at=abs_expiry,
            ip_address=ip_address,
            user_agent=user_agent,
            auth_method="password",
        )

        # 6. Generate Email Verification Token
        raw_verify_token = generate_secure_token(32)
        verify_token_hash = hash_token(raw_verify_token)
        verify_expiry = datetime.now(timezone.utc) + timedelta(
            hours=settings.VERIFY_TOKEN_EXPIRE_HOURS
        )
        self.token_repo.create_verification_token(
            db=db,
            user_id=user.id,
            token_hash=verify_token_hash,
            expires_at=verify_expiry,
        )

        # 7. Audit log
        log_security_event(
            event_type="REGISTER",
            status="SUCCESS",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"email": normalized_email},
            db=db,
        )

        return user, raw_session_token

    def authenticate_user_and_create_session(
        self,
        db: Session,
        email: str,
        password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> tuple[User, str] | None:
        normalized_email = email.strip().lower()
        user = self.user_repo.get_by_email(db, normalized_email)

        # Constant-time dummy check if user not found to prevent timing enumeration
        dummy_hash = "$argon2id$v=19$m=65536,t=3,p=4$c29tZXNhbHQ$dGVzdGhhc2h2YWx1ZQ"
        target_hash = user.password_hash if user else dummy_hash
        is_valid = verify_password(password, target_hash)

        if not user or not is_valid:
            log_security_event(
                event_type="LOGIN_FAILURE",
                status="FAILURE",
                user_id=user.id if user else None,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"email": normalized_email},
                db=db,
            )
            return None

        if not user.is_active:
            log_security_event(
                event_type="LOGIN_INACTIVE_BLOCKED",
                status="BLOCKED",
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                db=db,
            )
            raise ValueError("This account has been deactivated. Please contact support.")

        # Rehash if Argon2id parameters were upgraded or legacy hash was used
        if needs_rehash(user.password_hash):
            new_hash = hash_password(password)
            self.user_repo.update_password_hash(db, user, new_hash)

        # Generate cryptographically secure session
        raw_session_token = generate_secure_token(32)
        session_hash = hash_token(raw_session_token)
        abs_expiry = datetime.now(timezone.utc) + timedelta(
            days=settings.SESSION_ABSOLUTE_TIMEOUT_DAYS
        )

        self.session_repo.create_session(
            db=db,
            user_id=user.id,
            session_id_hash=session_hash,
            expires_at=abs_expiry,
            ip_address=ip_address,
            user_agent=user_agent,
            auth_method="password",
        )

        log_security_event(
            event_type="LOGIN_SUCCESS",
            status="SUCCESS",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            db=db,
        )

        return user, raw_session_token

    def validate_session_token(
        self,
        db: Session,
        raw_token: str,
    ) -> tuple[User, SessionModel] | None:
        if not raw_token:
            return None

        token_hash = hash_token(raw_token)
        session = self.session_repo.get_active_by_hash(db, token_hash)
        if not session:
            return None

        now = datetime.now(timezone.utc)

        # Check Idle Timeout (e.g. 60 minutes)
        idle_limit = timedelta(minutes=settings.SESSION_IDLE_TIMEOUT_MINUTES)
        last_used = session.last_used_at
        if last_used.tzinfo is None:
            last_used = last_used.replace(tzinfo=timezone.utc)

        if now - last_used > idle_limit:
            # Revoke idle session
            self.session_repo.revoke_session(db, session)
            return None

        # Check user
        user = self.user_repo.get_by_id(db, session.user_id)
        if not user or not user.is_active:
            return None

        # Slide last_used_at
        self.session_repo.update_last_used(db, session)
        return user, session

    def rotate_session(
        self,
        db: Session,
        old_session: SessionModel,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> str:
        """Revoke old session and issue new session token to prevent session fixation."""
        self.session_repo.revoke_session(db, old_session)
        new_token = generate_secure_token(32)
        new_hash = hash_token(new_token)
        abs_expiry = datetime.now(timezone.utc) + timedelta(
            days=settings.SESSION_ABSOLUTE_TIMEOUT_DAYS
        )
        self.session_repo.create_session(
            db=db,
            user_id=old_session.user_id,
            session_id_hash=new_hash,
            expires_at=abs_expiry,
            ip_address=ip_address or old_session.ip_address,
            user_agent=user_agent or old_session.user_agent,
            auth_method=old_session.auth_method,
        )
        return new_token

    def logout_session(
        self,
        db: Session,
        raw_token: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> bool:
        if not raw_token:
            return False
        token_hash = hash_token(raw_token)
        session = self.session_repo.get_by_hash(db, token_hash)
        if session:
            self.session_repo.revoke_session(db, session)
            log_security_event(
                event_type="LOGOUT",
                status="SUCCESS",
                user_id=session.user_id,
                ip_address=ip_address,
                user_agent=user_agent,
                db=db,
            )
            return True
        return False

    def logout_all_sessions(
        self,
        db: Session,
        user_id: uuid.UUID,
        ip_address: str | None = None,
        user_agent: str | None = None,
        except_raw_token: str | None = None,
    ) -> int:
        except_hash = hash_token(except_raw_token) if except_raw_token else None
        count = self.session_repo.revoke_all_user_sessions(
            db=db,
            user_id=user_id,
            except_session_hash=except_hash,
        )
        log_security_event(
            event_type="SESSION_REVOKE_ALL",
            status="SUCCESS",
            user_id=user_id,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"revoked_count": count},
            db=db,
        )
        return count

    def get_user_sessions(
        self,
        db: Session,
        user_id: uuid.UUID,
        current_raw_token: str | None = None,
    ) -> list[dict]:
        current_hash = hash_token(current_raw_token) if current_raw_token else None
        sessions = self.session_repo.get_user_sessions(db, user_id, active_only=True)
        results = []
        for s in sessions:
            results.append({
                "id": s.id,
                "created_at": s.created_at,
                "last_used_at": s.last_used_at,
                "expires_at": s.expires_at,
                "ip_address": s.ip_address,
                "user_agent": s.user_agent,
                "auth_method": s.auth_method,
                "is_current": s.session_id_hash == current_hash,
            })
        return results

    def revoke_session_by_id(
        self,
        db: Session,
        user_id: uuid.UUID,
        session_id: uuid.UUID,
        ip_address: str | None = None,
    ) -> bool:
        revoked = self.session_repo.revoke_session_by_id(db, session_id, user_id)
        if revoked:
            log_security_event(
                event_type="SESSION_REVOKED",
                status="SUCCESS",
                user_id=user_id,
                ip_address=ip_address,
                metadata={"revoked_session_id": str(session_id)},
                db=db,
            )
        return revoked

    def request_password_reset(
        self,
        db: Session,
        email: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> str | None:
        """Create a single-use password reset token (returns token or None, never leaks existence)."""
        normalized_email = email.strip().lower()
        user = self.user_repo.get_by_email(db, normalized_email)

        log_security_event(
            event_type="PASSWORD_RESET_REQUEST",
            status="SUCCESS" if user else "NON_EXISTENT_EMAIL",
            user_id=user.id if user else None,
            ip_address=ip_address,
            user_agent=user_agent,
            metadata={"email": normalized_email},
            db=db,
        )

        if not user or not user.is_active:
            return None

        raw_reset_token = generate_secure_token(32)
        token_hash = hash_token(raw_reset_token)
        expiry = datetime.now(timezone.utc) + timedelta(
            minutes=settings.RESET_TOKEN_EXPIRE_MINUTES
        )

        self.token_repo.create_reset_token(
            db=db,
            user_id=user.id,
            token_hash=token_hash,
            expires_at=expiry,
        )

        return raw_reset_token

    def reset_password(
        self,
        db: Session,
        raw_token: str,
        new_password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> bool:
        token_hash = hash_token(raw_token)
        token_record = self.token_repo.get_valid_reset_token(db, token_hash)
        if not token_record:
            log_security_event(
                event_type="PASSWORD_RESET_FAILURE",
                status="FAILURE",
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"reason": "Invalid or expired token"},
                db=db,
            )
            return False

        user = self.user_repo.get_by_id(db, token_record.user_id)
        if not user or not user.is_active:
            return False

        # Validate password strength
        is_strong, error_msg = validate_password_strength(
            password=new_password,
            user_inputs=[user.full_name, user.email.split("@")[0]],
        )
        if not is_strong:
            raise ValueError(error_msg or "Password does not meet security requirements.")

        # Hash with Argon2id
        new_hash = hash_password(new_password)
        self.user_repo.update_password_hash(db, user, new_hash)

        # Mark token as used (single-use)
        self.token_repo.mark_reset_token_used(db, token_record)

        # Invalidate all active user sessions upon password reset
        self.session_repo.revoke_all_user_sessions(db, user.id)

        log_security_event(
            event_type="PASSWORD_RESET_SUCCESS",
            status="SUCCESS",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            db=db,
        )
        return True

    def change_password(
        self,
        db: Session,
        user: User,
        current_password: str,
        new_password: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
        current_session: SessionModel | None = None,
    ) -> str:
        # Verify current password
        if not verify_password(current_password, user.password_hash):
            log_security_event(
                event_type="PASSWORD_CHANGE_FAILURE",
                status="FAILURE",
                user_id=user.id,
                ip_address=ip_address,
                user_agent=user_agent,
                metadata={"reason": "Current password incorrect"},
                db=db,
            )
            raise ValueError("Current password is incorrect.")

        # Validate new password strength
        is_strong, error_msg = validate_password_strength(
            password=new_password,
            user_inputs=[user.full_name, user.email.split("@")[0]],
        )
        if not is_strong:
            raise ValueError(error_msg or "New password does not meet security requirements.")

        # Hash with Argon2id
        new_hash = hash_password(new_password)
        self.user_repo.update_password_hash(db, user, new_hash)

        # Invalidate all sessions except current, then rotate current session
        current_hash = current_session.session_id_hash if current_session else None
        self.session_repo.revoke_all_user_sessions(db, user.id, except_session_hash=current_hash)

        new_session_token = generate_secure_token(32)
        if current_session:
            self.session_repo.revoke_session(db, current_session)

        new_session_hash = hash_token(new_session_token)
        abs_expiry = datetime.now(timezone.utc) + timedelta(
            days=settings.SESSION_ABSOLUTE_TIMEOUT_DAYS
        )
        self.session_repo.create_session(
            db=db,
            user_id=user.id,
            session_id_hash=new_session_hash,
            expires_at=abs_expiry,
            ip_address=ip_address,
            user_agent=user_agent,
            auth_method="password",
        )

        log_security_event(
            event_type="PASSWORD_CHANGED",
            status="SUCCESS",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            db=db,
        )
        return new_session_token

    def verify_email(
        self,
        db: Session,
        raw_token: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> bool:
        token_hash = hash_token(raw_token)
        token_record = self.token_repo.get_valid_verification_token(db, token_hash)
        if not token_record:
            return False

        user = self.user_repo.get_by_id(db, token_record.user_id)
        if not user or not user.is_active:
            return False

        self.user_repo.mark_email_verified(db, user)
        self.token_repo.mark_verification_token_used(db, token_record)

        log_security_event(
            event_type="EMAIL_VERIFIED",
            status="SUCCESS",
            user_id=user.id,
            ip_address=ip_address,
            user_agent=user_agent,
            db=db,
        )
        return True


# Backward compatibility helpers for any remaining legacy callers
_global_auth_service = AuthService()


def get_user_by_email(db: Session, email: str) -> User | None:
    return _global_auth_service.user_repo.get_by_email(db, email)


def create_user(db: Session, full_name: str, email: str, password: str) -> User:
    user, _ = _global_auth_service.register_user(db, full_name, email, password)
    return user


def authenticate_user(db: Session, email: str, password: str) -> User | None:
    result = _global_auth_service.authenticate_user_and_create_session(db, email, password)
    return result[0] if result else None
