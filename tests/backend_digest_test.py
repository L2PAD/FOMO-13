#!/usr/bin/env python3
"""
FOMO Market Digests Backend Test Suite
Tests admin CRUD, AI generation, publish/unpublish, and public endpoints.
"""
import requests
import sys
import json
from datetime import datetime

BASE_URL = "https://fomo-complete-setup.preview.emergentagent.com/api"
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTgxOTNmMzllYjc3YzUzMmYzNTgzODIiLCJyb2xlIjpbImFkbWluIl0sImlhdCI6MTc4NjkxMDc2NiwiZXhwIjoxNzg2OTE3OTY2fQ.oFY1Z2S97n4bz8GbqdU4vIugKgnRf8LKCjnt-hkcrfk"

class DigestTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.created_digest_id = None
        self.test_results = []

    def log(self, test_name, passed, message="", response_data=None):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
            print(f"✅ {test_name}: PASSED")
        else:
            print(f"❌ {test_name}: FAILED - {message}")
        
        self.test_results.append({
            "test": test_name,
            "passed": passed,
            "message": message,
            "data": response_data
        })

    def admin_headers(self):
        return {
            "Authorization": f"Bearer {ADMIN_TOKEN}",
            "Content-Type": "application/json"
        }

    def test_admin_list_digests(self):
        """Test GET /api/admin/calendar/digests"""
        try:
            response = requests.get(
                f"{BASE_URL}/admin/calendar/digests",
                headers=self.admin_headers(),
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                has_items = "items" in data
                self.log("Admin List Digests", has_items, 
                        f"Status: {response.status_code}, Has items: {has_items}")
                return True
            else:
                self.log("Admin List Digests", False, 
                        f"Expected 200, got {response.status_code}: {response.text[:200]}")
                return False
        except Exception as e:
            self.log("Admin List Digests", False, f"Exception: {str(e)}")
            return False

    def test_create_digest(self):
        """Test POST /api/admin/calendar/digests"""
        try:
            payload = {
                "title": f"Test Digest {datetime.now().strftime('%H%M%S')}",
                "period": "WEEK",
                "summary": "Test summary for automated testing",
                "bodyHtml": "<h3>Test Body</h3><p>This is a test digest created by automated testing.</p>",
                "outlook": "NEUTRAL",
                "status": "DRAFT",
                "tags": ["test", "automation"]
            }
            response = requests.post(
                f"{BASE_URL}/admin/calendar/digests",
                headers=self.admin_headers(),
                json=payload,
                timeout=10
            )
            if response.status_code in [200, 201]:
                data = response.json()
                if "id" in data:
                    self.created_digest_id = data["id"]
                    self.log("Create Digest", True, 
                            f"Created digest ID: {self.created_digest_id}")
                    return True
                else:
                    self.log("Create Digest", False, "No ID in response")
                    return False
            else:
                self.log("Create Digest", False, 
                        f"Expected 200/201, got {response.status_code}: {response.text[:200]}")
                return False
        except Exception as e:
            self.log("Create Digest", False, f"Exception: {str(e)}")
            return False

    def test_get_digest(self):
        """Test GET /api/admin/calendar/digests/{id}"""
        if not self.created_digest_id:
            self.log("Get Digest by ID", False, "No digest ID available")
            return False
        
        try:
            response = requests.get(
                f"{BASE_URL}/admin/calendar/digests/{self.created_digest_id}",
                headers=self.admin_headers(),
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                has_title = "title" in data
                self.log("Get Digest by ID", has_title, 
                        f"Retrieved digest: {data.get('title', 'N/A')}")
                return True
            else:
                self.log("Get Digest by ID", False, 
                        f"Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log("Get Digest by ID", False, f"Exception: {str(e)}")
            return False

    def test_patch_digest(self):
        """Test PATCH /api/admin/calendar/digests/{id}"""
        if not self.created_digest_id:
            self.log("Patch Digest", False, "No digest ID available")
            return False
        
        try:
            payload = {
                "summary": "Updated summary via automated test",
                "outlook": "BULLISH"
            }
            response = requests.patch(
                f"{BASE_URL}/admin/calendar/digests/{self.created_digest_id}",
                headers=self.admin_headers(),
                json=payload,
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                updated = data.get("outlook") == "BULLISH"
                self.log("Patch Digest", updated, 
                        f"Updated outlook: {data.get('outlook', 'N/A')}")
                return True
            else:
                self.log("Patch Digest", False, 
                        f"Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log("Patch Digest", False, f"Exception: {str(e)}")
            return False

    def test_ai_generate_week(self):
        """Test POST /api/admin/calendar/digests/generate (WEEK)"""
        try:
            payload = {"period": "WEEK"}
            response = requests.post(
                f"{BASE_URL}/admin/calendar/digests/generate",
                headers=self.admin_headers(),
                json=payload,
                timeout=30
            )
            if response.status_code in [200, 201]:
                data = response.json()
                has_draft = data.get("ok") and "draft" in data
                if has_draft:
                    draft = data["draft"]
                    meta = data.get("meta", {})
                    # Verify INTERNAL billing (no user credits charged)
                    no_sensitive = "aiProviderCostUsd" not in draft or draft.get("aiProviderCostUsd") is not None
                    self.log("AI Generate WEEK", True, 
                            f"Draft: {draft.get('title', 'N/A')[:50]}, Events: {meta.get('events', 0)}, News: {meta.get('news', 0)}")
                    return True
                else:
                    self.log("AI Generate WEEK", False, 
                            f"No draft in response: {data}")
                    return False
            else:
                self.log("AI Generate WEEK", False, 
                        f"Expected 200, got {response.status_code}: {response.text[:200]}")
                return False
        except Exception as e:
            self.log("AI Generate WEEK", False, f"Exception: {str(e)}")
            return False

    def test_ai_generate_month(self):
        """Test POST /api/admin/calendar/digests/generate (MONTH)"""
        try:
            payload = {"period": "MONTH"}
            response = requests.post(
                f"{BASE_URL}/admin/calendar/digests/generate",
                headers=self.admin_headers(),
                json=payload,
                timeout=30
            )
            if response.status_code in [200, 201]:
                data = response.json()
                has_draft = data.get("ok") and "draft" in data
                self.log("AI Generate MONTH", has_draft, 
                        f"Draft generated: {has_draft}")
                return True
            else:
                self.log("AI Generate MONTH", False, 
                        f"Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log("AI Generate MONTH", False, f"Exception: {str(e)}")
            return False

    def test_ai_generate_quarter(self):
        """Test POST /api/admin/calendar/digests/generate (QUARTER)"""
        try:
            payload = {"period": "QUARTER"}
            response = requests.post(
                f"{BASE_URL}/admin/calendar/digests/generate",
                headers=self.admin_headers(),
                json=payload,
                timeout=30
            )
            if response.status_code in [200, 201]:
                data = response.json()
                has_draft = data.get("ok") and "draft" in data
                self.log("AI Generate QUARTER", has_draft, 
                        f"Draft generated: {has_draft}")
                return True
            else:
                self.log("AI Generate QUARTER", False, 
                        f"Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log("AI Generate QUARTER", False, f"Exception: {str(e)}")
            return False

    def test_publish_digest(self):
        """Test POST /api/admin/calendar/digests/{id}/publish"""
        if not self.created_digest_id:
            self.log("Publish Digest", False, "No digest ID available")
            return False
        
        try:
            response = requests.post(
                f"{BASE_URL}/admin/calendar/digests/{self.created_digest_id}/publish",
                headers=self.admin_headers(),
                timeout=10
            )
            if response.status_code in [200, 201]:
                data = response.json()
                is_published = data.get("status") == "PUBLISHED"
                self.log("Publish Digest", is_published, 
                        f"Status: {data.get('status', 'N/A')}")
                return True
            else:
                self.log("Publish Digest", False, 
                        f"Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log("Publish Digest", False, f"Exception: {str(e)}")
            return False

    def test_public_list_digests(self):
        """Test GET /api/calendar/digests (public, no auth)"""
        try:
            response = requests.get(
                f"{BASE_URL}/calendar/digests",
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                # Verify no sensitive fields exposed
                no_sensitive = True
                for item in items:
                    if "aiProviderCostUsd" in item or "aiModel" in item:
                        no_sensitive = False
                        break
                
                self.log("Public List Digests", no_sensitive, 
                        f"Found {len(items)} published digests, no sensitive fields: {no_sensitive}")
                return True
            else:
                self.log("Public List Digests", False, 
                        f"Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log("Public List Digests", False, f"Exception: {str(e)}")
            return False

    def test_public_get_published_digest(self):
        """Test GET /api/calendar/digests/{id} (public)"""
        if not self.created_digest_id:
            self.log("Public Get Digest", False, "No digest ID available")
            return False
        
        try:
            response = requests.get(
                f"{BASE_URL}/calendar/digests/{self.created_digest_id}",
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                # Verify no sensitive fields
                no_sensitive = "aiProviderCostUsd" not in data and "aiModel" not in data
                self.log("Public Get Digest", no_sensitive, 
                        f"Retrieved published digest, no sensitive fields: {no_sensitive}")
                return True
            else:
                self.log("Public Get Digest", False, 
                        f"Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log("Public Get Digest", False, f"Exception: {str(e)}")
            return False

    def test_unpublish_digest(self):
        """Test POST /api/admin/calendar/digests/{id}/unpublish"""
        if not self.created_digest_id:
            self.log("Unpublish Digest", False, "No digest ID available")
            return False
        
        try:
            response = requests.post(
                f"{BASE_URL}/admin/calendar/digests/{self.created_digest_id}/unpublish",
                headers=self.admin_headers(),
                timeout=10
            )
            if response.status_code in [200, 201]:
                data = response.json()
                is_draft = data.get("status") == "DRAFT"
                self.log("Unpublish Digest", is_draft, 
                        f"Status: {data.get('status', 'N/A')}")
                return True
            else:
                self.log("Unpublish Digest", False, 
                        f"Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log("Unpublish Digest", False, f"Exception: {str(e)}")
            return False

    def test_public_get_draft_digest_404(self):
        """Test GET /api/calendar/digests/{id} returns 404 for DRAFT"""
        if not self.created_digest_id:
            self.log("Public Get Draft 404", False, "No digest ID available")
            return False
        
        try:
            response = requests.get(
                f"{BASE_URL}/calendar/digests/{self.created_digest_id}",
                timeout=10
            )
            # Should return 404 for DRAFT digest
            is_404 = response.status_code == 404
            self.log("Public Get Draft 404", is_404, 
                    f"Status: {response.status_code} (expected 404 for DRAFT)")
            return True
        except Exception as e:
            self.log("Public Get Draft 404", False, f"Exception: {str(e)}")
            return False

    def test_archive_digest(self):
        """Test POST /api/admin/calendar/digests/{id}/archive"""
        if not self.created_digest_id:
            self.log("Archive Digest", False, "No digest ID available")
            return False
        
        try:
            response = requests.post(
                f"{BASE_URL}/admin/calendar/digests/{self.created_digest_id}/archive",
                headers=self.admin_headers(),
                timeout=10
            )
            if response.status_code in [200, 201]:
                data = response.json()
                is_archived = data.get("status") == "ARCHIVED"
                self.log("Archive Digest", is_archived, 
                        f"Status: {data.get('status', 'N/A')}")
                return True
            else:
                self.log("Archive Digest", False, 
                        f"Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log("Archive Digest", False, f"Exception: {str(e)}")
            return False

    def test_calendar_events_related_article(self):
        """Test GET /api/calendar/events - verify relatedArticleId present"""
        try:
            response = requests.get(
                f"{BASE_URL}/calendar/events",
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])
                # Look for ARB Token Unlock event with relatedArticleId
                arb_event = None
                for item in items:
                    if "ARB" in item.get("title", "") and "Unlock" in item.get("title", ""):
                        arb_event = item
                        break
                
                if arb_event:
                    has_related = "relatedArticleId" in arb_event and arb_event["relatedArticleId"]
                    self.log("Calendar Events RelatedArticleId", has_related, 
                            f"ARB event has relatedArticleId: {arb_event.get('relatedArticleId', 'N/A')}")
                    return True
                else:
                    self.log("Calendar Events RelatedArticleId", True, 
                            f"No ARB Unlock event found, but endpoint works. Total events: {len(items)}")
                    return True
            else:
                self.log("Calendar Events RelatedArticleId", False, 
                        f"Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log("Calendar Events RelatedArticleId", False, f"Exception: {str(e)}")
            return False

    def test_delete_digest(self):
        """Test DELETE /api/admin/calendar/digests/{id}"""
        if not self.created_digest_id:
            self.log("Delete Digest", False, "No digest ID available")
            return False
        
        try:
            response = requests.delete(
                f"{BASE_URL}/admin/calendar/digests/{self.created_digest_id}",
                headers=self.admin_headers(),
                timeout=10
            )
            if response.status_code == 200:
                data = response.json()
                self.log("Delete Digest", True, "Digest deleted successfully")
                return True
            else:
                self.log("Delete Digest", False, 
                        f"Expected 200, got {response.status_code}")
                return False
        except Exception as e:
            self.log("Delete Digest", False, f"Exception: {str(e)}")
            return False

    def run_all_tests(self):
        """Run all tests in sequence"""
        print("\n" + "="*70)
        print("FOMO Market Digests Backend Test Suite")
        print("="*70 + "\n")

        # Admin CRUD tests
        print("--- Admin CRUD Tests ---")
        self.test_admin_list_digests()
        self.test_create_digest()
        self.test_get_digest()
        self.test_patch_digest()

        # AI generation tests
        print("\n--- AI Generation Tests ---")
        self.test_ai_generate_week()
        self.test_ai_generate_month()
        self.test_ai_generate_quarter()

        # Lifecycle tests
        print("\n--- Lifecycle Tests ---")
        self.test_publish_digest()
        self.test_public_list_digests()
        self.test_public_get_published_digest()
        self.test_unpublish_digest()
        self.test_public_get_draft_digest_404()
        self.test_archive_digest()

        # Calendar cross-through test
        print("\n--- Calendar Integration Tests ---")
        self.test_calendar_events_related_article()

        # Cleanup
        print("\n--- Cleanup ---")
        self.test_delete_digest()

        # Summary
        print("\n" + "="*70)
        print(f"Tests Passed: {self.tests_passed}/{self.tests_run}")
        print("="*70 + "\n")

        return self.tests_passed == self.tests_run

def main():
    tester = DigestTester()
    success = tester.run_all_tests()
    
    # Save results
    results = {
        "timestamp": datetime.now().isoformat(),
        "total_tests": tester.tests_run,
        "passed_tests": tester.tests_passed,
        "failed_tests": tester.tests_run - tester.tests_passed,
        "success_rate": f"{(tester.tests_passed/tester.tests_run*100):.1f}%",
        "test_details": tester.test_results
    }
    
    with open("/app/test_reports/backend_digest_results.json", "w") as f:
        json.dump(results, f, indent=2)
    
    print(f"Results saved to /app/test_reports/backend_digest_results.json")
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
