# Quality Evaluation Architecture (Slice 6)

## 1. Overview & Objective
The Quality Evaluation Service assesses generated commercial videos against campaign context, marketing strategy, Creative Bible / Direction, timeline parameters, and final video deliverable metadata.

It produces a canonical, Zod-validated `EvaluationResult` containing:
- Mathematical composite quality score (0.0 to 10.0)
- Pass/Fail verdict against a configurable threshold (default: 7.5 / 10.0)
- Dimensional breakdown across Product Fidelity, Brand Consistency, and Visual Quality
- Technical stream and container validation checks
- Structured issue log with severity and category classification
- Qualitative recommendations and machine-readable revision instructions for FUTURE autonomous revision loops

> [!IMPORTANT]
> **No Autonomous Revision in Slice 6**:
> The evaluator produces actionable revision directives and structured findings, but does **not** automatically re-trigger scene generation or rendering loops. Scene regeneration belongs to a subsequent slice.

---

## 2. Evaluation Dimensions & Weighting

Directly migrated from the legacy Python reference (`evaluation_engine.py`):

| Dimension | Weight | Description | Deterministic Check Rules |
| :--- | :--- | :--- | :--- |
| **Product Fidelity** | **40%** (0.40) | Faithfulness to product hero features, USPs, and core campaign goal. | Baseline 9.2. Penalized to 6.0 if visual prompts are sparse (< 15 characters). Penalized if product name/USP is omitted. |
| **Brand Consistency** | **30%** (0.30) | Adherence to Creative Bible style directives, tone, and visual guidelines. | Baseline 8.8. Penalized to 7.0 if Creative Bible is missing. |
| **Visual Quality** | **30%** (0.30) | Technical integrity, motion dynamics, framing, and absence of artifacts. | Baseline 9.4. Penalized to 6.5 if visual prompts are sparse. Penalized to <= 4.0 if technical video checks fail. |

### Mathematical Formula:
$$\text{overallScore} = \text{round}\Big((\text{productFidelity} \times 0.40) + (\text{brandConsistency} \times 0.30) + (\text{visualQuality} \times 0.30), 2\Big)$$

### Passing Verdict:
$$\text{passed} = (\text{overallScore} \ge \text{threshold}) \land \text{videoReadable} \land \text{resolutionValid}$$

---

## 3. Technical Quality Checks

The evaluation service verifies the following technical properties:
- `videoReadable`: Final video URL exists and media container is accessible.
- `durationValid`: Rendered duration matches target duration within allowable tolerance.
- `resolutionValid`: Width and height are non-zero and match the canvas specifications.
- `aspectRatioValid`: Aspect ratio matches campaign target (e.g. 9:16 or 16:9).
- `audioPresent`: Audio track is present when narration was specified.
- `subtitlesValid`: Subtitles are generated and synchronized when enabled.

---

## 4. Execution Modes

1. **Deterministic Rules Mode (`AI_EVALUATION_PROVIDER=rules` or default)**:
   - Uses `EvaluationRulesEngine`.
   - Requires zero external API credentials or models.
   - Evaluates prompt density, Creative Bible presence, and technical checks deterministically.
2. **Mock Evaluator (`AI_EVALUATION_PROVIDER=mock`)**:
   - Uses `MockEvaluator`.
   - Supports simulated PASS, simulated FAIL, and custom score overrides.
   - Fully offline for local development and CI testing.
3. **LLM Inference Mode (`AI_EVALUATION_PROVIDER=llm`)**:
   - Uses the centralized `ProviderRegistry.getLLM()`.
   - Structured JSON output with strict Zod validation and fallback to deterministic rules on failure.

---

## 5. Persistence, Provenance & Idempotency

### Schema (`quality_evaluations`):
- `id`: UUID Primary Key
- `campaign_id`: UUID (Foreign Key to `campaigns`)
- `workflow_execution_id`: UUID (Foreign Key to `workflow_executions`)
- `workflow_step_id`: UUID (Foreign Key to `workflow_steps`)
- `final_video_id`: UUID (Foreign Key to `final_videos`)
- `evaluation_version`: `'1.0'`
- `overall_score`: NUMERIC(4, 2)
- `threshold`: NUMERIC(4, 2)
- `passed`: BOOLEAN
- `dimensions`: JSONB
- `technical_checks`: JSONB
- `issues`: JSONB
- `recommendations`: JSONB
- `revision_instructions`: JSONB
- `metadata`: JSONB

### Provenance Chain:
$$\text{Campaign} \longrightarrow \text{WorkflowExecution} \longrightarrow \text{Timeline} \longrightarrow \text{FinalVideo} \longrightarrow \text{QualityEvaluation}$$

### Idempotency:
Evaluations are keyed by `evaluation:${workflowExecutionId}:${finalVideoId}:v1`. If an evaluation has already been persisted for the specific final video deliverable, it is reused unless `forceRefresh: true` is passed.

---

## 6. Known Limitations
- **No Direct Vision Model**: The system does not pretend to visually perceive video pixels if no vision AI model is connected. Visual quality is assessed via technical metadata, timeline integrity, and prompt density.
- **Scene-level Narration Timing**: Narration timing is aligned at scene boundaries when word-level timestamps are unavailable.
