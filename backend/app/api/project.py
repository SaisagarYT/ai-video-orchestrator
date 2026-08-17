from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.project import (
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.project_service import ProjectService

router = APIRouter(
    prefix="/projects",
    tags=["Projects"],
)

service = ProjectService()


@router.post("/", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
):
    """
    Temporary user_id until authentication is implemented.
    """
    user_id = UUID("11111111-1111-1111-1111-111111111111")

    return service.create_project(
        db=db,
        user_id=user_id,
        project=project,
    )


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: UUID,
    db: Session = Depends(get_db),
):
    try:
        return service.get_project(
            db=db,
            project_id=project_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/", response_model=list[ProjectResponse])
def get_projects(
    db: Session = Depends(get_db),
):
    return service.get_projects(db)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
):
    try:
        return service.update_project(
            db=db,
            project_id=project_id,
            data=data,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.delete("/{project_id}")
def delete_project(
    project_id: UUID,
    db: Session = Depends(get_db),
):
    try:
        service.delete_project(
            db=db,
            project_id=project_id,
        )

        return {"message": "Project deleted successfully"}

    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))