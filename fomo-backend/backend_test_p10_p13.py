"""Backend tests for P10-P13: Knowledge Layer, Tool Registry, Grounded Answer, Cost/Retrieval Telemetry."""
import os
import subprocess
import pytest
import requests
from pymongo import MongoClient

BASE_URL = "http://localhost:5000/api"
JWT_SECRET = "fomo-preview-jwt-access-secret-4b8e1d6a"
ADMIN_USER_ID = "6a79fcdddac74dd8de81b1e4"
UNAUTHORIZED_USER_ID = "6a79fcdddac74dd8de81b000"


def _mint_token():
    script = f"""
const jwt = require('/app/fomo-backend/node_modules/jsonwebtoken');
console.log(jwt.sign({{_id:'{ADMIN_USER_ID}',email:'admin@fomo.local',role:['admin'],is2FAEnabled:false,is2FAVerified:true}}, '{JWT_SECRET}', {{expiresIn:'7d'}}));
"""
    r = subprocess.run(["node", "-e", script], capture_output=True, text=True, check=True)
    return r.stdout.strip()


@pytest.fixture(scope="session")
def token():
    return _mint_token()


@pytest.fixture(scope="session")
def headers(token):
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


@pytest.fixture(scope="session")
def mongo():
    client = MongoClient("mongodb://localhost:27017")
    # DB_NAME auto-detected from backend/.env — try fomo_dev
    return client["fomo_dev"]


# ============ P10: Knowledge Health ============

class TestP10KnowledgeHealth:
    def test_health_returns_all_sources(self, headers):
        r = requests.get(f"{BASE_URL}/admin/entitlements/ai/knowledge/health", headers=headers)
        assert r.status_code in (200, 201)
        data = r.json()
        assert "items" in data
        by_domain = {i["domain"]: i for i in data["items"]}

        # earlyland must be present and OK with data
        assert "earlyland" in by_domain, f"missing earlyland; got {list(by_domain)}"
        el = by_domain["earlyland"]
        assert el["connected"] is True
        assert el["status"] == "ok", f"earlyland status={el['status']}, count={el.get('count')}"
        assert el.get("count", 0) >= 1

        # unlocks must be not_connected
        assert "unlocks" in by_domain
        un = by_domain["unlocks"]
        assert un["status"] == "not_connected"
        assert un["connected"] is False

        # empty-but-existing sources
        for d in ["projects", "funds", "persons", "ratings", "signals", "launchpad", "market", "portfolio"]:
            assert d in by_domain, f"missing domain {d}"
            row = by_domain[d]
            assert row["status"] == "empty", f"{d} status={row['status']}"
            assert row["connected"] is True
            assert row["count"] == 0

        # required fields per row
        for name, row in by_domain.items():
            for k in ["dataMode", "count", "freshness", "public", "requests24h", "errors", "avgLatencyMs"]:
                assert k in row, f"{name} missing {k}"

    def test_knowledge_test_earlyland_monad_real(self, headers):
        r = requests.post(
            f"{BASE_URL}/admin/entitlements/ai/knowledge/test",
            headers=headers,
            json={"domain": "earlyland", "query": "Monad"},
        )
        assert r.status_code in (200, 201)
        d = r.json()
        assert d.get("status") == "ok", d
        assert d.get("connected") is True
        # sample/record with Monad
        payload_str = str(d).lower()
        assert "monad" in payload_str, d
        # look for a record with title/name Monad Testnet
        recs = d.get("data") or d.get("results") or d.get("records") or d.get("sample") or []
        if isinstance(recs, dict):
            recs = [recs]
        found = False
        for rec in recs:
            s = str(rec).lower()
            if "monad" in s:
                found = True
                break
        assert found, f"No Monad record: {d}"

    def test_knowledge_test_unlocks_not_connected(self, headers):
        r = requests.post(
            f"{BASE_URL}/admin/entitlements/ai/knowledge/test",
            headers=headers,
            json={"domain": "unlocks", "query": "x"},
        )
        assert r.status_code in (200, 201)
        d = r.json()
        assert d.get("status") == "not_connected", d
        assert d.get("connected") is False

    def test_knowledge_test_projects_empty(self, headers):
        r = requests.post(
            f"{BASE_URL}/admin/entitlements/ai/knowledge/test",
            headers=headers,
            json={"domain": "projects", "query": "Monad"},
        )
        assert r.status_code in (200, 201)
        d = r.json()
        assert d.get("status") == "empty", d
        assert d.get("connected") is True
        assert d.get("count", 0) == 0


# ============ P11 + P12 + P13: Tool Registry, Grounded Answer, Cost ============

