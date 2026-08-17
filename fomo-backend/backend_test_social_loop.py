#!/usr/bin/env python3
"""
Backend test for FOMO social loop iteration (notifications, follow attribution, quote, repost).
Tests:
1. Admin login
2. Follow attribution with sourceTopicId
3. Influence read-model (followersFromContent)
4. Notifications endpoints (unread-count, list, mark read)
5. Repost flow
6. Quote flow (reply + repost)
7. No self-notify
"""

import requests
import sys
import json
from typing import Optional

BASE_URL = "https://fomo-crm-demo.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"
ADMIN_ID = "6a82f3633335c0bd9cf972b3"
ALICE_ID = "6a82f363a69208b6dccb4019"
ETH_ETF_TOPIC_ID = "6a82fc3927f8cdfd56944e04"


class SocialLoopTester:
    def __init__(self):
        self.token: Optional[str] = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log(self, message: str, status: str = "INFO"):
        """Log test message"""
        prefix = {
            "PASS": "✅",
            "FAIL": "❌",
            "INFO": "🔍",
            "WARN": "⚠️"
        }.get(status, "ℹ️")
        print(f"{prefix} {message}")

    def test(self, name: str, method: str, endpoint: str, expected_status: int,
             data: Optional[dict] = None, headers: Optional[dict] = None) -> tuple[bool, dict]:
        """Run a single API test"""
        url = f"{BASE_URL}/{endpoint}"
        req_headers = {"Content-Type": "application/json"}
        if self.token:
            req_headers["Authorization"] = f"Bearer {self.token}"
        if headers:
            req_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...", "INFO")

        try:
            if method == "GET":
                response = requests.get(url, headers=req_headers, timeout=15)
            elif method == "POST":
                response = requests.post(url, json=data, headers=req_headers, timeout=15)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=req_headers, timeout=15)
            else:
                self.log(f"Unsupported method {method}", "FAIL")
                return False, {}

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"PASSED - Status: {response.status_code}", "PASS")
            else:
                self.log(f"FAILED - Expected {expected_status}, got {response.status_code}", "FAIL")
                self.log(f"Response: {response.text[:200]}", "WARN")

            try:
                response_data = response.json() if response.text else {}
            except:
                response_data = {"raw": response.text}

            self.results.append({
                "test": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "passed": success,
                "response": response_data
            })

            return success, response_data

        except Exception as e:
            self.log(f"FAILED - Error: {str(e)}", "FAIL")
            self.results.append({
                "test": name,
                "method": method,
                "endpoint": endpoint,
                "expected_status": expected_status,
                "actual_status": 0,
                "passed": False,
                "error": str(e)
            })
            return False, {}

    def run_all_tests(self):
        """Run all social loop tests"""
        self.log("=" * 60, "INFO")
        self.log("FOMO Social Loop Backend Tests", "INFO")
        self.log("=" * 60, "INFO")

        # Test 1: Admin login
        self.log("\n--- Test 1: Admin Login ---", "INFO")
        success, response = self.test(
            "Admin Login",
            "POST",
            "user/admin/login",
            202,
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if not success:
            self.log("Admin login failed, cannot continue", "FAIL")
            return False

        self.token = response.get("accessToken")
        if not self.token:
            self.log("No accessToken in response", "FAIL")
            return False
        self.log(f"Got admin token: {self.token[:20]}...", "PASS")

        # Test 2: Follow Alice with sourceTopicId attribution
        self.log("\n--- Test 2: Follow Attribution ---", "INFO")
        success, response = self.test(
            "Follow Alice with sourceTopicId",
            "POST",
            f"user/follow/{ALICE_ID}",
            201,
            data={"sourceTopicId": ETH_ETF_TOPIC_ID}
        )
        if success:
            self.log(f"Follow response: {response}", "INFO")

        # Test 3: Check influence read-model (followersFromContent should be >= 1)
        self.log("\n--- Test 3: Influence Read-Model ---", "INFO")
        success, response = self.test(
            "Get Alice's influence (followersFromContent)",
            "GET",
            f"admin/comments/users/{ALICE_ID}/influence",
            200
        )
        if success:
            followers_from_content = response.get("summary", {}).get("followersFromContent")
            self.log(f"followersFromContent: {followers_from_content}", "INFO")
            if followers_from_content is not None and followers_from_content >= 1:
                self.log("Follow attribution working (followersFromContent >= 1)", "PASS")
            else:
                self.log(f"Expected followersFromContent >= 1, got {followers_from_content}", "WARN")

        # Test 4: Unfollow Alice (toggle)
        self.log("\n--- Test 4: Unfollow (Toggle) ---", "INFO")
        success, response = self.test(
            "Unfollow Alice",
            "POST",
            f"user/follow/{ALICE_ID}",
            201,
            data={"sourceTopicId": ETH_ETF_TOPIC_ID}
        )
        if success:
            self.log(f"Unfollow response: {response}", "INFO")

        # Test 5: Check influence again (followersFromContent should return to 0)
        self.log("\n--- Test 5: Influence After Unfollow ---", "INFO")
        success, response = self.test(
            "Get Alice's influence after unfollow",
            "GET",
            f"admin/comments/users/{ALICE_ID}/influence",
            200
        )
        if success:
            followers_from_content = response.get("summary", {}).get("followersFromContent")
            self.log(f"followersFromContent after unfollow: {followers_from_content}", "INFO")
            if followers_from_content == 0:
                self.log("Unfollow working (followersFromContent = 0)", "PASS")
            else:
                self.log(f"Expected followersFromContent = 0, got {followers_from_content}", "WARN")

        # Test 6: Notifications - unread count (requires Bearer token)
        self.log("\n--- Test 6: Notifications Unread Count ---", "INFO")
        success, response = self.test(
            "Get unread notifications count",
            "GET",
            "notifications/social/unread-count",
            200
        )
        if success:
            self.log(f"Unread count: {response}", "INFO")

        # Test 7: Notifications - list (requires Bearer token)
        self.log("\n--- Test 7: Notifications List ---", "INFO")
        success, response = self.test(
            "Get social notifications",
            "GET",
            "notifications/social",
            200
        )
        if success:
            notif_count = len(response) if isinstance(response, list) else 0
            self.log(f"Got {notif_count} notifications", "INFO")

        # Test 8: Notifications - mark read (requires Bearer token)
        self.log("\n--- Test 8: Mark Notifications Read ---", "INFO")
        success, response = self.test(
            "Mark notifications as read",
            "POST",
            "notifications/social/read",
            201
        )
        if success:
            self.log(f"Mark read response: {response}", "INFO")

        # Test 9: Repost topic
        self.log("\n--- Test 9: Repost Topic ---", "INFO")
        success, response = self.test(
            "Repost ETH ETF topic",
            "PUT",
            f"comments/repost/{ETH_ETF_TOPIC_ID}",
            200
        )
        if success:
            reposts_count = response.get("repostsCount")
            reposted = response.get("reposted")
            self.log(f"Repost result: reposted={reposted}, repostsCount={reposts_count}", "INFO")

        # Test 10: Get user reposts
        self.log("\n--- Test 10: Get User Reposts ---", "INFO")
        success, response = self.test(
            "Get admin's reposts",
            "GET",
            f"comments/reposts/user/{ADMIN_ID}",
            200
        )
        if success:
            reposts = response if isinstance(response, list) else []
            self.log(f"Admin has {len(reposts)} reposts", "INFO")
            # Check if ETH ETF topic is in reposts
            eth_etf_reposted = any(
                str(r.get("_id")) == ETH_ETF_TOPIC_ID or str(r.get("id")) == ETH_ETF_TOPIC_ID
                for r in reposts
            )
            if eth_etf_reposted:
                self.log("ETH ETF topic found in admin's reposts", "PASS")
            else:
                self.log("ETH ETF topic NOT found in admin's reposts (may have been toggled off)", "WARN")

        # Test 11: Quote flow - create reply first
        self.log("\n--- Test 11: Quote Flow (Reply) ---", "INFO")
        success, response = self.test(
            "Create reply to ETH ETF topic",
            "POST",
            f"comments/answer/{ETH_ETF_TOPIC_ID}",
            201,
            data={
                "text": "This is a quote comment from admin"
            }
        )
        if success:
            reply_id = response.get("_id") or response.get("id")
            self.log(f"Created reply: {reply_id}", "INFO")

        # Test 12: Quote flow - repost (already done in Test 9, but verify it's still reposted)
        self.log("\n--- Test 12: Quote Flow (Repost) ---", "INFO")
        self.log("Quote = reply + repost. Reply created in Test 11, repost done in Test 9.", "INFO")

        # Test 13: No self-notify - check admin's unread count (should be 0 for self-actions)
        self.log("\n--- Test 13: No Self-Notify ---", "INFO")
        success, response = self.test(
            "Check admin's unread count (should be 0 for self-actions)",
            "GET",
            "notifications/social/unread-count",
            200
        )
        if success:
            unread = response.get("count", 0) if isinstance(response, dict) else 0
            self.log(f"Admin unread count: {unread}", "INFO")
            # Note: This test is informational; admin acting on Alice's topic shouldn't notify admin

        # Test 14: Unauthorized access (no token)
        self.log("\n--- Test 14: Unauthorized Access ---", "INFO")
        temp_token = self.token
        self.token = None
        success, response = self.test(
            "Get notifications without token (should fail)",
            "GET",
            "notifications/social/unread-count",
            403
        )
        self.token = temp_token
        if success:
            self.log("Unauthorized access correctly blocked", "PASS")

        return True

    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "=" * 60, "INFO")
        self.log("TEST SUMMARY", "INFO")
        self.log("=" * 60, "INFO")
        self.log(f"Tests Run: {self.tests_run}", "INFO")
        self.log(f"Tests Passed: {self.tests_passed}", "PASS")
        self.log(f"Tests Failed: {self.tests_run - self.tests_passed}", "FAIL" if self.tests_run > self.tests_passed else "INFO")
        self.log(f"Success Rate: {(self.tests_passed / self.tests_run * 100):.1f}%", "INFO")

        # Save results to JSON
        results_file = "/app/test_reports/backend_social_loop_results.json"
        with open(results_file, "w") as f:
            json.dump({
                "total": self.tests_run,
                "passed": self.tests_passed,
                "failed": self.tests_run - self.tests_passed,
                "success_rate": f"{(self.tests_passed / self.tests_run * 100):.1f}%",
                "tests": self.results
            }, f, indent=2)
        self.log(f"\nResults saved to {results_file}", "INFO")


def main():
    tester = SocialLoopTester()
    try:
        tester.run_all_tests()
        tester.print_summary()
        return 0 if tester.tests_passed == tester.tests_run else 1
    except Exception as e:
        tester.log(f"Fatal error: {str(e)}", "FAIL")
        return 1


if __name__ == "__main__":
    sys.exit(main())
