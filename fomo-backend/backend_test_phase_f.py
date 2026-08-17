"""Phase F backend regression: P0 access + billing guards + plan simplification."""
import os, uuid, subprocess, json
import pytest, requests

BASE = "http://localhost:5000/api"
WTOK = open("/tmp/wallet_tok.txt").read().strip()
FTOK = open("/tmp/free_tok.txt").read().strip()

def H(tok): return {"Authorization": f"Bearer {tok}", "Content-Type": "application/json"}

# --- P0: AccessResolver ---
class TestP0Access:
    def test_membership_has_access(self):
        r = requests.get(f"{BASE}/fomo-v2/activities/my-access", headers=H(WTOK))
        assert r.status_code == 200
        d = r.json()
        assert d["hasAccess"] is True
        assert d["authenticated"] is True
        assert d["matchedBy"] in ("subscription", "grant")

    def test_free_no_access(self):
        r = requests.get(f"{BASE}/fomo-v2/activities/my-access", headers=H(FTOK))
        d = r.json()
        assert d["hasAccess"] is False
        assert d["authenticated"] is True
        assert d["reason"] in ("nft_or_grant_required", "subscription_required")

    def test_unauth_no_access(self):
        r = requests.get(f"{BASE}/fomo-v2/activities/my-access")
        d = r.json()
        assert d["hasAccess"] is False
        assert d["authenticated"] is False
        assert d["reason"] == "auth_required"

# --- Billing guards ---
class TestBillingGuards:
    def test_context_membership(self):
        r = requests.get(f"{BASE}/fomo-ai/context", headers=H(WTOK))
        d = r.json()
        assert d["access"]["allowed"] is True
        assert d["credits"]["available"] >= 1
        ops = {o["operation"]: o for o in d["operations"]}
        assert ops["token_analysis"]["allowed"] is True
        assert ops["portfolio_analysis"]["allowed"] is False
        assert ops["deep_research"]["allowed"] is False

    def test_context_free_locked(self):
        r = requests.get(f"{BASE}/fomo-ai/context", headers=H(FTOK))
        d = r.json()
        assert d["access"]["allowed"] is False

    def test_ask_token_analysis_grounded_and_charged(self):
        idk = f"phasef-{uuid.uuid4()}"
        r = requests.post(f"{BASE}/fomo-ai/ask", headers=H(WTOK),
                          json={"operation":"token_analysis","query":"Analyze Monad","idempotencyKey":idk})
        d = r.json()
        assert d["ok"] is True, d
        titles = [s["title"] for s in d["message"]["sources"]]
        assert "Monad Testnet" in titles
        assert d["message"]["usage"]["creditsCharged"] >= 1
        # Verify exactly 1 usage event created
        out = subprocess.run(["mongosh","--quiet","fomo_dev","--eval",
                              f"db.ai_usage_events.countDocuments({{idempotencyKey:'{idk}'}})"],
                             capture_output=True, text=True).stdout.strip()
        assert out == "1", f"expected 1 event got {out}"
        # Repeat: no duplicate event
        r2 = requests.post(f"{BASE}/fomo-ai/ask", headers=H(WTOK),
                           json={"operation":"token_analysis","query":"Analyze Monad","idempotencyKey":idk})
        assert r2.json()["ok"] is True
        out2 = subprocess.run(["mongosh","--quiet","fomo_dev","--eval",
                               f"db.ai_usage_events.countDocuments({{idempotencyKey:'{idk}'}})"],
                              capture_output=True, text=True).stdout.strip()
        assert out2 == "1", f"idempotency broken: {out2}"

    def test_ask_deep_research_access_denied(self):
        idk = f"phasef-denied-{uuid.uuid4()}"
        r = requests.post(f"{BASE}/fomo-ai/ask", headers=H(WTOK),
                          json={"operation":"deep_research","query":"deep dive Monad","idempotencyKey":idk})
        d = r.json()
        assert d["ok"] is False
        assert d["status"] == "ACCESS_DENIED"
        out = subprocess.run(["mongosh","--quiet","fomo_dev","--eval",
                              f"db.ai_usage_events.countDocuments({{idempotencyKey:'{idk}'}})"],
                             capture_output=True, text=True).stdout.strip()
        assert out == "0", f"denied ask must not create event, got {out}"

# --- Plan simplification ---
class TestPlanSimplification:
    def test_only_membership_active_featured(self):
        out = subprocess.run(["mongosh","--quiet","fomo_dev","--eval",
                              "JSON.stringify(db.entitlement_plans.find({},{code:1,status:1,featured:1,priceUsd:1,aiCreditsIncluded:1,capabilities:1,_id:0}).toArray())"],
                             capture_output=True, text=True).stdout.strip()
        plans = json.loads(out)
        by = {p["code"]: p for p in plans}
        m = by["FOMO_AI_MEMBERSHIP"]
        assert m["featured"] is True
        assert m["status"] == "ACTIVE"
        assert m["priceUsd"] == 49
        assert m["aiCreditsIncluded"] == 1000
        caps = {c["capabilityKey"] for c in m["capabilities"]}
        for req in ["fomo_ai.access","earlyland.prime","parsing.access","xrank.access",
                    "fomo_ai.portfolio_analysis","fomo_ai.deep_research"]:
            assert req in caps, f"missing cap {req}"
        for legacy in ["FOMO_AI_STARTER","FOMO_AI_PRO","FOMO_AI_RESEARCH"]:
            assert by[legacy]["status"] == "ARCHIVED", f"{legacy} not archived"
            assert by[legacy]["featured"] is False
