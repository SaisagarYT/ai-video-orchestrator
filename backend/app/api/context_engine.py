from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.context_engine import (
    ContextAnalyzeRequest,
    ContextSessionResponse,
    SubmitAnswersRequest,
)
from app.services.context_engine_service import ContextEngineService

router = APIRouter(
    prefix="/context",
    tags=["Context Engine & Clarification"],
)

service = ContextEngineService()


@router.post(
    "/analyze",
    response_model=ContextSessionResponse,
    status_code=status.HTTP_201_CREATED,
)
def analyze_context_prompt(
    request: ContextAnalyzeRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.analyze_natural_language_prompt(
            db=db,
            user_id=current_user.id,
            request=request,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )


@router.post(
    "/{session_id}/answer",
    response_model=ContextSessionResponse,
    status_code=status.HTTP_200_OK,
)
def submit_clarification_answers(
    session_id: UUID,
    request: SubmitAnswersRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.submit_clarification_answers(
            db=db,
            session_id=session_id,
            user_id=current_user.id,
            request=request,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/{session_id}",
    response_model=ContextSessionResponse,
)
def get_context_session(
    session_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_session(
            db=db,
            session_id=session_id,
            user_id=current_user.id,
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get(
    "/",
    response_model=list[ContextSessionResponse],
)
def list_context_sessions(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.repository.get_all_sessions_by_user(
        db=db,
        user_id=current_user.id,
    )
