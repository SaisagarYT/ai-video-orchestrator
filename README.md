
# AI ADVERTISEMENT ORCHESTRATION PLATFORM

> <i> Many brands, companies, hotels, restorents requires ads to showcase their products and this causes. But making ads became costly because of differnt persons involved in this domain like script writer, audio and video editor, content creater etc. Even generating video using AI also became a headache as AI requires a lot of context and trail and errors to generate the required output. To solve this problem this project plays a major role.</i>

## Basic Work Flow
Nike

↓

Frontend

↓

Backend

↓

Postgres (Save Project)

↓

Redis (Create Video Job)

↓

Worker

↓

MinIO (Store Images)

↓

Video Model

↓

MinIO (Store Final Video)

↓

Postgres (Save Video URL)

↓

Frontend

↓

User Downloads

### Backent Folder Structure
# Backend Project Structure

```text
backend/
│
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── endpoints/
│   │   │   └── router.py
│   │   └── deps.py
│   │
│   ├── core/
│   │   ├── config.py
│   │   ├── logging.py
│   │   └── security.py
│   │
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   └── migrations/
│   │
│   ├── models/
│   │
│   ├── schemas/
│   │
│   ├── repositories/
│   │
│   ├── services/
│   │
│   ├── workers/
│   │
│   ├── utils/
│   │
│   └── main.py
│
├── tests/
│
├── requirements.txt
│
└── README.md
```

## Directory Overview

| Directory/File | Purpose |
|----------------|---------|
| `app/api/` | API routes, versioning, and dependency injection |
| `app/api/v1/endpoints/` | Individual REST API endpoint modules |
| `app/api/v1/router.py` | Combines all v1 API routes |
| `app/api/deps.py` | Shared dependencies (DB session, authentication, etc.) |
| `app/core/` | Application configuration, logging, and security |
| `app/db/` | Database session, base model, and migrations |
| `app/models/` | SQLAlchemy ORM models |
| `app/schemas/` | Pydantic request/response schemas |
| `app/repositories/` | Data access layer (Repository Pattern) |
| `app/services/` | Business logic and application services |
| `app/workers/` | Background jobs and asynchronous workers |
| `app/utils/` | Shared utility functions and helpers |
| `app/main.py` | FastAPI application entry point |
| `tests/` | Unit and integration tests |
| `requirements.txt` | Python dependencies |
| `README.md` | Project documentation |

## FEATURES IMPLMENTATONS
POST   /api/v1/projects

GET    /api/v1/projects

GET    /api/v1/projects/{id}

PUT    /api/v1/projects/{id}

DELETE /api/v1/projects/{id}






