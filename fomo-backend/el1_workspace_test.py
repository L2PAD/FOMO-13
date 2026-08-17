#!/usr/bin/env python3
"""
EL-1 Activity Workspace Backend Testing Suite
Tests server-driven workspace object, comments, calendar, board, and task integration
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://fomo53-crm.preview.emergentagent.com/api"

# Test activity IDs from review_request
TEST_ACTIVITY_IDS = [
    "6a7a0fad05a0dc9383fb1a98",  # Monad
    "6a7a0fad05a0dc9383fb1a9a",
    "6a7a0fad05a0dc9383fb1a9c",
]

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class EL1WorkspaceTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.critical_failures = []
        self.auth_token = None
        self.test_user_id = None

    def log(self, message: str, color: str = Colors.BLUE):
        print(f"{color}{message}{Colors.END}")

    def success(self, message: str):
        self.log(f"✅ {message}", Colors.GREEN)

    def failure(self, message: str, critical: bool = False):
        self.log(f"❌ {message}", Colors.RED)
        if critical:
            self.critical_failures.append(message)

    def warning(self, message: str):
        self.log(f"⚠️  {message}", Colors.YELLOW)

    def test(self, name: str, fn):
        """Run a test and track results"""
        self.tests_run += 1
        self.log(f"\n{'='*70}")
        self.log(f"TEST {self.tests_run}: {name}")
        self.log(f"{'='*70}")
        try:
            result = fn()
            if result:
                self.tests_passed += 1
                self.success(f"PASSED: {name}")
            else:
                self.tests_failed += 1
                self.failure(f"FAILED: {name}")
            return result
        except Exception as e:
            self.tests_failed += 1
            self.failure(f"EXCEPTION in {name}: {str(e)}")
            import traceback
            traceback.print_exc()
            return False

    def get(self, endpoint: str, params: Optional[Dict] = None, auth: bool = False) -> requests.Response:
        """Make GET request"""
        url = f"{BASE_URL}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth and self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        
        self.log(f"GET {url}")
        if params:
            self.log(f"Params: {json.dumps(params, indent=2)}")
        
        response = requests.get(url, headers=headers, params=params)
        self.log(f"Status: {response.status_code}")
        return response

    def post(self, endpoint: str, data: Dict, auth: bool = False) -> requests.Response:
        """Make POST request"""
        url = f"{BASE_URL}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth and self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        
        self.log(f"POST {url}")
        self.log(f"Body: {json.dumps(data, indent=2)}")
        
        response = requests.post(url, headers=headers, json=data)
        self.log(f"Status: {response.status_code}")
        if response.status_code >= 400:
            self.log(f"Error Response: {response.text}")
        return response

    def delete(self, endpoint: str, auth: bool = False) -> requests.Response:
        """Make DELETE request"""
        url = f"{BASE_URL}/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        if auth and self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'
        
        self.log(f"DELETE {url}")
        response = requests.delete(url, headers=headers)
        self.log(f"Status: {response.status_code}")
        return response

    def test_anonymous_activity_detail_workspace(self):
        """Test: Anonymous user can get activity detail with workspace object"""
        def test():
            activity_id = TEST_ACTIVITY_IDS[0]  # Monad
            response = self.get(f"crypto-activities/{activity_id}")
            
            if response.status_code != 200:
                self.failure(f"Failed to get activity detail: {response.status_code}", critical=True)
                return False
            
            data = response.json()
            self.log(f"Activity name: {data.get('name', 'N/A')}")
            
            # Verify workspace object exists
            if 'workspace' not in data:
                self.failure("workspace object missing from response", critical=True)
                return False
            self.success("workspace object present")
            
            workspace = data['workspace']
            
            # Verify calendar structure
            if 'calendar' not in workspace:
                self.failure("workspace.calendar missing", critical=True)
                return False
            
            calendar = workspace['calendar']
            required_calendar_fields = ['added', 'eventsCount', 'nextDate', 'href']
            for field in required_calendar_fields:
                if field not in calendar:
                    self.failure(f"workspace.calendar.{field} missing", critical=True)
                    return False
            self.success(f"workspace.calendar has all required fields: {calendar}")
            
            # Verify board structure
            if 'board' not in workspace:
                self.failure("workspace.board missing", critical=True)
                return False
            
            board = workspace['board']
            required_board_fields = ['added', 'cardId', 'status', 'notePreview', 'href']
            for field in required_board_fields:
                if field not in board:
                    self.failure(f"workspace.board.{field} missing", critical=True)
                    return False
            self.success(f"workspace.board has all required fields: {board}")
            
            # Verify fomoTasks structure
            if 'fomoTasks' not in workspace:
                self.failure("workspace.fomoTasks missing", critical=True)
                return False
            
            fomo_tasks = workspace['fomoTasks']
            required_fomo_fields = ['count', 'available', 'inProgress', 'review', 'completed', 'totalXp', 'href']
            for field in required_fomo_fields:
                if field not in fomo_tasks:
                    self.failure(f"workspace.fomoTasks.{field} missing", critical=True)
                    return False
            self.success(f"workspace.fomoTasks has all required fields: {fomo_tasks}")
            
            # For anonymous user, calendar.added and board.added should be false
            if calendar['added'] != False:
                self.warning(f"Anonymous user calendar.added should be false, got {calendar['added']}")
            if board['added'] != False:
                self.warning(f"Anonymous user board.added should be false, got {board['added']}")
            
            return True
        
        return self.test("Anonymous user gets activity detail with workspace object", test)

    def test_activity_list_comments_count(self):
        """Test: Activity list includes commentsCount and hasComments"""
        def test():
            response = self.get("crypto-activities", {"limit": "10"})
            
            if response.status_code != 200:
                self.failure(f"Failed to get activity list: {response.status_code}", critical=True)
                return False
            
            data = response.json()
            items = data.get('items', [])
            
            if not items:
                self.failure("No activities in list", critical=True)
                return False
            
            self.log(f"Found {len(items)} activities")
            
            # Check first activity for commentsCount and hasComments
            first_activity = items[0]
            
            if 'commentsCount' not in first_activity:
                self.failure("commentsCount missing from activity list item", critical=True)
                return False
            self.success(f"commentsCount present: {first_activity['commentsCount']}")
            
            if 'hasComments' not in first_activity:
                self.failure("hasComments missing from activity list item", critical=True)
                return False
            self.success(f"hasComments present: {first_activity['hasComments']}")
            
            # Verify types
            if not isinstance(first_activity['commentsCount'], int):
                self.failure(f"commentsCount should be integer, got {type(first_activity['commentsCount'])}")
                return False
            
            if not isinstance(first_activity['hasComments'], bool):
                self.failure(f"hasComments should be boolean, got {type(first_activity['hasComments'])}")
                return False
            
            self.success("commentsCount and hasComments have correct types")
            
            return True
        
        return self.test("Activity list includes commentsCount and hasComments", test)

    def test_multiple_activities_workspace(self):
        """Test: Multiple test activities return workspace object"""
        def test():
            all_passed = True
            
            for activity_id in TEST_ACTIVITY_IDS:
                self.log(f"\nTesting activity: {activity_id}")
                response = self.get(f"crypto-activities/{activity_id}")
                
                if response.status_code != 200:
                    self.warning(f"Activity {activity_id} not found or error: {response.status_code}")
                    continue
                
                data = response.json()
                
                if 'workspace' not in data:
                    self.failure(f"Activity {activity_id} missing workspace object")
                    all_passed = False
                    continue
                
                workspace = data['workspace']
                
                # Quick validation
                if 'calendar' not in workspace or 'board' not in workspace or 'fomoTasks' not in workspace:
                    self.failure(f"Activity {activity_id} workspace incomplete")
                    all_passed = False
                    continue
                
                self.success(f"Activity {activity_id} has complete workspace: calendar={workspace['calendar']['added']}, board={workspace['board']['added']}, tasks={workspace['fomoTasks']['count']}")
            
            return all_passed
        
        return self.test("Multiple test activities return workspace object", test)

    def test_comments_get_empty(self):
        """Test: GET comments for activity (should work without auth)"""
        def test():
            activity_id = TEST_ACTIVITY_IDS[0]
            page_key = f"earlyland-activity-{activity_id}"
            
            response = self.get(f"comments/{page_key}")
            
            if response.status_code != 200:
                self.failure(f"Failed to get comments: {response.status_code}", critical=True)
                return False
            
            data = response.json()
            self.log(f"Comments response: {json.dumps(data, indent=2)[:500]}")
            
            # Should return array or object with comments
            if isinstance(data, list):
                self.success(f"Comments returned as array with {len(data)} items")
            elif isinstance(data, dict):
                self.success(f"Comments returned as object")
            else:
                self.failure(f"Unexpected comments response type: {type(data)}")
                return False
            
            return True
        
        return self.test("GET comments for activity (anonymous)", test)

    def test_backend_health(self):
        """Test: Backend is responding"""
        def test():
            try:
                response = self.get("crypto-activities", {"limit": "1"})
                if response.status_code == 200:
                    self.success("Backend is healthy and responding")
                    return True
                else:
                    self.failure(f"Backend returned unexpected status: {response.status_code}", critical=True)
                    return False
            except Exception as e:
                self.failure(f"Backend is not responding: {str(e)}", critical=True)
                return False
        
        return self.test("Backend health check", test)

    def test_workspace_non_sensitive_data(self):
        """Test: Workspace never leaks Prime content (anonymous user)"""
        def test():
            activity_id = TEST_ACTIVITY_IDS[0]
            response = self.get(f"crypto-activities/{activity_id}")
            
            if response.status_code != 200:
                self.failure(f"Failed to get activity: {response.status_code}")
                return False
            
            data = response.json()
            workspace = data.get('workspace', {})
            
            # Workspace should only contain counts, status, IDs, hrefs
            # Should NOT contain: task content, guide steps, review TEXT, hidden links
            # Note: 'review' in fomoTasks is a COUNT (submitted+under_review), not content
            
            # Check calendar - should only have metadata
            calendar = workspace.get('calendar', {})
            sensitive_fields = ['steps', 'guide', 'content', 'text', 'links']
            for field in sensitive_fields:
                if field in calendar:
                    self.failure(f"workspace.calendar contains sensitive field: {field}", critical=True)
                    return False
            
            # Check board - should only have status/id/preview
            board = workspace.get('board', {})
            for field in sensitive_fields:
                if field in board:
                    self.failure(f"workspace.board contains sensitive field: {field}", critical=True)
                    return False
            
            # Check fomoTasks - should only have counts (review is a count, not content)
            fomo_tasks = workspace.get('fomoTasks', {})
            for field in ['steps', 'guide', 'content', 'text', 'links']:
                if field in fomo_tasks:
                    self.failure(f"workspace.fomoTasks contains sensitive field: {field}", critical=True)
                    return False
            
            # Verify fomoTasks.review is a number (count), not content
            if 'review' in fomo_tasks:
                if not isinstance(fomo_tasks['review'], int):
                    self.failure(f"workspace.fomoTasks.review should be int count, got {type(fomo_tasks['review'])}", critical=True)
                    return False
                self.success(f"workspace.fomoTasks.review is a count (int): {fomo_tasks['review']}")
            
            self.success("Workspace contains only non-sensitive data (counts, status, IDs, hrefs)")
            
            return True
        
        return self.test("Workspace never leaks Prime content for anonymous user", test)

    def test_activity_detail_structure(self):
        """Test: Activity detail has expected structure"""
        def test():
            activity_id = TEST_ACTIVITY_IDS[0]
            response = self.get(f"crypto-activities/{activity_id}")
            
            if response.status_code != 200:
                self.failure(f"Failed to get activity: {response.status_code}")
                return False
            
            data = response.json()
            
            # Check basic fields
            required_fields = ['_id', 'id', 'name', 'slug', 'lifecycleStatus', 'accessTier']
            for field in required_fields:
                if field not in data:
                    self.failure(f"Activity missing required field: {field}")
                    return False
            
            self.success(f"Activity has all required fields")
            
            # Check commentsCount and hasComments
            if 'commentsCount' not in data:
                self.failure("Activity detail missing commentsCount")
                return False
            if 'hasComments' not in data:
                self.failure("Activity detail missing hasComments")
                return False
            
            self.success(f"Activity has commentsCount={data['commentsCount']}, hasComments={data['hasComments']}")
            
            return True
        
        return self.test("Activity detail has expected structure", test)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY - EL-1 Activity Workspace")
        print("="*70)
        print(f"Total Tests: {self.tests_run}")
        print(f"{Colors.GREEN}Passed: {self.tests_passed}{Colors.END}")
        print(f"{Colors.RED}Failed: {self.tests_failed}{Colors.END}")
        
        if self.critical_failures:
            print(f"\n{Colors.RED}CRITICAL FAILURES:{Colors.END}")
            for failure in self.critical_failures:
                print(f"  - {failure}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        if self.tests_failed == 0:
            print(f"\n{Colors.GREEN}🎉 ALL TESTS PASSED!{Colors.END}")
            return 0
        elif len(self.critical_failures) > 0:
            print(f"\n{Colors.RED}❌ CRITICAL FAILURES DETECTED{Colors.END}")
            return 1
        else:
            print(f"\n{Colors.YELLOW}⚠️  SOME NON-CRITICAL TESTS FAILED{Colors.END}")
            return 0

def main():
    print(f"{Colors.BLUE}{'='*70}")
    print("EL-1 Activity Workspace Backend Testing Suite")
    print("Testing server-driven workspace, comments, calendar, board integration")
    print(f"{'='*70}{Colors.END}\n")
    
    tester = EL1WorkspaceTester()
    
    # Run tests in order (anonymous tests first)
    tester.test_backend_health()
    tester.test_anonymous_activity_detail_workspace()
    tester.test_activity_list_comments_count()
    tester.test_multiple_activities_workspace()
    tester.test_comments_get_empty()
    tester.test_workspace_non_sensitive_data()
    tester.test_activity_detail_structure()
    
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())
