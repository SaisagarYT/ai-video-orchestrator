from uuid import UUID

from sqlalchemy.orm import Session

from app.models.project import Project
from app.schemas.project import ProjectCreate, ProjectUpdate


class ProjectRepository:

    def create_project(
        self,
        db: Session,
        user_id: UUID,
        project: ProjectCreate,
    ) -> Project:

        db_project = Project(
            user_id=user_id,
            title=project.title,
            description=project.description,
            objective=project.objective,
        )

        db.add(db_project)
        db.commit()
        db.refresh(db_project)

        return db_project

    def get_project_by_id(
        self,
        db: Session,
        project_id: UUID,
    ) -> Project | None:

        return (
            db.query(Project)
            .filter(Project.id == project_id)
            .first()
        )

    def get_all_projects(
        self,
        db: Session,
    ) -> list[Project]:

        return db.query(Project).all()

    def update_project(
        self,
        db: Session,
        project: Project,
        data: ProjectUpdate,
    ) -> Project:

        update_data = data.model_dump(exclude_unset=True)

        for key, value in update_data.items():
            setattr(project, key, value)

        db.commit()
        db.refresh(project)

        return project

    def delete_project(
        self,
        db: Session,
        project: Project,
    ) -> None:

        db.delete(project)
        db.commit()