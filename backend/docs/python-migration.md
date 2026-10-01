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
| **Timeline Construction & IR** | `app/services/timeline_builder.py` | `src/services/timeline/` (`timeline.schema.js`, `timeline.builder.js`, `timeline.validator.js`, `timeline.types.js`) | **Migrated & Verified (Slice 5)** | Canonical Timeline IR v1.0, deterministic scene ordering, asset matching, audio alignment, Zod validation. |
| **Video Rendering & FFmpeg** | `app/workers/render_worker.py`, FFmpeg scripts | `src/services/rendering/` (`renderer.registry.js`, `mock-renderer.js`, `ffmpeg-renderer.js`, `render.service.js`) | **Migrated & Verified (Slice 5)** | Pluggable renderer abstraction, MockRenderer for offline runs, secure argument-array FFmpegRenderer, Cloudinary persistence, durable `render_jobs` and `final_videos` with full provenance. |
| **Quality Evaluation & QA Gate** | `app/orchestration/evaluation_engine.py`, `app/services/evaluation_service.py` | `src/services/evaluation/` (`evaluation.rules.js`, `evaluation.schema.js`, `evaluation.service.js`, `mock.evaluator.js`) | **Migrated & Verified (Slice 6)** | Product Fidelity (40%), Brand Consistency (30%), Visual Quality (30%) dimensions, deterministic score verification, thresholding, technical checks, and structured revision instructions. |
| **Autonomous Revision & Prompt Self-Healing** | `app/orchestration/revision_engine.py` | `src/services/revision/` (`revision.planner.js`, `prompt.repair.js`, `revision.policy.js`, `revision.service.js`) | **Migrated & Verified (Slice 7)** | Bounded revision loop (MAX_REVISION_ATTEMPTS = 2), selective scene regeneration, prompt self-healing, versioned timeline IR (v2.0), crash recovery. |
| **Multimodal Video Understanding & Vision Inspection** | Vision inspection concepts | `src/video-understanding/` (`frameSampler.js`, `frameExtractor.js`, `sceneAnalyzer.js`, `visionAnalyzer.js`, `videoUnderstandingService.js`) | **Implemented & Verified (Slice 8)** | Representative frame extraction, normalized vision provider abstraction, scene-level visual inspection, product/brand/lighting fidelity, multimodal score integration, Slice 7 revision feed. |
| **Automated Subtitle Generation** | Scene narration scripts | `src/services/subtitles/` (`subtitle.schema.js`, `subtitle.formatter.js`, `subtitle.service.js`) | **Migrated & Verified (Slice 6)** | Canonical Subtitle Document IR, scene-level timing fallback, SRT and WebVTT formatting, storage persistence, and shell injection protection. |
| **Audio Mastering & Normalization** | FFmpeg scripts | `src/services/audio/` (`audio.config.js`, `audio.mastering.service.js`) | **Migrated & Verified (Slice 6)** | EBU R128 loudness normalization (`-16.0 LUFS`, `-1.5 dBTP`), 48kHz stereo normalization, synchronization validation, and durable events. |
| **Data Persistence** | `app/models/` (SQLAlchemy / SQLite) | `src/config/supabase.js`, `supabase/migrations/` | **Migrated & Verified** | Full Supabase schema including `video_understanding_runs` and `video_understanding_scenes`. |
| **API Transport & Routing** | `app/api/` (FastAPI) | `src/routes/`, `src/controllers/`, `src/app.js` | **Migrated & Verified** | Clean Express routes for Campaigns, Health, Auth, SSE progress streaming, Generation dispatch, Evaluation, Revisions, and Video Understanding. |

---

## 3. Test Coverage & Verification

