import uuid
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.dependencies import (
    get_current_user,
    get_raw_session_token,
)
from app.core.rate_limit import enforce_rate_limit, get_client_ip
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    ChangeEmailRequest,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    LoginRequest,
    MessageResponse,
    RegisterRequest,
    ResetPasswordRequest,
    SessionResponse,
    UserResponse,
    VerifyEmailRequest,
)
from app.services.auth_service import AuthService

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)

auth_service = AuthService()


def set_session_cookie(response: Response, raw_token: str):
    """Attach secure HttpOnly session cookie to response."""
    response.set_cookie(
        key=settings.SESSION_COOKIE_NAME,
        value=raw_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        path="/",
        max_age=settings.SESSION_ABSOLUTE_TIMEOUT_DAYS * 86400,
        domain=settings.COOKIE_DOMAIN,
    )


def clear_session_cookie(response: Response):
    """Delete session cookie from browser."""
    response.delete_cookie(
        key=settings.SESSION_COOKIE_NAME,
        path="/",
        domain=settings.COOKIE_DOMAIN,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
    )


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request_data: RegisterRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    # Enforce Rate Limiting on registration
    enforce_rate_limit(
        request=request,
        action="register",
        max_requests=settings.RATE_LIMIT_REGISTER_PER_MINUTE,
        identifier=request_data.email,
    )

    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    try:
        user, session_token = auth_service.register_user(
            db=db,
            full_name=request_data.full_name,
            email=request_data.email,
            password=request_data.password,
            ip_address=ip,
            user_agent=ua,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    # Issue session cookie automatically upon successful registration
    set_session_cookie(response, session_token)
    return user


@router.post(
    "/login",
    response_model=UserResponse,
)
def login(
    request_data: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    # Enforce Rate Limiting on login
    enforce_rate_limit(
        request=request,
        action="login",
        max_requests=settings.RATE_LIMIT_LOGIN_PER_MINUTE,
        identifier=request_data.email,
    )

    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    try:
        result = auth_service.authenticate_user_and_create_session(
            db=db,
            email=request_data.email,
            password=request_data.password,
            ip_address=ip,
            user_agent=ua,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(exc),
        )

    if not result:
        # Uniform response to mitigate account enumeration
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    user, session_token = result
    set_session_cookie(response, session_token)
    return user


@router.post(
    "/logout",
    response_model=MessageResponse,
)
def logout(
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    raw_token = get_raw_session_token(request)
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    if raw_token:
        auth_service.logout_session(
            db=db,
            raw_token=raw_token,
            ip_address=ip,
            user_agent=ua,
        )

    clear_session_cookie(response)
    return MessageResponse(message="Successfully logged out.")


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.post(
    "/verify-email",
    response_model=MessageResponse,
)
def verify_email(
    request_data: VerifyEmailRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")
    success = auth_service.verify_email(
        db=db,
        raw_token=request_data.token,
        ip_address=ip,
        user_agent=ua,
    )
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token.",
        )
    return MessageResponse(message="Email address verified successfully.")


@router.post(
    "/forgot-password",
    response_model=MessageResponse,
)
def forgot_password(
    request_data: ForgotPasswordRequest,
    request: Request,
    db: Session = Depends(get_db),
):
    enforce_rate_limit(
        request=request,
        action="forgot_password",
        max_requests=settings.RATE_LIMIT_RESET_PER_MINUTE,
        identifier=request_data.email,
    )
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    auth_service.request_password_reset(
        db=db,
        email=request_data.email,
        ip_address=ip,
        user_agent=ua,
    )

    # Constant non-enumerating message
    return MessageResponse(
        message="If an account exists with that email address, password reset instructions have been sent."
    )


@router.post(
    "/reset-password",
    response_model=MessageResponse,
)
def reset_password(
    request_data: ResetPasswordRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db),
):
    enforce_rate_limit(
        request=request,
        action="reset_password",
        max_requests=settings.RATE_LIMIT_RESET_PER_MINUTE,
    )
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    try:
        success = auth_service.reset_password(
            db=db,
            raw_token=request_data.token,
            new_password=request_data.new_password,
            ip_address=ip,
            user_agent=ua,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired password reset token.",
        )

    clear_session_cookie(response)
    return MessageResponse(message="Password reset successfully. Please log in with your new password.")


@router.post(
    "/change-password",
    response_model=MessageResponse,
)
def change_password(
    request_data: ChangePasswordRequest,
    request: Request,
    response: Response,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")
    current_session = getattr(request.state, "session", None)

    try:
        new_session_token = auth_service.change_password(
            db=db,
            user=current_user,
            current_password=request_data.current_password,
            new_password=request_data.new_password,
            ip_address=ip,
            user_agent=ua,
            current_session=current_session,
        )
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        )

    # Set rotated session cookie
    set_session_cookie(response, new_session_token)
    return MessageResponse(message="Password changed successfully.")


@router.post(
    "/change-email",
    response_model=MessageResponse,
)
def change_email(
    request_data: ChangeEmailRequest,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    from app.core.security import verify_password
    if not verify_password(request_data.current_password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    # Check if target email is already taken
    existing = auth_service.user_repo.get_by_email(db, request_data.new_email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already in use.",
        )

    auth_service.user_repo.update_email(db, current_user, request_data.new_email)
    return MessageResponse(message="Email address updated. Please verify your new email address.")


@router.get(
    "/sessions",
    response_model=list[SessionResponse],
)
def get_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raw_token = get_raw_session_token(request)
    sessions = auth_service.get_user_sessions(
        db=db,
        user_id=current_user.id,
        current_raw_token=raw_token,
    )
    return sessions


@router.delete(
    "/sessions/{session_id}",
    response_model=MessageResponse,
)
def revoke_session(
    session_id: uuid.UUID,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    ip = get_client_ip(request)
    revoked = auth_service.revoke_session_by_id(
        db=db,
        user_id=current_user.id,
        session_id=session_id,
        ip_address=ip,
    )
    if not revoked:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found or already revoked.",
        )
    return MessageResponse(message="Session revoked successfully.")


@router.post(
    "/sessions/revoke-all",
    response_model=MessageResponse,
)
def revoke_all_sessions(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    raw_token = get_raw_session_token(request)
    ip = get_client_ip(request)
    ua = request.headers.get("user-agent")

    count = auth_service.logout_all_sessions(
        db=db,
        user_id=current_user.id,
        ip_address=ip,
        user_agent=ua,
        except_raw_token=raw_token,
    )
    return MessageResponse(message=f"Revoked {count} other active session(s).")
