# Slice 8: Multimodal Video Understanding & Visual Quality Validation

## 1. Overview & Objective

In Slices 1–7, video evaluation operated on structured planning artifacts: campaign context, Creative Bible rules, scene specifications, and timeline IR. The system could evaluate intent and plan revisions, but lacked eyes on the rendered output.

**Slice 8 introduces the Multimodal Video Understanding layer**. The system inspects representative frames sampled from generated videos and compares what the video generator actually produced against what was requested in the scene specifications and Creative Bible.

```
       EXPECTED VIDEO
  (Scene Spec + Bible + Prompt)
              │
              ▼
        FRAME SAMPLING
    (Deterministic Timestamps)
              │
              ▼
       VISION ANALYSIS
(Vision Provider / Visual Inspection)
              │
              ▼
     STRUCTURED FINDINGS
  (Product, Brand, Scene, Quality)
              │
              ▼
     QUALITY EVALUATION
  (Rule 60% + Vision 40% Blend)
              │
              ▼
       REVISION PLANNER
 (Diagnose Affected Scene & Operations)
              │
              ▼
    SELECTIVE REGENERATION
   (Prompt Repair + New Asset)
```

---

## 2. Architecture & Pipeline

The video understanding domain resides in `src/video-understanding/`:

```
src/video-understanding/
├── types.js                  # Domain constants, enums, TypeScript/JSDoc types
├── schemas.js                # Zod schemas & strict payload validators
├── errors.js                 # Structured AppError hierarchy
├── frameSampler.js           # Deterministic timestamp & offset calculation
├── frameExtractor.js         # FFmpeg frame extraction & mock fallback
├── prompts.js                # VLM system & scene inspection prompts
├── sceneAnalyzer.js          # Single-scene specification vs visual frame analysis
├── visionAnalyzer.js         # Multi-scene aggregation & overall dimension scoring
├── videoUnderstandingService.js # Durable execution, idempotency & Supabase persistence
└── index.js                  # Barrel exports
```

### Logical Workflow Progression

```
FINAL_VIDEO_PERSISTENCE
        ↓
VIDEO_UNDERSTANDING
        ↓
QUALITY_EVALUATION
        ↓
AUTONOMOUS_REVISION
```

1. **FINAL_VIDEO_PERSISTENCE**: Persists rendered MP4 artifact to database and storage.
2. **VIDEO_UNDERSTANDING**:
   - Computes deterministic timestamps via `FrameSampler`.
   - Extracts representative frames via `FrameExtractor` to an isolated temp directory.
   - Dispatches frames and scene specifications to the registered `VisionProvider`.
   - Aggregates scene findings, dimensions, and evidence.
   - Persists `video_understanding_runs` and `video_understanding_scenes` to Supabase.
   - Emits SSE events (`VIDEO_UNDERSTANDING_STARTED`, `VIDEO_FRAMES_EXTRACTED`, `SCENE_VISION_ANALYSIS_STARTED`, `SCENE_VISION_ANALYSIS_COMPLETED`, `VIDEO_UNDERSTANDING_COMPLETED`).
   - Safely cleans up temporary frame files in `finally`.
3. **QUALITY_EVALUATION**: Blends rule-based evaluation (60%) with multimodal visual evidence (40%). Injects vision-detected issues and revision instructions into the unified result.
4. **AUTONOMOUS_REVISION**: If quality fails, Slice 7 Revision Planner isolates affected scenes using vision issue codes and triggers selective self-healing regeneration.

---

## 3. Frame Sampling Strategy (`FrameSampler`)

Rather than decoding entire video streams, `FrameSampler` computes deterministic, equidistant timestamps:

- **Configurable Samples**: Default `DEFAULT_FRAMES_PER_SCENE = 5` (e.g. 0%, 25%, 50%, 75%, 100% of scene duration).
- **Safety Clamps**: Clamps all timestamps to `[0, durationSeconds]`.
- **Edge Case Protection**: Zero or negative duration returns `[0]`. Single-sample requests return midpoint `[duration / 2]`. Duplicate timestamps are deduplicated and strictly ordered.
- **Scene Timeline Offsets**: Computes absolute timeline sampling positions across sequential scenes in rendered composite videos.

---

## 4. Vision Provider Abstraction

