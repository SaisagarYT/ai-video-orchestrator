# Slice 7: Autonomous Revision Loops & Prompt Self-Healing

## 1. Architectural Overview

Slice 7 transforms the AI Video Orchestrator from a linear pipeline into an autonomous, closed-loop self-healing generation platform.

```
Brand / Marketing Context
        ↓
Strategy & Creative Concepts
        ↓
Storyboard & Scene Plan (Creative Bible)
        ↓
Prompt Compilation
        ↓
Media Generation (Video + Narration)
        ↓
Timeline IR Construction (v1.0)
        ↓
Video Rendering & Mastering
        ↓
Quality Evaluation
        ↓
 ┌───────────────────────┐
 │                       │
PASS                    FAIL
 │                       │
 ↓                       ↓
Deliverable Video   Diagnose Failure (Revision Planner)
                         ↓
                    Select Affected Scene(s) (Selective Targeting)
                         ↓
                    Repair Prompt Specification (Prompt Self-Healing)
                         ↓
                    Regenerate Scene (New Asset + Provenance)
                         ↓
                    Rebuild Timeline IR (v2.0, preserving unaffected assets)
                         ↓
                    Re-render Revised Video
                         ↓
                    Re-evaluate Quality
                         ↓
                    PASS → Deliverable Video
                    FAIL → Attempt 2 (or REVISION_EXHAUSTED / WARNING_ACCEPTED)
```

---

## 2. Core Components

### 2.1 Revision Planner (`RevisionPlanner`)
- **Location**: `backend/src/services/revision/revision.planner.js`
- **Purpose**: Consumes canonical evaluation results (`quality_evaluations`), diagnoses defects across dimensions (`productFidelity`, `brandConsistency`, `visualQuality`), and maps evaluation issues into concrete repair operations.
- **Selective Scene Identification**:
  - Isolates affected scenes by explicit `sceneId` or parses narrative references in descriptions and revision instructions (`Scene 2`, `shot 2`).
  - Fallback logic selectively targets the primary product showcase scene or hook scene when failures are categorical.
  - **Critical Invariant**: Unaffected scenes are preserved! If only Scene 2 has an issue in a 4-scene video, only Scene 2 is regenerated; Scenes 1, 3, and 4 are reused without re-generation.

### 2.2 Prompt Self-Healing Engine (`PromptRepairEngine`)
- **Location**: `backend/src/services/revision/prompt.repair.js`
- **Purpose**: Dynamically adjusts scene prompts and compiler specifications to eliminate defects while strictly preserving:
  - Shot type (e.g. `Close-up`, `Wide`, `Macro`)
  - Scene duration (`duration_seconds`)
  - Target aspect ratio (`9:16`, `16:9`, `1:1`)
  - Camera movement trajectory
  - Creative Bible visual directives and brand identity
- **Structured Operations**:
  - `CORRECT_LIGHTING`: Upgrades dim, shadowy, or low-contrast shots to commercial studio 3-point illumination.
  - `ADD_CONSTRAINT`: Enforces centering, focal depth, and logo visibility.
  - `REMOVE_CONFLICT`: Strips conflicting terms (e.g. `dark`, `dim`, `blurry`, `shadowy`).
  - `ENHANCE_BRANDING`: Injects official brand colors and packaging styling.
  - `STRENGTHEN_DESCRIPTION`: Enhances 8k UHD resolution and crisp texture modifiers.
  - `PRESERVE_IDENTITY`: Reinforces consistent character styling and narrative continuity.
- **Explainability**: Every repaired scene produces an audit explanation detailing what was changed and which rules were applied.

### 2.3 Bounded Revision Policy (`RevisionPolicy`)
- **Location**: `backend/src/services/revision/revision.policy.js`
- **Limits**: `MAX_REVISION_ATTEMPTS = 2`
  - Attempt 1: Initial run $\rightarrow$ Fail
  - Revision 1: Attempt 2 $\rightarrow$ Fail
  - Revision 2: Attempt 3 $\rightarrow$ Pass (Complete) or Fail $\rightarrow$ `REVISION_EXHAUSTED` / `WARNING_ACCEPTED`
- **Guarantees**: Absolutely zero infinite loops.
- **Near-Threshold Acceptance**: When score is close to threshold ($\ge 6.5$) without critical fatal defects, policy allows graceful completion under `WARNING_ACCEPTED`.

### 2.4 Timeline Rebuild & Versioning
- **Location**: `backend/src/services/rendering/render.service.js`
- **Mechanics**:
  - Constructs a new versioned Timeline IR (e.g. `v2.0` for revision 1, `v3.0` for revision 2).
  - Assembles assets: unaffected scenes retain their original asset IDs; target scenes receive the newly regenerated asset IDs.
  - Re-renders with a deterministic revision idempotency key: `${campaignId}:${executionId}:render:rev-${attemptNumber}`.

