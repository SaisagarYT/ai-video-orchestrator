from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.middleware import CSRFProtectionMiddleware, SecurityHeadersMiddleware
from app.api.auth import router as auth_router
from app.api.business import router as business_router
from app.api.campaign import router as campaign_router
from app.api.context_engine import router as context_router
from app.api.dashboard import router as dashboard_router
from app.api.evaluation import router as evaluation_router
from app.api.generation import router as generation_router
from app.api.project import router as project_router
from app.api.render import router as render_router
from app.api.storyboard import router as storyboard_router
from app.api.strategy import router as strategy_router
from app.api.timeline import router as timeline_router
from app.api.workspace import router as workspace_router

app = FastAPI(
    title="AI Video Orchestrator",
    version="1.0.0",
)

# OWASP Security Headers Middleware
app.add_middleware(SecurityHeadersMiddleware)

# CSRF Origin/Referer Validation Middleware
app.add_middleware(CSRFProtectionMiddleware)

# Strict CORS configuration for credentialed cookie authentication
allowed_origins = list(settings.CORS_ALLOWED_ORIGINS)
if settings.DEBUG:
    for dev_origin in [
        "http://localhost:5173", "http://127.0.0.1:5173",
        "http://localhost:3000", "http://127.0.0.1:3000",
    ]:
        if dev_origin not in allowed_origins:
            allowed_origins.append(dev_origin)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(business_router)
app.include_router(campaign_router)
app.include_router(strategy_router)
app.include_router(storyboard_router)
app.include_router(generation_router)
app.include_router(evaluation_router)
app.include_router(timeline_router)
app.include_router(render_router)
app.include_router(workspace_router)
app.include_router(dashboard_router)
app.include_router(context_router)
app.include_router(project_router)


@app.get("/")
def root():
    return {
        "message": "AI Video Orchestrator API"
    }