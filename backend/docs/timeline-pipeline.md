# Timeline Construction & Intermediate Representation (Timeline IR)

## 1. Overview

The Timeline subsystem converts disparate scene-level assets (video clips, narration audio tracks, shot definitions) into a canonical, deterministic, and provider-independent **Timeline Intermediate Representation (Timeline IR)**.

This IR acts as the contract between the creative orchestration pipeline and the video rendering engines (FFmpeg, MockRenderer, or future cloud rendering services).

---

## 2. Timeline IR Specification (v1.0)

The canonical representation conforms strictly to `TimelineIRSchema` (validated with Zod):

```json
{
  "version": "1.0",
  "campaignId": "4a15ef05-88f2-4bc7-b844-3c66f9175ec9",
  "workflowExecutionId": "73d42e2b-ec1d-4076-a4c3-10e9fca2c231",
  "output": {
    "width": 1080,
    "height": 1920,
    "aspectRatio": "9:16",
    "fps": 30,
    "format": "mp4",
    "videoCodec": "h264",
    "audioCodec": "aac"
  },
  "durationMs": 15000,
  "tracks": [
    {
      "type": "video",
      "items": [
        {
          "id": "item-v-1",
          "sceneId": "scene-1",
          "assetId": "ast-v-1",
          "sourceUrl": "https://res.cloudinary.com/cloud/video/upload/scene1.mp4",
          "startMs": 0,
          "durationMs": 5000,
          "trimStartMs": 0,
          "trimEndMs": 0,
          "sequenceNumber": 1,
          "transitionIn": { "type": "cut", "durationMs": 0 },
          "transitionOut": { "type": "cut", "durationMs": 0 },
          "metadata": {
            "shotType": "Wide Hook Shot",
            "cameraMovement": "Dynamic Zoom-in"
          }
        },
        {
          "id": "item-v-2",
          "sceneId": "scene-2",
          "assetId": "ast-v-2",
          "sourceUrl": "https://res.cloudinary.com/cloud/video/upload/scene2.mp4",
          "startMs": 5000,
          "durationMs": 5000,
          "trimStartMs": 0,
          "trimEndMs": 0,
          "sequenceNumber": 2
        }
      ]
    },
    {
      "type": "audio",
      "items": [
        {
          "id": "item-a-1",
          "sceneId": "scene-1",
          "assetId": "ast-a-1",
          "sourceUrl": "https://res.cloudinary.com/cloud/video/upload/narration1.mp3",
          "startMs": 0,
          "durationMs": 4500,
          "volume": 1.0,
          "sequenceNumber": 1
        }
      ]
    }
  ],
  "metadata": {
    "totalScenes": 2,
    "hasAudio": true,
    "builtAt": "2026-09-30T14:30:00.000Z"
  }
}
```

---

## 3. Timeline Builder (`TimelineBuilder`)

Located at `src/services/timeline/timeline.builder.js`.

### Construction Algorithm:
1. **Deterministic Ordering**: Sorts scenes by `sequence_number` ascending (or `sceneIndex`).
2. **Asset Resolution**:
   - For each scene, resolves its persisted video asset from the `assets` table.
   - Resolves the corresponding narration audio track from `assets`.
   - Computes sequential `startMs` (scene 1 starts at 0ms, scene 2 starts at scene 1 duration, etc.).
3. **Narration Audio Alignment**:
   - Aligns narration audio to start at the exact `startMs` of its owning scene.
   - Caps narration duration if it exceeds the scene duration.
4. **Output Canvas Normalization**:
   - Computes resolution based on campaign aspect ratio (`9:16` -> 1080x1920, `16:9` -> 1920x1080, `1:1` -> 1080x1080).
5. **Validation**: Passes the resulting object through `validateTimelineIR` before serialization.

---

## 4. Invariant Validation (`timeline.validator.js`)

Enforces critical constraints before passing to any renderer:
- **Zod Schema**: Strict type checks, UUID formats, positive integers.
- **Continuity Invariant**: Video items must form a continuous track without gaps or unplanned overlaps (`item[i].startMs === item[i-1].startMs + item[i-1].durationMs`).
- **Trim Boundaries**: Trim ranges must be strictly smaller than the item duration (`trimStartMs + trimEndMs < durationMs`).
- **No Duplicate Scenes**: Each scene ID may only be referenced once in the video track.
- **Duration Agreement**: `timeline.durationMs` must equal the exact cumulative duration of the video track items.
