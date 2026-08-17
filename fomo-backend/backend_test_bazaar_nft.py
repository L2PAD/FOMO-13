#!/usr/bin/env python3
"""
Backend API tests for Bazaar NFT marketplace consolidation (G28).
Tests the new /api/collectionNft/admin/stats endpoint and ensures
/api/deals/admin/market-stats still works (regression).
"""

import requests
import sys
from typing import Dict, Any

# Public endpoint from frontend/.env
BASE_URL = "https://crm-admin-portal-8.preview.emergentagent.com/api"

# Admin credentials from backend/.env
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"


class BazaarNftTester:
    def __init__(self):
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failures = []

    def log(self, msg: str, level: str = "INFO"):
        """Log test messages"""
        prefix = {"INFO": "ℹ️", "PASS": "✅", "FAIL": "❌", "WARN": "⚠️"}
        print(f"{prefix.get(level, 'ℹ️')} {msg}")

    def test_login(self) -> bool:
        """Test admin login and get JWT token"""
        self.tests_run += 1
        self.log("Testing admin login...", "INFO")
        
        try:
            response = requests.post(
                f"{BASE_URL}/user/admin/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            if response.status_code in [200, 202]:
                data = response.json()
                if "accessToken" in data:
                    self.token = data["accessToken"]
                    self.tests_passed += 1
                    self.log(f"Login successful (status: {response.status_code})", "PASS")
                    return True
                else:
                    self.failures.append("Login response missing accessToken")
                    self.log("Login response missing accessToken", "FAIL")
                    return False
            else:
                self.failures.append(f"Login failed with status {response.status_code}")
                self.log(f"Login failed (status: {response.status_code})", "FAIL")
                return False
                
        except Exception as e:
            self.failures.append(f"Login error: {str(e)}")
            self.log(f"Login error: {str(e)}", "FAIL")
            return False

    def test_nft_stats_endpoint(self) -> bool:
        """Test GET /api/collectionNft/admin/stats - new NFT marketplace stats"""
        self.tests_run += 1
        self.log("Testing GET /api/collectionNft/admin/stats...", "INFO")
        
        if not self.token:
            self.failures.append("NFT stats test skipped - no auth token")
            self.log("Skipped - no auth token", "WARN")
            return False
        
        try:
            response = requests.get(
                f"{BASE_URL}/collectionNft/admin/stats",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code != 200:
                self.failures.append(f"NFT stats endpoint returned {response.status_code}")
                self.log(f"NFT stats endpoint failed (status: {response.status_code})", "FAIL")
                try:
                    error_data = response.json()
                    self.log(f"Error response: {error_data}", "INFO")
                except:
                    self.log(f"Response text: {response.text[:200]}", "INFO")
                return False
            
            data = response.json()
            
            # Verify expected fields
            required_fields = [
                "collectionsOnSale", "listedNfts", "listedVolumeUsd", "floorPrice",
                "salesCount", "salesVolumeUsd", "sellers", "topCollections",
                "topSellers", "recentListings"
            ]
            
            missing_fields = [f for f in required_fields if f not in data]
            if missing_fields:
                self.failures.append(f"NFT stats missing fields: {missing_fields}")
                self.log(f"Missing fields: {missing_fields}", "FAIL")
                return False
            
            # Log some stats
            self.log(f"  Collections on sale: {data['collectionsOnSale']}", "INFO")
            self.log(f"  Listed NFTs: {data['listedNfts']}", "INFO")
            self.log(f"  Sales count: {data['salesCount']}", "INFO")
            self.log(f"  Top collections: {len(data['topCollections'])}", "INFO")
            self.log(f"  Top sellers: {len(data['topSellers'])}", "INFO")
            self.log(f"  Recent listings: {len(data['recentListings'])}", "INFO")
            
            # Verify we have seeded data (3 collections, 5 listings, 1 sale expected)
            if data['listedNfts'] == 0:
                self.log("Warning: No NFTs listed (expected seeded data)", "WARN")
            
            self.tests_passed += 1
            self.log("NFT stats endpoint working correctly", "PASS")
            return True
            
        except Exception as e:
            self.failures.append(f"NFT stats test error: {str(e)}")
            self.log(f"NFT stats test error: {str(e)}", "FAIL")
            return False

    def test_deals_market_stats_regression(self) -> bool:
        """Test GET /api/deals/admin/market-stats - ensure no regression"""
        self.tests_run += 1
        self.log("Testing GET /api/deals/admin/market-stats (regression)...", "INFO")
        
        if not self.token:
            self.failures.append("Market stats test skipped - no auth token")
            self.log("Skipped - no auth token", "WARN")
            return False
        
        try:
            response = requests.get(
                f"{BASE_URL}/deals/admin/market-stats",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=10
            )
            
            if response.status_code != 200:
                self.failures.append(f"Market stats endpoint returned {response.status_code}")
                self.log(f"Market stats endpoint failed (status: {response.status_code})", "FAIL")
                return False
            
            data = response.json()
            
            # Verify basic structure (OTC/P2P stats)
            if "volumeUsd" not in data and "traders" not in data:
                self.failures.append("Market stats response missing expected fields")
                self.log("Market stats response structure invalid", "FAIL")
                return False
            
            self.log(f"  Volume USD: {data.get('volumeUsd', 0)}", "INFO")
            self.log(f"  Traders: {data.get('traders', 0)}", "INFO")
            
            self.tests_passed += 1
            self.log("Market stats endpoint working (no regression)", "PASS")
            return True
            
        except Exception as e:
            self.failures.append(f"Market stats test error: {str(e)}")
            self.log(f"Market stats test error: {str(e)}", "FAIL")
            return False

    def run_all_tests(self) -> int:
        """Run all backend tests"""
        self.log("=" * 60, "INFO")
        self.log("BAZAAR NFT MARKETPLACE - BACKEND API TESTS", "INFO")
        self.log("=" * 60, "INFO")
        
        # Test sequence
        if not self.test_login():
            self.log("Login failed - stopping tests", "FAIL")
            return 1
        
        self.test_nft_stats_endpoint()
        self.test_deals_market_stats_regression()
        
        # Summary
        self.log("=" * 60, "INFO")
        self.log(f"Tests passed: {self.tests_passed}/{self.tests_run}", "INFO")
        
        if self.failures:
            self.log("FAILURES:", "FAIL")
            for failure in self.failures:
                self.log(f"  - {failure}", "FAIL")
        
        return 0 if self.tests_passed == self.tests_run else 1


if __name__ == "__main__":
    tester = BazaarNftTester()
    exit_code = tester.run_all_tests()
    sys.exit(exit_code)
