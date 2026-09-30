# Video Rendering Architecture & Engine

## 1. Overview

The rendering subsystem is responsible for translating the **Timeline Intermediate Representation (Timeline IR)** into a single, cohesive advertisement MP4 video, uploading it to durable Cloudinary storage, and persisting the deliverable record with complete provenance.

---

## 2. Architecture & Registry (`RendererRegistry`)

The workflow engine never calls FFmpeg directly. Instead, all rendering occurs through the **Renderer Abstraction**:

```
RenderService
     │
     ▼
RendererRegistry
     ├── MockRenderer   ('mock')   --> Zero external dependencies, offline testing
     └── FFmpegRenderer ('ffmpeg') --> Native child_process invocation with safe argument arrays
```

---

## 3. Mock Renderer (`MockRenderer`)

Used for local development, CI/CD, and test suites:
- Validates the Timeline IR with `validateTimelineIR`.
- Simulates realistic render results without invoking FFmpeg.
- Returns deterministic technical metadata (`1080x1920`, `30fps`, `H.264`, `AAC`).
- Supports simulated failure modes (`simulateFailure: true`) to verify error handling and recovery.

---

## 4. FFmpeg Renderer (`FFmpegRenderer`)

Located at `src/services/rendering/ffmpeg-renderer.js`.

### Security & Safety Rules:
- **No Shell Injection**: Executes via `spawn(this.ffmpegPath, argsArray, { windowsHide: true })`. Never invokes a shell string (`exec("ffmpeg ...")`).
- **SSRF Protection**: Remote asset inputs are validated before download; loopback (`localhost`, `127.0.0.1`, `::1`) and private CIDR ranges are rejected.
- **Resource Limits**: Configurable timeout (`RENDER_TIMEOUT_MS`, default 120,000ms). Processes exceeding the timeout are aborted with `SIGKILL`.
- **Isolated Working Directories**: Each render execution creates a dedicated temporary directory (`os.tmpdir()/render-<uuid>`).
- **Guaranteed Cleanup**: Temporary directories and intermediate clip files are removed in `finally` blocks.

### Video Normalization & Concatenation:
FFmpeg builds a multi-input filter complex that:
1. Scales each clip to the target canvas while maintaining aspect ratio: `scale=1080:1920:force_original_aspect_ratio=decrease`.
2. Pads with black borders if needed to fit the target resolution: `pad=1080:1920:(ow-iw)/2:(oh-ih)/2`.
3. Sets sample aspect ratio `setsar=1` and enforces consistent framerate `fps=30`.
4. Concatenates video streams: `concat=n=<count>:v=1:a=0`.
5. Mixes or concatenates narration audio tracks: `concat=n=<audioCount>:v=0:a=1`.
6. Encodes output using `libx264` (YUV 4:2:0 pixel format) and AAC audio with `+faststart` for web streaming.

---

## 5. Render Service (`RenderService`)

Located at `src/services/rendering/render.service.js`.

### Key Responsibilities:
1. **`buildAndPersistTimeline({ campaignId, executionId, stepId, scenes })`**:
   - Resolves generated assets and scenes.
   - Builds canonical Timeline IR.
   - Persists to the `timelines` table in Supabase PostgreSQL.
   - Emits `TIMELINE_CREATED` workflow event.
2. **`renderTimeline({ campaignId, executionId, stepId, timelineId, rendererName, idempotencyKey })`**:
   - Checks `render_jobs` table for existing completed job with the same idempotency key (`reused: true`).
   - Inserts or updates durable `render_jobs` record (`status: 'PROCESSING'`).
   - Emits `RENDER_JOB_CREATED` and `RENDER_PROCESSING` events.
   - Executes the selected renderer from `rendererRegistry`.
   - Uploads final MP4 to `StorageProvider` (`storageProvider.uploadAsset(...)`).
   - Updates `render_jobs` to `COMPLETED` (or `FAILED` with error message).
   - Emits `RENDER_COMPLETED` (or `RENDER_FAILED`).
3. **`persistFinalVideo({ campaignId, executionId, stepId, timelineId, renderJobId, renderResult, storageAsset })`**:
   - Persists durable final video record into `final_videos` table.
   - Maintains full provenance: `campaign_id`, `workflow_execution_id`, `timeline_id`, `render_job_id`, `storage_asset_id`, `renderer`, `url`, `duration_ms`.
   - Updates campaign status to `COMPLETED`.
   - Emits `FINAL_VIDEO_CREATED`.

---

## 6. Workflow Integration (12 Stages)

The complete orchestrator workflow is now structured as 12 distinct sequential stages:

1. `CONTEXT_INGESTION`: Brand guidelines, product context, constraints.
2. `DIRECTOR`: Strategy analysis, audience targeting, archetype concept selection.
3. `SCREENWRITER`: Scriptwriting, scene breakdown, Creative Bible generation.
4. `CRITIC`: Concept evaluation and creative alignment check.
5. `CINEMATOGRAPHER`: Camera angles, movements, lighting design.
6. `PROMPT_COMPILER`: Positive & negative video generation specifications.
7. `SCENE_VIDEO_GENERATION`: Generative video model dispatch (Fal.ai / Mock).
8. `SCENE_AUDIO_GENERATION`: Neural voiceover synthesis (ElevenLabs / Mock).
9. `ASSET_PERSISTENCE`: Media asset ledger recording with Cloudinary URLs.
10. `TIMELINE_BUILD`: Deterministic Timeline IR construction and validation.
11. `VIDEO_RENDER`: Multi-scene video stitching and narration audio mix.
12. `FINAL_VIDEO_PERSISTENCE`: Final commercial video persistence, provenance, and completion.
