from fastapi import FastAPI

from app.api.project import router as project_router

app = FastAPI(
    title="AI Video Orchestrator",
    version="1.0.0",
)

app.include_router(project_router)


@app.get("/")
def root():
    return {
        "message": "AI Video Orchestrator API"
    }