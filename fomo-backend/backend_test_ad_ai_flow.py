"""Ad Request → AI Generate → Approve/Reject/Regenerate E2E test.

Covers iteration_8 review request:
  - POST /api/ads/request (public)
  - POST /api/ads/admin/requests/:id/ai-generate
  - POST /api/ads/admin/requests/:id/approve  (verifies GET /api/ads/serve)
  - POST /api/ads/admin/requests/:id/reject
  - Regenerate (ai-generate replaces prior draft campaign)
  - Demo placements still serving (filled=true)
"""
import os
import time
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "").rstrip("/") or \
    "https://monetization-core-1.preview.emergentagent.com"
API = f"{BASE_URL}/api"


def _admin_token() -> str:
    with open("/tmp/admin_tok.txt") as f:
        return f.read().strip()


@pytest.fixture(scope="module")
def admin_headers():
    return {
        "Authorization": f"Bearer {_admin_token()}",
        "Content-Type": "application/json",
    }


@pytest.fixture()
def new_request_id():
    """Submit a fresh public ad-request and yield its id. Cleaned up in teardown."""
    payload = {
        "projectName": "TEST_AiFlowProj",
        "email": "test_aiflow@example.com",
        "contactName": "AI Flow Tester",
        "telegram": "@aiflow",
        "website": "https://example.com/aiflow",
        "adType": "banner",
        "placement": "HOME_HERO",
        "budget": "1500",
        "message": "Please advertise our awesome new crypto index product.",
        "source": "e2e_test",
    }
    r = requests.post(f"{API}/ads/request", json=payload, timeout=15)
    assert r.status_code == 201 or r.status_code == 200, f"submit failed {r.status_code} {r.text}"
    body = r.json()
    assert body.get("success") is True, body
    rid = body["data"]["_id"]
    yield rid
    # teardown: best-effort delete the linked campaign; leave request record.
    try:
        h = {"Authorization": f"Bearer {_admin_token()}"}
        lr = requests.get(f"{API}/ads/admin/requests", headers=h, timeout=15).json()
        for it in lr.get("data", []):
            if str(it.get("_id")) == str(rid) and it.get("linkedCampaignId"):
                requests.delete(f"{API}/ads/admin/campaigns/{it['linkedCampaignId']}", headers=h, timeout=15)
    except Exception:
        pass


# ── Demo campaigns still serving ────────────────────────────────────────────
@pytest.mark.parametrize("placement", [
    "GLOBAL_TOP_BANNER", "HOME_HERO", "CRYPTO_PROMOTED",
    "ECHO_FEED", "EARLYLAND_FEED", "GEMSLAB_SLIDES",
])
def test_demo_placement_serves(placement):
    r = requests.get(f"{API}/ads/serve", params={"placement": placement}, timeout=15)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("filled") is True, f"{placement} not filled: {body}"


# ── Submit request ──────────────────────────────────────────────────────────
def test_submit_ad_request_public(new_request_id):
    assert new_request_id  # created by fixture
    # Verify listable by admin.
    h = {"Authorization": f"Bearer {_admin_token()}"}
    r = requests.get(f"{API}/ads/admin/requests", headers=h, timeout=15)
    assert r.status_code == 200
    ids = [str(x.get("_id")) for x in r.json().get("data", [])]
    assert new_request_id in ids


# ── AI generate → creates draft campaign + creative ────────────────────────
def _find_request(rid: str, headers):
    r = requests.get(f"{API}/ads/admin/requests", headers=headers, timeout=15).json()
    for it in r.get("data", []):
        if str(it.get("_id")) == str(rid):
            return it
    return None


