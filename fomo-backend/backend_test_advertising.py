#!/usr/bin/env python3
"""
FOMO CRM - Advertising/Campaign Management Backend Test Suite
Tests PUBLIC and ADMIN advertising endpoints
"""
import requests
import sys
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Base URL from frontend .env (public endpoint)
BASE_URL = "https://monetization-core-1.preview.emergentagent.com/api"

# Test credentials
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

class AdvertisingTester:
    def __init__(self):
        self.token: Optional[str] = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.results = []
        self.test_campaign_id: Optional[str] = None
        self.test_creative_id: Optional[str] = None
        self.test_delivery_id: Optional[str] = None
        
    def log(self, message: str, level: str = "info"):
        """Log with color"""
        colors = {"info": Colors.BLUE, "success": Colors.GREEN, "error": Colors.RED, "warning": Colors.YELLOW}
        color = colors.get(level, Colors.RESET)
        print(f"{color}{message}{Colors.RESET}")
    
    def test(self, name: str, method: str, endpoint: str, expected_status: int, 
             data: Optional[Dict] = None, headers: Optional[Dict] = None,
             validate_fn: Optional[callable] = None, accept_statuses: Optional[list] = None,
             use_auth: bool = True) -> Dict[str, Any]:
        """Run a single test"""
        self.tests_run += 1
        url = f"{BASE_URL}/{endpoint}"
        
        # Prepare headers
        req_headers = {'Content-Type': 'application/json'}
        if use_auth and self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            req_headers.update(headers)
        
        self.log(f"\n[{self.tests_run}] Testing: {name}", "info")
        self.log(f"    {method} {endpoint}", "info")
        
        try:
            # Make request
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=30)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=req_headers, timeout=30)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=req_headers, timeout=30)
            elif method == 'DELETE':
                response = requests.delete(url, headers=req_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Check status (allow multiple acceptable statuses)
            acceptable = accept_statuses if accept_statuses else [expected_status]
            status_ok = response.status_code in acceptable
            
            # Parse response
            try:
                response_data = response.json() if response.text else {}
            except:
                response_data = {"raw": response.text}
            
            # Custom validation
            validation_ok = True
            validation_msg = ""
            if validate_fn and status_ok:
                try:
                    validation_ok, validation_msg = validate_fn(response_data)
                except Exception as e:
                    validation_ok = False
                    validation_msg = f"Validation error: {str(e)}"
            
            # Overall success
            success = status_ok and validation_ok
            
            if success:
                self.tests_passed += 1
                self.log(f"    ✅ PASSED - Status: {response.status_code}", "success")
                if validation_msg:
                    self.log(f"    {validation_msg}", "success")
            else:
                self.tests_failed += 1
                self.log(f"    ❌ FAILED", "error")
                if not status_ok:
                    self.log(f"    Expected status {expected_status}, got {response.status_code}", "error")
                if not validation_ok:
                    self.log(f"    {validation_msg}", "error")
                self.log(f"    Response: {json.dumps(response_data, indent=2)[:500]}", "error")
            
            result = {
                "test": name,
                "endpoint": endpoint,
                "method": method,
                "expected_status": expected_status,
                "actual_status": response.status_code,
                "success": success,
                "validation_msg": validation_msg,
                "response_preview": str(response_data)[:200]
            }
            self.results.append(result)
            
            return {"success": success, "data": response_data, "status": response.status_code}
            
        except Exception as e:
            self.tests_failed += 1
            self.log(f"    ❌ FAILED - Exception: {str(e)}", "error")
            result = {
                "test": name,
                "endpoint": endpoint,
                "method": method,
                "success": False,
                "error": str(e)
            }
            self.results.append(result)
            return {"success": False, "error": str(e)}
    
    def run_all_tests(self):
        """Execute all test suites"""
        self.log("\n" + "="*80, "info")
        self.log("FOMO CRM - ADVERTISING/CAMPAIGN MANAGEMENT TEST SUITE", "info")
        self.log("="*80 + "\n", "info")
        
        # 1. AUTH
        self.log("\n### 1. AUTHENTICATION ###", "warning")
        auth_result = self.test(
            "Admin Login",
            "POST",
            "user/admin/login",
            202,  # NestJS returns 202 Accepted
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            validate_fn=lambda r: (
                "accessToken" in r,
                f"✓ Got accessToken" if "accessToken" in r else "✗ Missing accessToken"
            ),
            use_auth=False
        )
        
        if auth_result["success"] and "accessToken" in auth_result["data"]:
            self.token = auth_result["data"]["accessToken"]
            self.log(f"    Token acquired: {self.token[:20]}...", "success")
        else:
            self.log("    ⚠️  Cannot proceed without token. Stopping tests.", "error")
            return self.print_summary()
        
        # 2. PUBLIC ENDPOINTS (no auth required)
        self.log("\n### 2. PUBLIC AD DELIVERY & TRACKING ###", "warning")
        
        # 2a. Serve ad (should return filled:false if no campaigns, or filled:true with creative)
        serve_result = self.test(
            "PUBLIC: Serve ad for ECHO_FEED placement",
            "GET",
            "ads/serve?placement=ECHO_FEED&device=desktop&session=testS1",
            200,
            validate_fn=lambda r: (
                "filled" in r,
                f"✓ Ad serve response: filled={r.get('filled')}, reason={r.get('reason', 'N/A')}"
            ),
            use_auth=False
        )
        
        # Store deliveryId if ad was served
        if serve_result["success"] and serve_result["data"].get("filled"):
            self.test_delivery_id = serve_result["data"].get("deliveryId")
            self.log(f"    Stored deliveryId: {self.test_delivery_id}", "success")
        
        # 2b. Track impression (should accept or dedupe)
        if self.test_delivery_id:
            track_result = self.test(
                "PUBLIC: Track impression",
                "POST",
                "ads/track",
                200,
                accept_statuses=[200, 201],
                data={
                    "deliveryId": self.test_delivery_id,
                    "campaignId": serve_result["data"].get("campaignId"),
                    "placement": "ECHO_FEED",
                    "type": "impression",
                    "sessionId": "testS1"
                },
                validate_fn=lambda r: (
                    r.get("ok") == True,
                    f"✓ Impression tracked: ok={r.get('ok')}, deduped={r.get('deduped', False)}"
                ),
                use_auth=False
            )
            
            # 2c. Track same impression again (should dedupe)
            self.test(
                "PUBLIC: Track same impression (dedup test)",
                "POST",
                "ads/track",
                200,
                accept_statuses=[200, 201],
                data={
                    "deliveryId": self.test_delivery_id,
                    "campaignId": serve_result["data"].get("campaignId"),
                    "placement": "ECHO_FEED",
                    "type": "impression",
                    "sessionId": "testS1"
                },
                validate_fn=lambda r: (
                    r.get("ok") == True and r.get("deduped") == True,
                    f"✓ Dedup working: ok={r.get('ok')}, deduped={r.get('deduped')}"
                ),
                use_auth=False
            )
        
        # 2d. Track viewable impression with low viewability (should reject)
        self.test(
            "PUBLIC: Track viewable impression (low viewability - should reject)",
            "POST",
            "ads/track",
            200,
            accept_statuses=[200, 201],
            data={
                "deliveryId": "test_delivery_low_view",
                "placement": "ECHO_FEED",
                "type": "viewable_impression",
                "sessionId": "testS2",
                "viewablePct": 20,
                "dwellMs": 500
            },
            validate_fn=lambda r: (
                r.get("ok") == False and r.get("reason") == "not_viewable",
                f"✓ Low viewability rejected: ok={r.get('ok')}, reason={r.get('reason')}"
            ),
            use_auth=False
        )
        
        # 2e. Track viewable impression with high viewability (should accept)
        self.test(
            "PUBLIC: Track viewable impression (high viewability - should accept)",
            "POST",
            "ads/track",
            200,
            accept_statuses=[200, 201],
            data={
                "deliveryId": "test_delivery_high_view",
                "placement": "ECHO_FEED",
                "type": "viewable_impression",
                "sessionId": "testS3",
                "viewablePct": 80,
                "dwellMs": 1200
            },
            validate_fn=lambda r: (
                r.get("ok") == True,
                f"✓ High viewability accepted: ok={r.get('ok')}"
            ),
            use_auth=False
        )
        
        # 3. ADMIN PLACEMENTS
        self.log("\n### 3. ADMIN PLACEMENTS ###", "warning")
        
        placements_result = self.test(
            "ADMIN: List placements",
            "GET",
            "ads/admin/placements",
            200,
            validate_fn=lambda r: (
                r.get("success") == True and len(r.get("data", [])) == 9,
                f"✓ Got {len(r.get('data', []))} placements (expected 9). First has live inventory: {r.get('data', [{}])[0].get('live', {}).get('avgViewablePerDay', 'N/A') if r.get('data') else 'N/A'}"
            )
        )
        
        # Check inventoryIsBaseline flag
        if placements_result["success"] and placements_result["data"].get("data"):
            first_placement = placements_result["data"]["data"][0]
            has_baseline_flag = "inventoryIsBaseline" in first_placement.get("live", {})
            self.log(f"    inventoryIsBaseline flag present: {has_baseline_flag}", "success" if has_baseline_flag else "error")
        
        # 4. ADMIN CAMPAIGNS
        self.log("\n### 4. ADMIN CAMPAIGNS ###", "warning")
        
        # 4a. Create campaign
        create_campaign_result = self.test(
            "ADMIN: Create campaign",
            "POST",
            "ads/admin/campaigns",
            200,
            accept_statuses=[200, 201],
            data={
                "name": f"Test Campaign {datetime.now().strftime('%H%M%S')}",
                "status": "active",
                "pricingModel": "cpm",
                "rate": 8,
                "budget": 500,
                "placements": ["ECHO_FEED"],
                "advertiserName": "Test Advertiser",
                "objective": "awareness",
                "priority": 5
            },
            validate_fn=lambda r: (
                r.get("success") == True and r.get("data", {}).get("_id"),
                f"✓ Campaign created: id={r.get('data', {}).get('_id', 'N/A')}, name={r.get('data', {}).get('name', 'N/A')}"
            )
        )
        
        if create_campaign_result["success"] and create_campaign_result["data"].get("data", {}).get("_id"):
            self.test_campaign_id = create_campaign_result["data"]["data"]["_id"]
            self.log(f"    Stored campaign ID: {self.test_campaign_id}", "success")
        
        # 4b. List campaigns
        self.test(
            "ADMIN: List campaigns",
            "GET",
            "ads/admin/campaigns",
            200,
            validate_fn=lambda r: (
                r.get("success") == True and isinstance(r.get("data"), list),
                f"✓ Got {len(r.get('data', []))} campaigns. Each has stats: {bool(r.get('data', [{}])[0].get('stats')) if r.get('data') else False}"
            )
        )
        
        # 4c. Get campaign detail
        if self.test_campaign_id:
            get_campaign_result = self.test(
                "ADMIN: Get campaign detail",
                "GET",
                f"ads/admin/campaigns/{self.test_campaign_id}",
                200,
                validate_fn=lambda r: (
                    r.get("success") == True and r.get("data", {}).get("_id") == self.test_campaign_id,
                    f"✓ Campaign detail: name={r.get('data', {}).get('name', 'N/A')}, creatives={len(r.get('data', {}).get('creatives', []))}"
                )
            )
        
        # 5. ADMIN CREATIVES
        self.log("\n### 5. ADMIN CREATIVES ###", "warning")
        
        if self.test_campaign_id:
            # 5a. Create creative
            create_creative_result = self.test(
                "ADMIN: Create creative",
                "POST",
                f"ads/admin/campaigns/{self.test_campaign_id}/creatives",
                200,
                accept_statuses=[200, 201],
                data={
                    "type": "image",
                    "brandName": "Test Brand",
                    "headline": "Test Headline - Amazing Product",
                    "description": "Test description for the ad",
                    "ctaLabel": "Learn More",
                    "destinationUrl": "https://example.com",
                    "variant": "gradient",
                    "enabled": True
                },
                validate_fn=lambda r: (
                    r.get("success") == True and r.get("data", {}).get("_id"),
                    f"✓ Creative created: id={r.get('data', {}).get('_id', 'N/A')}, headline={r.get('data', {}).get('headline', 'N/A')}"
                )
            )
            
            if create_creative_result["success"] and create_creative_result["data"].get("data", {}).get("_id"):
                self.test_creative_id = create_creative_result["data"]["data"]["_id"]
                self.log(f"    Stored creative ID: {self.test_creative_id}", "success")
            
            # 5b. Get campaign with creatives
            self.test(
                "ADMIN: Get campaign with creatives",
                "GET",
                f"ads/admin/campaigns/{self.test_campaign_id}",
                200,
                validate_fn=lambda r: (
                    len(r.get("data", {}).get("creatives", [])) > 0,
                    f"✓ Campaign has {len(r.get('data', {}).get('creatives', []))} creative(s)"
                )
            )
        
        # 6. ADMIN CAMPAIGN STATUS
        self.log("\n### 6. ADMIN CAMPAIGN STATUS ###", "warning")
        
        if self.test_campaign_id:
            # 6a. Pause campaign
            self.test(
                "ADMIN: Pause campaign",
                "PATCH",
                f"ads/admin/campaigns/{self.test_campaign_id}/status",
                200,
                data={"status": "paused"},
                validate_fn=lambda r: (
                    r.get("success") == True and r.get("data", {}).get("status") == "paused",
                    f"✓ Campaign paused: status={r.get('data', {}).get('status')}"
                )
            )
            
            # 6b. Activate campaign
            self.test(
                "ADMIN: Activate campaign",
                "PATCH",
                f"ads/admin/campaigns/{self.test_campaign_id}/status",
                200,
                data={"status": "active"},
                validate_fn=lambda r: (
                    r.get("success") == True and r.get("data", {}).get("status") == "active",
                    f"✓ Campaign activated: status={r.get('data', {}).get('status')}"
                )
            )
        
        # 7. ADMIN ANALYTICS
        self.log("\n### 7. ADMIN ANALYTICS ###", "warning")
        
        analytics_result = self.test(
            "ADMIN: Analytics overview",
            "GET",
            "ads/admin/analytics/overview",
            200,
            validate_fn=lambda r: (
                r.get("success") == True and "totals" in r.get("data", {}) and "placements" in r.get("data", {}) and "lifecycle" in r.get("data", {}),
                f"✓ Analytics: impressions={r.get('data', {}).get('totals', {}).get('impressions', 0)}, viewable={r.get('data', {}).get('totals', {}).get('viewable', 0)}, clicks={r.get('data', {}).get('totals', {}).get('clicks', 0)}, ctr={r.get('data', {}).get('totals', {}).get('ctr', 0)}%, spend=${r.get('data', {}).get('totals', {}).get('spend', 0)}"
            )
        )
        
        # 8. ADMIN FORECAST
        self.log("\n### 8. ADMIN FORECAST ###", "warning")
        
        forecast_result = self.test(
            "ADMIN: Forecast",
            "POST",
            "ads/admin/forecast",
            200,
            accept_statuses=[200, 201],
            data={
                "placement": "ECHO_FEED",
                "pricingModel": "cpm",
                "rate": 8,
                "budget": 500,
                "days": 14
            },
            validate_fn=lambda r: (
                r.get("success") == True and "expectedImpressions" in r.get("data", {}) and "expectedClicks" in r.get("data", {}) and "dataQuality" in r.get("data", {}) and "usingBaseline" in r.get("data", {}),
                f"✓ Forecast: expectedImpressions={r.get('data', {}).get('expectedImpressions', {}).get('expected', 'N/A')}, expectedClicks={r.get('data', {}).get('expectedClicks', {}).get('expected', 'N/A')}, dataQuality={r.get('data', {}).get('dataQuality')}, usingBaseline={r.get('data', {}).get('usingBaseline')}"
            )
        )
        
        # 9. CLEANUP - Delete campaign
        self.log("\n### 9. CLEANUP ###", "warning")
        
        if self.test_campaign_id:
            self.test(
                "ADMIN: Delete campaign",
                "DELETE",
                f"ads/admin/campaigns/{self.test_campaign_id}",
                200,
                validate_fn=lambda r: (
                    r.get("success") == True,
                    f"✓ Campaign deleted"
                )
            )
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "="*80, "info")
        self.log("TEST SUMMARY", "info")
        self.log("="*80, "info")
        self.log(f"Total Tests: {self.tests_run}", "info")
        self.log(f"Passed: {self.tests_passed}", "success")
        self.log(f"Failed: {self.tests_failed}", "error")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        self.log(f"Success Rate: {success_rate:.1f}%", "success" if success_rate >= 80 else "warning")
        
        if self.tests_failed > 0:
            self.log("\nFailed Tests:", "error")
            for result in self.results:
                if not result.get("success"):
                    self.log(f"  - {result['test']}: {result.get('error', 'Status mismatch')}", "error")
        
        self.log("\n" + "="*80 + "\n", "info")
        
        return 0 if self.tests_failed == 0 else 1

def main():
    tester = AdvertisingTester()
    exit_code = tester.run_all_tests()
    
    # Save results to JSON
    results_file = "/tmp/backend_test_advertising_results.json"
    with open(results_file, "w") as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "summary": {
                "total": tester.tests_run,
                "passed": tester.tests_passed,
                "failed": tester.tests_failed,
                "success_rate": f"{(tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0:.1f}%"
            },
            "results": tester.results
        }, f, indent=2)
    
    print(f"\nDetailed results saved to: {results_file}")
    
    return exit_code

if __name__ == "__main__":
    sys.exit(main())
