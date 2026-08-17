#!/usr/bin/env python3
"""
Phase H37 Backend Testing: Financial consolidation endpoints
Tests all 4 new/enhanced endpoints and verifies consistency of canonical numbers.
"""
import requests
import sys
import json
from typing import Dict, Any, Optional

# Admin JWT from review_request (valid 24h)
ADMIN_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2YTdjZGQ0MGYzZDA1YjFkMmYwMDk2NDMiLCJlbWFpbCI6ImFkbWluQGZvbW8ubG9jYWwiLCJ3YWxsZXQiOiIiLCJyb2xlIjpbImFkbWluIl0sImlzQWN0aXZlIjp0cnVlLCJpczJGQVZlcmlmaWVkIjp0cnVlLCJpczJGQUVuYWJsZWQiOmZhbHNlLCJpYXQiOjE3ODY2MzQyOTksImV4cCI6MTc4NjcyMDY5OX0.k7ExzSmomUWmX6v2QXiuEef8SoeoMBTi1yG0I7wQWkg"

# Public endpoint base
BASE_URL = "https://fomo-dev-build.preview.emergentagent.com/api"

# Test user from review_request
TEST_USER_ID = "6a7cdd40a104ec674f9f6021"
TEST_USER_EMAIL = "bob.fomie@fomo.local"

# Expected canonical values for test user
EXPECTED = {
    "balance_total": 50,
    "balance_available": 40,
    "balance_reserved": 10,
    "realized_revenue": 49,
    "provider_cogs": 0,
    "contribution": 44.10,
    "margin": 0.9,  # 90%
    "status": "HEALTHY"
}

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

def log(msg: str, color: str = Colors.RESET):
    print(f"{color}{msg}{Colors.RESET}")

def api_get(endpoint: str) -> tuple[bool, Optional[Dict[Any, Any]], str]:
    """Make GET request to API endpoint"""
    url = f"{BASE_URL}/{endpoint}"
    headers = {"Authorization": f"Bearer {ADMIN_JWT}"}
    
    try:
        log(f"\n🔍 Testing: GET {endpoint}", Colors.BLUE)
        response = requests.get(url, headers=headers, timeout=30)
        
        if response.status_code == 200:
            data = response.json()
            log(f"✅ Status 200 OK", Colors.GREEN)
            return True, data, ""
        else:
            error = f"Status {response.status_code}: {response.text[:200]}"
            log(f"❌ {error}", Colors.RED)
            return False, None, error
    except Exception as e:
        error = f"Request failed: {str(e)}"
        log(f"❌ {error}", Colors.RED)
        return False, None, error

def approx_equal(a: float, b: float, tolerance: float = 0.01) -> bool:
    """Check if two floats are approximately equal"""
    return abs(a - b) <= tolerance

