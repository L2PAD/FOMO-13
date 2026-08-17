#!/usr/bin/env python3
"""Phase G — Unified Access Engine E2E (scenarios P22.1–7)."""
import json, os, subprocess, sys, urllib.request, urllib.error

API = subprocess.check_output(
    "grep REACT_APP_BACKEND_URL /app/frontend/.env | cut -d= -f2 | tr -d '\"'", shell=True
).decode().strip()
TOK = json.loads(subprocess.check_output("cd /app/fomo-backend && node mint_tokens.js", shell=True).decode())

ALICE = "6a79fcddfab5fd10fac25d9f"
BOB = "6a79fcddfab5fd10fac25da0"
WU = "6a7a04c90921ffa57f69455b"
CHAIN, CONTRACT = "1", "0xf0m0genesis000000000000000000000000c0de"

results = []
def check(name, cond, detail=""):
    results.append((name, cond, detail))
    print(("PASS" if cond else "FAIL"), "-", name, ("" if cond else "| " + detail))

def req(method, path, token=None, body=None):
    url = API + path
    data = json.dumps(body).encode() if body is not None else None
    r = urllib.request.Request(url, data=data, method=method)
    r.add_header("Content-Type", "application/json")
    r.add_header("User-Agent", "Mozilla/5.0 (E2E-test)")
    if token: r.add_header("Authorization", "Bearer " + token)
    try:
        with urllib.request.urlopen(r, timeout=30) as resp:
            return resp.status, json.loads(resp.read().decode() or "{}")
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode() or "{}")

def explain(uid, cap="earlyland.prime"):
    _, d = req("GET", f"/api/access/admin/explain?userId={uid}&capability={cap}", TOK["admin"])
    return d.get("data", {})

def clean():
    # remove membership entitlements + activations for our test users/token
    subprocess.run(
        f"""mongosh "mongodb://localhost:27017/fomo_dev" --quiet --eval '
        db.entitlements.deleteMany({{userId:{{$in:[ObjectId("{ALICE}"),ObjectId("{BOB}"),ObjectId("{WU}")]}}}});
        db.entitlement_subscriptions.deleteMany({{userId:{{$in:[ObjectId("{ALICE}"),ObjectId("{BOB}"),ObjectId("{WU}")]}}}});
        db.nft_access_activations.deleteMany({{tokenId:{{$in:["1842","2001"]}}}});
        db.nft_test_ownership.deleteMany({{tokenId:{{$in:["1842","2001"]}}}});
        '""", shell=True, capture_output=True)

clean()
print("API:", API)

# ── Scenario 1: subscription ──
d = explain(ALICE); check("S1a free user DENY prime", d.get("allowed") is False, str(d.get("reason")))
st, sub = req("POST", "/api/admin/entitlements/subscriptions", TOK["admin"],
              {"user": ALICE, "planCode": "FOMO_AI_MEMBERSHIP", "activate": True})
check("S1b subscription created+activated", sub.get("ok") is True, json.dumps(sub)[:200])
d = explain(ALICE)
check("S1c prime ALLOW via subscription", d.get("allowed") is True and d.get("membership", {}).get("active") is True, json.dumps(d)[:200])
check("S1d matchedBy SUBSCRIPTION", d.get("matchedBy") == "SUBSCRIPTION", str(d.get("matchedBy")))
d_ai = explain(ALICE, "fomo_ai.access")
check("S1e fomo_ai.access ALLOW", d_ai.get("allowed") is True, str(d_ai.get("reason")))

# ── Scenario 2: NFT activation ──
req("POST", "/api/access/admin/nft/test/ownership", TOK["admin"],
    {"chainId": CHAIN, "contract": CONTRACT, "tokenId": "1842", "wallet": "0xBOBWALLET"})
d = explain(BOB); check("S2a bob DENY before activation", d.get("allowed") is False, str(d.get("reason")))
st, act = req("POST", "/api/access/nft/activate", TOK["bob"],
              {"wallet": "0xBOBWALLET", "chainId": CHAIN, "contract": CONTRACT, "tokenId": "1842"})
