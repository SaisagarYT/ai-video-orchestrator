# Slice 4: Real Media Providers & Scene Generation Pipeline

## 1. Overview & Architecture

Slice 4 establishes the **Real Media Generation and Asset Pipeline** for the AI Video Orchestrator. It connects the creative intelligence developed in Slice 3 (Strategy, Concept, Creative Bible, Timed Storyboard, and Prompt Compiler) to production AI media providers and a durable media asset ledger.

```
                    ┌────────────────────────────────────────────────────────┐
                    │            Orchestration Workflow Engine               │
                    └──────────────────────────┬─────────────────────────────┘
                                               │
             ┌─────────────────────────────────┼────────────────────────────────┐
             │                                 │                                │
             ▼                                 ▼                                ▼
┌─────────────────────────┐       ┌─────────────────────────┐       ┌─────────────────────────┐
│ SceneGenerationService  │       │NarrationGenerationServ. │       │      AssetService       │
└────────────┬────────────┘       └────────────┬────────────┘       └────────────┬────────────┘
             │                                 │                                 │
             ▼                                 ▼                                 │
┌─────────────────────────┐       ┌─────────────────────────┐                    │
│   VideoProvider (Fal)   │       │ AudioProvider(11Labs)   │                    │
└────────────┬────────────┘       └────────────┬────────────┘                    │
             │                                 │                                 │
             └────────────────┬────────────────┘                                 │
                              ▼                                                  │
                 ┌─────────────────────────┐                                     │
                 │ StorageProvider (Cloud) │─────────────────────────────────────┘
                 └────────────┬────────────┘
                              │
                              ▼
            PostgreSQL: provider_jobs & assets
```

---

## 2. Core Components

### A. Provider Implementations

1. **Fal.ai Video Provider (`src/providers/video/fal-video.provider.js`)**
   - Submits text-to-video / image-to-video inference jobs to `queue.fal.run`.
   - Returns asynchronous job tokens (`status: QUEUED` / `PROCESSING`).
   - Implements bounded polling with configurable intervals and timeout aborts.
   - Comprehensive error mapping (`ProviderAuthenticationError`, `ProviderRateLimitError`, `ProviderUnavailableError`, `ProviderTimeoutError`).
   - Secret key sanitization: API keys are masked and never exposed in logs or client-facing errors.

2. **ElevenLabs Audio Provider (`src/providers/audio/elevenlabs-audio.provider.js`)**
   - Synthesizes studio-grade voiceover narration from storyboard scene text.
   - Streams/buffers raw binary MP3 audio data.
   - Estimates speech duration and tracks synthesis latency.
   - Strict input validation preventing blank text requests.

3. **Cloudinary Storage Provider (`src/providers/storage/cloudinary.provider.js`)**
   - Mirrors generated video and audio assets from ephemeral provider URLs into permanent, CDN-backed durable storage.
   - **SSRF Protection**: Validates and blocks private/local IP targets (`127.0.0.1`, `localhost`, `169.254.169.254`, `10.0.0.0/8`, `192.168.0.0/16`).
   - Supports both Buffer uploads and remote URL streaming uploads with cryptographic signature verification.

### B. Media Services

1. **`SceneGenerationService` (`src/services/media/scene-generation.service.js`)**
   - Coordinates scene video clip generation across storyboard scenes.
   - Integrates with `promptCompilerService` to inject compiled positive prompts, camera movements, and lighting parameters.
   - Idempotency via unique idempotency keys (`video:<executionId>:<sceneId>:<sequence>`).
   - Bounded polling loop with configurable poll intervals.
   - Mirrors resulting video into `StorageProvider` and records durable asset record.

2. **`NarrationGenerationService` (`src/services/media/narration-generation.service.js`)**
   - Synthesizes voiceover narration for each scene.
   - Tracks audio jobs in `provider_jobs` and persists speech assets in `assets`.
   - Idempotency support to avoid costly re-generation.

3. **`AssetService` (`src/services/media/asset.service.js`)**
   - Authoritative ledger for all media assets (`assets` table).
   - Provenance tracking: links every video and audio asset back to its originating campaign, workflow execution, workflow step, scene ID, and generation metadata.

---

## 3. Database Schema: Jobs & Provenance

### `provider_jobs`
Tracks external asynchronous provider tasks:
- `id` (UUID, Primary Key)
- `workflow_execution_id` (UUID, Foreign Key)
- `workflow_step_id` (UUID, Foreign Key)
- `campaign_id` (UUID, Foreign Key)
- `scene_id` (TEXT)
- `provider` (TEXT - e.g. `fal`, `mock-video`, `elevenlabs`)
- `provider_job_id` (TEXT)
- `media_type` (TEXT - `video`, `audio`)
- `status` (`QUEUED`, `PROCESSING`, `COMPLETED`, `FAILED`)
- `idempotency_key` (TEXT, Unique)
- `error_message` (TEXT)
- `metadata` (JSONB)

### `assets`
Durable media ledger with full provenance:
- `id` (UUID, Primary Key)
- `campaign_id` (UUID, Foreign Key)
- `workflow_execution_id` (UUID, Foreign Key)
- `workflow_step_id` (UUID, Foreign Key)
- `scene_id` (TEXT)
- `asset_type` (TEXT - `video`, `audio`, `image`)
- `provider` (TEXT)
- `provider_asset_id` (TEXT)
- `storage_provider` (TEXT - e.g. `cloudinary`, `mock-storage`)
- `storage_asset_id` (TEXT)
- `url` (TEXT)
- `secure_url` (TEXT)
- `duration_ms` (INTEGER)
- `width` / `height` (INTEGER)
- `metadata` (JSONB)

---

## 4. Workflow Orchestration Integration

The workflow execution pipeline now features the full 9 sequential stages:
1. `CONTEXT_INGESTION`: Brand guidelines, constraints, and marketing angle.
2. `DIRECTOR`: Strategic concepts and narrative angles.
3. `SCREENWRITER`: Sequential storyboard scenes and Creative Bible.
4. `CRITIC`: Quality and compliance validation.
5. `CINEMATOGRAPHER`: Camera angles, lighting, and movement specs.
6. `PROMPT_COMPILER`: Compilation into engine-specific prompt specifications.
7. `SCENE_VIDEO_GENERATION`: Asynchronous video generation with bounded polling and storage mirroring.
8. `SCENE_AUDIO_GENERATION`: Voiceover audio narration synthesis and storage mirroring.
9. `ASSET_PERSISTENCE`: Provenance verification and campaign asset finalization.

---

## 5. Offline Mock Mode & Test Coverage

All media providers implement deterministic mock modes allowing 100% test coverage without external API keys or Docker:
- Total backend test suites: **21 suites**
- Total automated tests: **76 tests**
- Pass rate: **100% (76 pass, 0 fail)**
