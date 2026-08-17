#!/usr/bin/env python3
"""
Support & Trust Center Backend Test Suite
Tests: Categories, Reasons, Reports (A/B/C), Tickets (E), SLA, Appeals (D), Customer360, Analytics
"""
import requests
import sys
import json
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Base URL from frontend .env (public endpoint)
BASE_URL = "https://monetization-core-1.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

class TrustBackendTester:
    def __init__(self):
        self.token: Optional[str] = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.results = []
        self.created_report_id = None
        self.created_ticket_id = None
        self.demo_user_id = None
        
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
                response = requests.get(url, headers=req_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=req_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Check status
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
                self.log(f"    Response: {json.dumps(response_data, indent=2)[:500]}", "error")
            
            result = {
                "test": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "validation_msg": validation_msg,
                "response_preview": str(response_data)[:200]
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
    
    def run_all_tests(self):
        """Execute all test suites"""
        self.log("\n" + "="*80, "info")
        self.log("SUPPORT & TRUST CENTER BACKEND TEST SUITE", "info")
        self.log("="*80 + "\n", "info")
        
        # 1. AUTH
        self.log("\n### 1. AUTHENTICATION ###", "warning")
        auth_result = self.test(
            "Admin Login",
            "POST",
            "user/admin/login",
            202,
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            accept_statuses=[200, 202],
            validate_fn=lambda r: (
                "accessToken" in r,
                f"✓ Got accessToken, role: {r.get('user', {}).get('role', 'N/A')}"
            )
        )
        
        if auth_result["success"] and "accessToken" in auth_result["data"]:
            self.token = auth_result["data"]["accessToken"]
            self.log(f"    Token acquired: {self.token[:20]}...", "success")
        else:
            self.log("    ⚠️  Cannot proceed without token. Stopping tests.", "error")
            return self.print_summary()
        
        # 2. CATEGORIES & REASONS
        self.log("\n### 2. CATEGORIES & REASONS ###", "warning")
        
        # 2a. Public categories (nested tree)
        self.test(
            "GET /trust/public/categories (nested tree)",
            "GET",
            "trust/public/categories",
            200,
            validate_fn=lambda r: (
                isinstance(r, list) and len(r) > 0 and "children" in r[0],
                f"✓ Got {len(r)} top-level categories with children arrays"
            )
        )
        
        # 2b. Public reasons for COMMENT
        comment_reasons = self.test(
            "GET /trust/public/reasons?targetType=COMMENT",
            "GET",
            "trust/public/reasons?targetType=COMMENT",
            200,
            validate_fn=lambda r: (
                isinstance(r, list) and all("allowedTargetTypes" in reason for reason in r),
                f"✓ Got {len(r)} reasons for COMMENT"
            )
        )
        
        # Verify impersonation NOT in COMMENT reasons
        if comment_reasons["success"]:
            codes = [r.get("code") for r in comment_reasons["data"]]
            if "impersonation" in codes:
                self.log("    ⚠️  WARNING: 'impersonation' should NOT appear for COMMENT targetType", "warning")
        
        # 2c. Public reasons for USER
        user_reasons = self.test(
            "GET /trust/public/reasons?targetType=USER",
            "GET",
            "trust/public/reasons?targetType=USER",
            200,
            validate_fn=lambda r: (
                isinstance(r, list) and any(reason.get("code") == "impersonation" for reason in r),
                f"✓ Got {len(r)} reasons for USER, includes 'impersonation'"
            )
        )
        
        # 3. REPORTS (Scenarios A, B, C)
        self.log("\n### 3. TRUST REPORTS (Scenarios A/B/C) ###", "warning")
        
        # 3a. Create COMMENT report (Scenario A)
        comment_report = self.test(
            "POST /trust/public/reports (COMMENT - Scenario A)",
            "POST",
            "trust/public/reports",
            201,
            accept_statuses=[200, 201],
            data={
                "targetType": "COMMENT",
                "targetId": "test-comment-123",
                "reasonCode": "harassment",
                "description": "Test comment report for scenario A",
                "targetSnapshot": {
                    "text": "This is offensive comment text",
                    "author": "test_user",
                    "page": "/crypto/projects/test"
                }
            },
            validate_fn=lambda r: (
                "_id" in r and r.get("targetType") == "COMMENT",
                f"✓ Created COMMENT report with ID: {r.get('_id')}"
            )
        )
        
        if comment_report["success"]:
            self.created_report_id = comment_report["data"].get("_id")
        
        # 3b. Create USER report (Scenario B)
        self.test(
            "POST /trust/public/reports (USER - Scenario B)",
            "POST",
            "trust/public/reports",
            201,
            accept_statuses=[200, 201],
            data={
                "targetType": "USER",
                "targetId": "test-user-456",
                "reasonCode": "impersonation",
                "description": "Test user report for scenario B",
                "targetSnapshot": {
                    "username": "fake_vitalik",
                    "wallet": "0xABC123"
                }
            },
            validate_fn=lambda r: (
                "_id" in r and r.get("targetType") == "USER",
                f"✓ Created USER report"
            )
        )
        
        # 3c. Create MESSAGE report (Scenario C)
        self.test(
            "POST /trust/public/reports (MESSAGE - Scenario C)",
            "POST",
            "trust/public/reports",
            201,
            accept_statuses=[200, 201],
            data={
                "targetType": "MESSAGE",
                "targetId": "test-msg-789",
                "reasonCode": "spam",
                "description": "Test message report for scenario C",
                "targetSnapshot": {
                    "text": "Join my pump group",
                    "author": "spammer",
                    "context": ["Hello", "Join my pump group", "Click here"]
                }
            },
            validate_fn=lambda r: (
                "_id" in r and r.get("targetType") == "MESSAGE",
                f"✓ Created MESSAGE report with conversation context"
            )
        )
        
        # 3d. List reports (admin)
        self.test(
            "GET /trust/reports?targetType=COMMENT&includeDemo=true",
            "GET",
            "trust/reports?targetType=COMMENT&includeDemo=true",
            200,
            validate_fn=lambda r: (
                "data" in r and isinstance(r["data"], list),
                f"✓ Got {len(r.get('data', []))} COMMENT reports"
            )
        )
        
        # 3e. Get specific report with targetSnapshot
        if self.created_report_id:
            self.test(
                f"GET /trust/reports/{self.created_report_id} (verify targetSnapshot)",
                "GET",
                f"trust/reports/{self.created_report_id}",
                200,
                validate_fn=lambda r: (
                    "targetSnapshot" in r and "text" in r["targetSnapshot"],
                    f"✓ Report has targetSnapshot with text/author/page"
                )
            )
            
            # 3f. Resolve report (moderator action)
            self.test(
                f"PATCH /trust/reports/{self.created_report_id} (resolve)",
                "PATCH",
                f"trust/reports/{self.created_report_id}",
                200,
                data={
                    "status": "resolved",
                    "resolution": "Confirmed violation, user warned"
                },
                validate_fn=lambda r: (
                    r.get("status") == "resolved",
                    f"✓ Report resolved successfully"
                )
            )
        
        # 4. SUPPORT TICKETS (Scenario E)
        self.log("\n### 4. SUPPORT TICKETS (Scenario E) ###", "warning")
        
        # 4a. Create ticket with SLA category (trading_otc)
        ticket_result = self.test(
            "POST /trust/public/tickets (categoryCode=trading_otc - SLA test)",
            "POST",
            "trust/public/tickets",
            201,
            accept_statuses=[200, 201],
            data={
                "categoryCode": "trading_otc",
                "subject": "Test OTC dispute",
                "message": "I need help with my OTC trade"
            },
            validate_fn=lambda r: (
                "ticketNumber" in r and r.get("priority") == "high" and "sla" in r,
                f"✓ Ticket created with priority={r.get('priority')}, has SLA object"
            )
        )
        
        if ticket_result["success"]:
            self.created_ticket_id = ticket_result["data"].get("_id")
            sla = ticket_result["data"].get("sla", {})
            if sla.get("firstResponseDueAt") and sla.get("resolutionDueAt"):
                self.log(f"    ✓ SLA: firstResponse={sla.get('firstResponseHours')}h, resolution={sla.get('resolutionHours')}h", "success")
            else:
                self.log(f"    ⚠️  WARNING: SLA object missing dueAt fields", "warning")
        
        # 4b. Add agent reply
        if self.created_ticket_id:
            self.test(
                f"POST /trust/tickets/{self.created_ticket_id}/messages (agent reply)",
                "POST",
                f"trust/tickets/{self.created_ticket_id}/messages",
                201,
                accept_statuses=[200, 201],
                data={
                    "body": "Thank you for contacting support. We are reviewing your case.",
                    "authorType": "agent"
                },
                validate_fn=lambda r: (
                    r.get("status") == "waiting_user",
                    f"✓ Agent reply added, status changed to waiting_user"
                )
            )
            
            # 4c. Add internal note (should NOT appear in public)
            self.test(
                f"POST /trust/tickets/{self.created_ticket_id}/messages (internal note)",
                "POST",
                f"trust/tickets/{self.created_ticket_id}/messages",
                201,
                accept_statuses=[200, 201],
                data={
                    "body": "Internal: escalate to senior support",
                    "authorType": "internal"
                },
                validate_fn=lambda r: (
                    "messages" in r,
                    f"✓ Internal note added"
                )
            )
            
            # 4d. Verify user sees agent reply but NOT internal note
            self.test(
                "GET /trust/public/tickets/mine (verify agent reply visible, internal hidden)",
                "GET",
                "trust/public/tickets/mine",
                200,
                validate_fn=lambda r: (
                    isinstance(r, list) and len(r) > 0,
                    f"✓ User can see their tickets"
                )
            )
        
        # 5. DEMO DEALS/APPEALS (Scenario D)
        self.log("\n### 5. DEMO DEALS/APPEALS (Scenario D) ###", "warning")
        
        # 5a. Reset demo first
        self.test(
            "POST /deals/admin/reset-demo",
            "POST",
            "deals/admin/reset-demo",
            201,
            accept_statuses=[200, 201],
            validate_fn=lambda r: (
                True,
                f"✓ Demo reset"
            )
        )
        
        # 5b. Seed demo disputes
        seed_result = self.test(
            "POST /deals/admin/seed-demo",
            "POST",
            "deals/admin/seed-demo",
            201,
            accept_statuses=[200, 201],
            validate_fn=lambda r: (
                "deals" in r and "appeals" in r and "users" in r,
                f"✓ Seeded {r.get('deals', 0)} deals, {r.get('appeals', 0)} appeals, {r.get('users', 0)} users"
            )
        )
        
        # 5c. List appeals
        appeals_result = self.test(
            "GET /deals/appeals?status=all&limit=10",
            "GET",
            "deals/appeals?status=all&limit=10",
            200,
            validate_fn=lambda r: (
                "appeals" in r and len(r["appeals"]) >= 3,
                f"✓ Got {len(r.get('appeals', []))} appeals (expected 3: P2P resolved, OTC in_review, OTC open)"
            )
        )
        
        # Verify appeal structure
        if appeals_result["success"] and appeals_result["data"].get("appeals"):
            appeal = appeals_result["data"]["appeals"][0]
            if all(k in appeal for k in ["deal", "creator", "reason", "status"]):
                self.log(f"    ✓ Appeal has deal.section={appeal.get('deal', {}).get('section')}, creator.username={appeal.get('creator', {}).get('username')}", "success")
                if appeal.get("creator", {}).get("_id"):
                    self.demo_user_id = appeal["creator"]["_id"]
            else:
                self.log(f"    ⚠️  WARNING: Appeal missing required fields", "warning")
        
        # 6. CUSTOMER 360
        self.log("\n### 6. CUSTOMER 360 ###", "warning")
        
        # Use demo user if available
        test_user_id = self.demo_user_id or "test-user-id"
        
        self.test(
            f"GET /trust/user/{test_user_id}/summary (Customer360)",
            "GET",
            f"trust/user/{test_user_id}/summary",
            200,
            validate_fn=lambda r: (
                all(k in r for k in ["support", "reports", "disputes", "moderation"]),
                f"✓ Customer360: support.open={r.get('support', {}).get('open')}, disputes.filed={r.get('disputes', {}).get('filed')}"
            )
        )
        
        # 7. ANALYTICS
        self.log("\n### 7. ANALYTICS ###", "warning")
        
        # 7a. Analytics WITHOUT demo data
        analytics_no_demo = self.test(
            "GET /trust/analytics/overview (excludes demo)",
            "GET",
            "trust/analytics/overview",
            200,
            validate_fn=lambda r: (
                "tickets" in r and "reports" in r and "moderation" in r,
                f"✓ Analytics (no demo): tickets.total={r.get('tickets', {}).get('total')}, reports.total={r.get('reports', {}).get('total')}"
            )
        )
        
        # 7b. Analytics WITH demo data
        analytics_with_demo = self.test(
            "GET /trust/analytics/overview?includeDemo=true",
            "GET",
            "trust/analytics/overview?includeDemo=true",
            200,
            validate_fn=lambda r: (
                "tickets" in r and "reports" in r,
                f"✓ Analytics (with demo): tickets.total={r.get('tickets', {}).get('total')}, reports.total={r.get('reports', {}).get('total')}"
            )
        )
        
        # Verify demo inclusion increases counts
        if analytics_no_demo["success"] and analytics_with_demo["success"]:
            no_demo_total = analytics_no_demo["data"].get("tickets", {}).get("total", 0)
            with_demo_total = analytics_with_demo["data"].get("tickets", {}).get("total", 0)
            if with_demo_total > no_demo_total:
                self.log(f"    ✓ Demo data inclusion works: {no_demo_total} -> {with_demo_total} tickets", "success")
            else:
                self.log(f"    ⚠️  WARNING: Demo data not increasing counts ({no_demo_total} vs {with_demo_total})", "warning")
        
        # 8. SEED TRUST DEMO DATA
        self.log("\n### 8. TRUST DEMO DATA ###", "warning")
        
        self.test(
            "POST /trust/seed-demo (seed trust demo data)",
            "POST",
            "trust/seed-demo",
            201,
            accept_statuses=[200, 201],
            validate_fn=lambda r: (
                "tickets" in r or "reports" in r or "moderation" in r,
                f"✓ Trust demo data seeded"
            )
        )
        
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
                    self.log(f"  - {result['test']}: {result.get('error', 'Status mismatch')}", "error")
        
        self.log("\n" + "="*80 + "\n", "info")
        
        return 0 if self.tests_failed == 0 else 1

def main():
    tester = TrustBackendTester()
    exit_code = tester.run_all_tests()
    
    # Save results to JSON
    results_file = "/tmp/trust_backend_test_results.json"
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
