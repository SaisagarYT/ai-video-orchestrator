from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


# Register ORM Models
from app.models.user import User
from app.models.project import Project