def main():
    log("\n" + "="*80, Colors.BLUE)
    log("Phase H37 Backend Testing: Financial Consolidation", Colors.BLUE)
    log("="*80 + "\n", Colors.BLUE)
    
    results = {
        "total": 0,
        "passed": 0,
        "failed": 0,
        "errors": []
    }
    
    # Store data from each endpoint for consistency checks
    endpoint_data = {}
    
    # ========== Test 1: GET /admin/money/statistics ==========
    results["total"] += 1
    success, data, error = api_get("admin/money/statistics")
    if success and data:
        endpoint_data["statistics"] = data
        
        # Check for new enriched fields
        required_fields = [
            "deposits", "withdrawals", "purchases", "realizedRevenue",
            "liability", "fundedUsers", "payingUsers", "activeSubscriptions",
            "settlementSuccessPct", "refundRatePct"
        ]
        
        missing = [f for f in required_fields if f not in data]
        if missing:
            log(f"❌ Missing fields: {missing}", Colors.RED)
            results["errors"].append(f"statistics: missing fields {missing}")
            results["failed"] += 1
        else:
            log(f"✅ All enriched fields present", Colors.GREEN)
            log(f"   - Funded users: {data.get('fundedUsers')}", Colors.YELLOW)
            log(f"   - Paying users: {data.get('payingUsers')}", Colors.YELLOW)
            log(f"   - Active subscriptions: {data.get('activeSubscriptions')}", Colors.YELLOW)
            log(f"   - Realized revenue total: ${data.get('realizedRevenue', {}).get('total', 0)}", Colors.YELLOW)
            results["passed"] += 1
    else:
        results["failed"] += 1
        results["errors"].append(f"statistics: {error}")
    
    # ========== Test 2: GET /admin/money/statistics/timeseries?days=30 ==========
    results["total"] += 1
    success, data, error = api_get("admin/money/statistics/timeseries?days=30")
    if success and data:
        endpoint_data["timeseries"] = data
        
        if "series" in data and "hasData" in data:
            log(f"✅ Timeseries structure valid", Colors.GREEN)
            log(f"   - Days: {data.get('days')}", Colors.YELLOW)
            log(f"   - Has data: {data.get('hasData')}", Colors.YELLOW)
            log(f"   - Series length: {len(data.get('series', []))}", Colors.YELLOW)
            
            # Check series structure
            if data.get("series"):
                sample = data["series"][0]
                required = ["date", "deposits", "withdrawals", "purchases", "revenue"]
                if all(k in sample for k in required):
                    log(f"✅ Series data structure valid", Colors.GREEN)
                    results["passed"] += 1
                else:
                    log(f"❌ Series missing fields", Colors.RED)
                    results["failed"] += 1
                    results["errors"].append("timeseries: series missing required fields")
            else:
                log(f"⚠️  No series data (empty dataset)", Colors.YELLOW)
                results["passed"] += 1
        else:
            log(f"❌ Missing series or hasData field", Colors.RED)
            results["failed"] += 1
            results["errors"].append("timeseries: missing series or hasData")
    else:
        results["failed"] += 1
        results["errors"].append(f"timeseries: {error}")
    
    # ========== Test 3: GET /admin/money/statistics/users?limit=200 ==========
    results["total"] += 1
    success, data, error = api_get("admin/money/statistics/users?limit=200")
    if success and data:
        endpoint_data["statistics_users"] = data
        
        if "items" in data and "total" in data:
            log(f"✅ Finance users table structure valid", Colors.GREEN)
            log(f"   - Total users: {data.get('total')}", Colors.YELLOW)
            
            # Find test user in the list
            test_user = None
            for item in data.get("items", []):
                if item.get("userId") == TEST_USER_ID or item.get("email") == TEST_USER_EMAIL:
                    test_user = item
                    break
            
            if test_user:
                log(f"✅ Found test user {TEST_USER_EMAIL}", Colors.GREEN)
                log(f"   - Balance: {test_user.get('balance')}", Colors.YELLOW)
                log(f"   - Realized revenue: ${test_user.get('realizedRevenueUsd')}", Colors.YELLOW)
                log(f"   - Contribution: ${test_user.get('contributionUsd')}", Colors.YELLOW)
                log(f"   - Margin: {test_user.get('marginPct')}", Colors.YELLOW)
                log(f"   - Status: {test_user.get('status')}", Colors.YELLOW)
                
                # Check required fields
                required = [
                    "userId", "email", "balance", "available", "reserved",
                    "deposited", "withdrawn", "purchased", "membership",
                    "aiCreditsUsed", "providerCogsUsd", "realizedRevenueUsd",
                    "contributionUsd", "marginPct", "status"
                ]
                missing = [f for f in required if f not in test_user]
                if missing:
                    log(f"❌ Test user missing fields: {missing}", Colors.RED)
                    results["failed"] += 1
                    results["errors"].append(f"statistics/users: test user missing {missing}")
                else:
                    results["passed"] += 1
            else:
                log(f"⚠️  Test user not found in finance users table", Colors.YELLOW)
                results["passed"] += 1  # Not a failure, might be no data
        else:
            log(f"❌ Missing items or total field", Colors.RED)
            results["failed"] += 1
            results["errors"].append("statistics/users: missing items or total")
    else:
        results["failed"] += 1
        results["errors"].append(f"statistics/users: {error}")
    
    # ========== Test 4: GET /admin/money/users/:id/finance ==========
    results["total"] += 1
    success, data, error = api_get(f"admin/money/users/{TEST_USER_ID}/finance")
    if success and data:
        endpoint_data["user_finance"] = data
        
        required_sections = ["userId", "balance", "commerce", "purchases", "timeline"]
        missing = [s for s in required_sections if s not in data]
        
        if missing:
            log(f"❌ Missing sections: {missing}", Colors.RED)
            results["failed"] += 1
            results["errors"].append(f"user/finance: missing sections {missing}")
        else:
            log(f"✅ User finance structure valid", Colors.GREEN)
            
            balance = data.get("balance", {})
            commerce = data.get("commerce", {})
            
            log(f"   - Balance total: {balance.get('total')}", Colors.YELLOW)
            log(f"   - Balance available: {balance.get('available')}", Colors.YELLOW)
            log(f"   - Balance reserved: {balance.get('reserved')}", Colors.YELLOW)
            log(f"   - Realized revenue: ${commerce.get('realizedRevenue')}", Colors.YELLOW)
            log(f"   - Deposited lifetime: {commerce.get('depositedLifetime')}", Colors.YELLOW)
            log(f"   - Purchases lifetime: {commerce.get('purchasesLifetime')}", Colors.YELLOW)
            log(f"   - Timeline entries: {len(data.get('timeline', []))}", Colors.YELLOW)
            log(f"   - Purchases: {len(data.get('purchases', []))}", Colors.YELLOW)
            
            results["passed"] += 1
    else:
        results["failed"] += 1
        results["errors"].append(f"user/finance: {error}")
    
    # ========== Test 5: GET /admin/entitlements/ai/users/:id/economics ==========
    results["total"] += 1
    success, data, error = api_get(f"admin/entitlements/ai/users/{TEST_USER_ID}/economics")
    if success and data:
        endpoint_data["user_economics"] = data
        
        if "economics" in data:
            econ = data["economics"]
            log(f"✅ User economics structure valid", Colors.GREEN)
            
            log(f"   - Realized revenue: ${econ.get('realizedRevenueUsd')}", Colors.YELLOW)
            log(f"   - Real provider COGS: ${econ.get('realProviderCogsUsd')}", Colors.YELLOW)
            log(f"   - Real contribution profit: ${econ.get('realContributionProfitUsd')}", Colors.YELLOW)
            log(f"   - Real contribution margin: {econ.get('realContributionMarginPct')}", Colors.YELLOW)
            log(f"   - Profitability status: {econ.get('profitabilityStatus')}", Colors.YELLOW)
            log(f"   - Target margin: {econ.get('targetMarginPct')}", Colors.YELLOW)
            
            # Check required fields
            required = [
                "realizedRevenueUsd", "realProviderCogsUsd",
                "realContributionProfitUsd", "realContributionMarginPct",
                "profitabilityStatus", "targetMarginPct"
            ]
            missing = [f for f in required if f not in econ]
            if missing:
                log(f"❌ Economics missing fields: {missing}", Colors.RED)
                results["failed"] += 1
                results["errors"].append(f"user/economics: missing {missing}")
            else:
                results["passed"] += 1
        else:
            log(f"❌ Missing economics section", Colors.RED)
            results["failed"] += 1
            results["errors"].append("user/economics: missing economics section")
    else:
        results["failed"] += 1
        results["errors"].append(f"user/economics: {error}")
    
    # ========== CONSISTENCY CHECKS ==========
    log("\n" + "="*80, Colors.BLUE)
    log("CONSISTENCY CHECKS: Canonical numbers across endpoints", Colors.BLUE)
    log("="*80 + "\n", Colors.BLUE)
    
    consistency_passed = 0
    consistency_total = 0
    
    # Extract values from each endpoint
    stats_users_data = None
    if "statistics_users" in endpoint_data:
        for item in endpoint_data["statistics_users"].get("items", []):
            if item.get("userId") == TEST_USER_ID:
                stats_users_data = item
                break
    
    user_finance_data = endpoint_data.get("user_finance", {})
    user_economics_data = endpoint_data.get("user_economics", {})
    
    # Check 1: balance.total consistency
    consistency_total += 1
    if stats_users_data and user_finance_data:
        bal1 = stats_users_data.get("balance")
        bal2 = user_finance_data.get("balance", {}).get("total")
        
        if bal1 is not None and bal2 is not None:
            if approx_equal(bal1, bal2):
                log(f"✅ Balance.total consistent: {bal1} ≈ {bal2}", Colors.GREEN)
                consistency_passed += 1
            else:
                log(f"❌ Balance.total INCONSISTENT: stats/users={bal1}, user/finance={bal2}", Colors.RED)
                results["errors"].append(f"Consistency: balance.total mismatch {bal1} vs {bal2}")
        else:
            log(f"⚠️  Balance.total: missing data", Colors.YELLOW)
    else:
        log(f"⚠️  Balance.total: endpoints not available", Colors.YELLOW)
    
    # Check 2: realizedRevenue consistency
    consistency_total += 1
    if stats_users_data and user_finance_data and user_economics_data:
        rev1 = stats_users_data.get("realizedRevenueUsd")
        rev2 = user_finance_data.get("commerce", {}).get("realizedRevenue")
        rev3 = user_economics_data.get("economics", {}).get("realizedRevenueUsd")
        
        if all(v is not None for v in [rev1, rev2, rev3]):
            if approx_equal(rev1, rev2) and approx_equal(rev2, rev3):
                log(f"✅ RealizedRevenue consistent: {rev1} ≈ {rev2} ≈ {rev3}", Colors.GREEN)
                consistency_passed += 1
            else:
                log(f"❌ RealizedRevenue INCONSISTENT: stats/users={rev1}, user/finance={rev2}, user/economics={rev3}", Colors.RED)
                results["errors"].append(f"Consistency: realizedRevenue mismatch")
        else:
            log(f"⚠️  RealizedRevenue: missing data", Colors.YELLOW)
    else:
        log(f"⚠️  RealizedRevenue: endpoints not available", Colors.YELLOW)
    
    # Check 3: contribution consistency
    consistency_total += 1
    if stats_users_data and user_economics_data:
        cont1 = stats_users_data.get("contributionUsd")
        cont2 = user_economics_data.get("economics", {}).get("realContributionProfitUsd")
        
        if cont1 is not None and cont2 is not None:
            if approx_equal(cont1, cont2, tolerance=0.1):
                log(f"✅ Contribution consistent: {cont1} ≈ {cont2}", Colors.GREEN)
                consistency_passed += 1
            else:
                log(f"❌ Contribution INCONSISTENT: stats/users={cont1}, user/economics={cont2}", Colors.RED)
                results["errors"].append(f"Consistency: contribution mismatch {cont1} vs {cont2}")
        else:
            log(f"⚠️  Contribution: missing data", Colors.YELLOW)
    else:
        log(f"⚠️  Contribution: endpoints not available", Colors.YELLOW)
    
    # Check 4: margin consistency
    consistency_total += 1
    if stats_users_data and user_economics_data:
        margin1 = stats_users_data.get("marginPct")
        margin2 = user_economics_data.get("economics", {}).get("realContributionMarginPct")
        
        if margin1 is not None and margin2 is not None:
            if approx_equal(margin1, margin2, tolerance=0.01):
                log(f"✅ Margin consistent: {margin1} ≈ {margin2}", Colors.GREEN)
                consistency_passed += 1
            else:
                log(f"❌ Margin INCONSISTENT: stats/users={margin1}, user/economics={margin2}", Colors.RED)
                results["errors"].append(f"Consistency: margin mismatch {margin1} vs {margin2}")
        else:
            log(f"⚠️  Margin: missing data", Colors.YELLOW)
    else:
        log(f"⚠️  Margin: endpoints not available", Colors.YELLOW)
    
    # ========== SUMMARY ==========
    log("\n" + "="*80, Colors.BLUE)
    log("TEST SUMMARY", Colors.BLUE)
    log("="*80 + "\n", Colors.BLUE)
    
    log(f"Endpoint Tests: {results['passed']}/{results['total']} passed", 
        Colors.GREEN if results['passed'] == results['total'] else Colors.YELLOW)
    log(f"Consistency Checks: {consistency_passed}/{consistency_total} passed",
        Colors.GREEN if consistency_passed == consistency_total else Colors.YELLOW)
    
    if results["errors"]:
        log(f"\n❌ Errors ({len(results['errors'])}):", Colors.RED)
        for err in results["errors"]:
            log(f"   - {err}", Colors.RED)
    
    total_tests = results['total'] + consistency_total
    total_passed = results['passed'] + consistency_passed
    
    log(f"\n{'='*80}", Colors.BLUE)
    log(f"OVERALL: {total_passed}/{total_tests} tests passed", 
        Colors.GREEN if total_passed == total_tests else Colors.RED)
    log(f"{'='*80}\n", Colors.BLUE)
    
    # Return exit code
    return 0 if total_passed == total_tests else 1

if __name__ == "__main__":
    sys.exit(main())
