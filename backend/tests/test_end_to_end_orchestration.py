import uuid
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.business import Business
from app.models.campaign import Campaign
from app.models.user import User


def test_complete_e2e_video_orchestration_pipeline(
    client: TestClient,
    db: Session,
    create_test_user,
):
    # 1. Register & Authenticate User
    unique_id = uuid.uuid4().hex[:8]
    user, session_token, password = create_test_user(f"producer_{unique_id}@adstudio.ai")
    cookies = {"kanggird_session": session_token}
    headers = {"Authorization": f"Bearer {session_token}", "Origin": "http://localhost:5173"}

    # -------------------------------------------------------------
    # STAGE 1 & 2: Context Engine & Interactive Clarification
    # -------------------------------------------------------------
    brief_prompt = "Create a high-energy vertical ad for Apex Velocity Carbon running shoes targeting marathon runners with 24hr battery."
    res = client.post(
        "/context/analyze",
        json={"prompt": brief_prompt},
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 201, res.text
    context_data = res.json()
    assert context_data["status"] in ["needs_clarification", "completed"]
    context_session_id = context_data["id"]

    # Submit clarification answer if questions were generated
    if context_data.get("clarification_questions"):
        res = client.post(
            f"/context/{context_session_id}/answer",
            json={
                "answers": {
                    "q_call_to_action": "Order Today & Get 20% Off",
                    "q_tone_of_voice": "Energetic and Bold",
                }
            },
            cookies=cookies,
            headers=headers,
        )
        assert res.status_code == 200, res.text
        context_data = res.json()
        assert context_data["status"] == "completed"
        assert context_data["complete_context"]["is_complete"] is True

    # -------------------------------------------------------------
    # STAGE 3: Business Profile & Campaign Creation
    # -------------------------------------------------------------
    res = client.post(
        "/businesses/",
        json={
            "name": "Apex Athletics Inc.",
            "industry": "Performance Footwear",
            "target_audience": "Marathon Runners & Athletes",
            "tone_of_voice": "Energetic, Fast-Paced & Bold",
            "brand_colors": "#013F32, #E7FE25, #000000",
            "brand_guidelines": "Always showcase dynamic movement and high-contrast visuals.",
        },
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 201, res.text
    business = res.json()
    business_id = business["id"]

    res = client.post(
        "/campaigns/",
        json={
            "business_id": business_id,
            "name": "Apex Velocity Launch Campaign",
            "product_name": "Apex Velocity Carbon",
            "product_description": "Next-generation carbon-plated marathon running shoes.",
            "unique_selling_points": "Ultralight carbon plate, 40% more energy return, breathable mesh",
            "objective": "Product Launch & Conversions",
            "target_platforms": "Instagram Reels, TikTok, YouTube Shorts",
            "call_to_action": "Order Today & Claim 20% Off Launch Discount",
        },
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 201, res.text
    campaign = res.json()
    campaign_id = campaign["id"]

    # -------------------------------------------------------------
    # STAGE 4 & 5: Strategy Synthesis & Multi-Concept Generation
    # -------------------------------------------------------------
    res = client.post(
        f"/campaigns/{campaign_id}/strategy",
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 201, res.text
    strategy_res = res.json()
    assert strategy_res["status"] == "concept_selection"
    assert strategy_res["strategy"]["campaign_objective"] == "Product Launch & Conversions"
    assert len(strategy_res["concepts"]) >= 3

    concept_to_select = strategy_res["concepts"][0]
    concept_id = concept_to_select["id"]

    # -------------------------------------------------------------
    # STAGE 6: Concept Selection
    # -------------------------------------------------------------
    res = client.post(
        f"/campaigns/{campaign_id}/concepts/{concept_id}/select",
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 200, res.text
    assert res.json()["status"] == "concept_selected"

    # -------------------------------------------------------------
    # STAGE 7: Storyboard & Creative Bible Generation
    # -------------------------------------------------------------
    res = client.post(
        f"/campaigns/{campaign_id}/storyboard",
        json={"aspect_ratio": "9:16", "concept_id": concept_id},
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 201, res.text
    storyboard = res.json()
    storyboard_id = storyboard["id"]
    assert storyboard["creative_bible"] is not None
    assert len(storyboard["scenes"]) >= 3

    scenes = storyboard["scenes"]
    scene_1 = scenes[0]
    scene_1_id = scene_1["id"]

    # -------------------------------------------------------------
    # STAGE 8: Workspace Scene Management & Editing
    # -------------------------------------------------------------
    # Edit scene
    res = client.patch(
        f"/storyboards/{storyboard_id}/scenes/{scene_1_id}",
        json={"visual_prompt": "Cinematic macro shot of carbon fiber weave flexing on neon track surface."},
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 200, res.text
    assert "carbon fiber weave" in res.json()["visual_prompt"]

    # Add custom scene
    res = client.post(
        f"/storyboards/{storyboard_id}/scenes",
        json={
            "sequence_number": 5,
            "shot_type": "Close Up",
            "camera_movement": "Dolly In",
            "visual_prompt": "Runner crossing the finish line wearing Apex Velocity shoes.",
            "audio_narration": "Push beyond limits.",
            "duration_seconds": 3.5,
            "lighting_atmosphere": "Stadium floodlights at dusk.",
        },
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 201, res.text

    # Check campaign workspace
    res = client.get(
        f"/campaigns/{campaign_id}/workspace",
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 200, res.text
    workspace_data = res.json()
    assert len(workspace_data["scenes"]) >= 4

    # -------------------------------------------------------------
    # STAGE 9 & 10: Generation Specification & Media Generation
    # -------------------------------------------------------------
    # Get compiled specification
    res = client.get(
        f"/scenes/{scene_1_id}/specification?aspect_ratio=9:16",
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 200, res.text
    spec = res.json()
    assert spec["scene_id"] == scene_1_id
    assert "carbon fiber weave" in spec["compiled_positive_prompt"]

    # Dispatch generation job for scene 1
    res = client.post(
        f"/scenes/{scene_1_id}/generate",
        json={
            "job_type": "video_generation",
            "parameters": {"aspect_ratio": "9:16", "seed": 42},
        },
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 201, res.text
    job_data = res.json()
    assert job_data["status"] == "completed"
    assert len(job_data["assets"]) > 0

    generated_asset = job_data["assets"][0]
    asset_id = generated_asset["id"]
    assert generated_asset["version"] == 1
    assert generated_asset["url"] is not None

    # -------------------------------------------------------------
    # STAGE 11: Quality Gate & Consistency Evaluation
    # -------------------------------------------------------------
    res = client.post(
        f"/assets/{asset_id}/evaluate",
        json={"strict_threshold": 7.0, "auto_regenerate_on_fail": True},
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 200, res.text
    eval_data = res.json()
    assert eval_data["asset_id"] == asset_id
    assert eval_data["overall_score"] >= 7.0
    assert eval_data["status"] == "pass"

    # -------------------------------------------------------------
    # STAGE 12: FFmpeg Multi-Track Timeline & Master Video Render
    # -------------------------------------------------------------
    res = client.post(
        f"/storyboards/{storyboard_id}/render",
        json={"resolution": "1080x1920", "aspect_ratio": "9:16", "fps": 30},
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 201, res.text
    render_job = res.json()
    assert render_job["status"] == "COMPLETED"
    assert render_job["progress"] == 100

    # Get final rendered videos
    res = client.get(
        f"/campaigns/{campaign_id}/final-videos",
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 200, res.text
    final_videos = res.json()
    assert len(final_videos) >= 1
    final_video = final_videos[0]
    assert final_video["status"] == "COMPLETED"
    assert final_video["url"] is not None

    # Render master commercial container
    res = client.post(
        f"/storyboards/{storyboard_id}/render-master",
        json={"resolution": "1080x1920", "transition_type": "crossfade"},
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 200, res.text
    master_video = res.json()
    assert master_video["storyboard_id"] == storyboard_id
    assert master_video["url"] is not None

    # -------------------------------------------------------------
    # Creator Dashboard Overview & Analytics
    # -------------------------------------------------------------
    res = client.get(
        "/dashboard/overview",
        cookies=cookies,
        headers=headers,
    )
    assert res.status_code == 200, res.text
    dash_data = res.json()
    assert dash_data["total_campaigns"] >= 1
    assert dash_data["total_rendered_videos"] >= 1
    assert dash_data["total_scenes_generated"] >= 1