Vision analysis is provider-agnostic, integrating into `providerRegistry` under `PROVIDER_TYPES.VISION = 'vision'`.

- **Contract**: `analyzeFrames({ frames, expectedScene, creativeBible, brandContext, options })`
- **Normalized Outputs**: Returns `SceneVisionResult` strictly conforming to `SceneVisionResultSchema`.
- **Error Normalization**: Maps external failures into `ProviderAuthenticationError`, `ProviderRateLimitError`, `ProviderTimeoutError`, and `ProviderResponseError`.
- **Mock Implementation (`MockVisionProvider`)**:
  - `PERFECT`: Clean scene with $\ge 9.2$ scores across all dimensions.
  - `PRODUCT_FIDELITY_FAILURE`: Detects shape/orientation mismatch (e.g. horizontal bottle), generates `PRODUCT_FIDELITY_MISMATCH` with evidence and revision directives.
  - `LIGHTING_MISMATCH`: Detects underexposed, murky lighting contrary to Creative Bible, generates `LIGHTING_MISMATCH`.
  - `BRAND_INCONSISTENCY`: Detects off-brand grading/palette, generates `BRAND_INCONSISTENCY`.
  - `SCENE_INCONSISTENCY`: Detects morphing or spatial discontinuity across frames, generates `SCENE_INCONSISTENCY`.
  - `TIMEOUT`, `AUTH_ERROR`, `RATE_LIMIT`, `MALFORMED_RESPONSE`: Tests failure resilience and recovery.

---

## 5. Visual Quality Dimensions & Evidence Model

Evaluation assesses four core dimensions:

1. **PRODUCT_FIDELITY**:
   - Compares physical appearance against brand context (container shape, packaging, proportions, logo placement, orientation).
   - If no product reference is specified in campaign, defaults gracefully to generic commercial evaluation without fabricating failures.
2. **BRAND_CONSISTENCY**:
   - Assesses color palette, visual styling, typography, and environmental tone against Creative Bible directives.
3. **VISUAL_QUALITY**:
   - Evaluates exposure balance, key/fill lighting, sharpness, 9:16 vertical canvas framing, and visual artifact absence.
4. **SCENE_CONSISTENCY**:
   - Compares early, middle, and late sampled frames for temporal continuity, product geometry stability, and absence of sudden morphing.

### Evidence-Based Finding Structure

Every detected issue includes grounded evidence and actionable revision instructions:

```json
{
  "code": "PRODUCT_FIDELITY_MISMATCH",
  "severity": "major",
  "category": "product",
  "sceneId": "scene-3",
  "frameIds": ["frame-3-2-a1b2c3d4"],
  "evidence": "Reference scene requires the product container to remain upright. In sampled frame at 2.50s, the generated object appears horizontally oriented.",
  "revisionInstructions": [
    "Preserve original product geometry and proportions.",
    "Ensure the product container remains upright and centered in frame."
  ]
}
```

---

## 6. Unified Quality Evaluation Integration

The existing Slice 6 evaluation engine remains the authoritative decision layer. Rather than maintaining a separate quality gate, findings are unified:

- **Score Blending**:
  - Where multimodal visual evidence is present:
    $$\text{Dimension Score} = (\text{Rule Score} \times 0.60) + (\text{Vision Score} \times 0.40)$$
  - Where vision evidence is unavailable or not assessable, rule score is preserved at 100%.
- **Dimension Weights (Slice 6 Preservation)**:
  - Product Fidelity: 40%
  - Brand Consistency: 30%
  - Visual Quality: 30%
- **Issue Injection**: Vision issues are appended to `evaluationResult.issues`, and vision revision instructions are merged into `evaluationResult.revisionInstructions`.
- **Pass / Fail Logic**: Fails if $\text{Overall Score} < \text{Threshold}$ or if any `critical` or `major` defect exists.

---

## 7. Slice 7 Autonomous Revision Integration

When visual inspection triggers a failure, Slice 7 seamlessly takes over:

