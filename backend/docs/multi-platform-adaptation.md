# Slice 10: Multi-Format & Multi-Platform Adaptation Engine

## 1. Executive Summary

Slice 10 introduces the **Autonomous Multi-Format & Multi-Platform Adaptation Engine** for the AI Video Orchestrator. The engine transforms a single approved, high-performing canonical creative into platform-tailored, broadcast-ready variants across the modern video advertising ecosystem:

- **TikTok** (`9:16` Vertical, 1080×1920)
- **Instagram Reels** (`9:16` Vertical, 1080×1920)
- **YouTube Shorts** (`9:16` Vertical, 1080×1920)
- **YouTube Landscape** (`16:9` In-Stream, 1920×1080)
- **Meta Feed** (`1:1` Square, 1080×1080)

---

## 2. Core Architectural Invariants

1. **Canonical Creative Immutability**:
   The canonical Timeline IR (generated in Slice 5) is strictly immutable. Adaptation generates derived, independent Timeline IR variants (e.g., `1.0-tiktok-v1`, `1.0-youtube_landscape-v1`).
2. **Unified Timeline IR & Renderer Abstraction**:
   No separate timeline format or secondary rendering pipeline is introduced. All adapted variants conform to `TimelineIRSchema` and render via the Slice 5 `RenderService` (Mock & FFmpeg).
3. **Multimodal Safe Zone & Subject Preservation**:
   Aspect reframing leverages focal points extracted from Slice 8 `VideoUnderstandingService` (or center crop fallbacks) ensuring critical subjects and products remain fully visible within platform safe zones.
4. **Platform Compliance & Quality Evaluation**:
   Adapted videos are evaluated through Slice 6/8 `EvaluationService` enriched with `adaptationChecks` (crop safety, subtitle safety, CTA visibility, loudness compliance).
5. **Durable Ledger & Event Provenance**:
   Every adaptation step, plan, validation result, and status transition is recorded in `campaign_adaptations` and published to `workflow_events`.

---

## 3. Platform Profiles & Safe Zones

Each supported platform has a formal `PlatformProfile` registered in `PlatformProfileRegistry`:

| Platform | Aspect Ratio | Resolution | Max Duration | Hook Constraint | Subtitle Safe Zone | CTA Safe Zone |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **TIKTOK** | `9:16` | 1080×1920 | 60s | ≤ 3.0s | `y: 0.65, h: 0.12` | `y: 0.80, h: 0.08` |
| **INSTAGRAM_REELS** | `9:16` | 1080×1920 | 90s | ≤ 3.0s | `y: 0.62, h: 0.12` | `y: 0.78, h: 0.08` |
| **YOUTUBE_SHORTS** | `9:16` | 1080×1920 | 60s | ≤ 3.5s | `y: 0.60, h: 0.14` | `y: 0.76, h: 0.08` |
| **YOUTUBE_LANDSCAPE** | `16:9` | 1920×1080 | 300s | ≤ 5.0s | `y: 0.75, h: 0.12` | `y: 0.82, h: 0.08` |
| **META_FEED** | `1:1` | 1080×1080 | 120s | ≤ 4.0s | `y: 0.70, h: 0.12` | `y: 0.82, h: 0.08` |

All coordinates are normalized `[0.0, 1.0]` bounding boxes (`{ x, y, width, height }`).

---

## 4. Adaptation Pipeline Workflow

```
Canonical Timeline IR (9:16)
         │
         ▼
[AdaptationPlannerService]
  ├── Hook Adaptation: Enforce platform drop-off limit (≤3s)
  ├── Duration Adaptation: Proportional scene scaling
  ├── Subject Focal Point: Inspect Slice 8 vision bounding boxes
  └── Safe Zone Repositioning: Subtitle & CTA offset calculations
         │
         ▼
[TimelineAdaptationTransformer]
  └── Emits new Platform Timeline IR (e.g. 1.0-tiktok-v1)
         │
         ▼
[PlatformConstraintValidator]
  └── Validates aspect, resolution, durations, safe zones
         │
         ▼
[RenderService (Slice 5)]
  └── Produces adapted MP4 video
         │
         ▼
[VideoUnderstandingService (Slice 8)]
  └── Extracts frames & verifies visual fidelity
         │
         ▼
[EvaluationService (Slice 6)]
  └── Runs platform compliance & adaptation checks
         │
   ┌─────┴─────┐
   ▼           ▼
APPROVED    WARNING / REVISION
               └── Bounded Revision Loop
```

---

## 5. API Reference

All adaptation endpoints are mounted under `/api/campaigns/:campaignId/adaptations` and require authenticated Bearer tokens.

### Create Single Adaptation
- **POST** `/api/campaigns/:campaignId/adaptations`
- **Body**: `{ "platform": "TIKTOK", "profileVersion": "v1" }`
- **Response**: `201 Created`

### Bulk Create Adaptations
- **POST** `/api/campaigns/:campaignId/adaptations/bulk`
- **Body**: `{ "platforms": ["TIKTOK", "INSTAGRAM_REELS", "YOUTUBE_LANDSCAPE"] }`
- **Response**: `202 Accepted`

### List Adaptations
- **GET** `/api/campaigns/:campaignId/adaptations`
- **Response**: `200 OK`

### Get Adaptation by ID
- **GET** `/api/campaigns/:campaignId/adaptations/:adaptationId`
- **Response**: `200 OK`

### Render / Execute Adaptation
- **POST** `/api/campaigns/:campaignId/adaptations/:adaptationId/render`
- **Response**: `200 OK`

### Cancel Adaptation
- **POST** `/api/campaigns/:campaignId/adaptations/:adaptationId/cancel`
- **Response**: `200 OK`

### Adaptation Events
- **GET** `/api/campaigns/:campaignId/adaptations/:adaptationId/events`
- **Response**: `200 OK`
