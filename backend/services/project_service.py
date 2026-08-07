from uuid import UUID

from sqlalchemy.orm import Session

from app.models.project import Project
from app.repositories.project_repository import ProjectRepository
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectService:

    def __init__(self):
        self.repository = ProjectRepository()

    def create_project(
        self,
        db: Session,
        user_id: UUID,
        project: ProjectCreate,
    ) -> Project:

        return self.repository.create_project(
            db=db,
            user_id=user_id,
            project=project,
        )

    def get_project(
        self,
        db: Session,
        project_id: UUID,
    ) -> Project:

        project = self.repository.get_project_by_id(
            db=db,
            project_id=project_id,
        )

        if project is None:
            raise ValueError("Project not found")

        return project

    def get_projects(
        self,
        db: Session,
    ) -> list[Project]:

        return self.repository.get_all_projects(db)

    def update_project(
        self,
        db: Session,
        project_id: UUID,
        data: ProjectUpdate,
    ) -> Project:

        project = self.get_project(db, project_id)

        return self.repository.update_project(
            db=db,
            project=project,
            data=data,
        )

    def delete_project(
        self,
        db: Session,
        project_id: UUID,
    ):

        project = self.get_project(db, project_id)

        self.repository.delete_project(
            db=db,
            project=project,
        )