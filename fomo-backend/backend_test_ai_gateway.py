#!/usr/bin/env python3
"""
FOMO AI Gateway Backend Test Suite (Phase E P2-P8)
Tests: Gateway execute, idempotency, access control, credits, pricing, usage analytics
"""
import requests
import sys
import json
import subprocess
from datetime import datetime
from typing import Dict, Any, Optional
from time import sleep

# Base URL from frontend .env (public endpoint)
BASE_URL = "https://monetization-core-1.preview.emergentagent.com/api"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

class AiGatewayTester:
    def __init__(self):
        self.token: Optional[str] = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.results = []
        self.test_user_id = None
        self.test_user_no_capability_id = None
        
    def log(self, message: str, level: str = "info"):
        """Log with color"""
        colors = {"info": Colors.BLUE, "success": Colors.GREEN, "error": Colors.RED, "warning": Colors.YELLOW}
        color = colors.get(level, Colors.RESET)
        print(f"{color}{message}{Colors.RESET}")
    
    def test(self, name: str, method: str, endpoint: str, expected_status: int, 
             data: Optional[Dict] = None, headers: Optional[Dict] = None,
             validate_fn: Optional[callable] = None, accept_statuses: Optional[list] = None) -> Dict[str, Any]:
        """Run a single test"""
        self.tests_run += 1
        url = f"{BASE_URL}/{endpoint}"
        
        # Prepare headers
        req_headers = {'Content-Type': 'application/json'}
        if self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            req_headers.update(headers)
        
        self.log(f"\n[{self.tests_run}] Testing: {name}", "info")
        self.log(f"    {method} {endpoint}", "info")
        
        try:
            # Make request
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=60)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=60)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=60)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Check status (allow multiple acceptable statuses)
            acceptable = accept_statuses if accept_statuses else [expected_status]
            status_ok = response.status_code in acceptable
            
            # Parse response
            try:
                response_data = response.json() if response.text else {}
            except:
                response_data = {"raw": response.text}
            
            # Custom validation
            validation_ok = True
            validation_msg = ""
            if validate_fn and status_ok:
                try:
                    validation_ok, validation_msg = validate_fn(response_data)
                except Exception as e:
                    validation_ok = False
                    validation_msg = f"Validation error: {str(e)}"
            
            # Overall success
            success = status_ok and validation_ok
            
            if success:
                self.tests_passed += 1
                self.log(f"    ✅ PASSED - Status: {response.status_code}", "success")
                if validation_msg:
                    self.log(f"    {validation_msg}", "success")
            else:
                self.tests_failed += 1
                self.log(f"    ❌ FAILED", "error")
                if not status_ok:
                    self.log(f"    Expected status {expected_status}, got {response.status_code}", "error")
                if not validation_ok:
                    self.log(f"    {validation_msg}", "error")
                self.log(f"    Response: {json.dumps(response_data, indent=2)[:800]}", "error")
            
            result = {
                "test": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "validation_msg": validation_msg,
                "response_preview": str(response_data)[:300]
            }
            self.results.append(result)
            
            return {"success": success, "data": response_data, "status": response.status_code}
            
        except Exception as e:
            self.tests_failed += 1
            self.log(f"    ❌ FAILED - Exception: {str(e)}", "error")
            result = {
                "test": name,
                "endpoint": endpoint,
                "method": method,
                "success": False,
                "error": str(e)
            }
            self.results.append(result)
            return {"success": False, "error": str(e)}
    
    def get_mongo_count(self, collection: str, query: str = "{}") -> int:
        """Get count from MongoDB collection"""
        try:
            cmd = f'mongosh fomo_dev --quiet --eval "db.{collection}.countDocuments({query})"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            # Extract just the number from output
            for line in result.stdout.split('\n'):
                line = line.strip()
                if line.isdigit():
                    return int(line)
            return 0
        except:
            return 0
    
    def get_mongo_doc(self, collection: str, query: str) -> Optional[Dict]:
        """Get a document from MongoDB"""
        try:
            cmd = f'mongosh fomo_dev --quiet --eval "JSON.stringify(db.{collection}.findOne({query}))"'
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
            for line in result.stdout.split('\n'):
                line = line.strip()
                if line.startswith('{'):
                    return json.loads(line)
            return None
        except Exception as e:
            self.log(f"MongoDB query error: {e}", "error")
            return None
    
    def setup_test_users(self):
        """Create test users with appropriate subscriptions"""
        self.log("\n### SETUP: Creating test users ###", "warning")
        
        # Create user WITH FOMO_AI_PRO subscription (has fomo_ai.access + fomo_ai.portfolio_analysis)
        result = self.test(
            "Setup: Create test user with FOMO_AI_PRO subscription",
            "POST",
            "admin/entitlements/subscriptions",
            200,
            accept_statuses=[200, 201],
            data={
                "user": "admin@fomo.local",  # Use admin for simplicity
                "planCode": "FOMO_AI_PRO",
                "activate": True
            },
            validate_fn=lambda r: (
                r.get("ok") == True and "subscription" in r,
                f"✓ Subscription created: {r.get('subscription', {}).get('_id', 'N/A')}"
            )
        )
        
        if result["success"]:
            # Get admin user ID
            self.test_user_id = "6a79fcdddac74dd8de81b1e4"
            self.log(f"    Test user ID: {self.test_user_id}", "success")
            
            # Verify balance
            balance_result = self.test(
                "Setup: Verify initial balance",
                "GET",
                f"admin/entitlements/credits/balance?userId={self.test_user_id}",
                200,
                validate_fn=lambda r: (
                    "total" in r and r["total"] >= 0,
                    f"✓ Balance: {r.get('total', 0)} credits (monthly: {r.get('monthly', 0)}, topup: {r.get('topup', 0)})"
                )
            )
            
            # If balance is low, add credits
            if balance_result["success"] and balance_result["data"].get("total", 0) < 100:
                self.test(
                    "Setup: Add credits to test user",
                    "POST",
                    "admin/entitlements/credits/adjust",
                    200,
                    accept_statuses=[200, 201],
                    data={
                        "user": self.test_user_id,
                        "delta": 1000,
                        "reason": "Test setup"
                    }
                )
        
        # Create user WITHOUT deep_research capability (for access denied test)
        # We'll use the same user but test with deep_research operation which is NOT in FOMO_AI_PRO
        self.test_user_no_capability_id = self.test_user_id
    
    def run_all_tests(self):
        """Execute all test suites"""
        self.log("\n" + "="*80, "info")
        self.log("FOMO AI GATEWAY TEST SUITE - PHASE E P2-P8", "info")
        self.log("="*80 + "\n", "info")
        
        # 1. Get admin token
        self.log("\n### 1. AUTHENTICATION ###", "warning")
        try:
            result = subprocess.run(
                ["node", "/app/fomo-backend/mint_admin_token.js"],
                capture_output=True,
                text=True,
                cwd="/app/fomo-backend"
            )
            self.token = result.stdout.strip()
            self.log(f"    Token acquired: {self.token[:30]}...", "success")
        except Exception as e:
            self.log(f"    ⚠️  Cannot get token: {e}. Stopping tests.", "error")
            return self.print_summary()
        
        # 2. Setup test users
        self.setup_test_users()
        
        if not self.test_user_id:
            self.log("    ⚠️  Cannot proceed without test user. Stopping tests.", "error")
            return self.print_summary()
        
        # 3. Test Gateway Execute USER success (mock mode)
        self.log("\n### 2. GATEWAY EXECUTE USER SUCCESS (MOCK) ###", "warning")
        
        # Get balance before
        balance_before_result = self.test(
            "Get balance before execute",
            "GET",
            f"admin/entitlements/credits/balance?userId={self.test_user_id}",
            200
        )
        balance_before = balance_before_result["data"].get("total", 0) if balance_before_result["success"] else 0
        
        # Execute ask_fomo
        idempotency_key_1 = f"test_execute_{datetime.now().timestamp()}"
        execute_result = self.test(
            "Gateway execute: ask_fomo (USER, mock)",
            "POST",
            "admin/entitlements/ai/gateway/execute",
            200,
            accept_statuses=[200, 201],
            data={
                "userId": self.test_user_id,
                "operation": "ask_fomo",
                "input": "What is FOMO?",
                "idempotencyKey": idempotency_key_1
            },
            validate_fn=lambda r: (
                r.get("ok") == True and 
                r.get("status") == "COMPLETED" and 
                r.get("dataMode") == "mock" and
                r.get("credits", {}).get("captured", 0) >= 1,
                f"✓ Status: {r.get('status')}, dataMode: {r.get('dataMode')}, captured: {r.get('credits', {}).get('captured', 0)} credits"
            )
        )
        
        if execute_result["success"]:
            captured_credits = execute_result["data"].get("credits", {}).get("captured", 0)
            
            # Get balance after
            balance_after_result = self.test(
                "Verify balance decreased after execute",
                "GET",
                f"admin/entitlements/credits/balance?userId={self.test_user_id}",
                200,
                validate_fn=lambda r: (
                    r.get("total", 0) == balance_before - captured_credits,
                    f"✓ Balance decreased by {captured_credits} credits (before: {balance_before}, after: {r.get('total', 0)})"
                )
            )
        
        # 4. Test Idempotency
        self.log("\n### 3. IDEMPOTENCY ###", "warning")
        
        # Get balance before duplicate
        balance_before_dup = self.test(
            "Get balance before duplicate execute",
            "GET",
            f"admin/entitlements/credits/balance?userId={self.test_user_id}",
            200
        )
        balance_before_dup_val = balance_before_dup["data"].get("total", 0) if balance_before_dup["success"] else 0
        
        # Count events and reservations before
        events_before = self.get_mongo_count("ai_usage_events", f"{{'idempotencyKey': '{idempotency_key_1}'}}")
        reservations_before = self.get_mongo_count("ai_credit_reservations", f"{{'idempotencyKey': '{idempotency_key_1}:reserve'}}")
        
        # Execute with SAME idempotency key
        duplicate_result = self.test(
            "Gateway execute: duplicate idempotency key",
            "POST",
            "admin/entitlements/ai/gateway/execute",
            200,
            accept_statuses=[200, 201],
            data={
                "userId": self.test_user_id,
                "operation": "ask_fomo",
                "input": "What is FOMO?",
                "idempotencyKey": idempotency_key_1  # SAME KEY
            },
            validate_fn=lambda r: (
                r.get("duplicate") == True and r.get("ok") == True,
                f"✓ Duplicate detected: {r.get('duplicate')}, status: {r.get('status')}"
            )
        )
        
        # Verify balance unchanged
        balance_after_dup = self.test(
            "Verify balance unchanged after duplicate",
            "GET",
            f"admin/entitlements/credits/balance?userId={self.test_user_id}",
            200,
            validate_fn=lambda r: (
                r.get("total", 0) == balance_before_dup_val,
                f"✓ Balance unchanged (before: {balance_before_dup_val}, after: {r.get('total', 0)})"
            )
        )
        
        # Count events and reservations after
        events_after = self.get_mongo_count("ai_usage_events", f"{{'idempotencyKey': '{idempotency_key_1}'}}")
        reservations_after = self.get_mongo_count("ai_credit_reservations", f"{{'idempotencyKey': '{idempotency_key_1}:reserve'}}")
        
        self.log(f"    Events: before={events_before}, after={events_after} (should be 1)", "info")
        self.log(f"    Reservations: before={reservations_before}, after={reservations_after} (should be 1)", "info")
        
        if events_after == 1 and reservations_after == 1:
            self.tests_passed += 1
            self.log(f"    ✅ PASSED - Exactly ONE event and ONE reservation for idempotency key", "success")
            self.results.append({
                "test": "Idempotency: DB verification",
                "success": True,
                "validation_msg": f"Exactly 1 event and 1 reservation for key {idempotency_key_1}"
            })
        else:
            self.tests_failed += 1
            self.log(f"    ❌ FAILED - Expected 1 event and 1 reservation, got {events_after} events and {reservations_after} reservations", "error")
            self.results.append({
                "test": "Idempotency: DB verification",
                "success": False,
                "validation_msg": f"Expected 1 event and 1 reservation, got {events_after} events and {reservations_after} reservations"
            })
        
        # 5. Test Access Denied
        self.log("\n### 4. ACCESS DENIED ###", "warning")
        
        # Count events and reservations before
        events_before_denied = self.get_mongo_count("ai_usage_events")
        reservations_before_denied = self.get_mongo_count("ai_credit_reservations")
        
        # Execute deep_research (user does NOT have fomo_ai.deep_research capability)
        access_denied_result = self.test(
            "Gateway execute: deep_research (no capability)",
            "POST",
            "admin/entitlements/ai/gateway/execute",
            200,
            accept_statuses=[200, 201],
            data={
                "userId": self.test_user_no_capability_id,
                "operation": "deep_research",
                "input": "Research topic",
                "idempotencyKey": f"test_access_denied_{datetime.now().timestamp()}"
            },
            validate_fn=lambda r: (
                r.get("ok") == False and 
                r.get("status") == "ACCESS_DENIED" and
                r.get("errorCode") == "access_denied",
                f"✓ Status: {r.get('status')}, errorCode: {r.get('errorCode')}"
            )
        )
        
        # Count events and reservations after
        events_after_denied = self.get_mongo_count("ai_usage_events")
        reservations_after_denied = self.get_mongo_count("ai_credit_reservations")
        
        self.log(f"    Events: before={events_before_denied}, after={events_after_denied} (should be same)", "info")
        self.log(f"    Reservations: before={reservations_before_denied}, after={reservations_after_denied} (should be same)", "info")
        
        if events_after_denied == events_before_denied and reservations_after_denied == reservations_before_denied:
            self.tests_passed += 1
            self.log(f"    ✅ PASSED - NO event or reservation created for access denied", "success")
            self.results.append({
                "test": "Access denied: DB verification",
                "success": True,
                "validation_msg": "No event or reservation created"
            })
        else:
            self.tests_failed += 1
            self.log(f"    ❌ FAILED - Events or reservations were created for access denied", "error")
            self.results.append({
                "test": "Access denied: DB verification",
                "success": False,
                "validation_msg": f"Events increased by {events_after_denied - events_before_denied}, reservations by {reservations_after_denied - reservations_before_denied}"
            })
        
        # 6. Test Insufficient Credits
        self.log("\n### 5. INSUFFICIENT CREDITS ###", "warning")
        
        # Drain balance to 0
        current_balance = self.test(
            "Get current balance",
            "GET",
            f"admin/entitlements/credits/balance?userId={self.test_user_id}",
            200
        )
        
        if current_balance["success"]:
            balance = current_balance["data"].get("total", 0)
            if balance > 0:
                self.test(
                    "Drain balance to 0",
                    "POST",
                    "admin/entitlements/credits/adjust",
                    200,
                    accept_statuses=[200, 201],
                    data={
                        "user": self.test_user_id,
                        "delta": -balance,
                        "reason": "Test insufficient credits"
                    }
                )
        
        # Count reservations before
        reservations_before_insufficient = self.get_mongo_count("ai_credit_reservations", "{'status': 'RESERVED'}")
        
        # Try to execute with 0 balance
        insufficient_result = self.test(
            "Gateway execute: insufficient credits",
            "POST",
            "admin/entitlements/ai/gateway/execute",
            200,
            accept_statuses=[200, 201],
            data={
                "userId": self.test_user_id,
                "operation": "ask_fomo",
                "input": "What is FOMO?",
                "idempotencyKey": f"test_insufficient_{datetime.now().timestamp()}"
            },
            validate_fn=lambda r: (
                r.get("ok") == False and 
                r.get("status") == "FAILED" and
                r.get("errorCode") == "insufficient_credits" and
                r.get("content") is None,
                f"✓ Status: {r.get('status')}, errorCode: {r.get('errorCode')}, content: {r.get('content')}"
            )
        )
        
        # Count reservations after (should be same, no leaked RESERVED)
        reservations_after_insufficient = self.get_mongo_count("ai_credit_reservations", "{'status': 'RESERVED'}")
        
        self.log(f"    RESERVED reservations: before={reservations_before_insufficient}, after={reservations_after_insufficient} (should be same)", "info")
        
        if reservations_after_insufficient == reservations_before_insufficient:
            self.tests_passed += 1
            self.log(f"    ✅ PASSED - No leaked RESERVED reservation", "success")
            self.results.append({
                "test": "Insufficient credits: No leaked reservation",
                "success": True,
                "validation_msg": "No RESERVED reservation left"
            })
        else:
            self.tests_failed += 1
            self.log(f"    ❌ FAILED - Leaked RESERVED reservation detected", "error")
            self.results.append({
                "test": "Insufficient credits: No leaked reservation",
                "success": False,
                "validation_msg": f"RESERVED reservations increased by {reservations_after_insufficient - reservations_before_insufficient}"
            })
        
        # Restore balance for remaining tests
        self.test(
            "Restore balance for remaining tests",
            "POST",
            "admin/entitlements/credits/adjust",
            200,
            accept_statuses=[200, 201],
            data={
                "user": self.test_user_id,
                "delta": 1000,
                "reason": "Restore after insufficient test"
            }
        )
        
        # 7. Test INTERNAL Billing Context
        self.log("\n### 6. INTERNAL BILLING CONTEXT ###", "warning")
        
        # Get balance before
        balance_before_internal = self.test(
            "Get balance before INTERNAL execute",
            "GET",
            f"admin/entitlements/credits/balance?userId={self.test_user_id}",
            200
        )
        balance_before_internal_val = balance_before_internal["data"].get("total", 0) if balance_before_internal["success"] else 0
        
        # Count INTERNAL events before
        internal_events_before = self.get_mongo_count("ai_usage_events", "{'billingContext': 'INTERNAL'}")
        
        # Execute with INTERNAL billing context
        internal_result = self.test(
            "Gateway execute: INTERNAL billing context",
            "POST",
            "admin/entitlements/ai/gateway/execute",
            200,
            accept_statuses=[200, 201],
            data={
                "userId": self.test_user_id,
                "operation": "activity_ai_review",
                "input": "Review this activity",
                "billingContext": "INTERNAL",
                "idempotencyKey": f"test_internal_{datetime.now().timestamp()}"
            },
            validate_fn=lambda r: (
                r.get("ok") == True and 
                r.get("status") == "COMPLETED" and
                r.get("credits", {}).get("captured", -1) == 0,
                f"✓ Status: {r.get('status')}, creditsCaptured: {r.get('credits', {}).get('captured', 0)}"
            )
        )
        
        # Get balance after
        balance_after_internal = self.test(
            "Verify balance unchanged after INTERNAL execute",
            "GET",
            f"admin/entitlements/credits/balance?userId={self.test_user_id}",
            200,
            validate_fn=lambda r: (
                r.get("total", 0) == balance_before_internal_val,
                f"✓ Balance unchanged (before: {balance_before_internal_val}, after: {r.get('total', 0)})"
            )
        )
        
        # Count INTERNAL events after
        internal_events_after = self.get_mongo_count("ai_usage_events", "{'billingContext': 'INTERNAL'}")
        
        self.log(f"    INTERNAL events: before={internal_events_before}, after={internal_events_after} (should increase by 1)", "info")
        
        if internal_events_after == internal_events_before + 1:
            self.tests_passed += 1
            self.log(f"    ✅ PASSED - INTERNAL usage event created", "success")
            self.results.append({
                "test": "INTERNAL billing: Usage event created",
                "success": True,
                "validation_msg": "INTERNAL usage event created with billingContext INTERNAL"
            })
        else:
            self.tests_failed += 1
            self.log(f"    ❌ FAILED - INTERNAL usage event not created", "error")
            self.results.append({
                "test": "INTERNAL billing: Usage event created",
                "success": False,
                "validation_msg": f"Expected 1 new INTERNAL event, got {internal_events_after - internal_events_before}"
            })
        
        # 8. Test Estimate-only
        self.log("\n### 7. ESTIMATE-ONLY ###", "warning")
        
        self.test(
            "Gateway estimate: ask_fomo",
            "GET",
            f"admin/entitlements/ai/gateway/estimate?userId={self.test_user_id}&operation=ask_fomo",
            200,
            validate_fn=lambda r: (
                r.get("ok") == True and 
                r.get("estimatedCredits", 0) >= 1 and
                "pricingMode" in r and
                "costStatus" in r,
                f"✓ Estimated: {r.get('estimatedCredits', 0)} credits, pricingMode: {r.get('pricingMode')}, costStatus: {r.get('costStatus')}"
            )
        )
        
        # 9. Test Provider Pricing Registry (P5)
        self.log("\n### 8. PROVIDER PRICING REGISTRY (P5) ###", "warning")
        
        # List prices
        list_prices_result = self.test(
            "List provider prices",
            "GET",
            "admin/entitlements/ai/pricing",
            200,
            validate_fn=lambda r: (
                "items" in r and len(r.get("items", [])) >= 3,
                f"✓ Found {len(r.get('items', []))} price entries (expected >= 3 openai models)"
            )
        )
        
        # Upsert a price
        self.test(
            "Upsert provider price",
            "POST",
            "admin/entitlements/ai/pricing",
            200,
            accept_statuses=[200, 201],
            data={
                "provider": "openai",
                "model": "gpt-test-model",
                "inputPer1M": 1.5,
                "outputPer1M": 6.0,
                "sourceNote": "Test price"
            },
            validate_fn=lambda r: (
                r.get("ok") == True and "price" in r,
                f"✓ Price upserted: {r.get('price', {}).get('model', 'N/A')}"
            )
        )
        
        # Get settings
        settings_result = self.test(
            "Get AI settings",
            "GET",
            "admin/entitlements/ai/settings",
            200,
            validate_fn=lambda r: (
                "allowUnpricedModels" in r and "defaultRevenuePerCreditUsd" in r,
                f"✓ Settings: allowUnpricedModels={r.get('allowUnpricedModels')}, defaultRevenuePerCreditUsd={r.get('defaultRevenuePerCreditUsd')}"
            )
        )
        
        # Update settings
        self.test(
            "Update AI settings",
            "POST",
            "admin/entitlements/ai/settings",
            200,
            accept_statuses=[200, 201],
            data={
                "allowUnpricedModels": True,
                "infrastructureCostPerRequestUsd": 0.0001
            },
            validate_fn=lambda r: (
                r.get("allowUnpricedModels") == True,
                f"✓ Settings updated: allowUnpricedModels={r.get('allowUnpricedModels')}"
            )
        )
        
        # 10. Test Usage Summary (P8)
        self.log("\n### 9. USAGE SUMMARY (P8) ###", "warning")
        
        self.test(
            "Usage summary (30 days)",
            "GET",
            "admin/entitlements/ai/usage/summary?days=30",
            200,
            validate_fn=lambda r: (
                "buckets" in r and 
                "hasRealData" in r and
                r.get("hasRealData") == False,  # Mock env
                f"✓ Buckets: {len(r.get('buckets', []))}, hasRealData: {r.get('hasRealData')} (expected False in mock)"
            )
        )
        
        # 11. Test User Analytics (P9)
        self.log("\n### 10. USER ANALYTICS (P9) ###", "warning")
        
        self.test(
            "User analytics",
            "GET",
            f"admin/entitlements/ai/user-analytics?userId={self.test_user_id}",
            200,
            validate_fn=lambda r: (
                r.get("ok") == True and
                "balances" in r and
                "ai" in r and
                "ledger" in r,
                f"✓ AI requests (30d): {r.get('ai', {}).get('requests30d', 0)}, creditsSpent: {r.get('ai', {}).get('creditsSpent30d', 0)}"
            )
        )
        
        # 12. Test Credit Pricing Engine (P6)
        self.log("\n### 11. CREDIT PRICING ENGINE (P6) ###", "warning")
        
        # Execute ask_fomo and verify HYBRID pricing
        hybrid_result = self.test(
            "Verify HYBRID pricing (ask_fomo)",
            "POST",
            "admin/entitlements/ai/gateway/execute",
            200,
            accept_statuses=[200, 201],
            data={
                "userId": self.test_user_id,
                "operation": "ask_fomo",
                "input": "Test HYBRID pricing",
                "idempotencyKey": f"test_hybrid_{datetime.now().timestamp()}"
            },
            validate_fn=lambda r: (
                r.get("ok") == True and 
                r.get("credits", {}).get("captured", 0) >= 1 and
                r.get("credits", {}).get("captured", 0) <= r.get("credits", {}).get("reserved", 999),
                f"✓ Captured: {r.get('credits', {}).get('captured', 0)}, Reserved: {r.get('credits', {}).get('reserved', 0)} (capture <= reserved)"
            )
        )
        
        # 13. Test Admin JWT Authentication
        self.log("\n### 12. ADMIN JWT AUTHENTICATION ###", "warning")
        
        # Save token
        saved_token = self.token
        self.token = None
        
        self.test(
            "Auth guard: Gateway execute without JWT",
            "POST",
            "admin/entitlements/ai/gateway/execute",
            403,
            data={
                "userId": self.test_user_id,
                "operation": "ask_fomo",
                "input": "Test"
            },
            accept_statuses=[401, 403]
        )
        
        self.test(
            "Auth guard: Pricing list without JWT",
            "GET",
            "admin/entitlements/ai/pricing",
            403,
            accept_statuses=[401, 403]
        )
        
        # Restore token
        self.token = saved_token
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "="*80, "info")
        self.log("TEST SUMMARY", "info")
        self.log("="*80, "info")
        self.log(f"Total Tests: {self.tests_run}", "info")
        self.log(f"Passed: {self.tests_passed}", "success")
        self.log(f"Failed: {self.tests_failed}", "error")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"Success Rate: {success_rate:.1f}%", "success" if success_rate >= 80 else "warning")
        
        if self.tests_failed > 0:
            self.log("\nFailed Tests:", "error")
            for result in self.results:
                if not result.get("success"):
                    self.log(f"  - {result['test']}: {result.get('error', result.get('validation_msg', 'Status mismatch'))}", "error")
        
        self.log("\n" + "="*80 + "\n", "info")
        
        return 0 if self.tests_failed == 0 else 1

def main():
    tester = AiGatewayTester()
    exit_code = tester.run_all_tests()
    
    # Save results to JSON
    results_file = "/tmp/backend_test_ai_gateway_results.json"
    with open(results_file, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total": tester.tests_run,
                "passed": tester.tests_passed,
                "failed": tester.tests_failed,
                "success_rate": f"{(tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0:.1f}%"
            },
            "results": tester.results
        }, f, indent=2)
    
    print(f"\nDetailed results saved to: {results_file}")
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())
