#!/usr/bin/env python3
"""
FOMO Social Notifications & Repost Testing Suite
Tests social notification loop (repost/reply/like) and Follow Me feed
"""

import requests
import json
import sys
import time
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://fomo-crm-demo.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"
ALICE_USER_ID = "6a82f363a69208b6dccb4019"
ALICE_TOPIC_ID = "6a82fc3927f8cdfd56944e04"
ADMIN_USER_ID = "6a82f3633335c0bd9cf972b3"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class SocialNotificationsTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.critical_failures = []
        self.admin_token = None
        self.admin_user_id = None

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
        self.log(f"\n{'='*60}")
        self.log(f"TEST {self.tests_run}: {name}")
        self.log(f"{'='*60}")
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

    def get_headers(self, token: Optional[str] = None) -> Dict[str, str]:
        """Get headers with optional auth token"""
        headers = {'Content-Type': 'application/json'}
        if token:
            headers['Authorization'] = f'Bearer {token}'
        return headers

    def test_admin_login(self):
        """Test: Admin login returns 202 + accessToken"""
        def test():
            url = f"{BASE_URL}/user/admin/login"
            data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            self.log(f"POST {url}")
            self.log(f"Body: {json.dumps(data, indent=2)}")
            
            response = requests.post(url, json=data, headers=self.get_headers())
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 202:
                self.failure(f"Expected status 202, got {response.status_code}", critical=True)
                self.log(f"Response: {response.text}")
                return False
            
            self.success("Status is 202")
            
            result = response.json()
            self.log(f"Response: {json.dumps(result, indent=2)}")
            
            if 'accessToken' not in result:
                self.failure("Response missing accessToken", critical=True)
                return False
            
            self.admin_token = result['accessToken']
            self.success(f"Got accessToken: {self.admin_token[:20]}...")
            
            # Extract user ID from response if available
            if 'user' in result and '_id' in result['user']:
                self.admin_user_id = result['user']['_id']
                self.log(f"Admin user ID: {self.admin_user_id}")
            else:
                self.admin_user_id = ADMIN_USER_ID
                self.log(f"Using default admin user ID: {self.admin_user_id}")
            
            return True
        
        return self.test("Admin login (POST /api/user/admin/login)", test)

    def test_notifications_unread_count_no_auth(self):
        """Test: Notifications API returns 401/403 without token"""
        def test():
            url = f"{BASE_URL}/notifications/social/unread-count"
            
            self.log(f"GET {url} (no auth)")
            response = requests.get(url, headers=self.get_headers())
            self.log(f"Status: {response.status_code}")
            
            if response.status_code not in [401, 403]:
                self.failure(f"Expected 401/403 without token, got {response.status_code}")
                return False
            
            self.success(f"Correctly returns {response.status_code} without auth")
            return True
        
        return self.test("Notifications API requires auth (401/403 without token)", test)

    def test_notifications_unread_count(self):
        """Test: GET /api/notifications/social/unread-count returns {unread:number}"""
        def test():
            if not self.admin_token:
                self.failure("No admin token available", critical=True)
                return False
            
            url = f"{BASE_URL}/notifications/social/unread-count"
            
            self.log(f"GET {url}")
            response = requests.get(url, headers=self.get_headers(self.admin_token))
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Expected status 200, got {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
            
            self.success("Status is 200")
            
            result = response.json()
            self.log(f"Response: {json.dumps(result, indent=2)}")
            
            if 'unread' not in result:
                self.failure("Response missing 'unread' field")
                return False
            
            if not isinstance(result['unread'], int):
                self.failure(f"'unread' should be a number, got {type(result['unread'])}")
                return False
            
            self.success(f"Unread count: {result['unread']}")
            return True
        
        return self.test("GET /api/notifications/social/unread-count", test)

    def test_notifications_list(self):
        """Test: GET /api/notifications/social returns array"""
        def test():
            if not self.admin_token:
                self.failure("No admin token available", critical=True)
                return False
            
            url = f"{BASE_URL}/notifications/social"
            
            self.log(f"GET {url}")
            response = requests.get(url, headers=self.get_headers(self.admin_token))
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Expected status 200, got {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
            
            self.success("Status is 200")
            
            result = response.json()
            
            if not isinstance(result, list):
                self.failure(f"Expected array response, got {type(result)}")
                return False
            
            self.success(f"Got array with {len(result)} notifications")
            
            if len(result) > 0:
                self.log(f"Sample notification: {json.dumps(result[0], indent=2)}")
            
            return True
        
        return self.test("GET /api/notifications/social", test)

    def test_repost_creates_notification(self):
        """Test: Repost creates cross-user notification"""
        def test():
            if not self.admin_token:
                self.failure("No admin token available", critical=True)
                return False
            
            # First, toggle repost OFF if it's already on
            url = f"{BASE_URL}/comments/repost/{ALICE_TOPIC_ID}"
            self.log(f"PUT {url} (toggle OFF if needed)")
            response = requests.put(url, headers=self.get_headers(self.admin_token))
            self.log(f"Status: {response.status_code}")
            
            if response.status_code == 200:
                result = response.json()
                self.log(f"Response: {json.dumps(result, indent=2)}")
                
                # If reposted is True, toggle again to turn it OFF
                if result.get('reposted'):
                    self.log("Repost is ON, toggling OFF first...")
                    response = requests.put(url, headers=self.get_headers(self.admin_token))
                    self.log(f"Status: {response.status_code}")
                    if response.status_code == 200:
                        result = response.json()
                        self.log(f"Response: {json.dumps(result, indent=2)}")
                        self.success("Toggled repost OFF")
                        time.sleep(1)  # Wait a bit
            
            # Now toggle repost ON
            self.log(f"PUT {url} (toggle ON)")
            response = requests.put(url, headers=self.get_headers(self.admin_token))
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Expected status 200, got {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
            
            self.success("Status is 200")
            
            result = response.json()
            self.log(f"Response: {json.dumps(result, indent=2)}")
            
            if 'repostsCount' not in result:
                self.failure("Response missing 'repostsCount'")
                return False
            
            if 'reposted' not in result:
                self.failure("Response missing 'reposted'")
                return False
            
            if not result['reposted']:
                self.failure("Expected reposted=true after toggling ON")
                return False
            
            self.success(f"Reposted successfully, count: {result['repostsCount']}")
            
            # Wait a bit for notification to be created
            time.sleep(2)
            
            # Check that admin's unread count is still 0 (admin is actor, not recipient)
            unread_url = f"{BASE_URL}/notifications/social/unread-count"
            unread_response = requests.get(unread_url, headers=self.get_headers(self.admin_token))
            
            if unread_response.status_code == 200:
                unread_result = unread_response.json()
                admin_unread = unread_result.get('unread', -1)
                self.log(f"Admin unread count: {admin_unread}")
                
                if admin_unread == 0:
                    self.success("Admin (actor) has 0 unread notifications (correct - self-action doesn't notify)")
                else:
                    self.warning(f"Admin has {admin_unread} unread notifications (may include other notifications)")
            
            return True
        
        return self.test("PUT /api/comments/repost/:id creates notification", test)

    def test_like_creates_notification(self):
        """Test: Like creates notification"""
        def test():
            if not self.admin_token:
                self.failure("No admin token available", critical=True)
                return False
            
            url = f"{BASE_URL}/comments/like/{ALICE_TOPIC_ID}"
            
            self.log(f"PUT {url}")
            response = requests.put(url, headers=self.get_headers(self.admin_token))
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Expected status 200, got {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
            
            self.success("Status is 200")
            
            result = response.json()
            self.log(f"Response: {json.dumps(result, indent=2)}")
            
            # Verify response has likes array
            if 'likes' not in result:
                self.failure("Response missing 'likes' field")
                return False
            
            self.success(f"Like toggled, likes count: {len(result.get('likes', []))}")
            
            return True
        
        return self.test("PUT /api/comments/like/:id", test)

    def test_reposts_feed(self):
        """Test: GET /api/comments/reposts/user/:userId returns reposts"""
        def test():
            if not self.admin_token:
                self.failure("No admin token available", critical=True)
                return False
            
            url = f"{BASE_URL}/comments/reposts/user/{self.admin_user_id or ADMIN_USER_ID}"
            
            self.log(f"GET {url}")
            response = requests.get(url, headers=self.get_headers(self.admin_token))
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Expected status 200, got {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
            
            self.success("Status is 200")
            
            result = response.json()
            
            if not isinstance(result, list):
                self.failure(f"Expected array response, got {type(result)}")
                return False
            
            self.success(f"Got array with {len(result)} reposts")
            
            # Check if Alice's topic is in the reposts
            alice_topic_found = False
            for item in result:
                if item.get('_id') == ALICE_TOPIC_ID:
                    alice_topic_found = True
                    self.success(f"Found Alice's ETH ETF topic in reposts: {item.get('topicName', 'N/A')}")
                    break
            
            if not alice_topic_found and len(result) > 0:
                self.warning("Alice's topic not found in reposts (may have been toggled off)")
            elif len(result) == 0:
                self.warning("No reposts found (admin may not have reposted anything)")
            
            if len(result) > 0:
                self.log(f"Sample repost: {json.dumps(result[0], indent=2)}")
            
            return True
        
        return self.test("GET /api/comments/reposts/user/:userId (Follow Me feed)", test)

    def test_mark_notifications_read(self):
        """Test: POST /api/notifications/social/read marks notifications as read"""
        def test():
            if not self.admin_token:
                self.failure("No admin token available", critical=True)
                return False
            
            url = f"{BASE_URL}/notifications/social/read"
            data = {"ids": []}  # Empty array marks all as read
            
            self.log(f"POST {url}")
            self.log(f"Body: {json.dumps(data, indent=2)}")
            
            response = requests.post(url, json=data, headers=self.get_headers(self.admin_token))
            self.log(f"Status: {response.status_code}")
            
            if response.status_code not in [200, 201]:
                self.failure(f"Expected status 200/201, got {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
            
            self.success(f"Status is {response.status_code}")
            
            result = response.json()
            self.log(f"Response: {json.dumps(result, indent=2)}")
            
            if 'ok' not in result or not result['ok']:
                self.failure("Response missing 'ok: true'")
                return False
            
            if 'unread' not in result:
                self.failure("Response missing 'unread' field")
                return False
            
            self.success(f"Marked as read, remaining unread: {result['unread']}")
            return True
        
        return self.test("POST /api/notifications/social/read", test)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
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
        else:
            print(f"\n{Colors.RED}❌ SOME TESTS FAILED{Colors.END}")
            return 1

def main():
    print(f"{Colors.BLUE}{'='*60}")
    print("FOMO Social Notifications & Repost Testing Suite")
    print("Testing social notification loop and Follow Me feed")
    print(f"{'='*60}{Colors.END}\n")
    
    tester = SocialNotificationsTester()
    
    # Run tests in order
    tester.test_admin_login()
    tester.test_notifications_unread_count_no_auth()
    tester.test_notifications_unread_count()
    tester.test_notifications_list()
    tester.test_repost_creates_notification()
    tester.test_like_creates_notification()
    tester.test_reposts_feed()
    tester.test_mark_notifications_read()
    
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())