class TestP11P12P13GroundedAsk:
    def test_token_analysis_internal_grounded(self, headers):
        r = requests.post(
            f"{BASE_URL}/admin/entitlements/ai/ask",
            headers=headers,
            json={"operation": "token_analysis", "query": "Analyze Monad", "billingContext": "INTERNAL"},
        )
        assert r.status_code in (200, 201), r.text
        d = r.json()
        assert d.get("ok") is True, d

        # P11: usedTools
        used = d.get("usedTools") or []
        assert isinstance(used, list) and len(used) > 0, d
        for t in used:
            for k in ["tool", "calls", "latencyMs", "costUsd", "costType", "dataMode", "success", "status", "source"]:
                assert k in t, f"usedTool missing {k}: {t}"
            assert t["costType"] == "internal_unmetered"

        # P11 + P12: sources include Monad Testnet
        sources = d.get("sources") or []
        assert len(sources) >= 1, d
        found_monad = any(
            (s.get("sourceType") == "FOMO" and s.get("entityType") == "EARLYLAND"
             and "monad" in str(s).lower())
            for s in sources
        )
        assert found_monad, f"Monad FOMO/EARLYLAND source not found: {sources}"

        # P12 grounded answer contract
        for k in ["answer", "coverage", "sources", "usedTools", "retrieval", "dataFreshness", "limitations", "usage"]:
            assert k in d, f"missing {k}"
        assert d["coverage"] in ("low", "medium", "high")
        assert "FOMO DATA" in d["answer"] or "FOMO" in d["answer"], d["answer"][:300]
        assert "Analysis" in d["answer"] or "analysis" in d["answer"].lower()

        # P13 all-in cost
        usage = d.get("usage") or {}
        cb = usage.get("costBreakdown") or {}
        for k in ["modelUsd", "embeddingUsd", "externalSearchUsd", "externalToolsUsd", "otherUsd", "totalUsd"]:
            assert k in cb, f"costBreakdown missing {k}: {cb}"
        components = cb["modelUsd"] + cb["embeddingUsd"] + cb["externalSearchUsd"] + cb["externalToolsUsd"] + cb["otherUsd"]
        assert abs(components - cb["totalUsd"]) < 1e-9, cb

        # retrieval telemetry
        retrieval = d.get("retrieval") or {}
        for k in ["knowledgeQueries", "sourcesConnected", "sourcesEmpty", "sourcesNotConnected", "errors", "totalLatencyMs"]:
            assert k in retrieval, f"retrieval missing {k}: {retrieval}"

    def test_privacy_gate_access_denied(self, headers):
        r = requests.post(
            f"{BASE_URL}/admin/entitlements/ai/ask",
            headers=headers,
            json={"operation": "ask_fomo", "billingContext": "USER", "userId": UNAUTHORIZED_USER_ID, "query": "hi"},
        )
        assert r.status_code in (200, 201), r.text
        d = r.json()
        assert d.get("ok") is False, d
        assert d.get("status") == "ACCESS_DENIED", d
        assert d.get("errorCode") == "access_denied", d

    def test_user_credit_path_and_idempotency(self, headers, mongo):
        idem = "accept-key-XYZ-p13-test"
        # Clean any previous events for this key so we can assert exactly 1
        mongo.ai_usage_events.delete_many({"idempotencyKey": idem})

        body = {
            "operation": "ask_fomo",
            "query": "What does FOMO track about Monad?",
            "billingContext": "USER",
            "userId": ADMIN_USER_ID,
            "idempotencyKey": idem,
        }
        r1 = requests.post(f"{BASE_URL}/admin/entitlements/ai/ask", headers=headers, json=body)
        assert r1.status_code in (200, 201), r1.text
        d1 = r1.json()
        assert d1.get("ok") is True, d1
        credits1 = (d1.get("usage") or {}).get("creditsCharged", 0)
        assert credits1 >= 1, d1

        # Repeat with same key
        r2 = requests.post(f"{BASE_URL}/admin/entitlements/ai/ask", headers=headers, json=body)
        assert r2.status_code in (200, 201)
        d2 = r2.json()
        assert d2.get("ok") is True, d2

        # Exactly ONE billable usage event
        count = mongo.ai_usage_events.count_documents({"idempotencyKey": idem})
        assert count == 1, f"expected 1 event, got {count}"

    def test_tool_budget_guard_token_analysis(self, headers):
        r = requests.post(
            f"{BASE_URL}/admin/entitlements/ai/ask",
            headers=headers,
            json={"operation": "token_analysis", "query": "Analyze Monad exhaustively", "billingContext": "INTERNAL"},
        )
        assert r.status_code in (200, 201)
        d = r.json()
        used = d.get("usedTools") or []
        total_calls = sum(t.get("calls", 0) for t in used)
        # token_analysis maxToolCalls=6
        assert total_calls <= 6, f"token_analysis exceeded 6 tool calls: {total_calls}"

    def test_deep_research_allows_more_tools(self, headers):
        # Just ensure operation dispatches successfully (or ACCESS_DENIED gracefully) — do INTERNAL to skip cap gate
        r = requests.post(
            f"{BASE_URL}/admin/entitlements/ai/ask",
            headers=headers,
            json={"operation": "deep_research", "query": "Deep research on Monad", "billingContext": "INTERNAL"},
        )
        assert r.status_code in (200, 201), r.text
        d = r.json()
        # Should be ok=true and possibly more tool calls than 6 allowed
        if d.get("ok"):
            used = d.get("usedTools") or []
            # just make sure no crash and structure valid
            assert isinstance(used, list)
