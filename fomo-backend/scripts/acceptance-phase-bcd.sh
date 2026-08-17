#!/usr/bin/env bash
# Phase B–D backend acceptance (curl). Prints PASS/FAIL per acceptance item.
set -uo pipefail
BASE="http://localhost:8001/api"
ALICE="6a79fcddfab5fd10fac25d9f"        # clean subscriber
WALLET_USER="6a7a04c90921ffa57f69455b"  # 0x94c8... (legacy earlyland grant)

TOKEN=$(curl -s -m10 -X POST "$BASE/user/admin/login" -H "Content-Type: application/json" \
  -d '{"email":"admin@fomo.local","password":"Admin@12345"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).accessToken')
AUTH=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")
j(){ node -e 'let d="";process.stdin.on("data",c=>d+=c).on("end",()=>{try{const o=JSON.parse(d);console.log(eval(process.argv[1]))}catch(e){console.log("PARSE_ERR:"+d.slice(0,120))}})' "$1"; }
pass(){ echo "  PASS: $1"; }
fail(){ echo "  FAIL: $1"; }

echo "### CLEANUP alice (idempotent test state)"
mongosh --quiet fomo_dev --eval "
db.entitlements.deleteMany({userId:ObjectId('$ALICE')});
db.entitlement_subscriptions.deleteMany({userId:ObjectId('$ALICE')});
db.ai_credit_transactions.deleteMany({userId:ObjectId('$ALICE')});
db.ai_credit_reservations.deleteMany({userId:ObjectId('$ALICE')});
print('cleaned');" >/dev/null 2>&1

echo "### TEST 1: legacy grant migration -> resolver ALLOW (wallet user)"
R=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/access?userId=$WALLET_USER&capability=earlyland.prime")
echo "$R" | j 'o.allowed' | grep -q true && [ "$(echo "$R" | j 'o.source')" = "legacy_backend_grant" ] && pass "earlyland.prime ALLOW via migrated entitlement (source=$(echo "$R"|j 'o.source'))" || fail "test1 ($R)"

