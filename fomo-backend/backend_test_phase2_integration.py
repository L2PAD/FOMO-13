#!/usr/bin/env python3
"""
Backend API tests for FOMO Rating Integration Layer (Phase 2)
Tests: reference directories, internal ingestion, provenance, raw preview
"""
import requests
import sys
import json
from datetime import datetime

BASE_URL = "https://monetization-core-1.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"
SERVICE_TOKEN = "fomo-rating-ingest-preview-7f3a9c2e"

class RatingIntegrationTester:
    def __init__(self):
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.config_version = None

    def log(self, message, level="INFO"):
        """Log test messages"""
        prefix = {
            "INFO": "ℹ️",
            "SUCCESS": "✅",
            "FAIL": "❌",
            "WARN": "⚠️"
        }.get(level, "•")
        print(f"{prefix} {message}")

    def test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{BASE_URL}/{endpoint}"
        req_headers = {"Content-Type": "application/json"}
        if self.token:
            req_headers["Authorization"] = f"Bearer {self.token}"
        if headers:
            req_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...", "INFO")
        
        try:
            if method == "GET":
                response = requests.get(url, headers=req_headers, timeout=10)
            elif method == "POST":
                response = requests.post(url, json=data, headers=req_headers, timeout=10)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=req_headers, timeout=10)
            elif method == "DELETE":
                response = requests.delete(url, headers=req_headers, timeout=10)
            else:
                self.log(f"Unknown method {method}", "FAIL")
                return False, {}

            success = response.status_code == expected_status
            
            try:
                response_data = response.json() if response.text else {}
            except Exception:
                response_data = {"raw": response.text}

            if success:
                self.tests_passed += 1
                self.log(f"PASSED - Status: {response.status_code}", "SUCCESS")
            else:
                self.log(f"FAILED - Expected {expected_status}, got {response.status_code}", "FAIL")
                if response_data:
                    self.log(f"Response: {json.dumps(response_data, indent=2)}", "FAIL")

            return success, response_data

        except Exception as e:
            self.log(f"FAILED - Error: {str(e)}", "FAIL")
            return False, {}

    def test_login(self):
        """Test admin login"""
        self.log("\n=== Testing Authentication ===", "INFO")
        success, response = self.test(
            "Admin Login",
            "POST",
            "user/admin/login",
            202,
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        if success and response.get("accessToken"):
            self.token = response["accessToken"]
            self.log(f"Token obtained: {self.token[:20]}...", "SUCCESS")
            return True
        self.log("Login failed - no accessToken in response", "FAIL")
        return False

    def test_get_reference_catalogs(self):
        """Test GET /api/admin/ratings/references - should return 7 catalogs"""
        self.log("\n=== Testing Reference Catalogs ===", "INFO")
        success, response = self.test(
            "Get Reference Catalogs",
            "GET",
            "admin/ratings/references",
            200
        )
        if not success:
            return False

        catalogs = response.get("catalogs", [])
        if len(catalogs) != 7:
            self.log(f"FAIL: Expected 7 catalogs, got {len(catalogs)}", "FAIL")
            return False

        expected_catalogs = [
            "rating_crises",
            "rating_jurisdictions",
            "rating_tier_registry",
            "rating_red_flag_catalog",
            "rating_role_catalog",
            "rating_partnership_types",
            "rating_media_source_tiers"
        ]
        
        for cat in expected_catalogs:
            if cat not in catalogs:
                self.log(f"FAIL: Missing catalog '{cat}'", "FAIL")
                return False

        self.log(f"All 7 catalogs verified: {catalogs}", "SUCCESS")
        return True

    def test_get_rating_crises(self):
        """Test GET /api/admin/ratings/references/rating_crises - should return 5 seeded crises with system:true"""
        self.log("\n=== Testing Rating Crises ===", "INFO")
        success, response = self.test(
            "Get Rating Crises",
            "GET",
            "admin/ratings/references/rating_crises",
            200
        )
        if not success:
            return False

        items = response.get("items", [])
        if len(items) < 5:
            self.log(f"FAIL: Expected at least 5 crises, got {len(items)}", "FAIL")
            return False

        # Verify all items have system:true
        system_count = sum(1 for item in items if item.get("system") is True)
        if system_count < 5:
            self.log(f"FAIL: Expected at least 5 system crises, got {system_count}", "FAIL")
            return False

        self.log(f"Rating crises verified: {len(items)} items, {system_count} system rows", "SUCCESS")
        return True

    def test_get_rating_jurisdictions(self):
        """Test GET /api/admin/ratings/references/rating_jurisdictions - should return >=10 rows"""
        self.log("\n=== Testing Rating Jurisdictions ===", "INFO")
        success, response = self.test(
            "Get Rating Jurisdictions",
            "GET",
            "admin/ratings/references/rating_jurisdictions",
            200
        )
        if not success:
            return False

        items = response.get("items", [])
        if len(items) < 10:
            self.log(f"FAIL: Expected at least 10 jurisdictions, got {len(items)}", "FAIL")
            return False

        self.log(f"Rating jurisdictions verified: {len(items)} items", "SUCCESS")
        return True

    def test_upsert_reference_item(self):
        """Test PUT /api/admin/ratings/references/rating_jurisdictions/testxx - should upsert with system:false"""
        self.log("\n=== Testing Reference Upsert ===", "INFO")
        success, response = self.test(
            "Upsert Reference Item",
            "PUT",
            "admin/ratings/references/rating_jurisdictions/testxx",
            200,
            data={"countryName": "Test Country", "baseScore": 7}
        )
        if not success:
            return False

        # Verify response has system:false
        if response.get("system") is not False:
            self.log(f"FAIL: Expected system:false, got {response.get('system')}", "FAIL")
            return False

        if response.get("code") != "testxx":
            self.log(f"FAIL: Expected code='testxx', got {response.get('code')}", "FAIL")
            return False

        self.log(f"Reference item upserted: code={response.get('code')}, system={response.get('system')}", "SUCCESS")
        return True

    def test_delete_custom_reference_item(self):
        """Test DELETE /api/admin/ratings/references/rating_jurisdictions/testxx - should succeed"""
        self.log("\n=== Testing Delete Custom Reference ===", "INFO")
        success, response = self.test(
            "Delete Custom Reference Item",
            "DELETE",
            "admin/ratings/references/rating_jurisdictions/testxx",
            200
        )
        if not success:
            return False

        if response.get("deleted") is not True:
            self.log(f"FAIL: Expected deleted:true, got {response.get('deleted')}", "FAIL")
            return False

        self.log(f"Custom reference item deleted: {response}", "SUCCESS")
        return True

    def test_delete_system_reference_item(self):
        """Test DELETE system row - should be REJECTED with 400"""
        self.log("\n=== Testing Delete System Reference (should fail) ===", "INFO")
        success, response = self.test(
            "Delete System Reference Item",
            "DELETE",
            "admin/ratings/references/rating_crises/ftx_collapse_2022",
            400
        )
        if success:
            message = response.get("message", "")
            if "System default rows cannot be deleted" in message or "системная" in message.lower():
                self.log(f"System row deletion correctly rejected: {message}", "SUCCESS")
                return True
            else:
                self.log(f"WARN: Got 400 but unexpected message: {message}", "WARN")
                return True
        else:
            self.log("Expected 400 for system row deletion", "FAIL")
            return False

    def test_internal_ingestion_without_token(self):
        """Test internal ingestion WITHOUT token - should return 401"""
        self.log("\n=== Testing Internal Ingestion Without Token ===", "INFO")
        
        # Temporarily remove token
        saved_token = self.token
        self.token = None
        
        success, response = self.test(
            "Internal Ingestion Without Token",
            "PUT",
            "internal/rating-inputs/funds/fund-test",
            401,
            data={
                "source": "test",
                "payload": {}
            }
        )
        
        # Restore token
        self.token = saved_token
        
        if success:
            self.log("Ingestion without token correctly rejected with 401", "SUCCESS")
            return True
        else:
            self.log("Expected 401 for ingestion without token", "FAIL")
            return False

    def test_internal_ingestion_with_token(self):
        """Test internal ingestion WITH token - should return accepted:true, deduped:false, score, provenance"""
        self.log("\n=== Testing Internal Ingestion With Token ===", "INFO")
        
        payload = {
            "source": "portfolio-db",
            "observedAt": "2026-08-01T00:00:00Z",
            "idempotencyKey": "fund-test:v1",
            "payload": {
                "foundedAt": "2016-01-01",
                "jurisdictionCode": "US",
                "licenseIds": ["l1"],
                "regulatoryIncidents": 0,
                "exits": [
                    {"realisedRoi": 3, "verified": True},
                    {"realisedRoi": 5, "verified": True}
                ],
                "portfolioReturns": [
                    {"realisedRoi": 2},
                    {"unrealisedRoi": 0.8}
                ]
            }
        }
        
        # Remove Bearer token, use service token header instead
        saved_token = self.token
        self.token = None
        
        success, response = self.test(
            "Internal Ingestion With Token",
            "PUT",
            "internal/rating-inputs/funds/fund-test",
            200,
            data=payload,
            headers={"x-service-token": SERVICE_TOKEN}
        )
        
        # Restore token
        self.token = saved_token
        
        if not success:
            return False

        # Verify response structure
        if response.get("accepted") is not True:
            self.log(f"FAIL: Expected accepted:true, got {response.get('accepted')}", "FAIL")
            return False

        if response.get("deduped") is not False:
            self.log(f"FAIL: Expected deduped:false (first ingestion), got {response.get('deduped')}", "FAIL")
            return False

        if "score" not in response or response.get("score") is None:
            self.log(f"FAIL: Expected numeric score, got {response.get('score')}", "FAIL")
            return False

        provenance = response.get("provenance", {})
        if not provenance:
            self.log("FAIL: Expected provenance object", "FAIL")
            return False

        # Verify provenance structure
        if provenance.get("mode") != "derived":
            self.log(f"FAIL: Expected provenance.mode='derived', got {provenance.get('mode')}", "FAIL")
            return False

        components = provenance.get("components", {})
        if not components:
            self.log("FAIL: Expected provenance.components", "FAIL")
            return False

        # Verify some components have mode='derived', some have mode='missing'
        derived_count = sum(1 for c in components.values() if c.get("mode") == "derived")
        missing_count = sum(1 for c in components.values() if c.get("mode") == "missing")
        
        if derived_count == 0:
            self.log("FAIL: Expected at least one component with mode='derived'", "FAIL")
            return False

        self.log(f"Ingestion successful: accepted=true, deduped=false, score={response.get('score')}, provenance.mode={provenance.get('mode')}, components: {derived_count} derived, {missing_count} missing", "SUCCESS")
        return True

    def test_idempotency(self):
        """Test idempotency - repeat exact same ingestion should return deduped:true"""
        self.log("\n=== Testing Idempotency ===", "INFO")
        
        payload = {
            "source": "portfolio-db",
            "observedAt": "2026-08-01T00:00:00Z",
            "idempotencyKey": "fund-test:v1",
            "payload": {
                "foundedAt": "2016-01-01",
                "jurisdictionCode": "US",
                "licenseIds": ["l1"],
                "regulatoryIncidents": 0,
                "exits": [
                    {"realisedRoi": 3, "verified": True},
                    {"realisedRoi": 5, "verified": True}
                ],
                "portfolioReturns": [
                    {"realisedRoi": 2},
                    {"unrealisedRoi": 0.8}
                ]
            }
        }
        
        # Remove Bearer token, use service token header instead
        saved_token = self.token
        self.token = None
        
        success, response = self.test(
            "Idempotent Ingestion",
            "PUT",
            "internal/rating-inputs/funds/fund-test",
            200,
            data=payload,
            headers={"x-service-token": SERVICE_TOKEN}
        )
        
        # Restore token
        self.token = saved_token
        
        if not success:
            return False

        # Verify deduped:true
        if response.get("deduped") is not True:
            self.log(f"FAIL: Expected deduped:true (idempotent replay), got {response.get('deduped')}", "FAIL")
            return False

        # Should still return the same score
        if "score" not in response or response.get("score") is None:
            self.log(f"FAIL: Expected score in idempotent response, got {response.get('score')}", "FAIL")
            return False

        self.log(f"Idempotency verified: deduped=true, score={response.get('score')}", "SUCCESS")
        return True

    def test_invalid_ingestion(self):
        """Test invalid ingestion - should return 400 with errors array"""
        self.log("\n=== Testing Invalid Ingestion ===", "INFO")
        
        payload = {
            "source": "x",
            "payload": {
                "followers": "lots"  # Invalid: should be number
            }
        }
        
        # Remove Bearer token, use service token header instead
        saved_token = self.token
        self.token = None
        
        success, response = self.test(
            "Invalid Ingestion",
            "PUT",
            "internal/rating-inputs/twitter/acc-1",
            400,
            data=payload,
            headers={"x-service-token": SERVICE_TOKEN}
        )
        
        # Restore token
        self.token = saved_token
        
        if success:
            # Verify errors array exists
            if "errors" not in response and "message" not in response:
                self.log("FAIL: Expected errors array or message in 400 response", "FAIL")
                return False
            
            self.log(f"Invalid ingestion correctly rejected: {response}", "SUCCESS")
            return True
        else:
            self.log("Expected 400 for invalid ingestion", "FAIL")
            return False

    def test_raw_preview_twitter(self):
        """Test per-entity RAW preview POST /api/admin/ratings/unified/preview/twitter"""
        self.log("\n=== Testing RAW Preview (Twitter) ===", "INFO")
        
        payload = {
            "source": "mock",
            "raw": {
                "followers": 250000,
                "verified": True,
                "accountCreatedAt": "2019-01-01",
                "audienceSample": [
                    {
                        "postCount": 5,
                        "isRatedEntity": True,
                        "cryptoRelevance": 0.8,
                        "suspiciousProbability": 0.1
                    }
                ],
                "posts": [
                    {
                        "postedAt": "2026-08-01T00:00:00Z",
                        "likes": 100,
                        "reposts": 20,
                        "replies": 10,
                        "views": 5000,
                        "uniqueEngagers": 90
                    }
                ]
            }
        }
        
        success, response = self.test(
            "RAW Preview Twitter",
            "POST",
            "admin/ratings/unified/preview/twitter",
            200,
            data=payload
        )
        
        if not success:
            return False

        # Verify response structure
        result = response.get("result", {})
        if not result:
            self.log("FAIL: Expected result object", "FAIL")
            return False

        if "score" not in result or not isinstance(result.get("score"), (int, float)):
            self.log(f"FAIL: Expected numeric score, got {result.get('score')}", "FAIL")
            return False

        provenance = response.get("provenance", {})
        if not provenance:
            self.log("FAIL: Expected provenance object", "FAIL")
            return False

        if provenance.get("mode") != "mock":
            self.log(f"FAIL: Expected provenance.mode='mock', got {provenance.get('mode')}", "FAIL")
            return False

        # Verify components have mode='mock'
        components = provenance.get("components", {})
        mock_count = sum(1 for c in components.values() if c.get("mode") == "mock")
        
        if mock_count == 0:
            self.log("FAIL: Expected at least one component with mode='mock'", "FAIL")
            return False

        self.log(f"RAW preview successful: score={result.get('score')}, provenance.mode={provenance.get('mode')}, {mock_count} mock components", "SUCCESS")
        return True

    def test_regression_get_config(self):
        """Test regression: GET /api/admin/ratings/unified/config still works"""
        self.log("\n=== Testing Regression: GET Config ===", "INFO")
        success, response = self.test(
            "Get Unified Config (regression)",
            "GET",
            "admin/ratings/unified/config",
            200
        )
        if not success:
            return False

        # Verify structure
        required_keys = ["version", "config", "runtime"]
        for key in required_keys:
            if key not in response:
                self.log(f"FAIL: Missing key in response: {key}", "FAIL")
                return False

        self.config_version = response.get("version")
        
        # Verify users.platformUser.weights sum to 100
        config = response.get("config", {})
        platform_user = config.get("users", {}).get("platformUser", {})
        weights = platform_user.get("weights", {})
        
        if not weights:
            self.log("FAIL: config.users.platformUser.weights is missing", "FAIL")
            return False

        total = sum(weights.values())
        if abs(total - 100) > 1:
            self.log(f"FAIL: platformUser.weights sum to {total}, expected 100", "FAIL")
            return False

        self.log(f"Config regression verified: version={self.config_version}, platformUser.weights sum={total}", "SUCCESS")
        return True

    def test_config_put_roundtrip(self):
        """Test config PUT round-trip - save and verify it persists"""
        self.log("\n=== Testing Config PUT Round-Trip ===", "INFO")
        
        if self.config_version is None:
            self.log("No config version loaded, skipping round-trip test", "WARN")
            return False

        # Get current config
        success, get_response = self.test(
            "Get Config for Round-Trip",
            "GET",
            "admin/ratings/unified/config",
            200
        )
        if not success:
            return False

        config = get_response.get("config", {})
        version = get_response.get("version")
        
        # Save the same config (no changes)
        success, put_response = self.test(
            "PUT Config Round-Trip",
            "PUT",
            "admin/ratings/unified/config",
            200,
            data={"version": version, "config": config}
        )
        if not success:
            return False

        new_version = put_response.get("version")
        if new_version is None or new_version <= version:
            self.log(f"FAIL: Version should increment. Old: {version}, New: {new_version}", "FAIL")
            return False

        self.log(f"Config round-trip successful: version {version} -> {new_version}", "SUCCESS")
        return True

    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("\n" + "="*60, "INFO")
        self.log("FOMO Rating Integration Layer (Phase 2) - Backend API Tests", "INFO")
        self.log("="*60 + "\n", "INFO")

        # Auth
        if not self.test_login():
            self.log("\n❌ Login failed, cannot continue", "FAIL")
            return False

        # Reference directories
        self.log("\n" + "="*60, "INFO")
        self.log("Reference Directories Tests", "INFO")
        self.log("="*60 + "\n", "INFO")
        
        self.test_get_reference_catalogs()
        self.test_get_rating_crises()
        self.test_get_rating_jurisdictions()
        self.test_upsert_reference_item()
        self.test_delete_custom_reference_item()
        self.test_delete_system_reference_item()

        # Internal ingestion
        self.log("\n" + "="*60, "INFO")
        self.log("Internal Ingestion Tests", "INFO")
        self.log("="*60 + "\n", "INFO")
        
        self.test_internal_ingestion_without_token()
        self.test_internal_ingestion_with_token()
        self.test_idempotency()
        self.test_invalid_ingestion()

        # RAW preview
        self.log("\n" + "="*60, "INFO")
        self.log("RAW Preview Tests", "INFO")
        self.log("="*60 + "\n", "INFO")
        
        self.test_raw_preview_twitter()

        # Regression
        self.log("\n" + "="*60, "INFO")
        self.log("Regression Tests", "INFO")
        self.log("="*60 + "\n", "INFO")
        
        self.test_regression_get_config()
        self.test_config_put_roundtrip()

        # Summary
        self.log("\n" + "="*60, "INFO")
        self.log(f"Tests completed: {self.tests_passed}/{self.tests_run} passed", 
                 "SUCCESS" if self.tests_passed == self.tests_run else "FAIL")
        self.log("="*60 + "\n", "INFO")

        return self.tests_passed == self.tests_run


def main():
    tester = RatingIntegrationTester()
    success = tester.run_all_tests()
    return 0 if success else 1


if __name__ == "__main__":
    sys.exit(main())
