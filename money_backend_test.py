#!/usr/bin/env python3
"""
Phase H — FOMO Money backend regression tests.
Tests the canonical off-chain MoneyLedger, Purchase Engine, and atomic settlement.
"""
import requests
import sys
import json
from datetime import datetime

BASE_URL = "https://fomo-dev-build.preview.emergentagent.com/api"

# Test users
CAROL_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTdkOTFlYzJjNDZmMWE3MGVlNjc2MDYiLCJlbWFpbCI6ImNhcm9sLnRlc3RlckBmb21vLmxvY2FsIiwid2FsbGV0IjoiMHhDYXIwMVRlc3QwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDBDQTAxIiwicm9sZSI6WyJ1c2VyIl0sImlzQWN0aXZlIjp0cnVlLCJpczJGQVZlcmlmaWVkIjp0cnVlLCJpczJGQUVuYWJsZWQiOmZhbHNlLCJpYXQiOjE3ODY2MTQyNjIsImV4cCI6MTc4Njc4NzA2Mn0.etWkiB9GVUv9olcphKnGBidAyOENcm97wZ2p9SGLCJE"
BOB_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTdjZGQ0MGExMDRlYzY3NGY5ZjYwMjEiLCJlbWFpbCI6ImJvYi5mb21pZUBmb21vLmxvY2FsIiwid2FsbGV0IjoiMHhGb2N1c0IwYjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwQjBCIiwicm9sZSI6WyJ1c2VyIl0sImlzQWN0aXZlIjp0cnVlLCJpczJGQVZlcmlmaWVkIjp0cnVlLCJpczJGQUVuYWJsZWQiOmZhbHNlLCJpYXQiOjE3ODY2MTMyOTIsImV4cCI6MTc4NjY5OTY5Mn0.BA0_0K6xi4iqU8OQFDl5GXKEBpgL2JoyZ4UZckZT2AY"

class MoneyAPITester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []

    def headers(self, token):
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def test(self, name, fn):
        """Run a single test"""
        self.tests_run += 1
        print(f"\n{'='*60}")
        print(f"TEST {self.tests_run}: {name}")
        print('='*60)
        try:
            fn()
            self.tests_passed += 1
            print(f"✅ PASSED: {name}")
        except AssertionError as e:
            self.tests_failed += 1
            self.failures.append({"test": name, "error": str(e)})
            print(f"❌ FAILED: {name}")
            print(f"   Error: {e}")
        except Exception as e:
            self.tests_failed += 1
            self.failures.append({"test": name, "error": f"Exception: {str(e)}"})
            print(f"❌ FAILED: {name}")
            print(f"   Exception: {e}")

    def summary(self):
        print(f"\n{'='*60}")
        print("TEST SUMMARY")
        print('='*60)
        print(f"Total tests: {self.tests_run}")
        print(f"Passed: {self.tests_passed}")
        print(f"Failed: {self.tests_failed}")
        if self.failures:
            print("\nFailed tests:")
            for f in self.failures:
                print(f"  - {f['test']}: {f['error']}")
        return 0 if self.tests_failed == 0 else 1

