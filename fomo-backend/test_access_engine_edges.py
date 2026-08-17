#!/usr/bin/env python3
"""Phase G — Unified Access Engine E2E edge cases (P22.8+): not_owner, no_rule,
admin grant + revoke, capability matrix (HYBRID/EXTERNAL/billing-boundary),
S7 explicit MAX-expiry check.
"""
import json, os, subprocess, sys, urllib.request, urllib.error
from datetime import datetime

API = subprocess.check_output(
    "grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2 | tr -d '\"'", shell=True
).decode().strip()
TOK = json.loads(subprocess.check_output("cd /app/fomo-backend && node mint_tokens.js", shell=True).decode())

ALICE = "6a79fcddfab5fd10fac25d9f"
BOB   = "6a79fcddfab5fd10fac25da0"
WU    = "6a7a04c90921ffa57f69455b"
CHAIN, CONTRACT = "1", "0xf0m0genesis000000000000000000000000c0de"
NOT_A_RULE = "0xdeadbeef00000000000000000000000000000000"  # no seeded rule

results = []
def check(name, cond, detail=""):
    results.append((name, bool(cond), detail))
    print(("PASS" if cond else "FAIL"), "-", name, ("" if cond else "| " + str(detail)[:220]))

def req(method, path, token=None, body=None):
    url = API + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    r.add_header("User-Agent", "Mozilla/5.0 (E2E-edges)")
    if token: r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        try:
            return e.code, json.loads(e.read().decode() or "{}")
        except Exception:
            return e.code, {}

def explain(uid, cap="earlyland.prime"):
    _, d = req("GET", f"/api/access/admin/explain?userId={uid}&capability={cap}", TOK["admin"])
    return d.get("data", {})

def list_ents(uid):
    _, e = req("GET", f"/api/access/admin/entitlements?userId={uid}", TOK["admin"])
    if isinstance(e, list): return e
    if isinstance(e, dict):
        v = e.get("data") or e.get("entitlements") or []
        if isinstance(v, list): return v
        if isinstance(v, dict):
            return v.get("data") or []
    return []

def clean():
    subprocess.run(
        f"""mongosh "mongodb://localhost:27017/fomo_dev" --quiet --eval '
        db.entitlements.deleteMany({{userId:{{$in:[ObjectId("{ALICE}"),ObjectId("{BOB}"),ObjectId("{WU}")]}}}});
        db.entitlement_subscriptions.deleteMany({{userId:{{$in:[ObjectId("{ALICE}"),ObjectId("{BOB}"),ObjectId("{WU}")]}}}});
        db.nft_access_activations.deleteMany({{tokenId:{{$in:["3001","3002","3003"]}}}});
        db.nft_test_ownership.deleteMany({{tokenId:{{$in:["3001","3002","3003"]}}}});
        '""", shell=True, capture_output=True)

clean()
print("API:", API)

# ─────────────────────────────────────────────────────────────
# E1: not_owner — activating with a wallet that does NOT own the token
# ─────────────────────────────────────────────────────────────
# Set ownership to walletA, but bob tries to activate with walletB
req("POST", "/api/access/admin/nft/test/ownership", TOK["admin"],
    {"chainId": CHAIN, "contract": CONTRACT, "tokenId": "3001", "wallet": "0xREALOWNER"})
st, act = req("POST", "/api/access/nft/activate", TOK["bob"],
              {"wallet": "0xIMPOSTOR", "chainId": CHAIN, "contract": CONTRACT, "tokenId": "3001"})
check("E1 not_owner: success=false code=not_owner",
      act.get("success") is False and act.get("code") == "not_owner",
      json.dumps(act)[:200])
d = explain(BOB)
check("E1 not_owner: explain remains DENY for bob", d.get("allowed") is False, json.dumps(d)[:200])

# ─────────────────────────────────────────────────────────────
# E2: no_rule — token from a collection with no enabled rule
# ─────────────────────────────────────────────────────────────
req("POST", "/api/access/admin/nft/test/ownership", TOK["admin"],
    {"chainId": CHAIN, "contract": NOT_A_RULE, "tokenId": "3002", "wallet": "0xBOBWALLET"})
st, act = req("POST", "/api/access/nft/activate", TOK["bob"],
              {"wallet": "0xBOBWALLET", "chainId": CHAIN, "contract": NOT_A_RULE, "tokenId": "3002"})
check("E2 no_rule: success=false code=no_rule",
      act.get("success") is False and act.get("code") == "no_rule",
      json.dumps(act)[:200])

# ─────────────────────────────────────────────────────────────
# E3: admin grant + revoke
# ─────────────────────────────────────────────────────────────
d = explain(ALICE); check("E3a alice DENY before grant", d.get("allowed") is False, json.dumps(d)[:160])
st, g = req("POST", "/api/access/admin/grant", TOK["admin"],
            {"userId": ALICE, "days": 7, "reason": "E2E test grant"})
check("E3b admin grant success", (g.get("success") is True) or (g.get("ok") is True) or bool(g.get("data")),
      json.dumps(g)[:220])
d = explain(ALICE)
check("E3c grant => ALLOW matchedBy=ADMIN_GRANT",
      d.get("allowed") is True and d.get("matchedBy") == "ADMIN_GRANT",
      json.dumps(d)[:220])

