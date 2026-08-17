#!/usr/bin/env python3
"""
Backend API Test for H5/P15 - Contract Balance Decomposition
Tests the new /api/admin/money/custody/decomposition endpoint
"""

import requests
import sys
import os

# Use public endpoint from frontend .env
BASE_URL = "https://fullstack-preview-60.preview.emergentagent.com/api"

# Admin credentials from backend .env
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"

class TestP15:
    def __init__(self):
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failures = []

    def log(self, msg, status="INFO"):
        prefix = {
            "PASS": "✅",
            "FAIL": "❌",
            "INFO": "ℹ️",
            "WARN": "⚠️"
        }.get(status, "•")
        print(f"{prefix} {msg}")

    def test(self, name, condition, details=""):
        self.tests_run += 1
        if condition:
            self.tests_passed += 1
            self.log(f"PASS: {name}", "PASS")
            if details:
                print(f"   {details}")
        else:
            self.log(f"FAIL: {name}", "FAIL")
            if details:
                print(f"   {details}")
            self.failures.append(f"{name}: {details}")

    def login(self):
        """Login as admin and get access token"""
        self.log("Logging in as admin...")
        try:
            response = requests.post(
                f"{BASE_URL}/user/admin/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                timeout=10
            )
            
            if response.status_code in [200, 202]:
                data = response.json()
                self.token = data.get("accessToken")
                self.test("Admin login", self.token is not None, f"Got token: {self.token[:20]}..." if self.token else "No token")
                return True
            else:
                self.test("Admin login", False, f"Status {response.status_code}: {response.text[:200]}")
                return False
        except Exception as e:
            self.test("Admin login", False, str(e))
            return False

    def test_decomposition_endpoint(self):
        """Test GET /api/admin/money/custody/decomposition"""
        self.log("\nTesting custody decomposition endpoint...")
        
        if not self.token:
            self.log("No auth token, skipping", "WARN")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{BASE_URL}/admin/money/custody/decomposition",
                headers=headers,
                timeout=15
            )
            
            # Test 1: HTTP 200
            self.test(
                "Decomposition endpoint returns 200",
                response.status_code == 200,
                f"Status: {response.status_code}"
            )
            
            if response.status_code != 200:
                self.log(f"Response: {response.text[:500]}", "FAIL")
                return
            
            data = response.json()
            self.log(f"Response data: {data}")
            
            # Test 2: Has totalAssets field
            has_total = "totalAssets" in data
            self.test(
                "Response has totalAssets field",
                has_total,
                f"totalAssets: {data.get('totalAssets')}"
            )
            
            # Test 3: Has components array
            has_components = "components" in data and isinstance(data.get("components"), list)
            self.test(
                "Response has components array",
                has_components,
                f"Components count: {len(data.get('components', []))}"
            )
            
            if not has_components:
                return
            
            components = data["components"]
            
            # Test 4: Check required component keys
            required_keys = ["user_liabilities", "platform_owned", "pending_settlements", "otc_locked", "unattributed"]
            component_keys = [c.get("key") for c in components]
            
            for key in required_keys:
                self.test(
                    f"Component '{key}' exists",
                    key in component_keys,
                    f"Found: {key in component_keys}"
                )
            
            # Test 5: Each component has required fields
            for comp in components:
                key = comp.get("key", "unknown")
                has_fields = all(f in comp for f in ["key", "label", "value"])
                self.test(
                    f"Component '{key}' has required fields",
                    has_fields,
                    f"Fields: {list(comp.keys())}"
                )
            
            # Test 6: Verify user_liabilities value
            user_liab = next((c for c in components if c.get("key") == "user_liabilities"), None)
            if user_liab:
                value = user_liab.get("value")
                # Should be around 2.00 according to spec
                is_reasonable = value is not None and isinstance(value, (int, float))
                self.test(
                    "user_liabilities has numeric value",
                    is_reasonable,
                    f"Value: {value}"
                )
                
                if is_reasonable:
                    self.log(f"   user_liabilities = ${value:.2f} (expected ~$2.00)", "INFO")
            
            # Test 7: Verify components sum approximately equals totalAssets
            total_assets = data.get("totalAssets")
            if total_assets is not None:
                component_sum = sum(c.get("value", 0) or 0 for c in components)
                diff = abs(total_assets - component_sum)
                sum_matches = diff < 0.01  # Allow 1 cent difference
                
                self.test(
                    "Components sum equals totalAssets",
                    sum_matches,
                    f"totalAssets: ${total_assets:.2f}, sum: ${component_sum:.2f}, diff: ${diff:.4f}"
                )
            
            # Test 8: Has healthy boolean
            has_healthy = "healthy" in data and isinstance(data.get("healthy"), bool)
            self.test(
                "Response has 'healthy' boolean",
                has_healthy,
                f"healthy: {data.get('healthy')}"
            )
            
            # Test 9: Check contractAddress field
            has_contract = "contractAddress" in data
            self.test(
                "Response has contractAddress",
                has_contract,
                f"contractAddress: {data.get('contractAddress', 'N/A')}"
            )
            
        except Exception as e:
            self.test("Decomposition endpoint test", False, str(e))

    def test_regression_stats(self):
        """Test regression: GET /api/admin/money/stats?days=30"""
        self.log("\nTesting regression: money stats endpoint...")
        
        if not self.token:
            self.log("No auth token, skipping", "WARN")
            return
        
        try:
            headers = {"Authorization": f"Bearer {self.token}"}
            response = requests.get(
                f"{BASE_URL}/admin/money/stats?days=30",
                headers=headers,
                timeout=15
            )
            
            self.test(
                "Stats endpoint returns 200",
                response.status_code == 200,
                f"Status: {response.status_code}"
            )
            
            if response.status_code == 200:
                data = response.json()
                has_kpis = "kpis" in data
                has_series = "series" in data
                
                self.test(
                    "Stats has kpis and series",
                    has_kpis and has_series,
                    f"kpis: {has_kpis}, series: {has_series}"
                )
                
        except Exception as e:
            self.test("Stats regression test", False, str(e))

    def run_all(self):
        """Run all tests"""
        self.log("=" * 60)
        self.log("Backend API Test - P15 Contract Balance Decomposition")
        self.log("=" * 60)
        
        # Step 1: Login
        if not self.login():
            self.log("Login failed, cannot continue", "FAIL")
            return False
        
        # Step 2: Test decomposition endpoint
        self.test_decomposition_endpoint()
        
        # Step 3: Test regression
        self.test_regression_stats()
        
        # Summary
        self.log("\n" + "=" * 60)
        self.log(f"Tests Run: {self.tests_run}")
        self.log(f"Tests Passed: {self.tests_passed}")
        self.log(f"Tests Failed: {self.tests_run - self.tests_passed}")
        
        if self.failures:
            self.log("\nFailures:", "FAIL")
            for failure in self.failures:
                self.log(f"  - {failure}", "FAIL")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"Success Rate: {success_rate:.1f}%")
        self.log("=" * 60)
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = TestP15()
    success = tester.run_all()
    sys.exit(0 if success else 1)
