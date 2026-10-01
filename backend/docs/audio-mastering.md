# Audio Mastering & Normalization (Slice 6)

## 1. Overview
The Audio Mastering Service applies basic automated audio normalization and channel formatting to commercial video deliverables. It ensures consistent narration volume, prevents audio clipping, normalizes sample rates, and ensures compatibility with social video platforms (TikTok, Instagram, YouTube).

> [!NOTE]
> **Scope Limitation**:
> This service implements deterministic automated volume and loudness normalization. It is **not** a broadcast-grade audio mastering suite, and does not perform multi-band compression, dynamic sidechain ducking, or vocal de-essing.

---

## 2. Audio Mastering Target Specifications

| Parameter | Configuration Key | Default Value | Standard Rationale |
| :--- | :--- | :--- | :--- |
| **Integrated Loudness** | `AUDIO_TARGET_LUFS` | `-16.0 LUFS` | Mobile / social video standard (matches Apple Podcasts, YouTube, TikTok recommendation). |
| **Maximum True Peak** | `AUDIO_TRUE_PEAK` | `-1.5 dBTP` | Prevents inter-sample clipping during lossy AAC encoding. |
| **Sample Rate** | `AUDIO_SAMPLE_RATE` | `48000 Hz` | Industry video standard for synchronized digital audio. |
| **Channel Layout** | `AUDIO_CHANNELS` | `2` (Stereo) | Dual channel audio compatibility. |
| **Audio Codec** | `AUDIO_CODEC` | `aac` | Universal container compatibility in MP4 containers. |
| **Bitrate** | `AUDIO_BITRATE` | `192k` | High fidelity speech reproduction. |

---

## 3. FFmpeg Filter Implementation

When FFmpeg executes, the audio pipeline concatenates narration clips and applies the EBU R128 / ITU-R BS.1770-4 filter:

```text
[aconcat]loudnorm=I=-16:TP=-1.5:LRA=11:print_format=none[amastered]
```

Together with deterministic encoding parameters:
```bash
-c:a aac -b:a 192k -ar 48000 -ac 2
```

---

## 4. Execution & Mock Mode
- **Offline / Mock Mode (`AUDIO_MASTERING_PROVIDER=mock`)**:
  Validates audio track configurations, verifies duration sync against the timeline, and formats technical mastering metadata without executing child processes.
- **Durable Events**:
  Emits `AUDIO_MASTERED` with clip counts, target LUFS, and sample rate parameters.
