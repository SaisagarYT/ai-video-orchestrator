from typing import Any, Dict, List
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.context_session import ContextSession


class ContextSessionRepository:

    def create_session(
        self,
        db: Session,
        user_id: UUID,
        raw_input_prompt: str,
        business_id: UUID | None = None,
        campaign_id: UUID | None = None,
        extracted_data: Dict[str, Any] | None = None,
        missing_fields: List[str] | None = None,
        clarification_questions: List[Dict[str, Any]] | None = None,
        status: str = "analyzing",
    ) -> ContextSession:
        db_session = ContextSession(
            user_id=user_id,
            business_id=business_id,
            campaign_id=campaign_id,
            raw_input_prompt=raw_input_prompt,
            extracted_data=extracted_data or {},
            missing_fields=missing_fields or [],
            clarification_questions=clarification_questions or [],
            user_answers={},
            complete_context={},
            status=status,
        )

        db.add(db_session)
        db.commit()
        db.refresh(db_session)

        return db_session

    def get_session_by_id(
        self,
        db: Session,
        session_id: UUID,
        user_id: UUID | None = None,
    ) -> ContextSession | None:
        query = db.query(ContextSession).filter(ContextSession.id == session_id)
        if user_id is not None:
            query = query.filter(ContextSession.user_id == user_id)
        return query.first()

    def get_all_sessions_by_user(
        self,
        db: Session,
        user_id: UUID,
    ) -> list[ContextSession]:
        return (
            db.query(ContextSession)
            .filter(ContextSession.user_id == user_id)
            .order_by(ContextSession.created_at.desc())
            .all()
        )

    def update_session(
        self,
        db: Session,
        session: ContextSession,
        **kwargs,
    ) -> ContextSession:
        for key, value in kwargs.items():
            if hasattr(session, key):
                setattr(session, key, value)

        db.commit()
        db.refresh(session)

        return session

    def delete_session(
        self,
        db: Session,
        session: ContextSession,
    ) -> None:
        db.delete(session)
        db.commit()
