#!/usr/bin/env python3
"""
OTC/P2P Market Backend Testing
Tests market-stats endpoint and deals endpoints for admin CRM
"""

import requests
import sys
import json
from typing import Dict, Any, Optional

# Base URL from frontend .env
BASE_URL = "https://crm-admin-portal-8.preview.emergentagent.com/api"

# Admin credentials
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"

class OTCMarketTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.critical_failures = []
        self.admin_token = None

    def _headers(self, token: Optional[str] = None) -> Dict[str, str]:
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        return headers

    def _test(self, name: str, method: str, endpoint: str, 
              expected_status: int, token: Optional[str] = None,
              data: Optional[Dict] = None, 
              check_response: Optional[callable] = None) -> bool:
        """Run a single API test"""
        url = f"{BASE_URL}/{endpoint}"
        self.tests_run += 1
        
        print(f"\n{'='*80}")
        print(f"🔍 Test #{self.tests_run}: {name}")
        print(f"   {method} {url}")
        print(f"   Expected: {expected_status}")
        
        try:
            if method == "GET":
                response = requests.get(url, headers=self._headers(token), timeout=15)
            elif method == "POST":
                response = requests.post(url, headers=self._headers(token), json=data or {}, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            status_match = response.status_code == expected_status
            
            if status_match:
                # Additional response checks if provided
                if check_response:
                    try:
                        response_data = response.json() if response.text else {}
                        check_result = check_response(response_data)
                        if not check_result:
                            print(f"   ❌ FAILED - Status OK but response check failed")
                            print(f"   Response: {json.dumps(response_data, indent=2)[:500]}")
                            self.tests_failed += 1
                            return False
                    except Exception as e:
                        print(f"   ❌ FAILED - Response check error: {e}")
                        self.tests_failed += 1
                        return False
                
                print(f"   ✅ PASSED - Status: {response.status_code}")
                self.tests_passed += 1
                return True
            else:
                print(f"   ❌ FAILED - Expected {expected_status}, got {response.status_code}")
                try:
                    print(f"   Response: {response.json()}")
                except:
                    print(f"   Response: {response.text[:200]}")
                self.tests_failed += 1
                return False
                
        except Exception as e:
            print(f"   ❌ FAILED - Exception: {str(e)}")
            self.tests_failed += 1
            self.critical_failures.append(f"{name}: {str(e)}")
            return False

    def test_admin_login(self):
        """Test admin login and get token"""
        print("\n" + "="*80)
        print("📋 TESTING: Admin Login")
        print("="*80)
        
        def check_login(data):
            if "accessToken" not in data:
                print(f"   ⚠️  No accessToken in response")
                return False
            self.admin_token = data["accessToken"]
            print(f"   ✓ Token received: {self.admin_token[:20]}...")
            return True
        
        return self._test(
            "Admin login with admin@fomo.local",
            "POST", "user/admin/login",
            202,
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            check_response=check_login
        )

    def test_market_stats(self):
        """Test GET /api/deals/admin/market-stats"""
        print("\n" + "="*80)
        print("📋 TESTING: Market Stats Endpoint")
        print("="*80)
        
        def check_market_stats(data):
            # Check required fields
            required_fields = [
                "deals", "volumeUsd", "commissionEarnedUsd", "feeRatePercent",
                "reservedOnContractUsd", "reservedDeals", "traders", "activeTraders",
                "topTraders", "popularPositions", "rankDistribution", "volumeBySection"
            ]
            
            missing = [f for f in required_fields if f not in data]
            if missing:
                print(f"   ⚠️  Missing fields: {missing}")
                return False
            
            # Check deals structure
            deals = data.get("deals", {})
            deals_fields = ["total", "active", "started", "waiting", "ended", "blocked"]
            missing_deals = [f for f in deals_fields if f not in deals]
            if missing_deals:
                print(f"   ⚠️  Missing deals fields: {missing_deals}")
                return False
            
            print(f"   ✓ All required fields present")
            print(f"   ✓ Total deals: {deals.get('total')}")
            print(f"   ✓ Volume USD: ${data.get('volumeUsd')}")
            print(f"   ✓ Commission earned: ${data.get('commissionEarnedUsd')}")
            print(f"   ✓ Reserved on contract: ${data.get('reservedOnContractUsd')}")
            print(f"   ✓ Traders: {data.get('traders')}")
            print(f"   ✓ Top traders count: {len(data.get('topTraders', []))}")
            print(f"   ✓ Popular positions count: {len(data.get('popularPositions', []))}")
            print(f"   ✓ Rank distribution count: {len(data.get('rankDistribution', []))}")
            
            # Check topTraders structure
            top_traders = data.get("topTraders", [])
            if top_traders:
                trader = top_traders[0]
                trader_fields = ["_id", "dealsCount", "endedCount", "volume"]
                missing_trader = [f for f in trader_fields if f not in trader]
                if missing_trader:
                    print(f"   ⚠️  Missing trader fields: {missing_trader}")
                    return False
                print(f"   ✓ Top trader structure valid")
            
            return True
        
        return self._test(
            "GET /api/deals/admin/market-stats returns aggregates",
            "GET", "deals/admin/market-stats",
            200,
            token=self.admin_token,
            check_response=check_market_stats
        )

    def test_otc_deals(self):
        """Test GET /api/deals/otc/all"""
        print("\n" + "="*80)
        print("📋 TESTING: OTC Deals Endpoint")
        print("="*80)
        
        def check_otc_deals(data):
            if "deals" not in data or "total" not in data:
                print(f"   ⚠️  Missing 'deals' or 'total' in response")
                return False
            
            deals = data.get("deals", [])
            total = data.get("total", 0)
            
            print(f"   ✓ Response has 'deals' and 'total'")
            print(f"   ✓ Total deals: {total}")
            print(f"   ✓ Deals returned: {len(deals)}")
            
            # Check deal structure if deals exist
            if deals:
                deal = deals[0]
                deal_fields = ["_id", "status", "creator"]
                missing_deal = [f for f in deal_fields if f not in deal]
                if missing_deal:
                    print(f"   ⚠️  Missing deal fields: {missing_deal}")
                    return False
                print(f"   ✓ Deal structure valid")
            
            return True
        
        return self._test(
            "GET /api/deals/otc/all returns {deals, total}",
            "GET", "deals/otc/all?limit=10&offset=0",
            200,
            token=self.admin_token,
            check_response=check_otc_deals
        )

    def test_p2p_deals(self):
        """Test GET /api/deals/p2p/all"""
        print("\n" + "="*80)
        print("📋 TESTING: P2P Deals Endpoint")
        print("="*80)
        
        def check_p2p_deals(data):
            if "deals" not in data or "total" not in data:
                print(f"   ⚠️  Missing 'deals' or 'total' in response")
                return False
            
            deals = data.get("deals", [])
            total = data.get("total", 0)
            
            print(f"   ✓ Response has 'deals' and 'total'")
            print(f"   ✓ Total deals: {total}")
            print(f"   ✓ Deals returned: {len(deals)}")
            
            # Check deal structure if deals exist
            if deals:
                deal = deals[0]
                deal_fields = ["_id", "status", "creator"]
                missing_deal = [f for f in deal_fields if f not in deal]
                if missing_deal:
                    print(f"   ⚠️  Missing deal fields: {missing_deal}")
                    return False
                print(f"   ✓ Deal structure valid")
            
            return True
        
        return self._test(
            "GET /api/deals/p2p/all returns {deals, total}",
            "GET", "deals/p2p/all?limit=10&offset=0",
            200,
            token=self.admin_token,
            check_response=check_p2p_deals
        )

    def run_all_tests(self):
        """Run all backend tests"""
        print("\n" + "🚀"*40)
        print("OTC/P2P MARKET — BACKEND API TESTING")
        print("Testing market-stats, OTC, and P2P endpoints")
        print("🚀"*40)
        
        try:
            # Login first
            if not self.test_admin_login():
                print("\n❌ CRITICAL: Admin login failed, cannot continue")
                return 1
            
            # Run tests
            self.test_market_stats()
            self.test_otc_deals()
            self.test_p2p_deals()
            
        except Exception as e:
            print(f"\n❌ CRITICAL ERROR: {e}")
            self.critical_failures.append(str(e))
        
        # Print summary
        print("\n" + "="*80)
        print("📊 TEST SUMMARY")
        print("="*80)
        print(f"Total tests run: {self.tests_run}")
        print(f"✅ Passed: {self.tests_passed}")
        print(f"❌ Failed: {self.tests_failed}")
        print(f"Success rate: {(self.tests_passed/self.tests_run*100):.1f}%")
        
        if self.critical_failures:
            print(f"\n🚨 CRITICAL FAILURES:")
            for failure in self.critical_failures:
                print(f"   - {failure}")
        
        print("="*80)
        
        # Return exit code
        return 0 if self.tests_failed == 0 and not self.critical_failures else 1

def main():
    tester = OTCMarketTester()
    return tester.run_all_tests()

if __name__ == "__main__":
    sys.exit(main())