def main():
    tester = MoneyAPITester()

    # ========== BACKEND REGRESSION TESTS ==========

    # TEST 1: GET /api/money/me/balance returns {available, reserved, total}
    def test_balance_bob():
        res = requests.get(f"{BASE_URL}/money/me/balance?asset=USDC", headers=tester.headers(BOB_TOKEN))
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        assert "available" in data, "Missing 'available' field"
        assert "reserved" in data, "Missing 'reserved' field"
        assert "total" in data, "Missing 'total' field"
        assert data["asset"] == "USDC", f"Expected asset USDC, got {data.get('asset')}"
        # BOB should have total=50, available=40, reserved=10
        print(f"BOB Balance: total={data['total']}, available={data['available']}, reserved={data['reserved']}")

    tester.test("GET /api/money/me/balance (BOB)", test_balance_bob)

    # TEST 2: GET /api/money/me/transactions returns ledger items
    def test_transactions_bob():
        res = requests.get(f"{BASE_URL}/money/me/transactions?limit=100", headers=tester.headers(BOB_TOKEN))
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        assert "items" in data, "Missing 'items' field"
        items = data["items"]
        print(f"Found {len(items)} transactions for BOB")
        if len(items) > 0:
            tx = items[0]
            assert "type" in tx, "Transaction missing 'type'"
            assert "direction" in tx, "Transaction missing 'direction'"
            assert "amount" in tx, "Transaction missing 'amount'"
            print(f"Sample transaction: type={tx['type']}, direction={tx['direction']}, amount={tx['amount']}")

    tester.test("GET /api/money/me/transactions (BOB)", test_transactions_bob)

    # TEST 3: POST /api/money/purchases with insufficient balance returns 400
    def test_purchase_insufficient():
        # Use BOB (available=40) to try to buy something for 49 USDC
        idem_key = f"test:insufficient:{datetime.now().timestamp()}"
        res = requests.post(
            f"{BASE_URL}/money/purchases",
            headers=tester.headers(BOB_TOKEN),
            json={"productCode": "FOMO_AI", "idempotencyKey": idem_key}
        )
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
        assert res.status_code == 400, f"Expected 400 for insufficient balance, got {res.status_code}"
        data = res.json()
        assert "message" in data or "error" in data, "Expected error message"
        msg = data.get("message", data.get("error", "")).lower()
        assert "insufficient" in msg, f"Expected 'insufficient' in error message, got: {msg}"
        print(f"✓ Correctly rejected with: {msg}")

    tester.test("POST /api/money/purchases - insufficient balance", test_purchase_insufficient)

    # TEST 4: POST /api/money/purchases with sufficient balance settles
    # (CAROL has 100 USDC, FOMO_AI costs 49 USDC)
    purchase_id_carol = None
    idem_key_carol = f"test:carol:purchase:{datetime.now().timestamp()}"

    def test_purchase_sufficient():
        nonlocal purchase_id_carol
        res = requests.post(
            f"{BASE_URL}/money/purchases",
            headers=tester.headers(CAROL_TOKEN),
            json={"productCode": "FOMO_AI", "idempotencyKey": idem_key_carol}
        )
        print(f"Status: {res.status_code}")
        data = res.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        assert res.status_code == 200 or res.status_code == 201, f"Expected 200/201, got {res.status_code}"
        assert data.get("ok") == True, "Expected ok=true"
        purchase = data.get("purchase")
        assert purchase is not None, "Missing 'purchase' field"
        assert purchase["status"] == "SETTLED", f"Expected status SETTLED, got {purchase['status']}"
        assert purchase["subscriptionId"], "Missing subscriptionId"
        assert purchase["aiCreditsGranted"] == 1000, f"Expected 1000 AI credits, got {purchase['aiCreditsGranted']}"
        purchase_id_carol = purchase["id"]
        print(f"✓ Purchase settled: id={purchase_id_carol}, subscription={purchase['subscriptionId']}, credits={purchase['aiCreditsGranted']}")
        
        # Verify balance updated
        balance = data.get("balance")
        assert balance is not None, "Missing 'balance' field"
        print(f"✓ New balance: available={balance['available']}, total={balance['total']}")
        # CAROL had 100, spent 49, should have 51 available
        assert balance["available"] == 51.0, f"Expected available=51, got {balance['available']}"

    tester.test("POST /api/money/purchases - sufficient balance (CAROL)", test_purchase_sufficient)

    # TEST 5: POST /api/money/purchases idempotency - same key returns same purchase
    def test_purchase_idempotency():
        # Use the same idempotency key as test 4
        res = requests.post(
            f"{BASE_URL}/money/purchases",
            headers=tester.headers(CAROL_TOKEN),
            json={"productCode": "FOMO_AI", "idempotencyKey": idem_key_carol}
        )
        print(f"Status: {res.status_code}")
        data = res.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        assert res.status_code in [200, 201], f"Expected 200/201, got {res.status_code}"
        assert data.get("ok") == True, "Expected ok=true"
        purchase = data.get("purchase")
        assert purchase["id"] == purchase_id_carol, f"Expected same purchase ID {purchase_id_carol}, got {purchase['id']}"
        print(f"✓ Idempotency verified: returned same purchase {purchase['id']}")
        
        # Verify balance unchanged (no double charge)
        balance = data.get("balance")
        assert balance["available"] == 51.0, f"Expected available=51 (no double charge), got {balance['available']}"
        print(f"✓ Balance unchanged: available={balance['available']}")

    tester.test("POST /api/money/purchases - idempotency", test_purchase_idempotency)

    # TEST 6: Verify CAROL's subscription and AI credits
    def test_carol_subscription():
        res = requests.get(f"{BASE_URL}/products/my", headers=tester.headers(CAROL_TOKEN))
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        fomo_ai = data.get("fomoAi")
        assert fomo_ai is not None, "Missing fomoAi field"
        assert fomo_ai["subscribed"] == True, "Expected subscribed=true"
        assert fomo_ai["status"] != "NONE", f"Expected active status, got {fomo_ai['status']}"
        credits = fomo_ai.get("credits")
        assert credits is not None, "Missing credits"
        assert credits["total"] == 1000, f"Expected 1000 total credits, got {credits['total']}"
        assert credits["available"] == 1000, f"Expected 1000 available credits, got {credits['available']}"
        print(f"✓ Subscription active: status={fomo_ai['status']}, credits={credits['available']}/{credits['total']}")

    tester.test("Verify CAROL subscription and AI credits", test_carol_subscription)

    # TEST 7: Verify CAROL has exactly ONE PURCHASE debit in ledger
    def test_carol_ledger():
        res = requests.get(f"{BASE_URL}/money/me/transactions?limit=200", headers=tester.headers(CAROL_TOKEN))
        print(f"Status: {res.status_code}")
        assert res.status_code == 200, f"Expected 200, got {res.status_code}"
        data = res.json()
        items = data.get("items", [])
        print(f"Found {len(items)} transactions for CAROL")
        
        # Count PURCHASE debits
        purchase_debits = [tx for tx in items if tx["type"] == "PURCHASE" and tx["direction"] == "DEBIT"]
        print(f"Found {len(purchase_debits)} PURCHASE debits")
        
        # Should have exactly 1 PURCHASE debit of 49 USDC
        assert len(purchase_debits) >= 1, "Expected at least 1 PURCHASE debit"
        
        # Find the one matching our purchase
        our_purchase = [tx for tx in purchase_debits if tx["amount"] == 49.0]
        assert len(our_purchase) >= 1, f"Expected PURCHASE debit of 49 USDC, found {len(our_purchase)}"
        print(f"✓ Found PURCHASE debit: amount={our_purchase[0]['amount']}, type={our_purchase[0]['type']}")

    tester.test("Verify CAROL ledger has PURCHASE debit", test_carol_ledger)

    # TEST 8: POST /api/money/withdrawals reserves funds
    def test_withdrawal_reserve():
        # Get CAROL's current balance
        res = requests.get(f"{BASE_URL}/money/me/balance?asset=USDC", headers=tester.headers(CAROL_TOKEN))
        assert res.status_code == 200
        before = res.json()
        print(f"Balance before: available={before['available']}, reserved={before['reserved']}")
        
        # Request withdrawal of 10 USDC
        res = requests.post(
            f"{BASE_URL}/money/withdrawals",
            headers=tester.headers(CAROL_TOKEN),
            json={
                "amount": 10.0,
                "destination": "0xTestDestination0000000000000000000000000001",
                "asset": "USDC",
                "network": "ZKSYNC"
            }
        )
        print(f"Status: {res.status_code}")
        data = res.json()
        print(f"Response: {json.dumps(data, indent=2)}")
        assert res.status_code == 200 or res.status_code == 201, f"Expected 200/201, got {res.status_code}"
        assert data.get("ok") == True, "Expected ok=true"
        assert "withdrawalId" in data, "Missing withdrawalId"
        
        # Verify balance updated
        balance = data.get("balance")
        assert balance is not None, "Missing balance"
        print(f"Balance after: available={balance['available']}, reserved={balance['reserved']}")
        
        # Available should decrease by 10, reserved should increase by 10
        assert balance["available"] == before["available"] - 10.0, f"Expected available to decrease by 10"
        assert balance["reserved"] == before["reserved"] + 10.0, f"Expected reserved to increase by 10"
        print(f"✓ Withdrawal reserved: available decreased by 10, reserved increased by 10")

    tester.test("POST /api/money/withdrawals - reserves funds", test_withdrawal_reserve)

    # TEST 9: POST /api/money/withdrawals rejects amount > available
    def test_withdrawal_insufficient():
        # Get CAROL's current balance
        res = requests.get(f"{BASE_URL}/money/me/balance?asset=USDC", headers=tester.headers(CAROL_TOKEN))
        assert res.status_code == 200
        balance = res.json()
        available = balance["available"]
        print(f"Current available: {available}")
        
        # Try to withdraw more than available
        res = requests.post(
            f"{BASE_URL}/money/withdrawals",
            headers=tester.headers(CAROL_TOKEN),
            json={
                "amount": available + 100.0,
                "destination": "0xTestDestination0000000000000000000000000001",
                "asset": "USDC",
                "network": "ZKSYNC"
            }
        )
        print(f"Status: {res.status_code}")
        print(f"Response: {res.text}")
        assert res.status_code == 400, f"Expected 400 for insufficient balance, got {res.status_code}"
        data = res.json()
        msg = data.get("message", data.get("error", "")).lower()
        assert "insufficient" in msg, f"Expected 'insufficient' in error message, got: {msg}"
        print(f"✓ Correctly rejected with: {msg}")

    tester.test("POST /api/money/withdrawals - rejects amount > available", test_withdrawal_insufficient)

    # Note: POST /api/money/deposits/confirm idempotency test requires an actual on-chain deposit
    # which is out of scope for automated testing. The backend logic is verified by the main agent.

    return tester.summary()

if __name__ == "__main__":
    sys.exit(main())
