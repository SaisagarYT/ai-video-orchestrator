import uuid
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.business import Business
from app.models.campaign import Campaign


def test_unauthenticated_requests_rejected(client: TestClient):
    """Verify that protected API endpoints reject unauthenticated requests with 401."""
    res_me = client.get("/auth/me")
    assert res_me.status_code == 401

    res_sessions = client.get("/auth/sessions")
    assert res_sessions.status_code == 401

    res_campaigns = client.get("/campaigns/")
    assert res_campaigns.status_code == 401


def test_idor_campaign_isolation(client: TestClient, db: Session, create_test_user):
    """Verify that User B cannot view or modify User A's campaign (IDOR protection)."""
    # 1. Create User A and User A's campaign
    user_a, token_a, _ = create_test_user(email=f"usera_{uuid.uuid4().hex[:8]}@kanggird.ai")

    # Create business for User A
    business_a = Business(
        user_id=user_a.id,
        name="User A Brand",
        industry="Technology",
        target_audience="Engineers",
        tone_of_voice="Professional",
    )
    db.add(business_a)
    db.commit()
    db.refresh(business_a)

    # Create campaign for User A
    campaign_a = Campaign(
        user_id=user_a.id,
        business_id=business_a.id,
        name="User A Confidential Ad Campaign",
        product_name="AI Video Tool",
        product_description="High-tier AI video generation",
        objective="conversions",
        call_to_action="Sign up today",
    )
    db.add(campaign_a)
    db.commit()
    db.refresh(campaign_a)

    # 2. Create User B
    user_b, token_b, _ = create_test_user(email=f"userb_{uuid.uuid4().hex[:8]}@kanggird.ai")

    # 3. User A can access User A's campaign
    res_user_a = client.get(
        f"/campaigns/{campaign_a.id}",
        headers={"Authorization": f"Bearer {token_a}"},
    )
    assert res_user_a.status_code == 200
    assert res_user_a.json()["name"] == "User A Confidential Ad Campaign"

    # 4. User B attempts to access User A's campaign -> MUST FAIL (404/403)
    res_user_b_get = client.get(
        f"/campaigns/{campaign_a.id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res_user_b_get.status_code in (403, 404)

    # 5. User B attempts to update User A's campaign -> MUST FAIL (404/403)
    res_user_b_patch = client.patch(
        f"/campaigns/{campaign_a.id}",
        headers={"Authorization": f"Bearer {token_b}"},
        json={"name": "Hacked Campaign Name"},
    )
    assert res_user_b_patch.status_code in (403, 404)

    # 6. User B attempts to delete User A's campaign -> MUST FAIL (404/403)
    res_user_b_delete = client.delete(
        f"/campaigns/{campaign_a.id}",
        headers={"Authorization": f"Bearer {token_b}"},
    )
    assert res_user_b_delete.status_code in (403, 404)

    # Verify campaign was not modified in DB
    db.refresh(campaign_a)
    assert campaign_a.name == "User A Confidential Ad Campaign"


def test_csrf_cross_origin_blocked(client: TestClient, create_test_user):
    """Verify that state-changing requests from untrusted origins are blocked by CSRF protection."""
    user, session_token, _ = create_test_user(email=f"csrf_test_{uuid.uuid4().hex[:8]}@kanggird.ai")

    # Request from untrusted external origin
    res = client.post(
        "/auth/logout",
        headers={
            "Authorization": f"Bearer {session_token}",
            "Origin": "https://malicious-attacker-website.com",
        },
    )
    assert res.status_code == 403
    assert "Cross-site request blocked" in res.json()["detail"]
