import uuid
from datetime import datetime, timezone
from sqlalchemy import select, update
from sqlalchemy.orm import Session

from app.models.session import Session as SessionModel


class SessionRepository:
    def create_session(
        self,
        db: Session,
        user_id: uuid.UUID,
        session_id_hash: str,
        expires_at: datetime,
        ip_address: str | None = None,
        user_agent: str | None = None,
        auth_method: str = "password",
    ) -> SessionModel:
        session = SessionModel(
            session_id_hash=session_id_hash,
            user_id=user_id,
            expires_at=expires_at,
            ip_address=ip_address,
            user_agent=user_agent[:512] if user_agent else None,
            auth_method=auth_method,
            created_at=datetime.now(timezone.utc),
            last_used_at=datetime.now(timezone.utc),
        )
        db.add(session)
        db.commit()
        db.refresh(session)
        return session

    def get_by_hash(self, db: Session, session_id_hash: str) -> SessionModel | None:
        stmt = select(SessionModel).where(SessionModel.session_id_hash == session_id_hash)
        return db.execute(stmt).scalar_one_or_none()

    def get_active_by_hash(self, db: Session, session_id_hash: str) -> SessionModel | None:
        now = datetime.now(timezone.utc)
        stmt = select(SessionModel).where(
            SessionModel.session_id_hash == session_id_hash,
            SessionModel.revoked_at.is_(None),
            SessionModel.expires_at > now,
        )
        return db.execute(stmt).scalar_one_or_none()

    def update_last_used(
        self,
        db: Session,
        session: SessionModel,
        new_expires_at: datetime | None = None,
    ) -> SessionModel:
        session.last_used_at = datetime.now(timezone.utc)
        if new_expires_at:
            session.expires_at = new_expires_at
        db.commit()
        db.refresh(session)
        return session

    def revoke_session(self, db: Session, session: SessionModel) -> SessionModel:
        session.revoked_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(session)
        return session

    def revoke_session_by_id(
        self,
        db: Session,
        session_id: uuid.UUID,
        user_id: uuid.UUID,
    ) -> bool:
        stmt = (
            update(SessionModel)
            .where(
                SessionModel.id == session_id,
                SessionModel.user_id == user_id,
                SessionModel.revoked_at.is_(None),
            )
            .values(revoked_at=datetime.now(timezone.utc))
        )
        result = db.execute(stmt)
        db.commit()
        return result.rowcount > 0

    def revoke_all_user_sessions(
        self,
        db: Session,
        user_id: uuid.UUID,
        except_session_hash: str | None = None,
    ) -> int:
        stmt = (
            update(SessionModel)
            .where(
                SessionModel.user_id == user_id,
                SessionModel.revoked_at.is_(None),
            )
        )
        if except_session_hash:
            stmt = stmt.where(SessionModel.session_id_hash != except_session_hash)

        stmt = stmt.values(revoked_at=datetime.now(timezone.utc))
        result = db.execute(stmt)
        db.commit()
        return result.rowcount

    def get_user_sessions(
        self,
        db: Session,
        user_id: uuid.UUID,
        active_only: bool = True,
    ) -> list[SessionModel]:
        now = datetime.now(timezone.utc)
        stmt = select(SessionModel).where(SessionModel.user_id == user_id)
        if active_only:
            stmt = stmt.where(
                SessionModel.revoked_at.is_(None),
                SessionModel.expires_at > now,
            )
        stmt = stmt.order_by(SessionModel.last_used_at.desc())
        return list(db.execute(stmt).scalars().all())
