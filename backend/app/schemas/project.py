from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict


class ProjectCreate(BaseModel):
    title: str
    description: str
    objective: str


class ProjectUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    objective: str | None = None
    status: str | None = None


class ProjectResponse(BaseModel):
    id: UUID
    user_id: UUID
    title: str
    description: str
    objective: str
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)