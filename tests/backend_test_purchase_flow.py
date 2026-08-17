#!/usr/bin/env python3
"""
Purchase Flow Backend Testing - Bug Fix Verification
Tests that POST /api/money/purchases/legacy correctly DEBITS internal balance.

Bug: Public membership purchase from internal FOMO Balance did NOT debit the user's balance.
Fix: Changed from custody on-chain saga to internal-ledger debit flow (money.checkout -> settle).

Test Coverage:
1. POST /api/money/purchases/legacy with SUFFICIENT balance -> debit, subscription, credits
2. POST /api/money/purchases/legacy with INSUFFICIENT balance -> 400 "Insufficient FOMO Balance"
3. Idempotency: same idempotencyKey should NOT double-debit
4. GET /api/money/me/balance reflects reduced balance after purchase
5. Regression: admin endpoints still work
"""

import requests
import sys
import json
from typing import Dict, Any, Optional
from datetime import datetime
from pymongo import MongoClient

# Base URL from frontend .env
BASE_URL = "https://fullstack-preview-60.preview.emergentagent.com/api"

# MongoDB connection
MONGO_URL = "mongodb://localhost:27017"
DB_NAME = "fomo_dev"

class PurchaseFlowTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.critical_failures = []
        self.admin_token = None
        self.test_user_id = None
        self.test_user_token = None
        self.test_plan_code = None
        
        # MongoDB client
        try:
            self.mongo_client = MongoClient(MONGO_URL, serverSelectionTimeoutMS=5000)
            self.db = self.mongo_client[DB_NAME]
            # Test connection
            self.mongo_client.server_info()
            print("✓ MongoDB connection established")
        except Exception as e:
            print(f"❌ MongoDB connection failed: {e}")
            self.mongo_client = None
            self.db = None

    def _headers(self, token: str) -> Dict[str, str]:
        return {
            "Authorization": f"Bearer {token}",
            "Content-Type": "application/json"
        }

    def _test(self, name: str, method: str, endpoint: str, token: str, 
              expected_status: int, data: Optional[Dict] = None, 
              check_response: Optional[callable] = None) -> tuple[bool, Any]:
        """Run a single API test and return (success, response_data)"""
        url = f"{BASE_URL}/{endpoint}"
        self.tests_run += 1
        
        print(f"\n{'='*80}")
        print(f"🔍 Test #{self.tests_run}: {name}")
        print(f"   {method} {endpoint}")
        print(f"   Expected: {expected_status}")
        if data:
            print(f"   Data: {json.dumps(data, indent=2)}")
        
        try:
            if method == "GET":
                response = requests.get(url, headers=self._headers(token), timeout=15)
            elif method == "POST":
                response = requests.post(url, headers=self._headers(token), json=data or {}, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            status_match = response.status_code == expected_status
            response_data = None
            
            try:
                response_data = response.json() if response.text else {}
            except:
                response_data = {"text": response.text[:200]}
            
            if status_match:
                # Additional response checks if provided
                if check_response:
                    try:
                        check_result = check_response(response_data)
                        if not check_result:
                            print(f"   ❌ FAILED - Status OK but response check failed")
                            print(f"   Response: {json.dumps(response_data, indent=2)}")
                            self.tests_failed += 1
                            return False, response_data
                    except Exception as e:
                        print(f"   ❌ FAILED - Response check error: {e}")
                        self.tests_failed += 1
                        return False, response_data
                
                print(f"   ✅ PASSED - Status: {response.status_code}")
                if response_data:
                    print(f"   Response: {json.dumps(response_data, indent=2)[:500]}")
                self.tests_passed += 1
                return True, response_data
            else:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {json.dumps(response_data, indent=2)}")
                self.tests_failed += 1
                return False, response_data
                
        except Exception as e:
            print(f"   ❌ FAILED - Exception: {str(e)}")
            self.tests_failed += 1
            return False, None

    def setup_test_data(self):
        """Setup test data: admin login, create test user with balance, create test plan"""
        print("\n" + "="*80)
        print("🔧 SETUP: Creating test data")
        print("="*80)
        
        if self.db is None:
            print("❌ MongoDB not available, cannot setup test data")
            self.critical_failures.append("MongoDB connection failed")
            return False
        
        try:
            # 1. Login as admin
            print("\n1. Logging in as admin...")
            success, response = self._test(
                "Admin login",
                "POST", "user/admin/login",
                "", 202,  # Admin login returns 202
                data={"email": "admin@fomo.local", "password": "Admin@12345"}
            )
            
            if not success or not response or "accessToken" not in response:
                print("❌ Admin login failed")
                self.critical_failures.append("Admin login failed")
                return False
            
            self.admin_token = response["accessToken"]
            print(f"✓ Admin token obtained: {self.admin_token[:20]}...")
            
            # 2. Create or find a test plan with low price
            print("\n2. Creating test plan...")
            plans_collection = self.db["entitlement_plans"]
            
            # Check if test plan exists
            test_plan = plans_collection.find_one({"code": "TEST_PLAN_LOW"})
            
            if not test_plan:
                # Create a new test plan
                from bson import ObjectId
                test_plan = {
                    "_id": ObjectId(),
                    "code": "TEST_PLAN_LOW",
                    "name": "Test Plan Low Price",
                    "productType": "FOMO_AI",
                    "priceUsd": 1.00,  # Low price for testing
                    "durationDays": 30,
                    "aiCredits": 100,
                    "aiCreditsIncluded": 100,
                    "status": "ACTIVE",
                    "sortOrder": 999,
                    "version": 1,
                    "createdAt": datetime.utcnow(),
                    "updatedAt": datetime.utcnow()
                }
                plans_collection.insert_one(test_plan)
                print(f"✓ Created test plan: {test_plan['code']} (${test_plan['priceUsd']})")
            else:
                print(f"✓ Found existing test plan: {test_plan['code']} (${test_plan.get('priceUsd', 0)})")
            
            self.test_plan_code = test_plan["code"]
            
            # 3. Get admin user ID from token
            print("\n3. Getting admin user ID...")
            users_collection = self.db["users"]
            ledger_collection = self.db["money_ledger_entries"]
            
            # The admin user ID is in the login response
            admin_user = users_collection.find_one({"email": "admin@fomo.local"})
            if not admin_user:
                print("❌ Admin user not found in database")
                self.critical_failures.append("Admin user not found")
                return False
            
            self.test_user_id = str(admin_user["_id"])
            self.test_user_token = self.admin_token
            print(f"✓ Admin user ID: {self.test_user_id}")
            
            # 4. Add balance to admin user (via ledger CREDIT)
            print("\n4. Adding balance to admin user...")
            
            # Check current balance
            from bson import ObjectId
            ledger_entries = list(ledger_collection.find({"userId": ObjectId(self.test_user_id)}))
            
            credit = sum(e.get("amount", 0) for e in ledger_entries if e.get("direction") == "CREDIT")
            debit = sum(e.get("amount", 0) for e in ledger_entries if e.get("direction") == "DEBIT")
            current_balance = credit - debit
            
            print(f"   Current balance: ${current_balance:.2f}")
            
            # Add balance if needed (ensure at least $5.00 for testing)
            if current_balance < 5.00:
                amount_to_add = 10.00 - current_balance
                ledger_entry = {
                    "_id": ObjectId(),
                    "userId": ObjectId(self.test_user_id),
                    "asset": "USDC",
                    "network": "ZKSYNC",
                    "type": "ADMIN_ADJUSTMENT",
                    "direction": "CREDIT",
                    "amount": amount_to_add,
                    "referenceType": "ADMIN",
                    "referenceId": "test_setup",
                    "txHash": "",
                    "idempotencyKey": f"test_setup_{self.test_user_id}_{datetime.utcnow().timestamp()}",
                    "metadata": {"reason": "Test setup", "reference": "backend_test_purchase_flow"},
                    "createdAt": datetime.utcnow(),
                    "createdBy": "test_setup"
                }
                ledger_collection.insert_one(ledger_entry)
                print(f"✓ Added ${amount_to_add:.2f} to admin user balance")
                current_balance += amount_to_add
            
            print(f"✓ Admin user balance: ${current_balance:.2f}")
            
            print("\n✓ Test data setup complete")
            return True
            
        except Exception as e:
            print(f"❌ Setup failed: {e}")
            import traceback
            traceback.print_exc()
            self.critical_failures.append(f"Setup failed: {e}")
            return False

    def test_sufficient_balance_purchase(self):
        """Test purchase with SUFFICIENT balance - should debit, activate subscription, grant credits"""
        print("\n" + "="*80)
        print("📋 TEST 1: Purchase with SUFFICIENT balance")
        print("="*80)
        
        if not self.test_user_token or not self.test_plan_code:
            print("❌ Test data not setup, skipping test")
            return False
        
        # Get balance before purchase
        print("\n1. Getting balance before purchase...")
        success, balance_before = self._test(
            "Get balance before purchase",
            "GET", "money/me/balance",
            self.test_user_token, 200
        )
        
        if not success or not balance_before:
            print("❌ Failed to get balance before purchase")
            return False
        
        available_before = balance_before.get("available", 0)
        print(f"   Available before: ${available_before:.2f}")
        
        # Make purchase
        print("\n2. Making purchase...")
        idempotency_key = f"test_purchase_{datetime.utcnow().timestamp()}"
        
        def check_purchase_response(data):
            if not data.get("ok"):
                print(f"   ❌ Purchase not ok: {data}")
                return False
            
            purchase = data.get("purchase")
            if not purchase:
                print(f"   ❌ No purchase in response")
                return False
            
            # Check purchase fields
            if purchase.get("status") != "SETTLED":
                print(f"   ❌ Purchase status is {purchase.get('status')}, expected SETTLED")
                return False
            
            if not purchase.get("subscriptionId"):
                print(f"   ❌ No subscriptionId in purchase")
                return False
            
            if not purchase.get("aiCreditsGranted") or purchase.get("aiCreditsGranted") <= 0:
                print(f"   ❌ No AI credits granted: {purchase.get('aiCreditsGranted')}")
                return False
            
            print(f"   ✓ Purchase SETTLED")
            print(f"   ✓ Subscription ID: {purchase.get('subscriptionId')}")
            print(f"   ✓ AI Credits granted: {purchase.get('aiCreditsGranted')}")
            
            # Check balance in response
            balance = data.get("balance")
            if not balance:
                print(f"   ❌ No balance in response")
                return False
            
            available_after = balance.get("available", 0)
            amount = purchase.get("amount", 0)
            
            print(f"   ✓ Available after: ${available_after:.2f}")
            print(f"   ✓ Amount debited: ${amount:.2f}")
            
            # Check that balance was debited
            expected_available = available_before - amount
            if abs(available_after - expected_available) > 0.01:
                print(f"   ❌ Balance not debited correctly: expected ${expected_available:.2f}, got ${available_after:.2f}")
                return False
            
            print(f"   ✓ Balance debited correctly")
            return True
        
        success, purchase_response = self._test(
            "Purchase with sufficient balance",
            "POST", "money/purchases/legacy",
            self.test_user_token, 201,  # Returns 201 Created
            data={"planCode": self.test_plan_code, "idempotencyKey": idempotency_key},
            check_response=check_purchase_response
        )
        
        if not success:
            self.critical_failures.append("Purchase with sufficient balance failed")
            return False
        
        # Verify ledger entry was created
        print("\n3. Verifying ledger entry...")
        if self.db is not None:
            from bson import ObjectId
            ledger_collection = self.db["money_ledger_entries"]
            purchase_id = purchase_response.get("purchase", {}).get("id")
            
            if purchase_id:
                debit_entry = ledger_collection.find_one({
                    "idempotencyKey": f"purchase_settlement:{purchase_id}",
                    "type": "PURCHASE",
                    "direction": "DEBIT"
                })
                
                if debit_entry:
                    print(f"   ✓ DEBIT ledger entry found: ${debit_entry.get('amount', 0):.2f}")
                else:
                    print(f"   ❌ DEBIT ledger entry NOT found")
                    return False
        
        # Get balance after purchase to double-check
        print("\n4. Getting balance after purchase...")
        success, balance_after = self._test(
            "Get balance after purchase",
            "GET", "money/me/balance",
            self.test_user_token, 200
        )
        
        if success and balance_after:
            available_after = balance_after.get("available", 0)
            print(f"   ✓ Available after (verified): ${available_after:.2f}")
        
        return True

    def test_insufficient_balance_purchase(self):
        """Test purchase with INSUFFICIENT balance - should return 400 with error"""
        print("\n" + "="*80)
        print("📋 TEST 2: Purchase with INSUFFICIENT balance")
        print("="*80)
        
        if not self.test_user_token or not self.test_plan_code:
            print("❌ Test data not setup, skipping test")
            return False
        
        # Get current balance
        print("\n1. Getting current balance...")
        success, balance = self._test(
            "Get current balance",
            "GET", "money/me/balance",
            self.test_user_token, 200
        )
        
        if not success or not balance:
            print("❌ Failed to get balance")
            return False
        
        available = balance.get("available", 0)
        print(f"   Available: ${available:.2f}")
        
        # Create a plan with price higher than available balance
        print("\n2. Creating high-price plan...")
        if self.db is not None:
            from bson import ObjectId
            plans_collection = self.db["entitlement_plans"]
            
            high_price_plan = {
                "_id": ObjectId(),
                "code": "TEST_PLAN_HIGH",
                "name": "Test Plan High Price",
                "productType": "FOMO_AI",
                "priceUsd": available + 100.00,  # Much higher than available
                "durationDays": 30,
                "aiCredits": 1000,
                "aiCreditsIncluded": 1000,
                "status": "ACTIVE",
                "sortOrder": 998,
                "version": 1,
                "createdAt": datetime.utcnow(),
                "updatedAt": datetime.utcnow()
            }
            
            # Check if exists
            existing = plans_collection.find_one({"code": "TEST_PLAN_HIGH"})
            if not existing:
                plans_collection.insert_one(high_price_plan)
                print(f"   ✓ Created high-price plan: ${high_price_plan['priceUsd']:.2f}")
            else:
                print(f"   ✓ Using existing high-price plan: ${existing.get('priceUsd', 0):.2f}")
        
        # Try to purchase with insufficient balance
        print("\n3. Attempting purchase with insufficient balance...")
        
        def check_insufficient_error(data):
            message = data.get("message", "")
            if "Insufficient FOMO Balance" not in message:
                print(f"   ❌ Expected 'Insufficient FOMO Balance' in error message, got: {message}")
                return False
            
            print(f"   ✓ Got expected error: {message}")
            return True
        
        success, response = self._test(
            "Purchase with insufficient balance",
            "POST", "money/purchases/legacy",
            self.test_user_token, 400,
            data={"planCode": "TEST_PLAN_HIGH", "idempotencyKey": f"test_insufficient_{datetime.utcnow().timestamp()}"},
            check_response=check_insufficient_error
        )
        
        if not success:
            self.critical_failures.append("Insufficient balance test failed")
            return False
        
        # Verify balance was NOT debited
        print("\n4. Verifying balance was NOT debited...")
        success, balance_after = self._test(
            "Get balance after failed purchase",
            "GET", "money/me/balance",
            self.test_user_token, 200
        )
        
        if success and balance_after:
            available_after = balance_after.get("available", 0)
            if abs(available_after - available) > 0.01:
                print(f"   ❌ Balance changed: was ${available:.2f}, now ${available_after:.2f}")
                return False
            print(f"   ✓ Balance unchanged: ${available_after:.2f}")
        
        return True

    def test_idempotency(self):
        """Test idempotency - same idempotencyKey should NOT double-debit"""
        print("\n" + "="*80)
        print("📋 TEST 3: Idempotency (same idempotencyKey)")
        print("="*80)
        
        if not self.test_user_token or not self.test_plan_code:
            print("❌ Test data not setup, skipping test")
            return False
        
        # Get balance before
        print("\n1. Getting balance before...")
        success, balance_before = self._test(
            "Get balance before",
            "GET", "money/me/balance",
            self.test_user_token, 200
        )
        
        if not success or not balance_before:
            print("❌ Failed to get balance")
            return False
        
        available_before = balance_before.get("available", 0)
        print(f"   Available before: ${available_before:.2f}")
        
        # Make first purchase
        print("\n2. Making first purchase...")
        idempotency_key = f"test_idempotency_{datetime.utcnow().timestamp()}"
        
        success1, response1 = self._test(
            "First purchase",
            "POST", "money/purchases/legacy",
            self.test_user_token, 201,  # Returns 201 Created
            data={"planCode": self.test_plan_code, "idempotencyKey": idempotency_key}
        )
        
        if not success1 or not response1:
            print("❌ First purchase failed")
            return False
        
        purchase1_id = response1.get("purchase", {}).get("id")
        amount = response1.get("purchase", {}).get("amount", 0)
        print(f"   ✓ First purchase ID: {purchase1_id}")
        print(f"   ✓ Amount: ${amount:.2f}")
        
        # Make second purchase with SAME idempotencyKey
        print("\n3. Making second purchase with SAME idempotencyKey...")
        
        success2, response2 = self._test(
            "Second purchase (same idempotencyKey)",
            "POST", "money/purchases/legacy",
            self.test_user_token, 201,  # Returns 201 Created (idempotent)
            data={"planCode": self.test_plan_code, "idempotencyKey": idempotency_key}
        )
        
        if not success2 or not response2:
            print("❌ Second purchase failed")
            return False
        
        purchase2_id = response2.get("purchase", {}).get("id")
        print(f"   ✓ Second purchase ID: {purchase2_id}")
        
        # Check that both purchases have the SAME ID (idempotent)
        if purchase1_id != purchase2_id:
            print(f"   ❌ Purchase IDs differ: {purchase1_id} vs {purchase2_id}")
            self.critical_failures.append("Idempotency failed - different purchase IDs")
            return False
        
        print(f"   ✓ Same purchase returned (idempotent)")
        
        # Get balance after
        print("\n4. Verifying balance was debited ONLY ONCE...")
        success, balance_after = self._test(
            "Get balance after",
            "GET", "money/me/balance",
            self.test_user_token, 200
        )
        
        if success and balance_after:
            available_after = balance_after.get("available", 0)
            expected_available = available_before - amount
            
            if abs(available_after - expected_available) > 0.01:
                print(f"   ❌ Balance incorrect: expected ${expected_available:.2f}, got ${available_after:.2f}")
                self.critical_failures.append("Idempotency failed - balance debited twice")
                return False
            
            print(f"   ✓ Balance debited only once: ${available_after:.2f}")
        
        return True

    def test_admin_regression(self):
        """Test regression - admin endpoints still work"""
        print("\n" + "="*80)
        print("📋 TEST 4: Regression - Admin endpoints")
        print("="*80)
        
        if not self.admin_token:
            print("❌ Admin token not available, skipping test")
            return False
        
        # Test 1: GET /api/admin/money/custody/decomposition
        print("\n1. Testing GET /api/admin/money/custody/decomposition...")
        
        def check_decomposition(data):
            # Check for numeric fields
            if data.get("totalAssets") is None and data.get("totalAssets") != 0:
                print(f"   ⚠️  totalAssets is null (RPC may be unavailable)")
            
            if data.get("knownMoneyLiabilities") is None:
                print(f"   ❌ knownMoneyLiabilities is null")
                return False
            
            status = data.get("status")
            if status not in ["HEALTHY", "HEALTHY_WITH_UNCLASSIFIED", "READS_UNAVAILABLE", "CRITICAL_MISMATCH"]:
                print(f"   ❌ Unexpected status: {status}")
                return False
            
            invariant_ok = data.get("invariantOk")
            if invariant_ok is False:
                print(f"   ❌ invariantOk is false")
                return False
            
            print(f"   ✓ Status: {status}")
            print(f"   ✓ invariantOk: {invariant_ok}")
            print(f"   ✓ knownMoneyLiabilities: {data.get('knownMoneyLiabilities')}")
            return True
        
        success1, _ = self._test(
            "GET custody decomposition",
            "GET", "admin/money/custody/decomposition",
            self.admin_token, 200,
            check_response=check_decomposition
        )
        
        # Test 2: GET /api/admin/money/settlement-items/summary
        print("\n2. Testing GET /api/admin/money/settlement-items/summary...")
        
        success2, _ = self._test(
            "GET settlement items summary",
            "GET", "admin/money/settlement-items/summary",
            self.admin_token, 200
        )
        
        return success1 and success2

    def run_all_tests(self):
        """Run all purchase flow tests"""
        print("\n" + "🚀"*40)
        print("PURCHASE FLOW BACKEND TESTING")
        print("Bug Fix: Internal balance debit verification")
        print("🚀"*40)
        
        try:
            # Setup test data
            if not self.setup_test_data():
                print("\n❌ Setup failed, cannot continue with tests")
                return 1
            
            # Run tests
            self.test_sufficient_balance_purchase()
            self.test_insufficient_balance_purchase()
            self.test_idempotency()
            self.test_admin_regression()
            
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR: {e}")
            import traceback
            traceback.print_exc()
            self.critical_failures.append(str(e))
        
        # Print summary
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        print(f"Total tests run: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_failed}")
        if self.tests_run > 0:
            print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.critical_failures:
            print(f"\n🚨 CRITICAL FAILURES:")
            for failure in self.critical_failures:
                print(f"   - {failure}")
        
        print("="*80)
        
        # Cleanup
        if self.mongo_client:
            self.mongo_client.close()
        
        # Return exit code
        return 0 if self.tests_failed == 0 and not self.critical_failures else 1

def main():
    tester = PurchaseFlowTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
