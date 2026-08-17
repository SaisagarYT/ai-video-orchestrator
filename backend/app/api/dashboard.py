from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user
from app.db.session import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardOverviewResponse
from app.services.workspace_service import WorkspaceService

router = APIRouter(
    tags=["Dashboard & Creator Analytics"],
)

service = WorkspaceService()


@router.get(
    "/dashboard/overview",
    response_model=DashboardOverviewResponse,
)
def get_dashboard_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return service.get_dashboard_overview(
        db=db,
        user_id=current_user.id,
    )
