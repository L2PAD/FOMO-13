#!/usr/bin/env python3
"""
Backend test for OTC/P2P Market Management APIs (H4.2 - deals market admin page).
Tests all endpoints used by /admin/users_list/otc page.

IMPORTANT: This is READ-ONLY testing. Does NOT execute destructive mutations.
"""
import requests
import sys
import json
from typing import Dict, Any

BASE_URL = "https://crm-admin-portal-8.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"


class OTCMarketTester:
    def __init__(self):
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.results = []

    def log_result(self, test_name: str, passed: bool, details: str = "", data: Any = None):
        """Log test result"""
        self.tests_run += 1
        if passed:
            self.tests_passed += 1
        
        result = {
            "test": test_name,
            "passed": passed,
            "details": details,
        }
        if data is not None:
            result["data_sample"] = data
        
        self.results.append(result)
        
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"\n{status} - {test_name}")
        if details:
            print(f"  Details: {details}")
        if data is not None:
            print(f"  Sample: {json.dumps(data, indent=2)[:200]}...")

    def login(self) -> bool:
        """Login as admin and get JWT token"""
        print("\n🔐 Logging in as admin...")
        try:
            response = requests.post(
                f"{BASE_URL}/user/admin/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code in [200, 201, 202]:
                data = response.json()
                # Try different token field names
                tokens = data.get("tokens", {})
                self.token = (
                    tokens.get("accessToken") or 
                    tokens.get("access_token") or
                    data.get("accessToken") or 
                    data.get("access_token")
                )
                if self.token:
                    print(f"✅ Login successful")
                    return True
                else:
                    print(f"❌ Login response missing token: {data}")
                    return False
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return False

    def get_headers(self) -> Dict[str, str]:
        """Get request headers with auth token"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json",
        }

    def test_otc_deals(self):
        """Test GET /api/deals/otc/all"""
        test_name = "GET /api/deals/otc/all"
        try:
            response = requests.get(
                f"{BASE_URL}/deals/otc/all?limit=100&offset=0",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 500:
                self.log_result(
                    test_name,
                    False,
                    f"500 Internal Server Error - possibly reviewLikes $size bug",
                    {"status": 500, "error": response.text[:200]}
                )
                return
            
            if response.status_code != 200:
                self.log_result(
                    test_name,
                    False,
                    f"Expected 200, got {response.status_code}",
                    {"error": response.text[:200]}
                )
                return
            
            data = response.json()
            
            # Verify response structure
            if "deals" not in data or "total" not in data:
                self.log_result(
                    test_name,
                    False,
                    "Response missing 'deals' or 'total' fields",
                    data
                )
                return
            
            deals = data["deals"]
            total = data["total"]
            
            # Check if we have demo deals
            if not isinstance(deals, list):
                self.log_result(
                    test_name,
                    False,
                    "'deals' is not a list",
                    {"deals_type": type(deals).__name__}
                )
                return
            
            sample = deals[0] if deals else None
            self.log_result(
                test_name,
                True,
                f"Found {len(deals)} OTC deals (total: {total})",
                sample
            )
            
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_p2p_deals(self):
        """Test GET /api/deals/p2p/all"""
        test_name = "GET /api/deals/p2p/all"
        try:
            response = requests.get(
                f"{BASE_URL}/deals/p2p/all?limit=100&offset=0",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code == 500:
                self.log_result(
                    test_name,
                    False,
                    f"500 Internal Server Error",
                    {"status": 500, "error": response.text[:200]}
                )
                return
            
            if response.status_code != 200:
                self.log_result(
                    test_name,
                    False,
                    f"Expected 200, got {response.status_code}",
                    {"error": response.text[:200]}
                )
                return
            
            data = response.json()
            
            if "deals" not in data or "total" not in data:
                self.log_result(
                    test_name,
                    False,
                    "Response missing 'deals' or 'total' fields",
                    data
                )
                return
            
            deals = data["deals"]
            total = data["total"]
            
            sample = deals[0] if deals else None
            self.log_result(
                test_name,
                True,
                f"Found {len(deals)} P2P deals (total: {total})",
                sample
            )
            
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_appeals(self):
        """Test GET /api/deals/appeals"""
        test_name = "GET /api/deals/appeals"
        try:
            response = requests.get(
                f"{BASE_URL}/deals/appeals?status=all&limit=100&offset=0",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result(
                    test_name,
                    False,
                    f"Expected 200, got {response.status_code}",
                    {"error": response.text[:200]}
                )
                return
            
            data = response.json()
            
            if "appeals" not in data or "total" not in data:
                self.log_result(
                    test_name,
                    False,
                    "Response missing 'appeals' or 'total' fields",
                    data
                )
                return
            
            appeals = data["appeals"]
            total = data["total"]
            
            # Verify we have at least 1 appeal (from seed)
            if total < 1:
                self.log_result(
                    test_name,
                    False,
                    f"Expected at least 1 appeal from seed, got {total}",
                    data
                )
                return
            
            sample = appeals[0] if appeals else None
            self.log_result(
                test_name,
                True,
                f"Found {len(appeals)} appeals (total: {total})",
                sample
            )
            
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_withdraws(self):
        """Test GET /api/withdraws"""
        test_name = "GET /api/withdraws"
        try:
            response = requests.get(
                f"{BASE_URL}/withdraws?page=1&limit=100",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result(
                    test_name,
                    False,
                    f"Expected 200, got {response.status_code}",
                    {"error": response.text[:200]}
                )
                return
            
            data = response.json()
            
            # Response can be array or object with data field
            if isinstance(data, list):
                withdraws = data
                total = len(data)
            elif isinstance(data, dict) and "data" in data:
                withdraws = data["data"]
                total = data.get("total", len(withdraws))
            else:
                self.log_result(
                    test_name,
                    False,
                    "Unexpected response format",
                    data
                )
                return
            
            sample = withdraws[0] if withdraws else None
            self.log_result(
                test_name,
                True,
                f"Found {len(withdraws)} withdraws (total: {total})",
                sample
            )
            
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def test_deposits(self):
        """Test GET /api/deposits"""
        test_name = "GET /api/deposits"
        try:
            response = requests.get(
                f"{BASE_URL}/deposits?page=1&limit=100",
                headers=self.get_headers(),
                timeout=10
            )
            
            if response.status_code != 200:
                self.log_result(
                    test_name,
                    False,
                    f"Expected 200, got {response.status_code}",
                    {"error": response.text[:200]}
                )
                return
            
            data = response.json()
            
            # Response can be array or object with data field
            if isinstance(data, list):
                deposits = data
                total = len(data)
            elif isinstance(data, dict) and "data" in data:
                deposits = data["data"]
                total = data.get("total", len(deposits))
            else:
                self.log_result(
                    test_name,
                    False,
                    "Unexpected response format",
                    data
                )
                return
            
            sample = deposits[0] if deposits else None
            self.log_result(
                test_name,
                True,
                f"Found {len(deposits)} deposits (total: {total})",
                sample
            )
            
        except Exception as e:
            self.log_result(test_name, False, f"Exception: {str(e)}")

    def run_all_tests(self):
        """Run all backend tests"""
        print("=" * 70)
        print("OTC/P2P Market Backend API Tests")
        print("=" * 70)
        
        if not self.login():
            print("\n❌ Cannot proceed without authentication")
            return False
        
        # Run all API tests
        self.test_otc_deals()
        self.test_p2p_deals()
        self.test_appeals()
        self.test_withdraws()
        self.test_deposits()
        
        # Print summary
        print("\n" + "=" * 70)
        print(f"📊 Test Summary: {self.tests_passed}/{self.tests_run} passed")
        print("=" * 70)
        
        # Save results to file
        results_file = "/app/test_reports/backend_otc_market_results.json"
        with open(results_file, "w") as f:
            json.dump({
                "summary": {
                    "total": self.tests_run,
                    "passed": self.tests_passed,
                    "failed": self.tests_run - self.tests_passed,
                },
                "results": self.results,
            }, f, indent=2)
        print(f"\n📄 Results saved to: {results_file}")
        
        return self.tests_passed == self.tests_run


def main():
    tester = OTCMarketTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
