#!/usr/bin/env python3
"""
FOMO Calendar Backend API Test Suite
Tests public calendar API and admin calendar management flow
"""
import requests
import sys
from typing import Dict, Any, Optional
from datetime import datetime, timedelta

# Public endpoint
BASE_URL = "https://fomo-complete-setup.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"


class CalendarTester:
    def __init__(self):
        self.token: Optional[str] = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failures = []
        self.created_event_id: Optional[str] = None

    def log(self, msg: str, level: str = "INFO"):
        prefix = {"INFO": "ℹ️", "PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}
        print(f"{prefix.get(level, '•')} {msg}")

    def test(self, name: str, fn, expected_status: int = 200) -> Dict[str, Any]:
        """Run a single test"""
        self.tests_run += 1
        self.log(f"Testing: {name}", "INFO")
        try:
            result = fn()
            if isinstance(result, requests.Response):
                status = result.status_code
                try:
                    data = result.json()
                except:
                    data = {"text": result.text[:200]}
                
                if status == expected_status:
                    self.tests_passed += 1
                    self.log(f"PASSED - Status: {status}", "PASS")
                    return {"success": True, "data": data, "status": status}
                else:
                    self.log(f"FAILED - Expected {expected_status}, got {status}", "FAIL")
                    self.log(f"Response: {str(data)[:300]}", "WARN")
                    self.failures.append(f"{name}: Expected {expected_status}, got {status}")
                    return {"success": False, "data": data, "status": status}
            else:
                self.tests_passed += 1
                self.log(f"PASSED", "PASS")
                return {"success": True, "data": result}
        except Exception as e:
            self.log(f"FAILED - Exception: {str(e)}", "FAIL")
            self.failures.append(f"{name}: {str(e)}")
            return {"success": False, "error": str(e)}

    def admin_login(self) -> bool:
        """Test admin login and store token"""
        def login_request():
            return requests.post(
                f"{BASE_URL}/user/admin/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                headers={"Content-Type": "application/json"}
            )
        
        result = self.test("Admin Login", login_request, 202)
        if result["success"] and "data" in result:
            self.token = result["data"].get("accessToken")
            if self.token:
                self.log(f"Token acquired: {self.token[:20]}...", "INFO")
                return True
        return False

    def get_headers(self) -> Dict[str, str]:
        """Get auth headers"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }

    def test_calendar_types(self):
        """Test GET /api/calendar/types - should return event type registry"""
        def request():
            return requests.get(f"{BASE_URL}/calendar/types")
        
        result = self.test("GET /api/calendar/types", request)
        if result["success"]:
            data = result["data"]
            items = data.get("items", [])
            self.log(f"  Event types found: {len(items)}", "INFO")
            if len(items) > 0:
                # Log some example types
                for item in items[:3]:
                    self.log(f"    - {item.get('name')} ({item.get('key')})", "INFO")
            else:
                self.log(f"  WARNING: No event types found", "WARN")
        return result

    def test_public_events(self):
        """Test GET /api/calendar/events - should return only PUBLISHED + PUBLIC events"""
        def request():
            return requests.get(f"{BASE_URL}/calendar/events")
        
        result = self.test("GET /api/calendar/events (public)", request)
        if result["success"]:
            data = result["data"]
            items = data.get("items", [])
            self.log(f"  Public events found: {len(items)}", "INFO")
            
            # Expected: 9 seeded public events
            if len(items) != 9:
                self.log(f"  WARNING: Expected 9 seeded events, got {len(items)}", "WARN")
            
            # Verify all are PUBLISHED
            draft_events = [e for e in items if e.get("lifecycleStatus") == "DRAFT"]
            if draft_events:
                self.log(f"  ERROR: Found {len(draft_events)} DRAFT events in public API", "FAIL")
                self.failures.append("Public API returned DRAFT events")
            
            # Log some event details
            if items:
                self.log(f"  Sample events:", "INFO")
                for event in items[:3]:
                    self.log(f"    - {event.get('title')} ({event.get('eventType')})", "INFO")
        return result

    def test_filtered_events(self):
        """Test GET /api/calendar/events?eventType=TOKEN_UNLOCK - should return only unlock events"""
        def request():
            return requests.get(f"{BASE_URL}/calendar/events?eventType=TOKEN_UNLOCK")
        
        result = self.test("GET /api/calendar/events?eventType=TOKEN_UNLOCK", request)
        if result["success"]:
            data = result["data"]
            items = data.get("items", [])
            self.log(f"  TOKEN_UNLOCK events found: {len(items)}", "INFO")
            
            # Expected: 2 unlock events
            if len(items) != 2:
                self.log(f"  WARNING: Expected 2 TOKEN_UNLOCK events, got {len(items)}", "WARN")
            
            # Verify all are TOKEN_UNLOCK
            non_unlock = [e for e in items if e.get("eventType") != "TOKEN_UNLOCK"]
            if non_unlock:
                self.log(f"  ERROR: Found {len(non_unlock)} non-TOKEN_UNLOCK events", "FAIL")
                self.failures.append("Filter returned wrong event types")
            
            # Log event details
            for event in items:
                self.log(f"    - {event.get('title')} ({event.get('tokenSymbol', 'N/A')})", "INFO")
        return result

    def test_calendar_digest(self):
        """Test GET /api/calendar/digest?period=week - should return grouped events"""
        def request():
            return requests.get(f"{BASE_URL}/calendar/digest?period=week")
        
        result = self.test("GET /api/calendar/digest?period=week", request)
        if result["success"]:
            data = result["data"]
            total = data.get("totalEvents", 0)
            groups = data.get("groups", {})
            by_type = data.get("byType", {})
            by_source = data.get("bySource", {})
            
            self.log(f"  Total events: {total}", "INFO")
            self.log(f"  Groups: {list(groups.keys())}", "INFO")
            for group_name, group_events in groups.items():
                self.log(f"    - {group_name}: {len(group_events)} events", "INFO")
            
            self.log(f"  By type: {by_type}", "INFO")
            self.log(f"  By source: {by_source}", "INFO")
            
            # Verify structure
            required_keys = ["period", "from", "to", "totalEvents", "groups", "byType", "bySource", "events"]
            missing = [k for k in required_keys if k not in data]
            if missing:
                self.log(f"  ERROR: Missing keys in digest: {missing}", "FAIL")
                self.failures.append(f"Digest missing keys: {missing}")
        return result

    def test_create_event(self):
        """Test POST /api/admin/calendar/events - create a new event"""
        # Create event in the future (Aug 2026)
        future_date = "2026-08-25T14:00:00Z"
        
        def request():
            return requests.post(
                f"{BASE_URL}/admin/calendar/events",
                json={
                    "title": "Test Event - Automated Test",
                    "shortDescription": "This is a test event created by automated testing",
                    "eventType": "CUSTOM",
                    "startAt": future_date,
                    "visibility": "PUBLIC",
                    "lifecycleStatus": "DRAFT"
                },
                headers=self.get_headers()
            )
        
        result = self.test("POST /api/admin/calendar/events (create)", request, 201)
        if result["success"]:
            data = result["data"]
            self.created_event_id = data.get("id")
            self.log(f"  Created event ID: {self.created_event_id}", "INFO")
            self.log(f"  Title: {data.get('title')}", "INFO")
            self.log(f"  Status: {data.get('lifecycleStatus')}", "INFO")
            
            # Verify it's DRAFT
            if data.get("lifecycleStatus") != "DRAFT":
                self.log(f"  ERROR: Expected DRAFT status, got {data.get('lifecycleStatus')}", "FAIL")
        return result

    def test_verify_draft_not_public(self):
        """Verify DRAFT event does NOT appear in public API"""
        if not self.created_event_id:
            self.log("Skipping - no event created", "WARN")
            return {"success": True, "skipped": True}
        
        def request():
            return requests.get(f"{BASE_URL}/calendar/events")
        
        result = self.test("Verify DRAFT not in public API", request)
        if result["success"]:
            data = result["data"]
            items = data.get("items", [])
            
            # Check if our test event appears
            test_event = next((e for e in items if e.get("id") == self.created_event_id), None)
            if test_event:
                self.log(f"  ERROR: DRAFT event appeared in public API!", "FAIL")
                self.failures.append("DRAFT event visible in public API")
                return {"success": False, "data": data}
            else:
                self.log(f"  CORRECT: DRAFT event not in public API", "PASS")
        return result

    def test_publish_event(self):
        """Test POST /api/admin/calendar/events/:id/publish"""
        if not self.created_event_id:
            self.log("Skipping - no event created", "WARN")
            return {"success": True, "skipped": True}
        
        def request():
            return requests.post(
                f"{BASE_URL}/admin/calendar/events/{self.created_event_id}/publish",
                headers=self.get_headers()
            )
        
        # Accept both 200 and 201 as valid
        result = self.test("POST /api/admin/calendar/events/:id/publish", request, 201)
        if result["success"]:
            data = result["data"]
            self.log(f"  Status after publish: {data.get('lifecycleStatus')}", "INFO")
            
            # Verify it's PUBLISHED
            if data.get("lifecycleStatus") != "PUBLISHED":
                self.log(f"  ERROR: Expected PUBLISHED status, got {data.get('lifecycleStatus')}", "FAIL")
                self.failures.append("Event not published correctly")
        return result

    def test_verify_published_is_public(self):
        """Verify PUBLISHED event DOES appear in public API"""
        if not self.created_event_id:
            self.log("Skipping - no event created", "WARN")
            return {"success": True, "skipped": True}
        
        def request():
            return requests.get(f"{BASE_URL}/calendar/events")
        
        result = self.test("Verify PUBLISHED in public API", request)
        if result["success"]:
            data = result["data"]
            items = data.get("items", [])
            
            # Check if our test event appears
            test_event = next((e for e in items if e.get("id") == self.created_event_id), None)
            if not test_event:
                self.log(f"  ERROR: PUBLISHED event NOT in public API!", "FAIL")
                self.failures.append("PUBLISHED event not visible in public API")
                return {"success": False, "data": data}
            else:
                self.log(f"  CORRECT: PUBLISHED event found in public API", "PASS")
                self.log(f"    Title: {test_event.get('title')}", "INFO")
        return result

    def test_cleanup(self):
        """Delete the test event"""
        if not self.created_event_id:
            return {"success": True, "skipped": True}
        
        def request():
            return requests.delete(
                f"{BASE_URL}/admin/calendar/events/{self.created_event_id}",
                headers=self.get_headers()
            )
        
        result = self.test("DELETE test event (cleanup)", request)
        return result

    def run_all_tests(self):
        """Run complete test suite"""
        self.log("=" * 70, "INFO")
        self.log("FOMO Calendar Backend API Test Suite", "INFO")
        self.log("=" * 70, "INFO")
        
        # 1. Test public endpoints (no auth required)
        self.log("\n--- Testing Public Calendar API ---", "INFO")
        self.test_calendar_types()
        self.test_public_events()
        self.test_filtered_events()
        self.test_calendar_digest()
        
        # 2. Admin login
        self.log("\n--- Testing Admin Flow ---", "INFO")
        if not self.admin_login():
            self.log("Admin login failed - skipping admin tests", "FAIL")
        else:
            # 3. Test admin flow: create -> verify not public -> publish -> verify public
            self.test_create_event()
            self.test_verify_draft_not_public()
            self.test_publish_event()
            self.test_verify_published_is_public()
            
            # 4. Cleanup
            self.log("\n--- Cleanup ---", "INFO")
            self.test_cleanup()
        
        # Print summary
        self.log("\n" + "=" * 70, "INFO")
        self.log(f"Tests Run: {self.tests_run}", "INFO")
        self.log(f"Tests Passed: {self.tests_passed}", "PASS" if self.tests_passed == self.tests_run else "WARN")
        self.log(f"Tests Failed: {len(self.failures)}", "FAIL" if self.failures else "INFO")
        
        if self.failures:
            self.log("\nFailures:", "FAIL")
            for failure in self.failures:
                self.log(f"  - {failure}", "FAIL")
        
        self.log("=" * 70, "INFO")
        
        return self.tests_passed == self.tests_run


def main():
    tester = CalendarTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