echo "### TEST 2: create Pro subscription -> Prime/Parsing/AI ALLOW + 1000 credits"
SUB=$(curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/subscriptions" -d "{\"user\":\"$ALICE\",\"planCode\":\"FOMO_AI_PRO\"}")
SUBID=$(echo "$SUB" | j 'o.subscription._id')
P1=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/access?userId=$ALICE&capability=earlyland.prime" | j 'o.allowed')
P2=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/access?userId=$ALICE&capability=parsing.access" | j 'o.allowed')
P3=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/access?userId=$ALICE&capability=fomo_ai.access" | j 'o.allowed')
BAL=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/credits/balance?userId=$ALICE" | j 'o.available')
[ "$P1" = "true" ] && [ "$P2" = "true" ] && [ "$P3" = "true" ] && [ "$BAL" = "1000" ] && pass "Pro active: prime/parsing/ai ALLOW, credits=$BAL (sub $SUBID)" || fail "test2 prime=$P1 parsing=$P2 ai=$P3 bal=$BAL"

echo "### TEST 3: admin grant earlyland.prime + expire sub -> prime still ALLOW via grant"
curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/grants" -d "{\"user\":\"$ALICE\",\"capabilityKey\":\"earlyland.prime\",\"reason\":\"acceptance\"}" >/dev/null
curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/subscriptions/$SUBID/expire" >/dev/null
PRIME_AFTER=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/access?userId=$ALICE&capability=earlyland.prime" | j 'o.allowed+"/"+o.source')
AI_AFTER=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/access?userId=$ALICE&capability=fomo_ai.access" | j 'o.allowed')
echo "$PRIME_AFTER" | grep -q "true/admin_grant" && [ "$AI_AFTER" = "false" ] && pass "after expiry: prime ALLOW via admin_grant, fomo_ai DENY ($PRIME_AFTER, ai=$AI_AFTER)" || fail "test3 prime=$PRIME_AFTER ai=$AI_AFTER"

echo "### TEST 4: plan version snapshot (Pro 1000 -> 1500)"
curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/plans" -d '{"code":"FOMO_AI_PRO","name":"FOMO AI Pro","status":"ACTIVE","billingPeriod":"MONTH","durationDays":30,"priceUsd":49,"aiCreditsIncluded":1500,"capabilities":[{"capabilityKey":"fomo_ai.access"},{"capabilityKey":"earlyland.prime"},{"capabilityKey":"parsing.access"}]}' >/dev/null
OLD_CR=$(mongosh --quiet fomo_dev --eval "print(db.entitlement_subscriptions.findOne({_id:ObjectId('$SUBID')}).planSnapshot.aiCreditsIncluded)")
NEWSUB=$(curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/subscriptions" -d "{\"user\":\"$ALICE\",\"planCode\":\"FOMO_AI_PRO\"}")
NEW_CR=$(echo "$NEWSUB" | j 'o.subscription.planSnapshot.aiCreditsIncluded')
NEWSUBID=$(echo "$NEWSUB" | j 'o.subscription._id')
[ "$OLD_CR" = "1000" ] && [ "$NEW_CR" = "1500" ] && pass "old period snapshot=$OLD_CR, new period snapshot=$NEW_CR" || fail "test4 old=$OLD_CR new=$NEW_CR"

echo "### TEST 5/6/7: credit reserve/capture/release/idempotency/insufficient (fresh user state)"
mongosh --quiet fomo_dev --eval "db.ai_credit_transactions.deleteMany({userId:ObjectId('$ALICE')});db.ai_credit_reservations.deleteMany({userId:ObjectId('$ALICE')});" >/dev/null 2>&1
curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/credits/adjust" -d "{\"user\":\"$ALICE\",\"delta\":1000,\"reason\":\"acceptance seed\"}" >/dev/null
# T5 reserve 10 capture 10 -> 990; repeat idempotent -> 990
RES=$(curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/credits/reserve" -d "{\"userId\":\"$ALICE\",\"operationType\":\"deep_research\",\"credits\":10,\"idempotencyKey\":\"acc-t5\"}")
RID=$(echo "$RES" | j 'o.reservation._id')
curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/credits/reservations/$RID/capture" -d '{"actual":10}' >/dev/null
B_AFTER=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/credits/balance?userId=$ALICE" | j 'o.available')
RES_DUP=$(curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/credits/reserve" -d "{\"userId\":\"$ALICE\",\"operationType\":\"deep_research\",\"credits\":10,\"idempotencyKey\":\"acc-t5\"}" | j 'o.duplicate')
B_DUP=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/credits/balance?userId=$ALICE" | j 'o.available')
[ "$B_AFTER" = "990" ] && [ "$RES_DUP" = "true" ] && [ "$B_DUP" = "990" ] && pass "T5 capture 10 -> $B_AFTER; idempotent repeat -> $B_DUP" || fail "T5 after=$B_AFTER dup=$RES_DUP balDup=$B_DUP"
# T6 reserve 10 release -> balance unchanged (990)
RES2=$(curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/credits/reserve" -d "{\"userId\":\"$ALICE\",\"operationType\":\"ask_fomo\",\"credits\":10,\"idempotencyKey\":\"acc-t6\"}")
RID2=$(echo "$RES2" | j 'o.reservation._id')
curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/credits/reservations/$RID2/release" >/dev/null
B_REL=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/credits/balance?userId=$ALICE" | j 'o.available')
[ "$B_REL" = "990" ] && pass "T6 reserve+release -> balance $B_REL (unchanged)" || fail "T6 balance=$B_REL"
# T7 insufficient: try reserve 100000
INSUF=$(curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/credits/reserve" -d "{\"userId\":\"$ALICE\",\"operationType\":\"deep_research\",\"credits\":100000}")
B_INS=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/credits/balance?userId=$ALICE" | j 'o.available')
echo "$INSUF" | grep -q insufficient_credits && [ "$B_INS" = "990" ] && pass "T7 insufficient rejected, balance still $B_INS" || fail "T7 resp=$INSUF bal=$B_INS"

echo "### TEST 9: launchpad.invest HYBRID (access maybe, eligibility external)"
LI=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/access?userId=$ALICE&capability=launchpad.invest")
[ "$(echo "$LI"|j 'o.allowed')" = "false" ] && [ "$(echo "$LI"|j 'o.eligibilityRequired')" = "true" ] && [ "$(echo "$LI"|j 'o.eligibilityProvider')" = "launchpad" ] && pass "launchpad.invest: allowed=false eligibilityRequired=true provider=launchpad (not emulated)" || fail "test9 ($LI)"

echo "### TEST 10: spaceport.stake EXTERNAL_ELIGIBILITY"
SS=$(curl -s -m10 "${AUTH[@]}" "$BASE/admin/entitlements/access?userId=$ALICE&capability=spaceport.stake")
[ "$(echo "$SS"|j 'o.allowed')" = "false" ] && [ "$(echo "$SS"|j 'o.eligibilityProvider')" = "spaceport" ] && pass "spaceport.stake: external eligibility (provider=spaceport, not emulated)" || fail "test10 ($SS)"

echo "### TEST 8: expiry worker reconciliation (idempotent)"
EXP=$(curl -s -m10 "${AUTH[@]}" -X POST "$BASE/admin/entitlements/subscriptions/run-expiry")
echo "  run-expiry -> $EXP"

echo "### CLEANUP acceptance artifacts"
mongosh --quiet fomo_dev --eval "
db.entitlements.deleteMany({userId:ObjectId('$ALICE')});
db.entitlement_subscriptions.deleteMany({userId:ObjectId('$ALICE')});
db.ai_credit_transactions.deleteMany({userId:ObjectId('$ALICE')});
db.ai_credit_reservations.deleteMany({userId:ObjectId('$ALICE')});
db.ai_usage_events.deleteMany({userId:ObjectId('$ALICE')});
print('cleaned alice test data');" >/dev/null 2>&1
echo "DONE"