1. **Selective Scene Diagnosis**: `RevisionPlanner` matches `issue.sceneId` or parses "Scene 3" from visual evidence to isolate the target scene.
2. **Prompt Self-Healing**: `PromptRepairEngine` receives vision issue codes (`PRODUCT_FIDELITY_MISMATCH`, `LIGHTING_MISMATCH`, `SCENE_INCONSISTENCY`) and applies targeted operations (`ADD_CONSTRAINT`, `CORRECT_LIGHTING`, `PRESERVE_IDENTITY`) while preserving shot type, aspect ratio, and narrative invariants.
3. **Selective Scene Regeneration**: Only the defective scene is regenerated; unaffected scene assets are untouched.
4. **Timeline Rebuild & Re-render**: Timeline IR v2.0 is built and rendered.
5. **Multimodal Re-inspection**: The revised final video undergoes vision analysis again. Once verified, evaluation passes and the workflow completes.

---

## 8. Durable State & Database Schema

Defined in `backend/supabase/migrations/005_video_understanding.sql`:

- `video_understanding_runs`: Tracks run ID, campaign ID, execution ID, final video ID, status (`PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`), frame count, scene count, overall confidence, summary, dimensions JSONB, detected issues JSONB, and unique idempotency key.
- `video_understanding_scenes`: Stores scene-level records with per-frame analyses, dimension scores, observations, and detected issues.

### Idempotency & Crash Recovery

- **Deterministic Key**: `vision:${workflowExecutionId}:${finalVideoId}:v1`
- **Replay Protection**: If a video understanding run already exists with `status: 'COMPLETED'`, it is immediately reused without duplicate processing.
- **Crash Recovery**: Orphaned runs resume safely; temporary directories are generated with unique UUIDs and guaranteed cleaned up in `finally` blocks.

---

## 9. Security & Resource Controls

- **No Secrets Leaked**: Vision API keys and service tokens are never logged or exposed in client responses.
- **Path Sanitization**: Local temporary filesystem paths (`/tmp/`, `C:\...`) are sanitized before API serialization.
- **Resource Limits**:
  - `MAX_FRAMES_PER_SCENE = 10`
  - `MAX_TOTAL_FRAMES = 30`
  - `VISION_TIMEOUT_MS = 60000`
  - `MAX_VIDEO_ANALYSIS_DURATION_SECONDS = 180`
- **SSRF & Filesystem Protection**: Video inputs are verified through storage abstractions; arbitrary URL downloads or command interpolations are prohibited.

---

## 10. API Reference

### `GET /api/campaigns/:id/video-understanding`

Retrieves the latest multimodal video understanding run for an authorized campaign.

**Response (200 OK)**:
```json
{
  "success": true,
  "data": {
    "campaignId": "c-123",
    "runId": "run-456",
    "status": "COMPLETED",
    "frameCount": 10,
    "sceneCount": 2,
    "overallConfidence": 0.93,
    "summary": "Visual inspection verified 2 scene(s). All scenes adhere to Creative Bible standards.",
    "dimensions": {
      "productFidelity": { "score": 9.4, "confidence": 0.95, "findings": "..." },
      "brandConsistency": { "score": 9.2, "confidence": 0.90, "findings": "..." },
      "visualQuality": { "score": 9.5, "confidence": 0.95, "findings": "..." },
      "sceneConsistency": { "score": 9.3, "confidence": 0.90, "findings": "..." }
    },
    "detectedIssues": [],
    "scenes": [
      {
        "sceneId": "scene-1",
        "sceneIndex": 1,
        "frameCount": 5,
        "confidence": 0.94,
        "dimensions": { ... },
        "detectedIssues": [],
        "observations": ["Visible product packaging centered at 0.00s"]
      }
    ],
    "createdAt": "2026-10-01T15:00:00.000Z",
    "completedAt": "2026-10-01T15:00:05.000Z"
  }
}
```

---

## 11. Known Limitations

1. **Representative Frame Sampling**: Frame sampling provides high-confidence visual state inspection, but does not perform continuous frame-by-frame temporal computer vision or optical flow tracking.
2. **Vision Model Confidence Variance**: External VLM confidence may fluctuate based on image lighting or complex background clutter.
3. **Subtle Texture Nuances**: Microscopic packaging textures (e.g. holographic foils, micro-embossing) may not be fully resolved in standard 1080x1920 frames.
4. **No Autonomous Provider Switching**: Currently uses the configured or default vision provider; does not dynamically failover across commercial vision marketplaces in this slice.
5. **Visual Only**: Audio track analysis (loudness, voice timing) remains handled by Slice 6 audio mastering; vision layer does not inspect audio waveforms.
