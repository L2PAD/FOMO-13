#!/usr/bin/env python3
"""
FOMO News Parser Backend Testing (Package D Regression)
Tests news parser admin endpoints and public news API after importer fix
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://fomo-crm-admin.preview.emergentagent.com"
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class NewsParserTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.critical_failures = []
        self.token = None
        self.headers = {'Content-Type': 'application/json'}

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

    def test_admin_login(self):
        """Test: Admin login and get JWT token"""
        def test():
            url = f"{BASE_URL}/api/user/admin/login"
            data = {"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
            
            self.log(f"POST {url}")
            self.log(f"Body: {json.dumps(data, indent=2)}")
            
            response = requests.post(url, json=data, headers=self.headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code not in [200, 202]:
                self.failure(f"Login failed with status {response.status_code}", critical=True)
                self.log(f"Response: {response.text}")
                return False
            
            result = response.json()
            self.log(f"Response: {json.dumps(result, indent=2)}")
            
            if 'accessToken' not in result:
                self.failure("No accessToken in response", critical=True)
                return False
            
            self.token = result['accessToken']
            self.headers['Authorization'] = f'Bearer {self.token}'
            self.success(f"Login successful, got token")
            
            # Verify role is admin
            if 'role' in result and 'admin' in str(result['role']).lower():
                self.success("User has admin role")
            else:
                self.warning(f"User role: {result.get('role')}")
            
            return True
        
        return self.test("Admin login (POST /api/user/admin/login)", test)

    def test_overview_endpoint(self):
        """Test: GET /api/admin/news-parser/overview"""
        def test():
            url = f"{BASE_URL}/api/admin/news-parser/overview"
            self.log(f"GET {url}")
            
            response = requests.get(url, headers=self.headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Overview endpoint failed with status {response.status_code}", critical=True)
                self.log(f"Response: {response.text}")
                return False
            
            data = response.json()
            self.log(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify structure
            required_fields = ['health', 'sources', 'last24h', 'articlesTotal']
            for field in required_fields:
                if field not in data:
                    self.failure(f"Missing field: {field}", critical=True)
                    return False
            
            self.success(f"Overview has all required fields")
            
            # Verify real data
            sources_total = data.get('sources', {}).get('total', 0)
            articles_total = data.get('articlesTotal', 0)
            
            self.log(f"Sources total: {sources_total}")
            self.log(f"Articles total: {articles_total}")
            
            if sources_total == 0:
                self.failure("No sources found (expected 121)", critical=True)
                return False
            
            self.success(f"Found {sources_total} sources")
            
            if articles_total == 0:
                self.warning("No articles found (expected 926+)")
            else:
                self.success(f"Found {articles_total} articles")
            
            # Verify health status
            health = data.get('health')
            self.log(f"System health: {health}")
            
            return True
        
        return self.test("Overview endpoint (GET /api/admin/news-parser/overview)", test)

    def test_parsing_endpoint(self):
        """Test: GET /api/admin/news-parser/parsing"""
        def test():
            url = f"{BASE_URL}/api/admin/news-parser/parsing"
            self.log(f"GET {url}")
            
            response = requests.get(url, headers=self.headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Parsing endpoint failed with status {response.status_code}", critical=True)
                self.log(f"Response: {response.text}")
                return False
            
            data = response.json()
            self.log(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify structure
            required_fields = ['schedulerEnabled', 'workerEnabled', 'globalPaused', 'redisOk', 'queue']
            for field in required_fields:
                if field not in data:
                    self.failure(f"Missing field: {field}")
                    return False
            
            self.success("Parsing controls have all required fields")
            
            # Log status
            self.log(f"Scheduler enabled: {data.get('schedulerEnabled')}")
            self.log(f"Worker enabled: {data.get('workerEnabled')}")
            self.log(f"Global paused: {data.get('globalPaused')}")
            self.log(f"Redis OK: {data.get('redisOk')}")
            self.log(f"Queue: {data.get('queue')}")
            
            return True
        
        return self.test("Parsing controls (GET /api/admin/news-parser/parsing)", test)

    def test_diagnostics_endpoint(self):
        """Test: GET /api/admin/news-parser/diagnostics"""
        def test():
            url = f"{BASE_URL}/api/admin/news-parser/diagnostics"
            self.log(f"GET {url}")
            
            response = requests.get(url, headers=self.headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Diagnostics endpoint failed with status {response.status_code}", critical=True)
                self.log(f"Response: {response.text}")
                return False
            
            data = response.json()
            self.log(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify structure
            if 'ok' not in data or 'checks' not in data:
                self.failure("Missing ok or checks field", critical=True)
                return False
            
            self.success("Diagnostics has required fields")
            
            checks = data.get('checks', [])
            self.log(f"Found {len(checks)} diagnostic checks")
            
            for check in checks:
                status = "✓" if check.get('ok') else "✗"
                self.log(f"  {status} {check.get('label')}: {check.get('detail')}")
            
            return True
        
        return self.test("Diagnostics (GET /api/admin/news-parser/diagnostics)", test)

    def test_sources_endpoint(self):
        """Test: GET /api/admin/news-parser/sources"""
        def test():
            url = f"{BASE_URL}/api/admin/news-parser/sources"
            self.log(f"GET {url}")
            
            response = requests.get(url, headers=self.headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Sources endpoint failed with status {response.status_code}", critical=True)
                self.log(f"Response: {response.text}")
                return False
            
            data = response.json()
            
            if not isinstance(data, list):
                self.failure("Sources response is not a list", critical=True)
                return False
            
            self.log(f"Found {len(data)} sources")
            
            if len(data) == 0:
                self.failure("No sources found (expected 121)", critical=True)
                return False
            
            self.success(f"Found {len(data)} sources")
            
            # Verify source structure
            if len(data) > 0:
                sample = data[0]
                self.log(f"Sample source: {json.dumps(sample, indent=2)}")
                
                required_fields = ['id', 'name', 'tier', 'status', 'state']
                for field in required_fields:
                    if field not in sample:
                        self.warning(f"Source missing field: {field}")
            
            # Count by status
            statuses = {}
            for source in data:
                status = source.get('status', 'UNKNOWN')
                statuses[status] = statuses.get(status, 0) + 1
            
            self.log(f"Sources by status: {statuses}")
            
            return True
        
        return self.test("Sources list (GET /api/admin/news-parser/sources)", test)

    def test_runs_endpoint(self):
        """Test: GET /api/admin/news-parser/runs"""
        def test():
            url = f"{BASE_URL}/api/admin/news-parser/runs"
            self.log(f"GET {url}")
            
            response = requests.get(url, headers=self.headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Runs endpoint failed with status {response.status_code}", critical=True)
                self.log(f"Response: {response.text}")
                return False
            
            data = response.json()
            
            if not isinstance(data, list):
                self.failure("Runs response is not a list", critical=True)
                return False
            
            self.log(f"Found {len(data)} runs")
            
            if len(data) == 0:
                self.warning("No runs found")
                return True
            
            self.success(f"Found {len(data)} runs")
            
            # Verify run structure
            sample = data[0]
            self.log(f"Sample run: {json.dumps(sample, indent=2)}")
            
            # Count by status
            statuses = {}
            for run in data:
                status = run.get('status', 'UNKNOWN')
                statuses[status] = statuses.get(status, 0) + 1
            
            self.log(f"Runs by status: {statuses}")
            
            return True
        
        return self.test("Runs history (GET /api/admin/news-parser/runs)", test)

    def test_backfill_endpoint(self):
        """Test: POST /api/admin/news-parser/import/backfill?batches=5"""
        def test():
            url = f"{BASE_URL}/api/admin/news-parser/import/backfill?batches=5"
            self.log(f"POST {url}")
            
            response = requests.post(url, headers=self.headers)
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200 and response.status_code != 201:
                self.failure(f"Backfill endpoint failed with status {response.status_code}", critical=True)
                self.log(f"Response: {response.text}")
                return False
            
            data = response.json()
            self.log(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify structure
            required_fields = ['batches', 'candidates', 'saved', 'duplicates']
            for field in required_fields:
                if field not in data:
                    self.failure(f"Missing field: {field}")
                    return False
            
            self.success("Backfill has all required fields")
            
            self.log(f"Batches: {data.get('batches')}")
            self.log(f"Candidates: {data.get('candidates')}")
            self.log(f"Saved: {data.get('saved')}")
            self.log(f"Duplicates: {data.get('duplicates')}")
            
            return True
        
        return self.test("Backfill import (POST /api/admin/news-parser/import/backfill)", test)

    def test_public_news_endpoint(self):
        """Test: GET /api/news/crypto (public endpoint)"""
        def test():
            url = f"{BASE_URL}/api/news/crypto"
            self.log(f"GET {url}")
            
            # Public endpoint, no auth needed
            response = requests.get(url, headers={'Content-Type': 'application/json'})
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Public news endpoint failed with status {response.status_code}", critical=True)
                self.log(f"Response: {response.text}")
                return False
            
            data = response.json()
            
            # Response can be array or object with news array
            news_list = data if isinstance(data, list) else data.get('news', [])
            
            if not isinstance(news_list, list):
                self.failure("News response is not a list", critical=True)
                return False
            
            self.log(f"Found {len(news_list)} news articles")
            
            if len(news_list) == 0:
                self.failure("No news articles found (expected 926+)", critical=True)
                return False
            
            self.success(f"Found {len(news_list)} news articles")
            
            # Verify sorting (newest first)
            if len(news_list) >= 2:
                first_date = news_list[0].get('date')
                second_date = news_list[1].get('date')
                
                if first_date and second_date:
                    self.log(f"First article date: {first_date}")
                    self.log(f"Second article date: {second_date}")
                    
                    # Compare dates (should be descending)
                    if first_date >= second_date:
                        self.success("News sorted by date desc (newest first)")
                    else:
                        self.failure("News NOT sorted by date desc", critical=True)
                        return False
            
            # Verify article structure
            if len(news_list) > 0:
                sample = news_list[0]
                self.log(f"Sample article: {json.dumps(sample, indent=2)[:500]}...")
                
                required_fields = ['title', 'text', 'date']
                for field in required_fields:
                    if field not in sample:
                        self.warning(f"Article missing field: {field}")
            
            return True
        
        return self.test("Public news (GET /api/news/crypto)", test)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY")
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
            print(f"\n{Colors.GREEN}🎉 ALL BACKEND TESTS PASSED!{Colors.END}")
            return 0
        else:
            print(f"\n{Colors.RED}❌ SOME BACKEND TESTS FAILED{Colors.END}")
            return 1

def main():
    print(f"{Colors.BLUE}{'='*70}")
    print("FOMO News Parser Backend Testing (Package D Regression)")
    print("Testing news parser admin endpoints after importer fix")
    print(f"{'='*70}{Colors.END}\n")
    
    tester = NewsParserTester()
    
    # Run tests in order
    if not tester.test_admin_login():
        print(f"\n{Colors.RED}❌ Login failed, cannot proceed with authenticated tests{Colors.END}")
        return 1
    
    tester.test_overview_endpoint()
    tester.test_parsing_endpoint()
    tester.test_diagnostics_endpoint()
    tester.test_sources_endpoint()
    tester.test_runs_endpoint()
    tester.test_backfill_endpoint()
    tester.test_public_news_endpoint()
    
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())
