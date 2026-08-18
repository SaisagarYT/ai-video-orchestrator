import uuid
from datetime import datetime, timezone
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.user import User


class UserRepository:
    def get_by_id(self, db: Session, user_id: uuid.UUID) -> User | None:
        return db.get(User, user_id)

    def get_by_email(self, db: Session, email: str) -> User | None:
        normalized = email.strip().lower()
        stmt = select(User).where(User.email == normalized)
        return db.execute(stmt).scalar_one_or_none()

    def create(
        self,
        db: Session,
        full_name: str,
        email: str,
        password_hash: str,
        role: str = "user",
    ) -> User:
        user = User(
            full_name=full_name.strip(),
            email=email.strip().lower(),
            password_hash=password_hash,
            role=role,
            is_active=True,
            security_version=1,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def update_password_hash(self, db: Session, user: User, new_hash: str) -> User:
        user.password_hash = new_hash
        user.security_version += 1
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
        return user

    def mark_email_verified(self, db: Session, user: User) -> User:
        user.email_verified_at = datetime.now(timezone.utc)
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
        return user

    def update_email(self, db: Session, user: User, new_email: str) -> User:
        user.email = new_email.strip().lower()
        user.email_verified_at = None
        user.security_version += 1
        user.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(user)
        return user
