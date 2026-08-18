import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.email_verification import EmailVerificationToken
from app.models.password_reset import PasswordResetToken


class AuthTokenRepository:
    # Email Verification Tokens
    def create_verification_token(
        self,
        db: Session,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> EmailVerificationToken:
        token_record = EmailVerificationToken(
            token_hash=token_hash,
            user_id=user_id,
            expires_at=expires_at,
            created_at=datetime.now(timezone.utc),
        )
        db.add(token_record)
        db.commit()
        db.refresh(token_record)
        return token_record

    def get_valid_verification_token(
        self,
        db: Session,
        token_hash: str,
    ) -> EmailVerificationToken | None:
        now = datetime.now(timezone.utc)
        stmt = select(EmailVerificationToken).where(
            EmailVerificationToken.token_hash == token_hash,
            EmailVerificationToken.used_at.is_(None),
            EmailVerificationToken.expires_at > now,
        )
        return db.execute(stmt).scalar_one_or_none()

    def mark_verification_token_used(
        self,
        db: Session,
        token_record: EmailVerificationToken,
    ):
        token_record.used_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(token_record)

    # Password Reset Tokens
    def create_reset_token(
        self,
        db: Session,
        user_id: uuid.UUID,
        token_hash: str,
        expires_at: datetime,
    ) -> PasswordResetToken:
        token_record = PasswordResetToken(
            token_hash=token_hash,
            user_id=user_id,
            expires_at=expires_at,
            created_at=datetime.now(timezone.utc),
        )
        db.add(token_record)
        db.commit()
        db.refresh(token_record)
        return token_record

    def get_valid_reset_token(
        self,
        db: Session,
        token_hash: str,
    ) -> PasswordResetToken | None:
        now = datetime.now(timezone.utc)
        stmt = select(PasswordResetToken).where(
            PasswordResetToken.token_hash == token_hash,
            PasswordResetToken.used_at.is_(None),
            PasswordResetToken.expires_at > now,
        )
        return db.execute(stmt).scalar_one_or_none()

    def mark_reset_token_used(
        self,
        db: Session,
        token_record: PasswordResetToken,
    ):
        token_record.used_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(token_record)
