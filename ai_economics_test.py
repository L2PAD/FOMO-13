#!/usr/bin/env python3
"""
FOMO AI Economics Feature Test Suite
Tests Phase 1 of AI economics epic: unit-economics engine + simulator
"""
import requests
import sys
import json
from datetime import datetime

BASE_URL = "https://fomo-dev-build.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class AIEconomicsTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.failures = []

    def log(self, msg, color=Colors.BLUE):
        print(f"{color}{msg}{Colors.END}")

    def success(self, msg):
        self.log(f"✅ {msg}", Colors.GREEN)
        self.tests_passed += 1

    def fail(self, msg):
        self.log(f"❌ {msg}", Colors.RED)
        self.failures.append(msg)
        self.tests_failed += 1

    def info(self, msg):
        self.log(f"ℹ️  {msg}", Colors.BLUE)

    def test_admin_login(self):
        """Test 1: Admin login"""
        self.log("\n" + "="*70, Colors.BLUE)
        self.log("TEST 1: ADMIN LOGIN", Colors.BLUE)
        self.log("="*70, Colors.BLUE)
        
        self.tests_run += 1
        url = f"{self.base_url}/user/admin/login"
        
        try:
            response = requests.post(
                url,
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                headers={'Content-Type': 'application/json'},
                timeout=15
            )
            
            if response.status_code != 202:
                self.fail(f"Login failed - Status: {response.status_code}")
                self.log(f"Response: {response.text[:500]}", Colors.YELLOW)
                return False
            
            data = response.json()
            if 'accessToken' not in data:
                self.fail("No accessToken in response")
                return False
            
            self.admin_token = data['accessToken']
            user = data.get('user', {})
            role = user.get('role', [])
            
            if 'admin' not in role:
                self.fail(f"User is not admin, role: {role}")
                return False
            
            self.success(f"Admin login successful, token obtained")
            return True
            
        except Exception as e:
            self.fail(f"Login error: {str(e)}")
            return False

    def test_get_economics(self):
        """Test 2: GET /api/admin/entitlements/ai/economics"""
        self.log("\n" + "="*70, Colors.BLUE)
        self.log("TEST 2: GET AI ECONOMICS", Colors.BLUE)
        self.log("="*70, Colors.BLUE)
        
        if not self.admin_token:
            self.fail("No admin token - skipping")
            return False
        
        self.tests_run += 1
        url = f"{self.base_url}/admin/entitlements/ai/economics"
        
        try:
            response = requests.get(
                url,
                headers={
                    'Authorization': f'Bearer {self.admin_token}',
                    'Content-Type': 'application/json'
                },
                timeout=15
            )
            
            if response.status_code != 200:
                self.fail(f"GET economics failed - Status: {response.status_code}")
                self.log(f"Response: {response.text[:500]}", Colors.YELLOW)
                return False
            
            data = response.json()
            self.info(f"Response: {json.dumps(data, indent=2)}")
            
            # Check structure
            if 'economics' not in data:
                self.fail("Missing 'economics' in response")
                return False
            
            if 'budget' not in data:
                self.fail("Missing 'budget' in response")
                return False
            
            econ = data['economics']
            budget = data['budget']
            
            # Verify default economics values
            expected_defaults = {
                'priceUsd': 49,
                'periodDays': 30,
                'includedCredits': 1000,
                'targetGrossMarginPct': 0.5,
                'paymentFeeReservePct': 0.03,
                'infraReservePct': 0.07
            }
            
            all_correct = True
            for key, expected_value in expected_defaults.items():
                actual_value = econ.get(key)
                if actual_value != expected_value:
                    self.fail(f"Economics {key}: expected {expected_value}, got {actual_value}")
                    all_correct = False
                else:
                    self.success(f"Economics {key}: {actual_value} ✓")
            
            # Verify budget calculations
            # NetRevenue = 49 × (1 - 0.03 - 0.07) = 49 × 0.9 = 44.10
            expected_net_revenue = 44.10
            actual_net_revenue = budget.get('netRevenueUsd')
            
            if abs(actual_net_revenue - expected_net_revenue) < 0.01:
                self.success(f"Budget netRevenueUsd: ${actual_net_revenue} ✓")
            else:
                self.fail(f"Budget netRevenueUsd: expected ${expected_net_revenue}, got ${actual_net_revenue}")
                all_correct = False
            
            # AllowedAiCost = 44.10 × (1 - 0.5) = 44.10 × 0.5 = 22.05
            expected_allowed_cost = 22.05
            actual_allowed_cost = budget.get('allowedAiCostUsd')
            
            if abs(actual_allowed_cost - expected_allowed_cost) < 0.01:
                self.success(f"Budget allowedAiCostUsd: ${actual_allowed_cost} ✓")
            else:
                self.fail(f"Budget allowedAiCostUsd: expected ${expected_allowed_cost}, got ${actual_allowed_cost}")
                all_correct = False
            
            # MaxCostPerCredit = 22.05 / 1000 = 0.02205
            expected_max_cost = 0.02205
            actual_max_cost = budget.get('maxCostPerCreditUsd')
            
            if abs(actual_max_cost - expected_max_cost) < 0.00001:
                self.success(f"Budget maxCostPerCreditUsd: ${actual_max_cost} ✓")
            else:
                self.fail(f"Budget maxCostPerCreditUsd: expected ${expected_max_cost}, got ${actual_max_cost}")
                all_correct = False
            
            return all_correct
            
        except Exception as e:
            self.fail(f"GET economics error: {str(e)}")
            return False

    def test_simulate_default(self):
        """Test 3: POST /api/admin/entitlements/ai/economics/simulate (default 70% utilization)"""
        self.log("\n" + "="*70, Colors.BLUE)
        self.log("TEST 3: SIMULATE ECONOMICS (70% utilization)", Colors.BLUE)
        self.log("="*70, Colors.BLUE)
        
        if not self.admin_token:
            self.fail("No admin token - skipping")
            return False
        
        self.tests_run += 1
        url = f"{self.base_url}/admin/entitlements/ai/economics/simulate"
        
        try:
            response = requests.post(
                url,
                json={"expectedUtilizationPct": 0.7},
                headers={
                    'Authorization': f'Bearer {self.admin_token}',
                    'Content-Type': 'application/json'
                },
                timeout=15
            )
            
            if response.status_code not in [200, 201]:
                self.fail(f"Simulate failed - Status: {response.status_code}")
                self.log(f"Response: {response.text[:500]}", Colors.YELLOW)
                return False
            
            data = response.json()
            self.info(f"Response keys: {list(data.keys())}")
            
            # Check structure
            if 'budget' not in data:
                self.fail("Missing 'budget' in response")
                return False
            
            budget = data['budget']
            
            # Verify budget matches expected values
            expected_net_revenue = 44.10
            expected_allowed_cost = 22.05
            expected_max_cost = 0.02205
            
            all_correct = True
            
            actual_net_revenue = budget.get('netRevenueUsd')
            if abs(actual_net_revenue - expected_net_revenue) < 0.01:
                self.success(f"Budget netRevenueUsd: ${actual_net_revenue} ✓")
            else:
                self.fail(f"Budget netRevenueUsd: expected ${expected_net_revenue}, got ${actual_net_revenue}")
                all_correct = False
            
            actual_allowed_cost = budget.get('allowedAiCostUsd')
            if abs(actual_allowed_cost - expected_allowed_cost) < 0.01:
                self.success(f"Budget allowedAiCostUsd: ${actual_allowed_cost} ✓")
            else:
                self.fail(f"Budget allowedAiCostUsd: expected ${expected_allowed_cost}, got ${actual_allowed_cost}")
                all_correct = False
            
            actual_max_cost = budget.get('maxCostPerCreditUsd')
            if abs(actual_max_cost - expected_max_cost) < 0.00001:
                self.success(f"Budget maxCostPerCreditUsd: ${actual_max_cost} ✓")
            else:
                self.fail(f"Budget maxCostPerCredit: expected ${expected_max_cost}, got ${actual_max_cost}")
                all_correct = False
            
            # Verify simulation results at 70% utilization
            expected_consumed_credits = 700  # 1000 * 0.7
            actual_consumed_credits = data.get('expectedConsumedCredits')
            
            if actual_consumed_credits == expected_consumed_credits:
                self.success(f"expectedConsumedCredits: {actual_consumed_credits} ✓")
            else:
                self.fail(f"expectedConsumedCredits: expected {expected_consumed_credits}, got {actual_consumed_credits}")
                all_correct = False
            
            # expectedAiCogsUsd = 700 * 0.02205 = 15.435
            expected_cogs = 15.435
            actual_cogs = data.get('expectedAiCogsUsd')
            
            if abs(actual_cogs - expected_cogs) < 0.001:
                self.success(f"expectedAiCogsUsd: ${actual_cogs} ✓")
            else:
                self.fail(f"expectedAiCogsUsd: expected ${expected_cogs}, got ${actual_cogs}")
                all_correct = False
            
            # estimatedGrossMarginPct ≈ 0.65 (65%)
            # Gross profit = 44.10 - 15.435 = 28.665
            # Margin = 28.665 / 44.10 ≈ 0.65
            expected_margin = 0.65
            actual_margin = data.get('estimatedGrossMarginPct')
            
            if abs(actual_margin - expected_margin) < 0.01:
                self.success(f"estimatedGrossMarginPct: {actual_margin:.4f} ({actual_margin*100:.1f}%) ✓")
            else:
                self.fail(f"estimatedGrossMarginPct: expected ~{expected_margin}, got {actual_margin}")
                all_correct = False
            
            # worstCaseGrossMarginPct ≈ 0.5 (50%) at 100% utilization
            expected_worst_margin = 0.5
            actual_worst_margin = data.get('worstCaseGrossMarginPct')
            
            if abs(actual_worst_margin - expected_worst_margin) < 0.01:
                self.success(f"worstCaseGrossMarginPct: {actual_worst_margin:.4f} ({actual_worst_margin*100:.1f}%) ✓")
            else:
                self.fail(f"worstCaseGrossMarginPct: expected ~{expected_worst_margin}, got {actual_worst_margin}")
                all_correct = False
            
            return all_correct
            
        except Exception as e:
            self.fail(f"Simulate error: {str(e)}")
            return False

    def test_simulate_overrides(self):
        """Test 4: POST /api/admin/entitlements/ai/economics/simulate with overrides"""
        self.log("\n" + "="*70, Colors.BLUE)
        self.log("TEST 4: SIMULATE ECONOMICS WITH OVERRIDES", Colors.BLUE)
        self.log("="*70, Colors.BLUE)
        
        if not self.admin_token:
            self.fail("No admin token - skipping")
            return False
        
        self.tests_run += 1
        url = f"{self.base_url}/admin/entitlements/ai/economics/simulate"
        
        # Test with: priceUsd:59, includedCredits:800, targetGrossMarginPct:0.6
        # NetRevenue = 59 * (1 - 0.03 - 0.07) = 59 * 0.9 = 53.1
        # AllowedAiCost = 53.1 * (1 - 0.6) = 53.1 * 0.4 = 21.24
        # MaxCostPerCredit = 21.24 / 800 = 0.02655
        
        try:
            response = requests.post(
                url,
                json={
                    "priceUsd": 59,
                    "includedCredits": 800,
                    "targetGrossMarginPct": 0.6,
                    "expectedUtilizationPct": 0.7
                },
                headers={
                    'Authorization': f'Bearer {self.admin_token}',
                    'Content-Type': 'application/json'
                },
                timeout=15
            )
            
            if response.status_code not in [200, 201]:
                self.fail(f"Simulate with overrides failed - Status: {response.status_code}")
                self.log(f"Response: {response.text[:500]}", Colors.YELLOW)
                return False
            
            data = response.json()
            budget = data.get('budget', {})
            
            # Verify calculations with overrides
            expected_net_revenue = 53.1
            expected_allowed_cost = 21.24
            expected_max_cost = 0.02655
            
            all_correct = True
            
            actual_net_revenue = budget.get('netRevenueUsd')
            if abs(actual_net_revenue - expected_net_revenue) < 0.01:
                self.success(f"Budget netRevenueUsd: ${actual_net_revenue} ✓")
            else:
                self.fail(f"Budget netRevenueUsd: expected ${expected_net_revenue}, got ${actual_net_revenue}")
                all_correct = False
            
            actual_allowed_cost = budget.get('allowedAiCostUsd')
            if abs(actual_allowed_cost - expected_allowed_cost) < 0.01:
                self.success(f"Budget allowedAiCostUsd: ${actual_allowed_cost} ✓")
            else:
                self.fail(f"Budget allowedAiCostUsd: expected ${expected_allowed_cost}, got ${actual_allowed_cost}")
                all_correct = False
            
            actual_max_cost = budget.get('maxCostPerCreditUsd')
            if abs(actual_max_cost - expected_max_cost) < 0.00001:
                self.success(f"Budget maxCostPerCreditUsd: ${actual_max_cost} ✓")
            else:
                self.fail(f"Budget maxCostPerCredit: expected ${expected_max_cost}, got ${actual_max_cost}")
                all_correct = False
            
            # Verify the overrides were applied
            if data.get('priceUsd') == 59:
                self.success(f"Override priceUsd: $59 ✓")
            else:
                self.fail(f"Override priceUsd not applied: {data.get('priceUsd')}")
                all_correct = False
            
            if data.get('includedCredits') == 800:
                self.success(f"Override includedCredits: 800 ✓")
            else:
                self.fail(f"Override includedCredits not applied: {data.get('includedCredits')}")
                all_correct = False
            
            if abs(data.get('targetGrossMarginPct', 0) - 0.6) < 0.001:
                self.success(f"Override targetGrossMarginPct: 0.6 ✓")
            else:
                self.fail(f"Override targetGrossMarginPct not applied: {data.get('targetGrossMarginPct')}")
                all_correct = False
            
            return all_correct
            
        except Exception as e:
            self.fail(f"Simulate with overrides error: {str(e)}")
            return False

    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "="*70, Colors.BLUE)
        self.log("TEST SUMMARY", Colors.BLUE)
        self.log("="*70, Colors.BLUE)
        
        self.log(f"\nTotal tests run: {self.tests_run}")
        self.log(f"Passed: {self.tests_passed}", Colors.GREEN)
        if self.tests_failed > 0:
            self.log(f"Failed: {self.tests_failed}", Colors.RED)
        
        if self.failures:
            self.log("\n❌ FAILED CHECKS:", Colors.RED)
            for failure in self.failures:
                self.log(f"  - {failure}", Colors.RED)
        
        success_rate = (self.tests_passed / (self.tests_passed + self.tests_failed) * 100) if (self.tests_passed + self.tests_failed) > 0 else 0
        self.log(f"\nSuccess rate: {success_rate:.1f}%", Colors.GREEN if success_rate == 100 else Colors.YELLOW)
        
        return self.tests_failed == 0

def main():
    tester = AIEconomicsTester()
    
    print("\n" + "="*70)
    print("FOMO AI Economics Feature Test Suite")
    print("="*70)
    print(f"Base URL: {BASE_URL}")
    print(f"Admin: {ADMIN_EMAIL}")
    print("="*70 + "\n")
    
    try:
        # Test 1: Admin login
        if not tester.test_admin_login():
            print("\n❌ Admin login failed - cannot proceed")
            return 1
        
        # Test 2: GET economics
        tester.test_get_economics()
        
        # Test 3: Simulate with default utilization
        tester.test_simulate_default()
        
        # Test 4: Simulate with overrides
        tester.test_simulate_overrides()
        
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1
    
    # Print summary
    all_passed = tester.print_summary()
    
    return 0 if all_passed else 1

if __name__ == "__main__":
    sys.exit(main())