All automated tests run via `node --test`:
- **192 total tests across 54 suites**
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
13. `tests/unit/timeline.schema.test.js`: Canonical Timeline IR schema validation, negative duration, continuity, and trim checks.
14. `tests/unit/timeline.builder.test.js`: Deterministic sequence sorting, asset matching, audio alignment, aspect ratio scaling.
15. `tests/unit/renderer.test.js`: RendererRegistry, MockRenderer deterministic offline render, FFmpeg argument construction and security.
16. `tests/unit/render.service.test.js`: Timeline persistence, durable render jobs, idempotency, StorageProvider upload, and final video provenance.
17. `tests/unit/evaluation.schema.test.js`: Canonical evaluation schema, range validation, weighted score formula check, threshold verdicts.
18. `tests/unit/evaluation.service.test.js`: Rules engine, mock evaluator, score bounds, technical checks, persistence in `quality_evaluations`, and idempotency.
19. `tests/unit/subtitle.service.test.js`: Subtitle cue generation, schema validation, SRT/VTT formatting, storage persistence, and shell injection protection.
20. `tests/unit/audio.mastering.test.js`: Audio mastering configuration, true peak/LUFS validation, FFmpeg filter construction, and event emission.
21. `tests/unit/queue.test.js`: Queue concurrency, event emission, failure recording.
22. `tests/unit/auth.middleware.test.js`: Bearer token validation and SSE token extraction.
23. `tests/unit/stepRunner.test.js`: Step execution lifecycle, retries, and failure states.
24. `tests/unit/engine.test.js`: Workflow execution lifecycle and idempotency.
25. `tests/integration/campaign.api.test.js`: Campaign CRUD, multi-tenant user isolation, generation dispatch.
26. `tests/integration/evaluation.api.test.js`: Campaign evaluation retrieval endpoint, multi-tenant isolation, 404 handling.
27. `tests/integration/sse.test.js`: Server-Sent Events historical replay and live event streaming.
28. `tests/integration/recovery.test.js`: Crash recovery for orphaned workflows on startup.
29. `tests/integration/workflow.intelligence.test.js`: E2E workflow run verifying that all 6 stage artifacts in PostgreSQL contain the migrated intelligence structures.
30. `tests/integration/workflow.media.test.js`: Complete 9-stage E2E pipeline verifying video, audio, and asset provenance in PostgreSQL.
31. `tests/integration/workflow.render.test.js`: Complete 12-stage E2E pipeline verifying full advertisement rendering, timeline, render job, and final video in PostgreSQL.
32. `tests/integration/workflow.evaluation.test.js`: Complete 13-stage E2E pipeline verifying end-to-end evaluation, subtitle asset generation, provenance, and idempotency.
33. `tests/unit/revision.policy.test.js`: Bounded revision policy (MAX_REVISION_ATTEMPTS = 2), near-threshold acceptance, idempotency key generation.
34. `tests/unit/revision.planner.test.js`: Selective scene defect diagnosis, issue mapping, structured repair operations, invariant preservation.
35. `tests/unit/prompt.repair.test.js`: Deterministic prompt self-healing, conflict stripping, lighting upgrade, brand alignment.
36. `tests/integration/workflow.revision.test.js`: End-to-end autonomous revision loops, selective scene regeneration, timeline v2 rebuild, bounded exhaustion termination, crash recovery.
37. `tests/integration/revision.api.test.js`: Campaign revision history retrieval, tenant security, provenance tracking.
38. `tests/unit/frameSampler.test.js`: Deterministic equidistant timestamp sampling, bounds clamping, multi-scene timeline offset planning.
39. `tests/unit/frameExtractor.test.js`: Isolated temp directory management, FFmpeg frame extraction, synthetic fallback, and clean directory teardown.
40. `tests/unit/mock-vision.provider.test.js`: Deterministic scenario simulation (PERFECT, PRODUCT_FIDELITY_FAILURE, LIGHTING_MISMATCH, BRAND_INCONSISTENCY, SCENE_INCONSISTENCY), error normalization.
41. `tests/unit/visionAnalyzer.test.js`: Multi-scene frame grouping, dimensional score aggregation, cross-scene issue synthesis.
42. `tests/integration/video-understanding.service.test.js`: End-to-end video understanding pipeline, durable runs and scenes in Supabase, idempotency caching.
43. `tests/integration/multimodal.evaluation.test.js`: Unified 60% rule / 40% vision score blending, issue injection, and multimodal validation flag.
44. `tests/integration/vision.revision.test.js`: Full closed-loop vision failure diagnosis, prompt repair, selective regeneration, timeline rebuild, and re-evaluation pass.
45. `tests/integration/video-understanding.api.test.js`: Authenticated API endpoint GET /api/campaigns/:id/video-understanding, multi-tenant isolation, sanitized payload.

---

## 4. Pending Migration & Non-Migrated Components

The following components remain in the legacy Python codebase and have **NOT** been decommissioned or deleted:
- **Social Media Publishing Integrations**: TikTok API, Meta Ads, Instagram publishing, YouTube Shorts export.
- **ROAS & Performance Analytics**: Conversion tracking, cost-per-acquisition analytics.
- **Legacy Python files**: All 96 `.py` files remain untouched in `backend/app/` as architectural reference.

---

## 5. Next Steps

- Social media publishing integrations and external ad network deployment.
- Webhook dispatch and delivery tracking for platform publishing.
- Performance metric telemetry.

