#!/usr/bin/env python3
"""
Content Influence Explainability Backend Test (Step 3)
Tests the canonical Content Influence read-model that powers:
- Customer 360 influence tab
- Top Contributors leaderboard
- Public profile contribution stats
All three surfaces MUST use the SAME backend formula.
"""

import requests
import sys
import json
from datetime import datetime

# Backend URL from frontend/.env
BASE_URL = "https://fomo-crm-demo.preview.emergentagent.com/api"

# Test credentials from /app/memory/test_credentials.md
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"

# Test user Alice Nakamoto (seeded with 4 topics + engagement)
ALICE_USER_ID = "6a82f363a69208b6dccb4019"

class ContentInfluenceTest:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.admin_token = None
        self.results = []

    def log(self, msg, level="INFO"):
        """Log test output"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {msg}")

    def test(self, name, fn):
        """Run a single test"""
        self.tests_run += 1
        self.log(f"Testing: {name}")
        try:
            result = fn()
            if result.get("success"):
                self.tests_passed += 1
                self.log(f"✅ PASS: {name}", "PASS")
                self.results.append({"test": name, "status": "PASS", "details": result.get("details")})
            else:
                self.log(f"❌ FAIL: {name} - {result.get('error')}", "FAIL")
                self.results.append({"test": name, "status": "FAIL", "error": result.get("error")})
        except Exception as e:
            self.log(f"❌ ERROR: {name} - {str(e)}", "ERROR")
            self.results.append({"test": name, "status": "ERROR", "error": str(e)})

    def admin_login(self):
        """Test 1: Admin login"""
        def run():
            url = f"{BASE_URL}/user/admin/login"
            payload = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            resp = requests.post(url, json=payload, timeout=10)
            
            if resp.status_code != 202:
                return {"success": False, "error": f"Expected 202, got {resp.status_code}"}
            
            data = resp.json()
            if "accessToken" not in data:
                return {"success": False, "error": "No accessToken in response"}
            
            # Role is in user.role array
            user = data.get("user", {})
            role = user.get("role", [])
            if "admin" not in role:
                return {"success": False, "error": f"Expected admin role, got {role}"}
            
            self.admin_token = data["accessToken"]
            return {"success": True, "details": f"Logged in as admin"}
        
        return run()

    def get_user_influence_with_auth(self):
        """Test 2: GET /api/admin/comments/users/:userId/influence (with auth)"""
        def run():
            if not self.admin_token:
                return {"success": False, "error": "No admin token"}
            
            url = f"{BASE_URL}/admin/comments/users/{ALICE_USER_ID}/influence"
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            resp = requests.get(url, headers=headers, timeout=10)
            
            if resp.status_code != 200:
                return {"success": False, "error": f"Expected 200, got {resp.status_code}"}
            
            data = resp.json()
            
            # Verify required keys
            required_keys = ["userId", "summary", "periods", "topTopics", "milestones", "exclusionStats", "generatedAt"]
            missing = [k for k in required_keys if k not in data]
            if missing:
                return {"success": False, "error": f"Missing keys: {missing}"}
            
            # Verify summary has all required fields
            summary = data.get("summary", {})
            summary_keys = ["topicsPublished", "totalViews", "uniqueEngagers", "likesReceived", 
                           "commentsReceived", "qualifiedComments", "repostsReceived", 
                           "followersFromContent", "contentInfluence", "influenceXpEarned"]
            missing_summary = [k for k in summary_keys if k not in summary]
            if missing_summary:
                return {"success": False, "error": f"Missing summary keys: {missing_summary}"}
            
            # Verify followersFromContent is null (not implemented yet)
            if summary.get("followersFromContent") is not None:
                return {"success": False, "error": f"followersFromContent should be null, got {summary.get('followersFromContent')}"}
            
            # Verify periods
            periods = data.get("periods", {})
            if not all(k in periods for k in ["7d", "30d", "all"]):
                return {"success": False, "error": f"Missing period keys, got: {list(periods.keys())}"}
            
            # Verify Alice has expected data (4 topics, 5 XP)
            if summary.get("topicsPublished") != 4:
                return {"success": False, "error": f"Expected topicsPublished=4, got {summary.get('topicsPublished')}"}
            
            if summary.get("influenceXpEarned") != 5:
                return {"success": False, "error": f"Expected influenceXpEarned=5, got {summary.get('influenceXpEarned')}"}
            
            # Verify at least 1 milestone
            milestones = data.get("milestones", [])
            if len(milestones) < 1:
                return {"success": False, "error": "Expected at least 1 milestone"}
            
            # Verify milestone has correct type and xp
            first_milestone = milestones[0]
            if first_milestone.get("type") != "CONTENT_INFLUENCE_MILESTONE":
                return {"success": False, "error": f"Expected type=CONTENT_INFLUENCE_MILESTONE, got {first_milestone.get('type')}"}
            
            if first_milestone.get("xp") != 5:
                return {"success": False, "error": f"Expected xp=5, got {first_milestone.get('xp')}"}
            
            # Verify exclusionStats
            exclusions = data.get("exclusionStats", {})
            if not all(k in exclusions for k in ["selfInteractionsExcluded", "duplicateEngagementsExcluded", "hiddenDeletedExcluded"]):
                return {"success": False, "error": f"Missing exclusion keys"}
            
            details = {
                "topicsPublished": summary.get("topicsPublished"),
                "contentInfluence": summary.get("contentInfluence"),
                "influenceXpEarned": summary.get("influenceXpEarned"),
                "milestones": len(milestones),
                "topTopics": len(data.get("topTopics", []))
            }
            
            return {"success": True, "details": details}
        
        return run()

    def get_user_influence_without_auth(self):
        """Test 3: GET /api/admin/comments/users/:userId/influence (without auth - should fail)"""
        def run():
            url = f"{BASE_URL}/admin/comments/users/{ALICE_USER_ID}/influence"
            resp = requests.get(url, timeout=10)
            
            # Should be rejected (401 or 403)
            if resp.status_code in [401, 403]:
                return {"success": True, "details": f"Correctly rejected with {resp.status_code}"}
            else:
                return {"success": False, "error": f"Expected 401/403, got {resp.status_code}"}
        
        return run()

    def get_top_contributors(self):
        """Test 4: GET /api/comments/contributors?period=all (leaderboard)"""
        def run():
            url = f"{BASE_URL}/comments/contributors?period=all"
            resp = requests.get(url, timeout=10)
            
            if resp.status_code != 200:
                return {"success": False, "error": f"Expected 200, got {resp.status_code}"}
            
            data = resp.json()
            
            if not isinstance(data, list):
                return {"success": False, "error": f"Expected array, got {type(data)}"}
            
            if len(data) == 0:
                return {"success": False, "error": "Expected at least 1 contributor"}
            
            # Find Alice in the leaderboard
            alice = next((c for c in data if c.get("id") == ALICE_USER_ID), None)
            if not alice:
                return {"success": False, "error": "Alice not found in leaderboard"}
            
            # Store Alice's influence for consistency check
            self.alice_leaderboard_influence = alice.get("influence")
            
            details = {
                "contributors": len(data),
                "alice_rank": next((i+1 for i, c in enumerate(data) if c.get("id") == ALICE_USER_ID), None),
                "alice_influence": alice.get("influence"),
                "alice_score": alice.get("score")
            }
            
            return {"success": True, "details": details}
        
        return run()

    def check_consistency_leaderboard_vs_readmodel(self):
        """Test 5: Consistency - leaderboard influence must equal read-model summary.contentInfluence"""
        def run():
            if not self.admin_token:
                return {"success": False, "error": "No admin token"}
            
            # Get read-model
            url = f"{BASE_URL}/admin/comments/users/{ALICE_USER_ID}/influence"
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            resp = requests.get(url, headers=headers, timeout=10)
            
            if resp.status_code != 200:
                return {"success": False, "error": f"Failed to get read-model: {resp.status_code}"}
            
            data = resp.json()
            readmodel_influence = data.get("summary", {}).get("contentInfluence")
            
            # Compare with leaderboard
            if not hasattr(self, "alice_leaderboard_influence"):
                return {"success": False, "error": "Leaderboard test not run yet"}
            
            leaderboard_influence = self.alice_leaderboard_influence
            
            # They should be equal (allowing for small floating point differences)
            if abs(readmodel_influence - leaderboard_influence) > 0.1:
                return {"success": False, "error": f"Mismatch: leaderboard={leaderboard_influence}, read-model={readmodel_influence}"}
            
            return {"success": True, "details": f"Both sources show influence={readmodel_influence}"}
        
        return run()

    def check_consistency_persons_api(self):
        """Test 6: Consistency - GET /api/persons/:userId?type=fomies should match read-model"""
        def run():
            if not self.admin_token:
                return {"success": False, "error": "No admin token"}
            
            # Get persons API
            url = f"{BASE_URL}/persons/{ALICE_USER_ID}?type=fomies"
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            resp = requests.get(url, headers=headers, timeout=10)
            
            if resp.status_code != 200:
                return {"success": False, "error": f"Failed to get persons: {resp.status_code}"}
            
            data = resp.json()
            persons_influence = data.get("contentInfluence", {}).get("summary", {}).get("contentInfluence")
            
            # Get read-model
            url2 = f"{BASE_URL}/admin/comments/users/{ALICE_USER_ID}/influence"
            resp2 = requests.get(url2, headers=headers, timeout=10)
            
            if resp2.status_code != 200:
                return {"success": False, "error": f"Failed to get read-model: {resp2.status_code}"}
            
            data2 = resp2.json()
            readmodel_influence = data2.get("summary", {}).get("contentInfluence")
            
            # They should be equal
            if persons_influence is None:
                return {"success": False, "error": "contentInfluence not found in persons API"}
            
            if abs(persons_influence - readmodel_influence) > 0.1:
                return {"success": False, "error": f"Mismatch: persons={persons_influence}, read-model={readmodel_influence}"}
            
            return {"success": True, "details": f"All three surfaces show influence={readmodel_influence}"}
        
        return run()

    def recalc_influence(self):
        """Test 7: POST /api/comments/admin/influence/recalc (admin)"""
        def run():
            if not self.admin_token:
                return {"success": False, "error": "No admin token"}
            
            url = f"{BASE_URL}/comments/admin/influence/recalc"
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            resp = requests.post(url, headers=headers, timeout=30)
            
            if resp.status_code != 201:
                return {"success": False, "error": f"Expected 201, got {resp.status_code}"}
            
            data = resp.json()
            
            if "processed" not in data or "xpAwarded" not in data:
                return {"success": False, "error": f"Missing keys in response: {list(data.keys())}"}
            
            # Run again to test idempotency
            resp2 = requests.post(url, headers=headers, timeout=30)
            if resp2.status_code != 201:
                return {"success": False, "error": f"Second call failed: {resp2.status_code}"}
            
            data2 = resp2.json()
            
            # Second run should award 0 XP (idempotent)
            if data2.get("xpAwarded") != 0:
                return {"success": False, "error": f"Expected xpAwarded=0 on second run, got {data2.get('xpAwarded')}"}
            
            details = {
                "first_run": {"processed": data.get("processed"), "xpAwarded": data.get("xpAwarded")},
                "second_run": {"processed": data2.get("processed"), "xpAwarded": data2.get("xpAwarded")}
            }
            
            return {"success": True, "details": details}
        
        return run()

    def bad_user_id(self):
        """Test 8: Bad userId should return 200 with empty summary"""
        def run():
            if not self.admin_token:
                return {"success": False, "error": "No admin token"}
            
            url = f"{BASE_URL}/admin/comments/users/notavalidid/influence"
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            resp = requests.get(url, headers=headers, timeout=10)
            
            if resp.status_code != 200:
                return {"success": False, "error": f"Expected 200, got {resp.status_code}"}
            
            data = resp.json()
            summary = data.get("summary", {})
            
            if summary.get("topicsPublished") != 0:
                return {"success": False, "error": f"Expected topicsPublished=0, got {summary.get('topicsPublished')}"}
            
            return {"success": True, "details": "Bad userId handled gracefully"}
        
        return run()

    def run_all(self):
        """Run all tests"""
        self.log("=" * 60)
        self.log("Content Influence Explainability Backend Test")
        self.log("=" * 60)
        
        # Test 1: Admin login
        self.test("Admin login", self.admin_login)
        
        # Test 2: Get user influence with auth
        self.test("GET user influence (with auth)", self.get_user_influence_with_auth)
        
        # Test 3: Get user influence without auth
        self.test("GET user influence (without auth - should fail)", self.get_user_influence_without_auth)
        
        # Test 4: Get top contributors
        self.test("GET top contributors leaderboard", self.get_top_contributors)
        
        # Test 5: Consistency check - leaderboard vs read-model
        self.test("Consistency: leaderboard vs read-model", self.check_consistency_leaderboard_vs_readmodel)
        
        # Test 6: Consistency check - persons API
        self.test("Consistency: persons API vs read-model", self.check_consistency_persons_api)
        
        # Test 7: Recalc influence (idempotency)
        self.test("POST recalc influence (idempotency)", self.recalc_influence)
        
        # Test 8: Bad user ID
        self.test("Bad userId handling", self.bad_user_id)
        
        # Summary
        self.log("=" * 60)
        self.log(f"Tests run: {self.tests_run}")
        self.log(f"Tests passed: {self.tests_passed}")
        self.log(f"Tests failed: {self.tests_run - self.tests_passed}")
        self.log(f"Success rate: {(self.tests_passed / self.tests_run * 100):.1f}%")
        self.log("=" * 60)
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = ContentInfluenceTest()
    success = tester.run_all()
    
    # Save results
    with open("/tmp/content_influence_test_results.json", "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "tests_run": tester.tests_run,
            "tests_passed": tester.tests_passed,
            "success_rate": f"{(tester.tests_passed / tester.tests_run * 100):.1f}%",
            "results": tester.results
        }, f, indent=2)
    
    sys.exit(0 if success else 1)
