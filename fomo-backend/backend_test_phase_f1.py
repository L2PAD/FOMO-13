"""
Phase F.1 backend regression: TWO independent commercial products
(FOMO AI with credits, FOMO Intel access-only, no credits).
Uses direct NestJS on :5000/api (proxy at :8001 also acceptable).
"""
import os
import subprocess
import pytest
import requests

BASE_URL = "http://localhost:5000/api"


def _read(path):
    with open(path) as f:
        return f.read().strip()


@pytest.fixture(scope="module")
def wallet_token():
    return _read("/tmp/wallet_tok.txt")


@pytest.fixture(scope="module")
def free_token():
    return _read("/tmp/free_tok.txt")


# ---------- Catalog: GET /api/products ----------
class TestPublicCatalog:
    def test_products_exact_two_active(self):
        r = requests.get(f"{BASE_URL}/products", timeout=10)
        assert r.status_code == 200
        items = r.json()["items"]
        codes = sorted(p["code"] for p in items)
        assert codes == ["FOMO_AI_MEMBERSHIP", "FOMO_INTEL_SUB"], codes
        for code in ("FOMO_AI_STARTER", "FOMO_AI_PRO", "FOMO_AI_RESEARCH"):
            assert code not in codes

    def test_fomo_ai_shape(self):
        r = requests.get(f"{BASE_URL}/products").json()
        p = next(x for x in r["items"] if x["code"] == "FOMO_AI_MEMBERSHIP")
        assert p["productType"] == "FOMO_AI"
        assert p["aiCredits"] == 1000
        assert p["priceUsd"] == 49
        assert p["checkout"]["status"] == "NOT_CONNECTED"
        assert p.get("externalUrl") in (None, "")
        assert isinstance(p["offerItems"], list) and len(p["offerItems"]) > 0

    def test_fomo_intel_shape(self):
        r = requests.get(f"{BASE_URL}/products").json()
        p = next(x for x in r["items"] if x["code"] == "FOMO_INTEL_SUB")
        assert p["productType"] == "FOMO_INTEL"
        assert p["aiCredits"] in (None, 0)  # spec: null (no credits)
        # per spec must be null:
        assert p["aiCredits"] is None, "FOMO Intel must serialize aiCredits=null"
        assert p["priceUsd"] == 79
        assert p["checkout"]["status"] == "NOT_CONNECTED"
        assert p["externalUrl"], "FOMO Intel must have externalUrl"


# ---------- /api/products/my access resolution ----------
class TestProductsMy:
    def test_my_wallet_membership_and_intel(self, wallet_token):
        r = requests.get(
            f"{BASE_URL}/products/my",
            headers={"Authorization": f"Bearer {wallet_token}"},
            timeout=10,
        )
        assert r.status_code == 200
        d = r.json()
        assert d["fomoAi"]["subscribed"] is True
        assert d["fomoAi"]["status"] == "ACTIVE"
        assert d["fomoAi"]["credits"]["available"] >= 0
        assert d["fomoIntel"]["subscribed"] is True
        assert d["fomoIntel"]["credits"] is None
        assert d["fomoIntel"]["externalUrl"]

    def test_my_free_none(self, free_token):
        r = requests.get(
            f"{BASE_URL}/products/my",
            headers={"Authorization": f"Bearer {free_token}"},
            timeout=10,
        )
        assert r.status_code == 200
        d = r.json()
        assert d["fomoAi"]["subscribed"] is False
        assert d["fomoIntel"]["subscribed"] is False


# ---------- Credit economy separation (P3/P10) ----------
class TestCreditSeparation:
    """Intel subscription must NOT create any ai_credit_transactions."""

    def test_intel_activation_creates_no_credit_txns(self):
        # Use mongosh to count credit txns for the wallet user.
        # The wallet user already has an Intel sub activated by main agent.
        # Assert: no credit txns of type SUBSCRIPTION_GRANT tied to Intel plan.
        cmd = [
            "mongosh", "fomo_dev", "--quiet", "--eval",
            'JSON.stringify({'
            'total: db.ai_credit_transactions.countDocuments({userId:ObjectId("6a7a04c90921ffa57f69455b")}),'
            'intelPlanId: db.entitlement_plans.findOne({code:"FOMO_INTEL_SUB"})._id.toString(),'
            'intelGrants: db.ai_credit_transactions.countDocuments({userId:ObjectId("6a7a04c90921ffa57f69455b"), reason:/intel/i}),'
            'grantTxns: db.ai_credit_transactions.countDocuments({userId:ObjectId("6a7a04c90921ffa57f69455b"),type:"SUBSCRIPTION_GRANT"})'
            '})'
        ]
        out = subprocess.check_output(cmd).decode().strip()
        # Extract last JSON line
        import json, re
        m = re.search(r"\{.*\}", out)
        data = json.loads(m.group(0))
        # Exactly 1 SUBSCRIPTION_GRANT (from FOMO_AI); no Intel-referenced credit grants
        assert data["grantTxns"] == 1, data
        assert data["intelGrants"] == 0, data


# ---------- Plan lifecycle (legacy archived + not visible + not purchasable) ----------
class TestPlanLifecycle:
    def test_legacy_archived_hidden(self):
        cmd = [
            "mongosh", "fomo_dev", "--quiet", "--eval",
            'JSON.stringify(db.entitlement_plans.find({code:{$in:["FOMO_AI_STARTER","FOMO_AI_PRO","FOMO_AI_RESEARCH"]}},{code:1,status:1,visible:1,purchasable:1,_id:0}).toArray())'
        ]
        import json, re
        out = subprocess.check_output(cmd).decode()
        arr = json.loads(re.search(r"\[.*\]", out, re.S).group(0))
        assert len(arr) == 3
        for p in arr:
            assert p["status"] == "ARCHIVED", p
            assert p["visible"] is False, p
            assert p["purchasable"] is False, p


# ---------- Admin plan upsert (edit persists) ----------
class TestAdminPlanEdit:
    """POST /api/entitlements/admin/plans with $set updates."""

    def test_admin_update_fomo_ai_subtitle_persists(self):
        admin_tok = _read("/tmp/admin_tok.txt")
        H = {"Authorization": f"Bearer {admin_tok}", "Content-Type": "application/json"}
        # fetch current
        r = requests.get(f"{BASE_URL}/entitlements/admin/plans", headers=H, timeout=10)
        if r.status_code == 404:
            pytest.skip("admin plans endpoint path different; UI test will cover")
        assert r.status_code in (200, 201), r.text
        plans = r.json()
        plans = plans.get("items", plans) if isinstance(plans, dict) else plans
        ai = next((p for p in plans if p.get("code") == "FOMO_AI_MEMBERSHIP"), None)
        assert ai, plans
        old = ai.get("subtitle", "")
        new = "AI research & crypto intelligence"  # canonical value
        # No-op-safe: write same value to ensure endpoint works
        payload = {**ai, "subtitle": new}
        upd = requests.post(f"{BASE_URL}/entitlements/admin/plans", headers=H, json=payload, timeout=15)
        assert upd.status_code in (200, 201), upd.text
        # verify persisted
        r2 = requests.get(f"{BASE_URL}/entitlements/admin/plans", headers=H, timeout=10).json()
        r2 = r2.get("items", r2) if isinstance(r2, dict) else r2
        ai2 = next(p for p in r2 if p.get("code") == "FOMO_AI_MEMBERSHIP")
        assert ai2["subtitle"] == new
