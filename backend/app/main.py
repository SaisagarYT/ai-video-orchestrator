from fastapi import FastAPI

from app.api.auth import router as auth_router
from app.api.business import router as business_router
from app.api.campaign import router as campaign_router
from app.api.context_engine import router as context_router
from app.api.generation import router as generation_router
from app.api.project import router as project_router
from app.api.storyboard import router as storyboard_router
from app.api.strategy import router as strategy_router

app = FastAPI(
    title="AI Video Orchestrator",
    version="1.0.0",
)

app.include_router(auth_router)
app.include_router(business_router)
app.include_router(campaign_router)
app.include_router(strategy_router)
app.include_router(storyboard_router)
app.include_router(generation_router)
app.include_router(context_router)
app.include_router(project_router)


@app.get("/")
def root():
    return {
        "message": "AI Video Orchestrator API"
    }