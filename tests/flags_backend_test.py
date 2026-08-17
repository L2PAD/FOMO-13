#!/usr/bin/env python3
"""
FOMO CRM Flags Moderation Backend API Testing
Tests the admin/fomo-v2/flags endpoints
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://crm-admin-portal-8.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"
# Using existing admin token from the system
ADMIN_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTc5ZmNkZGRhYzc0ZGQ4ZGU4MWIxZTQiLCJlbWFpbCI6ImFkbWluQGZvbW8ubG9jYWwiLCJpc0FjdGl2ZSI6dHJ1ZSwicm9sZSI6WyJhZG1pbiJdLCJ3YWxsZXQiOiIweGFkbWluIiwiaWF0IjoxNzg2NDAyMTY5LCJleHAiOjE3ODcwMDY5Njl9.VoRyZoX8XWUtymyzgKVToTOx72rhtsDyiGwMVQDOLm8"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class FlagsTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.token = ADMIN_TOKEN
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'Bearer {ADMIN_TOKEN}'
        }

    def log(self, message: str, color: str = Colors.BLUE):
        print(f"{color}{message}{Colors.END}")

    def success(self, message: str):
        self.log(f"✅ {message}", Colors.GREEN)

    def failure(self, message: str):
        self.log(f"❌ {message}", Colors.RED)

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

    def test_login(self):
        """Test: Admin login"""
        def test():
            url = f"{BASE_URL}/auth/login"
            data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            
            self.log(f"POST {url}")
            response = requests.post(url, json=data, headers=self.headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Login failed with status {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
            
            result = response.json()
            if 'token' in result:
                self.token = result['token']
                self.headers['Authorization'] = f'Bearer {self.token}'
                self.success(f"Login successful, token obtained")
                return True
            else:
                self.failure("No token in response")
                return False
        
        return self.test("Admin login", test)

    def test_list_flags(self):
        """Test: List flags with pending status"""
        def test():
            url = f"{BASE_URL}/admin/fomo-v2/flags"
            params = {"status": "pending", "limit": "20"}
            
            self.log(f"GET {url}")
            self.log(f"Params: {params}")
            response = requests.get(url, headers=self.headers, params=params)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"List flags failed with status {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
            
            result = response.json()
            self.log(f"Response: {json.dumps(result, indent=2)}")
            
            # Check structure
            if 'items' not in result:
                self.failure("Response missing 'items' field")
                return False
            
            items = result['items']
            self.success(f"Found {len(items)} pending flags")
            
            # Check for [DEMO] flags
            demo_flags = [f for f in items if f.get('title', '').startswith('[DEMO]')]
            self.log(f"Found {len(demo_flags)} [DEMO] flags")
            
            if len(demo_flags) >= 3:
                self.success(f"Found {len(demo_flags)} [DEMO] flags (expected 3)")
            else:
                self.warning(f"Expected 3 [DEMO] flags, found {len(demo_flags)}")
            
            # Check counts
            counts = result.get('counts', {})
            by_status = counts.get('byStatus', {})
            self.log(f"Status counts: {by_status}")
            
            return True
        
        return self.test("List pending flags", test)

    def test_confirm_flag(self):
        """Test: Confirm a flag"""
        def test():
            # First get a pending flag
            url = f"{BASE_URL}/admin/fomo-v2/flags"
            params = {"status": "pending", "limit": "1"}
            
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code != 200:
                self.failure("Failed to get pending flags")
                return False
            
            result = response.json()
            items = result.get('items', [])
            
            if not items:
                self.warning("No pending flags to confirm")
                return True
            
            flag = items[0]
            flag_id = flag.get('id') or flag.get('_id')
            self.log(f"Confirming flag: {flag_id}")
            
            # Confirm the flag
            confirm_url = f"{BASE_URL}/admin/fomo-v2/flags/{flag_id}/confirm"
            confirm_data = {"adminComment": "Test confirmation"}
            
            self.log(f"POST {confirm_url}")
            confirm_response = requests.post(confirm_url, headers=self.headers, json=confirm_data)
            self.log(f"Status: {confirm_response.status_code}")
            
            if confirm_response.status_code not in [200, 201]:
                self.failure(f"Confirm failed with status {confirm_response.status_code}")
                self.log(f"Response: {confirm_response.text}")
                return False
            
            confirm_result = confirm_response.json()
            self.log(f"Response: {json.dumps(confirm_result, indent=2)}")
            
            if confirm_result.get('ok') or confirm_result.get('isSuccess'):
                self.success("Flag confirmed successfully")
                return True
            else:
                self.failure("Confirm response indicates failure")
                return False
        
        return self.test("Confirm a flag", test)

    def test_reject_flag(self):
        """Test: Reject a flag"""
        def test():
            # First get a pending flag
            url = f"{BASE_URL}/admin/fomo-v2/flags"
            params = {"status": "pending", "limit": "1"}
            
            response = requests.get(url, headers=self.headers, params=params)
            if response.status_code != 200:
                self.failure("Failed to get pending flags")
                return False
            
            result = response.json()
            items = result.get('items', [])
            
            if not items:
                self.warning("No pending flags to reject")
                return True
            
            flag = items[0]
            flag_id = flag.get('id') or flag.get('_id')
            self.log(f"Rejecting flag: {flag_id}")
            
            # Reject the flag
            reject_url = f"{BASE_URL}/admin/fomo-v2/flags/{flag_id}/reject"
            reject_data = {"adminComment": "Test rejection"}
            
            self.log(f"POST {reject_url}")
            reject_response = requests.post(reject_url, headers=self.headers, json=reject_data)
            self.log(f"Status: {reject_response.status_code}")
            
            if reject_response.status_code not in [200, 201]:
                self.failure(f"Reject failed with status {reject_response.status_code}")
                self.log(f"Response: {reject_response.text}")
                return False
            
            reject_result = reject_response.json()
            self.log(f"Response: {json.dumps(reject_result, indent=2)}")
            
            if reject_result.get('ok') or reject_result.get('isSuccess'):
                self.success("Flag rejected successfully")
                return True
            else:
                self.failure("Reject response indicates failure")
                return False
        
        return self.test("Reject a flag", test)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        print(f"Total Tests: {self.tests_run}")
        print(f"{Colors.GREEN}Passed: {self.tests_passed}{Colors.END}")
        print(f"{Colors.RED}Failed: {self.tests_failed}{Colors.END}")
        
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
    print("FOMO CRM Flags Moderation Backend API Testing")
    print(f"{'='*60}{Colors.END}\n")
    
    tester = FlagsTester()
    
    # Run tests (skip login since we have token)
    tester.test_list_flags()
    tester.test_confirm_flag()
    tester.test_reject_flag()
    
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())
