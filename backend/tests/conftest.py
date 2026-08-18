import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.main import app
from app.db.session import SessionLocal
from app.models.user import User
from app.models.session import Session as SessionModel
from app.models.business import Business
from app.models.campaign import Campaign
from app.services.auth_service import AuthService

auth_service = AuthService()


@pytest.fixture(scope="function")
def db():
    """Provide a transactional DB session for testing."""
    session: Session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture(scope="function")
def client():
    """Provide a FastAPI TestClient."""
    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture(scope="function")
def create_test_user(db: Session):
    """Factory fixture to create test users with unique emails and Argon2id passwords."""
    created_users = []

    def _creator(email: str, password: str = "CorrectHorseBatteryStaple#2026", full_name: str = "Test User"):
        user, session_token = auth_service.register_user(
            db=db,
            full_name=full_name,
            email=email,
            password=password,
        )
        created_users.append(user.id)
        return user, session_token, password

    yield _creator

    # Teardown created users
    for uid in created_users:
        try:
            u = db.get(User, uid)
            if u:
                db.delete(u)
                db.commit()
        except Exception:
            db.rollback()
