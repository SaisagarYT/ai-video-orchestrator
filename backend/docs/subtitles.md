# Automated Subtitle Generation Architecture (Slice 6)

## 1. Overview
The Subtitle Service transforms scene narration text into synchronized subtitle cues, formats them into standard SubRip (SRT) and WebVTT formats, and persists the subtitle deliverable as a durable asset in Supabase with full provenance.

---

## 2. Canonical Subtitle Data Model
The internal subtitle representation is provider-independent:

```json
{
  "version": "1.0",
  "language": "en",
  "cues": [
    {
      "startMs": 0,
      "endMs": 2800,
      "text": "Discover Apex Surge today."
    },
    {
      "startMs": 2800,
      "endMs": 5800,
      "text": "Zero sugar, pure focus."
    }
  ]
}
```

### Zod Validation Rules:
- `language`: Valid ISO language code (default `'en'`).
- `cues`: Non-empty array of cues.
- `startMs`: Non-negative integer.
- `endMs`: Greater than `startMs`.
- Strict chronological ordering: $C_{i}.\text{startMs} \ge C_{i-1}.\text{startMs}$.
- Cues must not exceed total timeline duration $+ 2000\text{ms}$ buffer.

---

## 3. Subtitle Sources & Timing Strategy
1. **Timestamped / Word-level (Preferred when available)**: If an audio provider returns word-level timestamps, cues match exact word boundaries.
2. **Scene-Level Fallback (Documented Default)**: When word-level timing is unavailable, each scene's duration (`duration_seconds`) determines cue start and end timestamps:
   - $\text{startMs}_i = \sum_{k=0}^{i-1} \text{sceneDurationMs}_k$
   - $\text{endMs}_i = \text{startMs}_i + \max(1000, \text{sceneDurationMs}_i - 200)$ (allowing $200\text{ms}$ inter-cue clearance).

---

## 4. Supported Formats & Output

### 1. SubRip (SRT)
```srt
1
00:00:00,000 --> 00:00:02,800
Discover Apex Surge today.

2
00:00:02,800 --> 00:00:05,800
Zero sugar, pure focus.
```

### 2. WebVTT (VTT)
```vtt
WEBVTT

1
00:00:00.000 --> 00:00:02.800
Discover Apex Surge today.

2
00:00:02.800 --> 00:00:05.800
Zero sugar, pure focus.
```

---

## 5. Security & Sanitization
- **Path Traversal Protection**: Subtitle filenames and paths are generated using UUIDs within controlled temporary directories.
- **Command Injection Prevention**: Subtitle text is stripped of control characters, HTML tags (`<`, `>`), and newline sequences. Subtitle paths in FFmpeg commands are escaped.
- **SSRF Protection**: Media sources are validated against localhost and private IP ranges.

---

## 6. Rendering Modes
Configured via `SUBTITLE_MODE`:
- `sidecar` (Default): Generates and uploads `.srt` asset as a standalone file attached to the campaign and execution.
- `none`: Disables subtitle processing.
- `burned`: Injects `subtitles=...` filter in FFmpeg video rendering pipeline to hardcode open captions onto the video track.
