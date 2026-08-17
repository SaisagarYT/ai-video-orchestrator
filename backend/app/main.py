from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.business import router as business_router
from app.api.campaign import router as campaign_router
from app.api.project import router as project_router

app = FastAPI(
    title="AI Video Orchestrator",
    version="1.0.0",
)

app.include_router(auth_router)
app.include_router(business_router)
app.include_router(campaign_router)
app.include_router(project_router)


@app.get("/")
def root():
    return {
        "message": "AI Video Orchestrator API"
    }