# find the ADMIN_GRANT entitlement id
ent_list = list_ents(ALICE)
grant_id = None
for e in (ent_list or []):
    if e.get("sourceType") == "ADMIN_GRANT" and e.get("capabilityKey") == "fomo_ai.membership":
        grant_id = e.get("_id") or e.get("id")
        break
check("E3d found ADMIN_GRANT entitlement id", grant_id is not None,
      f"ents={json.dumps(ent_list)[:220]}")

if grant_id:
    st, r = req("POST", f"/api/access/admin/entitlements/{grant_id}/revoke", TOK["admin"])
    check("E3e revoke success", (r.get("success") is True) or (r.get("ok") is True) or st in (200, 201),
          json.dumps(r)[:200])
    d = explain(ALICE)
    check("E3f explain DENY after revoke", d.get("allowed") is False, json.dumps(d)[:200])

# ─────────────────────────────────────────────────────────────
# E4: capability matrix — with active membership (fresh subscription on BOB)
# ─────────────────────────────────────────────────────────────
req("POST", "/api/admin/entitlements/subscriptions", TOK["admin"],
    {"user": BOB, "planCode": "FOMO_AI_MEMBERSHIP", "activate": True})
for cap in ["earlyland.prime", "fomo_ai.access", "parsing.access", "xrank.access"]:
    d = explain(BOB, cap)
    check(f"E4a ALLOWED with membership: {cap}", d.get("allowed") is True, json.dumps(d)[:200])

# HYBRID: launchpad.invest — accessAllowed reflects membership but allowed=false (eligibility external)
d = explain(BOB, "launchpad.invest")
check("E4b HYBRID launchpad.invest: accessAllowed=true but allowed=false",
      d.get("accessAllowed") is True and d.get("allowed") is False,
      json.dumps(d)[:260])

# EXTERNAL: spaceport.stake
d = explain(BOB, "spaceport.stake")
check("E4c EXTERNAL spaceport.stake: allowed=false (external eligibility)",
      d.get("allowed") is False,
      json.dumps(d)[:260])

# Billing boundary: fomo_intel.access — NOT included in FOMO_AI_MEMBERSHIP product
d = explain(BOB, "fomo_intel.access")
check("E4d billing-boundary fomo_intel.access: DENY even with membership",
      d.get("allowed") is False,
      json.dumps(d)[:260])

# ─────────────────────────────────────────────────────────────
# E5: dual-source union — membership.expiresAt = MAX(sub, nft), and cancelling
#     one keeps the other's own expiry (no implicit merge)
# ─────────────────────────────────────────────────────────────
# walletuser: subscription + NFT activation
req("POST", "/api/admin/entitlements/subscriptions", TOK["admin"],
    {"user": WU, "planCode": "FOMO_AI_MEMBERSHIP", "activate": True})
req("POST", "/api/access/admin/nft/test/ownership", TOK["admin"],
    {"chainId": CHAIN, "contract": CONTRACT, "tokenId": "3003", "wallet": "0xWALLETUSER"})
st, act = req("POST", "/api/access/nft/activate", TOK["walletuser"],
              {"wallet": "0xWALLETUSER", "chainId": CHAIN, "contract": CONTRACT, "tokenId": "3003"})
nft_end = (act.get("data") or {}).get("accessEndsAt")

d = explain(WU)
srcs = {s.get("type"): s.get("expiresAt") for s in (d.get("sources") or [])}
check("E5a both sources present", "NFT_ACTIVATION" in srcs and "SUBSCRIPTION" in srcs, str(srcs))
m_expires = (d.get("membership") or {}).get("expiresAt")
# max should equal max of the two source expiries
def parse(x):
    if not x: return None
    try: return datetime.fromisoformat(str(x).replace("Z","+00:00"))
    except Exception: return None
exps = [parse(v) for v in srcs.values() if v]
mx = max([e for e in exps if e]) if exps else None
me = parse(m_expires)
check("E5b membership.expiresAt = MAX of sources",
      mx is not None and me is not None and abs((mx - me).total_seconds()) < 5,
      f"sources={srcs} membership={m_expires}")

# Cancel the subscription (revoke SUBSCRIPTION entitlement) -> NFT expiry remains untouched
_, ents = req("GET", f"/api/access/admin/entitlements?userId={WU}", TOK["admin"])
ent_list = list_ents(WU)
sub_id = None
for e in (ent_list or []):
    if e.get("sourceType") == "SUBSCRIPTION" and e.get("capabilityKey") == "fomo_ai.membership":
        sub_id = e.get("_id") or e.get("id")
        break
if sub_id:
    req("POST", f"/api/access/admin/entitlements/{sub_id}/revoke", TOK["admin"])
d = explain(WU)
srcs2 = {s.get("type"): s.get("expiresAt") for s in (d.get("sources") or [])}
check("E5c after cancelling SUBSCRIPTION, NFT source alone remains ALLOW",
      d.get("allowed") is True and "NFT_ACTIVATION" in srcs2 and "SUBSCRIPTION" not in srcs2,
      f"srcs2={srcs2} allowed={d.get('allowed')}")
check("E5d NFT expiry unchanged after subscription cancel",
      srcs2.get("NFT_ACTIVATION") == nft_end,
      f"orig={nft_end} now={srcs2.get('NFT_ACTIVATION')}")

# cleanup
clean()

passed = sum(1 for _, c, _ in results if c)
total = len(results)
print(f"\n==== {passed}/{total} PASSED ====")
sys.exit(0 if passed == total else 1)
