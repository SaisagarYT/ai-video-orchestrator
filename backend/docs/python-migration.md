# Python to Node.js Backend Migration Audit & Mapping

## 1. Executive Summary

This document establishes the official migration record from the legacy Python/FastAPI backend to the canonical **Node.js 20+ Express.js** architecture for the **AI Video Orchestrator**.

In accordance with architectural directives:
- **No Python code has been deleted.** All 96 legacy Python files remain in the repository as architectural and domain references.
- **Node.js + Express.js** is the single canonical production backend.
- **Supabase PostgreSQL** serves as the durable source of truth.
- **Supabase Auth** handles user identity and JWT validation.
- **AI Provider Abstraction Layer (`src/providers/`)** isolates business logic and workflow engines from external vendor APIs.
- Local development and automated testing require **zero external API keys** and **no Docker**.

---

## 2. Migration Matrix

| Legacy Python Component | Location in Python | Node.js Replacement | Status | Notes |
| :--- | :--- | :--- | :--- | :--- |
| **Strategy Engine** | `app/orchestration/strategy_engine.py`, `app/services/strategy_service.py` | `src/services/strategy/` (`strategy.schema.js`, `strategy.prompts.js`, `strategy.service.js`) | **Migrated & Verified** | Synthesizes marketing strategy using OpenRouter LLM or deterministic fallback with Zod validation. |
| **Creative Concept Engine** | `app/orchestration/concept_engine.py` | `src/services/concept/` (`concept.schema.js`, `concept.prompts.js`, `concept.service.js`) | **Migrated & Verified** | Decomposes strategy into 4 creative archetypes (Rush, Everyday Difference, Precision & Craft, Social Proof). |
| **Storyboard & Bible Engine** | `app/orchestration/storyboard_engine.py`, `app/services/storyboard_service.py` | `src/services/creative-direction/` (`creative-direction.schema.js`, `creative-direction.prompts.js`, `creative-direction.service.js`) | **Migrated & Verified** | Generates Creative Bible (lighting, color palette, audio profile) + timed sequential scenes. |
| **Prompt Compiler** | `app/orchestration/prompt_compiler.py`, `app/services/generation_service.py` | `src/services/prompt/` (`prompt.schema.js`, `prompt.templates.js`, `prompt-compiler.service.js`) | **Migrated & Verified** | Assembles positive and negative generation specifications for video generative models. |
| **Context Ingestion Engine** | `app/orchestration/context_engine.py`, `app/services/context_engine_service.py` | `src/orchestration/stepRunner.js` (`CONTEXT_INGESTION`) | **Migrated & Verified** | Synthesizes brand guidelines, aspect ratios, constraints, and initial strategy directives. |
| **LLM Inference Providers** | `app/providers/text/` (`gemini_provider.py`, `openai_provider.py`, `omniroute_provider.py`) | `src/providers/llm/` (`llm.provider.js`, `openrouter.provider.js`, `mock-llm.provider.js`) | **Migrated & Verified** | Centralized via `ProviderRegistry`. Implements native fetch, timeout abort, error mapping, and token tracking. |
| **Image / Video / Audio Providers** | `app/providers/image/`, `app/providers/video/`, `app/providers/audio/` | `src/providers/` (`video/fal-video.provider.js`, `audio/elevenlabs-audio.provider.js`, `storage/cloudinary.provider.js`), `src/services/media/` | **Migrated & Verified (Slice 4)** | Real Fal.ai video generation with bounded polling, ElevenLabs voiceover synthesis, Cloudinary durable mirroring with SSRF protection, and `provider_jobs`/`assets` ledger. |
| **Queue & Worker Daemon** | `app/workers/` (`job_worker.py`, `render_worker.py`, `worker_daemon.py`), Redis | `src/orchestration/queue.js`, `src/orchestration/engine.js` | **Migrated & Verified** | `MemoryQueueAdapter` enforces concurrency and events; Supabase PostgreSQL stores durable steps; crash recovery implemented. |
| **Data Persistence** | `app/models/` (SQLAlchemy / SQLite) | `src/config/supabase.js`, `supabase/migrations/` | **Migrated & Verified** | Full Supabase schema (`campaigns`, `workflow_executions`, `workflow_steps`, `workflow_events`, `users`, `provider_jobs`, `assets`). |
| **API Transport & Routing** | `app/api/` (FastAPI) | `src/routes/`, `src/controllers/`, `src/app.js` | **Migrated & Verified** | Clean Express routes for Campaigns, Health, Auth, SSE progress streaming, and Generation dispatch. |

---

## 3. Test Coverage & Verification

All automated tests run via `node --test`:
- **76 total tests across 21 suites**
- **100% pass rate**
- **0 external credentials required**

### Test Suite Breakdown:
1. `tests/unit/provider.registry.test.js`: Provider registration, defaults, type querying, error handling.
2. `tests/unit/mock-llm.provider.test.js`: Free-form completions, structured JSON generation, custom response overrides.
3. `tests/unit/openrouter.provider.test.js`: Chat completions, structured output, 401/429/503/timeout error mapping, key sanitization.
4. `tests/unit/fal-video.provider.test.js`: Video creation request payload, bounded status check, 401/429/503/timeout mapping.
5. `tests/unit/elevenlabs-audio.provider.test.js`: Speech synthesis, audio buffer handling, secret key protection, error mapping.
6. `tests/unit/cloudinary.provider.test.js`: SSRF blocking (localhost/private IPs), buffer and remote URL uploads, signature validation.
7. `tests/unit/strategy.service.test.js`: Structured marketing strategy output and fallback synthesis.
8. `tests/unit/concept.service.test.js`: Multi-concept generation and 4 archetype validations.
9. `tests/unit/creative-direction.service.test.js`: Creative Bible rules and timed scene breakdown.
10. `tests/unit/prompt-compiler.service.test.js`: Generation specification compilation for video engines.
11. `tests/unit/scene-generation.service.test.js`: Scene video generation, durable `provider_jobs` tracking, storage mirroring, and idempotency.
12. `tests/unit/narration-generation.service.test.js`: Narration synthesis, `provider_jobs` tracking, `assets` persistence, and idempotency.
13. `tests/unit/queue.test.js`: Queue concurrency, event emission, failure recording.
14. `tests/unit/auth.middleware.test.js`: Bearer token validation and SSE token extraction.
15. `tests/unit/stepRunner.test.js`: Step execution lifecycle, retries, and failure states.
16. `tests/unit/engine.test.js`: Workflow execution lifecycle and idempotency.
17. `tests/integration/campaign.api.test.js`: Campaign CRUD, multi-tenant user isolation, generation dispatch.
18. `tests/integration/sse.test.js`: Server-Sent Events historical replay and live event streaming.
19. `tests/integration/recovery.test.js`: Crash recovery for orphaned workflows on startup.
20. `tests/integration/workflow.intelligence.test.js`: E2E workflow run verifying that all 6 stage artifacts in PostgreSQL contain the migrated intelligence structures.
21. `tests/integration/workflow.media.test.js`: Complete 9-stage E2E pipeline verifying video, audio, and asset provenance in PostgreSQL.

---

## 4. Next Steps (Slice 5)

- Final timeline composition and video stitching (FFmpeg pipeline).
- Subtitle generation and automated burner.
- Lip-sync and audio track mixing.
- Final render export and notification webhooks.