check("S2b activation success", act.get("success") is True and act.get("code") == "activated", json.dumps(act)[:200])
exp1 = act.get("data", {}).get("accessEndsAt")
d = explain(BOB)
check("S2c bob prime ALLOW via NFT", d.get("allowed") is True and d.get("matchedBy") == "NFT_ACTIVATION", json.dumps(d)[:200])

# ── Scenario 3: idempotent re-activation ──
st, act2 = req("POST", "/api/access/nft/activate", TOK["bob"],
               {"wallet": "0xBOBWALLET", "chainId": CHAIN, "contract": CONTRACT, "tokenId": "1842"})
exp2 = act2.get("data", {}).get("accessEndsAt")
check("S3 re-activation returns SAME period (no +30d)", act2.get("reused") is True and exp1 == exp2,
      f"code={act2.get('code')} exp1={exp1} exp2={exp2}")

# ── Scenario 4: transfer (remaining follows token) ──
st, tr = req("POST", "/api/access/admin/nft/transfer", TOK["admin"],
             {"chainId": CHAIN, "contract": CONTRACT, "tokenId": "1842", "newWallet": "0xWALLETUSER", "newUserId": WU})
check("S4a transfer ok", tr.get("success") is True, json.dumps(tr)[:200])
d_bob = explain(BOB); check("S4b old owner (bob) DENY after transfer", d_bob.get("allowed") is False, json.dumps(d_bob)[:160])
d_wu = explain(WU)
check("S4c new owner (walletuser) ALLOW", d_wu.get("allowed") is True and d_wu.get("matchedBy") == "NFT_ACTIVATION", json.dumps(d_wu)[:160])
exp3 = (d_wu.get("membership") or {}).get("expiresAt")
check("S4d same original expiresAt after transfer", exp3 is not None and exp3[:10] == str(exp1)[:10], f"orig={exp1} new={exp3}")

# ── Scenario 5: expiry (NFT still owned, access gone) ──
subprocess.run(
    f"""mongosh "mongodb://localhost:27017/fomo_dev" --quiet --eval '
    var past=new Date(Date.now()-86400000);
    db.nft_access_activations.updateMany({{tokenId:"1842",status:"ACTIVE"}},{{$set:{{accessEndsAt:past}}}});
    db.entitlements.updateMany({{capabilityKey:"fomo_ai.membership",sourceType:"NFT_ACTIVATION"}},{{$set:{{validUntil:past}}}});
    '""", shell=True, capture_output=True)
req("POST", "/api/access/admin/nft/run-expiry", TOK["admin"])
d_wu = explain(WU)
check("S5a access DENY after expiry", d_wu.get("allowed") is False, json.dumps(d_wu)[:160])
_, diag = req("GET", f"/api/access/admin/nft/diagnostics?chainId={CHAIN}&contract={CONTRACT}&tokenId=1842&wallet=0xWALLETUSER", TOK["admin"])
check("S5b NFT still owned (ownership independent)", diag.get("ownerMatches") is True and diag.get("premiumAccess") == "DENY",
      json.dumps(diag)[:200])

# ── Scenario 7: NFT + subscription => effective = max ──
# give walletuser BOTH: a fresh NFT (token 2001, +30d) and a subscription (activate)
req("POST", "/api/access/admin/nft/test/ownership", TOK["admin"],
    {"chainId": CHAIN, "contract": CONTRACT, "tokenId": "2001", "wallet": "0xWALLETUSER"})
# a second rule activation allowed since token 2001 never activated
st, act3 = req("POST", "/api/access/nft/activate", TOK["walletuser"],
               {"wallet": "0xWALLETUSER", "chainId": CHAIN, "contract": CONTRACT, "tokenId": "2001"})
req("POST", "/api/admin/entitlements/subscriptions", TOK["admin"],
    {"user": WU, "planCode": "FOMO_AI_MEMBERSHIP", "activate": True})
d = explain(WU)
srcs = {s.get("type") for s in d.get("sources", [])}
check("S7a both sources present", "NFT_ACTIVATION" in srcs and "SUBSCRIPTION" in srcs, str(srcs))
check("S7b allowed with two independent sources", d.get("allowed") is True, json.dumps(d)[:160])

clean()
passed = sum(1 for _, c, _ in results if c)
print(f"\n==== {passed}/{len(results)} PASSED ====")
sys.exit(0 if passed == len(results) else 1)