def test_ai_generate_then_approve_serves(admin_headers, new_request_id):
    rid = new_request_id
    # AI generate (may take up to ~45s)
    r = requests.post(f"{API}/ads/admin/requests/{rid}/ai-generate",
                      headers=admin_headers, timeout=90)
    assert r.status_code in (200, 201), f"ai-generate {r.status_code}: {r.text}"
    body = r.json()
    assert body.get("success") is True, body
    data = body.get("data") or {}
    campaign_id = data.get("campaignId")
    assert campaign_id, data
    # usedAi may be true or false (template fallback) — both are success
    assert "usedAi" in data

    # request should now be in_review, aiStatus=generated, linkedCampaignId set
    req_doc = _find_request(rid, admin_headers)
    assert req_doc is not None
    assert req_doc.get("status") == "in_review", req_doc
    assert req_doc.get("aiStatus") == "generated", req_doc
    assert str(req_doc.get("linkedCampaignId")) == str(campaign_id)

    # Fetch campaign, verify draft + aiGenerated
    r = requests.get(f"{API}/ads/admin/campaigns/{campaign_id}",
                     headers=admin_headers, timeout=15)
    assert r.status_code == 200, r.text
    camp = r.json().get("data") or r.json()
    assert camp.get("status") == "draft"
    assert camp.get("aiGenerated") is True
    placements = camp.get("placements") or []
    assert placements, camp
    placement_code = placements[0]

    # Approve → campaign active + request approved
    r = requests.post(f"{API}/ads/admin/requests/{rid}/approve",
                      headers=admin_headers, timeout=30)
    assert r.status_code in (200, 201), r.text
    assert r.json().get("success") is True

    r = requests.get(f"{API}/ads/admin/campaigns/{campaign_id}",
                     headers=admin_headers, timeout=15).json()
    camp2 = r.get("data") or r
    assert camp2.get("status") == "active", camp2

    req2 = _find_request(rid, admin_headers)
    assert req2.get("status") == "approved"

    # And serve should return filled=true for this placement (may take a moment for cache).
    time.sleep(1.5)
    served_ok = False
    for _ in range(3):
        r = requests.get(f"{API}/ads/serve", params={"placement": placement_code}, timeout=15)
        if r.status_code == 200 and r.json().get("filled") is True:
            served_ok = True
            break
        time.sleep(1)
    assert served_ok, f"placement {placement_code} did not serve filled=true"


def test_ai_generate_then_reject(admin_headers, new_request_id):
    rid = new_request_id
    r = requests.post(f"{API}/ads/admin/requests/{rid}/ai-generate",
                      headers=admin_headers, timeout=90)
    assert r.status_code in (200, 201)
    campaign_id = r.json()["data"]["campaignId"]

    r = requests.post(f"{API}/ads/admin/requests/{rid}/reject",
                      headers=admin_headers, timeout=30)
    assert r.status_code in (200, 201), r.text
    assert r.json().get("success") is True

    # Campaign now cancelled
    camp = requests.get(f"{API}/ads/admin/campaigns/{campaign_id}",
                        headers=admin_headers, timeout=15).json()
    camp_data = camp.get("data") or camp
    assert camp_data.get("status") == "cancelled", camp_data

    # Request now rejected
    req_doc = _find_request(rid, admin_headers)
    assert req_doc.get("status") == "rejected"


def test_ai_regenerate_replaces_previous_draft(admin_headers, new_request_id):
    rid = new_request_id
    r1 = requests.post(f"{API}/ads/admin/requests/{rid}/ai-generate",
                       headers=admin_headers, timeout=90)
    assert r1.status_code in (200, 201)
    old_campaign = r1.json()["data"]["campaignId"]

    r2 = requests.post(f"{API}/ads/admin/requests/{rid}/ai-generate",
                       headers=admin_headers, timeout=90)
    assert r2.status_code in (200, 201)
    new_campaign = r2.json()["data"]["campaignId"]

    assert old_campaign != new_campaign, "regenerate should create a new draft"

    # Old campaign should be deleted (404) — best-check.
    r = requests.get(f"{API}/ads/admin/campaigns/{old_campaign}",
                     headers=admin_headers, timeout=15)
    # Either 404 OR success:false — treat any non-2xx-with-data OK signal as removed.
    if r.status_code == 200:
        body = r.json()
        # In this codebase getCampaign returns {success:false, message:'Not found'} when missing.
        data = body.get("data")
        assert data in (None, {}) or body.get("success") is False, f"old campaign still present: {body}"
    # New campaign is a fresh draft
    r = requests.get(f"{API}/ads/admin/campaigns/{new_campaign}",
                     headers=admin_headers, timeout=15).json()
    camp = r.get("data") or r
    assert camp.get("status") == "draft"
    assert camp.get("aiGenerated") is True

    # Request still in_review, linkedCampaignId points to the NEW one
    req_doc = _find_request(rid, admin_headers)
    assert req_doc.get("status") == "in_review"
    assert str(req_doc.get("linkedCampaignId")) == str(new_campaign)