---

## 3. Database Schema & Provenance Tracking

Migration: `backend/supabase/migrations/004_revision_system.sql`

### `revision_attempts`
| Column | Type | Description |
|---|---|---|
| `id` | `UUID PK` | Unique revision attempt identifier |
| `campaign_id` | `UUID FK` | Associated campaign |
| `workflow_execution_id` | `UUID FK` | Workflow execution |
| `attempt_number` | `INTEGER` | 1 or 2 |
| `evaluation_id` | `UUID FK` | Evaluation that triggered this revision |
| `status` | `TEXT` | `IN_PROGRESS`, `COMPLETED`, `FAILED`, `EXHAUSTED`, `WARNING_ACCEPTED` |
| `diagnostics` | `JSONB` | Root causes and failed dimension scores |
| `affected_scene_ids` | `JSONB` | List of target scene IDs |
| `timeline_id` | `UUID FK` | New timeline version created |
| `final_video_id` | `UUID FK` | New final video rendered |
| `subsequent_evaluation_id` | `UUID FK` | Evaluation of revised deliverable |
| `passed` | `BOOLEAN` | Whether re-evaluation passed |

### `revision_targets`
| Column | Type | Description |
|---|---|---|
| `id` | `UUID PK` | Unique target record identifier |
| `revision_attempt_id` | `UUID FK` | Parent revision attempt |
| `scene_id` | `TEXT` | Identifier of regenerated scene |
| `scene_index` | `INTEGER` | Sequence index |
| `original_prompt` | `TEXT` | Prompt prior to healing |
| `healed_prompt` | `TEXT` | Modified prompt with applied operations |
| `applied_operations` | `JSONB` | Structured operations applied |
| `explanation` | `TEXT` | Human-readable change summary |
| `previous_asset_id` | `UUID FK` | Pre-revision video asset |
| `new_asset_id` | `UUID FK` | Post-revision regenerated video asset |
| `status` | `TEXT` | `PENDING`, `GENERATED`, `FAILED` |

---

## 4. API Endpoints

### `GET /api/campaigns/:id/revisions`
Returns the complete revision history, diagnostics, target scenes, prompt modifications, and asset provenance for a campaign.

**Response Structure (HTTP 200)**:
```json
{
  "success": true,
  "data": {
    "campaignId": "c-12345",
    "totalAttempts": 1,
    "revisions": [
      {
        "id": "att-001",
        "attempt_number": 1,
        "status": "COMPLETED",
        "passed": true,
        "diagnostics": {
          "failedDimensions": ["productFidelity"],
          "overallScore": 6.8,
          "threshold": 7.5
        },
        "affected_scene_ids": ["scene-2"],
        "targets": [
          {
            "scene_id": "scene-2",
            "scene_index": 2,
            "original_prompt": "Can drops onto desk",
            "healed_prompt": "Can drops onto desk, commercial studio lighting, logo centered in sharp focus",
            "explanation": "Self-healed Scene 2 prompt: Enhanced lighting to commercial studio standard; Added framing and product focal constraint",
            "previous_asset_id": "asset-old-123",
            "new_asset_id": "asset-new-456",
            "status": "GENERATED"
          }
        ]
      }
    ]
  }
}
```

---

## 5. Verification & Tests

- **Unit Tests**:
  - `backend/tests/unit/revision.policy.test.js`: Validates attempt bounding (`MAX_REVISION_ATTEMPTS = 2`), idempotency key generation, pass gating.
  - `backend/tests/unit/revision.planner.test.js`: Validates selective scene identification, issue parsing, and defect operation mapping.
  - `backend/tests/unit/prompt.repair.test.js`: Validates deterministic prompt healing, invariant preservation, and conflict removal.
- **Integration Tests**:
  - `backend/tests/integration/workflow.revision.test.js`:
    - Scenario 1: Passing evaluation skips revisions.
    - Scenario 2: Single scene defect $\rightarrow$ selective regeneration $\rightarrow$ timeline v2 $\rightarrow$ re-render $\rightarrow$ re-evaluate $\rightarrow$ pass.
    - Scenario 3: Bounded policy enforcement $\rightarrow$ terminates cleanly with `REVISION_EXHAUSTED` after 2 attempts without infinite loops.
    - Scenario 4: Durable state and crash recovery $\rightarrow$ avoids duplicate scene generation when jobs exist.
  - `backend/tests/integration/revision.api.test.js`: Validates `GET /api/campaigns/:id/revisions` with authentication and tenant isolation.
