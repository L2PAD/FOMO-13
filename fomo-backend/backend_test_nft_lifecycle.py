#!/usr/bin/env python3
"""
Phase G NFT Access Lifecycle E2E Test
Tests the complete NFT temporary-benefit lifecycle:
- Activation → Entitlement → AccessResolver ALLOW
- Idempotency → Transfer → Expiry → Subscription overlap
"""

import requests
import sys
import json
from datetime import datetime

BASE_URL = "https://fomo53-crm.preview.emergentagent.com/api"

# Test data from review_request
TEST_CONTRACT = "0xtestc0llection00000000000000000000007001"
CHAIN_ID = "1"

USER_A = {
    "wallet": "0xa2a0000000000000000000000000000000008001",
    "userId": "6a7c26812cdbdde60a256c28",
    "owns_tokens": ["8001", "8002", "8003"],
    "token_jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3YWxsZXQiOiIweGEyYTAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDgwMDEiLCJpYXQiOjE3ODY1MjEyMTcsImV4cCI6MTc4NjYwNzYxN30.wVmXjmt0YqBuyZ7q8F5pbgqKREjgLfOfmPX4ZELRF5c"
}

USER_B = {
    "wallet": "0xb2b0000000000000000000000000000000008002",
    "userId": "6a7c26812cdbdde60a256c2c",
    "token_jwt": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3YWxsZXQiOiIweGIyYjAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDgwMDIiLCJpYXQiOjE3ODY1MjEyMTcsImV4cCI6MTc4NjYwNzYxN30.EVGryNH2bvVkh_3ILN_Oyp7QVfIrruaccl1iFMMAhmQ"
}

ADMIN_CREDS = {
    "email": "admin@fomo.local",
    "password": "Admin@12345"
}

class NFTLifecycleTester:
    def __init__(self):
        self.admin_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.activation_data = {}
        
    def log(self, msg, level="INFO"):
        prefix = "✅" if level == "PASS" else "❌" if level == "FAIL" else "🔍"
        print(f"{prefix} {msg}")
        
    def admin_login(self):
        """Get admin token"""
        self.log("Logging in as admin...")
        try:
            r = requests.post(f"{BASE_URL}/user/admin/login", json=ADMIN_CREDS, timeout=10)
            if r.status_code in [200, 202]:
                data = r.json()
                self.admin_token = data.get("token") or data.get("accessToken")
                if self.admin_token:
                    self.log(f"Admin login successful (status {r.status_code})", "PASS")
                    return True
            self.log(f"Admin login failed: {r.status_code} - {r.text[:200]}", "FAIL")
            return False
        except Exception as e:
            self.log(f"Admin login error: {e}", "FAIL")
            return False
    
    def api_call(self, method, endpoint, token=None, data=None, params=None, expect_status=200):
        """Make API call with proper headers"""
        self.tests_run += 1
        url = f"{BASE_URL}{endpoint}"
        headers = {"Content-Type": "application/json"}
        if token:
            headers["Authorization"] = f"Bearer {token}"
        
        try:
            if method == "GET":
                r = requests.get(url, headers=headers, params=params, timeout=10)
            elif method == "POST":
                r = requests.post(url, headers=headers, json=data, timeout=10)
            elif method == "PATCH":
                r = requests.patch(url, headers=headers, json=data, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            success = r.status_code == expect_status
            if success:
                self.tests_passed += 1
            
            return {
                "success": success,
                "status": r.status_code,
                "data": r.json() if r.text and r.status_code < 500 else {},
                "text": r.text
            }
        except Exception as e:
            self.log(f"API call error {method} {endpoint}: {e}", "FAIL")
            return {"success": False, "status": 0, "data": {}, "error": str(e)}
    
    def step1_activation(self):
        """STEP 1: Baseline check + Activation via API"""
        self.log("\n=== STEP 1: ACTIVATION (baseline + activate #8001) ===")
        
        # Baseline: GET /api/me/nft-access
        self.log("1a. Checking baseline NFT access for USER_A...")
        result = self.api_call("GET", "/me/nft-access", token=USER_A["token_jwt"])
        if result["success"]:
            tokens = result["data"].get("tokens", [])
            self.log(f"USER_A has {len(tokens)} eligible tokens", "PASS")
            for t in tokens:
                if t["tokenId"] in ["8001", "8002", "8003"]:
                    status = t["benefit"]["status"]
                    self.log(f"  Token #{t['tokenId']}: {status}")
        else:
            self.log(f"Failed to get NFT access: {result['status']}", "FAIL")
            return False
        
        # Baseline: GET /api/access/explain?capability=earlyland.prime (should be false)
        self.log("1b. Checking baseline access to earlyland.prime (should be DENY)...")
        result = self.api_call("GET", "/access/explain", token=USER_A["token_jwt"], 
                              params={"capability": "earlyland.prime"})
        if result["success"]:
            allowed = result["data"].get("data", {}).get("allowed", False)
            if not allowed:
                self.log("earlyland.prime correctly DENIED before activation", "PASS")
            else:
                self.log("earlyland.prime should be DENIED before activation", "FAIL")
        
        # Activate #8001 via API
        self.log("1c. Activating NFT #8001 via API...")
        result = self.api_call("POST", "/access/nft/activate", token=USER_A["token_jwt"],
                              data={
                                  "chainId": CHAIN_ID,
                                  "contract": TEST_CONTRACT,
                                  "tokenId": "8001"
                              }, expect_status=201)
        if result["success"]:
            self.log("NFT #8001 activation API call successful", "PASS")
            self.activation_data = result["data"].get("data", {})
            self.log(f"  Activation ID: {self.activation_data.get('_id', 'N/A')}")
            self.log(f"  Access ends at: {self.activation_data.get('accessEndsAt', 'N/A')}")
        else:
            self.log(f"NFT activation failed: {result['status']} - {result.get('text', '')[:200]}", "FAIL")
            return False
        
        # Verify via admin endpoint
        self.log("1d. Verifying activation via admin endpoint...")
        result = self.api_call("GET", "/access/admin/nft/activations", token=self.admin_token,
                              params={"tokenId": "8001"})
        if result["success"]:
            activations = result["data"]
            if isinstance(activations, list) and len(activations) == 1:
                act = activations[0]
                self.log(f"Found EXACTLY ONE activation for #8001", "PASS")
                self.log(f"  Contract: {act.get('contractAddress')}")
                self.log(f"  Wallet: {act.get('currentOwnerWallet')}")
                self.log(f"  Activated at: {act.get('activatedAt')}")
                self.log(f"  Expires at: {act.get('accessEndsAt')}")
                # Store for later comparison
                self.activation_data["accessEndsAt"] = act.get("accessEndsAt")
            else:
                self.log(f"Expected 1 activation, found {len(activations) if isinstance(activations, list) else 'unknown'}", "FAIL")
        
        # Verify access granted
        self.log("1e. Verifying access to earlyland.prime (should be ALLOW)...")
        result = self.api_call("GET", "/access/explain", token=USER_A["token_jwt"],
                              params={"capability": "earlyland.prime"})
        if result["success"]:
            allowed = result["data"].get("data", {}).get("allowed", False)
            if allowed:
                self.log("earlyland.prime correctly ALLOWED after activation", "PASS")
            else:
                self.log("earlyland.prime should be ALLOWED after activation", "FAIL")
        
        # Verify fomo_ai.access
        self.log("1f. Verifying access to fomo_ai.access (should be ALLOW)...")
        result = self.api_call("GET", "/access/explain", token=USER_A["token_jwt"],
                              params={"capability": "fomo_ai.access"})
        if result["success"]:
            allowed = result["data"].get("data", {}).get("allowed", False)
            if allowed:
                self.log("fomo_ai.access correctly ALLOWED after activation", "PASS")
            else:
                self.log("fomo_ai.access should be ALLOWED after activation", "FAIL")
        
        return True
    
    def step2_idempotency(self):
        """STEP 2: Idempotency - re-activate should not create new activation"""
        self.log("\n=== STEP 2: IDEMPOTENCY ===")
        
        # Try to activate again
        self.log("2a. Attempting to re-activate #8001...")
        result = self.api_call("POST", "/access/nft/activate", token=USER_A["token_jwt"],
                              data={
                                  "chainId": CHAIN_ID,
                                  "contract": TEST_CONTRACT,
                                  "tokenId": "8001"
                              })
        if result["success"]:
            data = result["data"]
            if data.get("reused") or data.get("code") == "already_active":
                self.log("Re-activation correctly returned existing activation (idempotent)", "PASS")
            else:
                self.log("Re-activation should indicate reused/already_active", "FAIL")
        
        # Verify still only ONE activation
        self.log("2b. Verifying still only ONE activation exists...")
        result = self.api_call("GET", "/access/admin/nft/activations", token=self.admin_token,
                              params={"tokenId": "8001"})
        if result["success"]:
            activations = result["data"]
            if isinstance(activations, list) and len(activations) == 1:
                self.log("Still EXACTLY ONE activation (idempotency verified)", "PASS")
                # Verify accessEndsAt unchanged
                new_expires = activations[0].get("accessEndsAt")
                old_expires = self.activation_data.get("accessEndsAt")
                if new_expires == old_expires:
                    self.log("accessEndsAt UNCHANGED (no extra 30 days added)", "PASS")
                else:
                    self.log(f"accessEndsAt changed! Old: {old_expires}, New: {new_expires}", "FAIL")
            else:
                self.log(f"Expected 1 activation, found {len(activations) if isinstance(activations, list) else 'unknown'}", "FAIL")
        
        return True
    
    def step3_independence(self):
        """STEP 3: Multiple-NFT independence"""
        self.log("\n=== STEP 3: MULTIPLE-NFT INDEPENDENCE ===")
        
        self.log("3a. Checking USER_A's NFT access status...")
        result = self.api_call("GET", "/me/nft-access", token=USER_A["token_jwt"])
        if result["success"]:
            tokens = result["data"].get("tokens", [])
            status_map = {t["tokenId"]: t["benefit"]["status"] for t in tokens}
            
            if status_map.get("8001") == "ACTIVE":
                self.log("#8001 is ACTIVE ✓", "PASS")
            else:
                self.log(f"#8001 should be ACTIVE, got {status_map.get('8001')}", "FAIL")
            
            if status_map.get("8002") == "AVAILABLE":
                self.log("#8002 remains AVAILABLE ✓", "PASS")
            else:
                self.log(f"#8002 should be AVAILABLE, got {status_map.get('8002')}", "FAIL")
            
            if status_map.get("8003") == "AVAILABLE":
                self.log("#8003 remains AVAILABLE ✓", "PASS")
            else:
                self.log(f"#8003 should be AVAILABLE, got {status_map.get('8003')}", "FAIL")
        
        return True
    
    def step4_transfer(self):
        """STEP 4: Transfer A→B"""
        self.log("\n=== STEP 4: TRANSFER A→B ===")
        
        self.log("4a. Admin transferring #8001 from USER_A to USER_B...")
        result = self.api_call("POST", "/access/admin/nft/transfer", token=self.admin_token,
                              data={
                                  "chainId": CHAIN_ID,
                                  "contract": TEST_CONTRACT,
                                  "tokenId": "8001",
                                  "newWallet": USER_B["wallet"],
                                  "newUserId": USER_B["userId"]
                              }, expect_status=201)
        if result["success"]:
            self.log("Transfer API call successful", "PASS")
            transfer_data = result["data"]
            self.log(f"  Remaining days: {transfer_data.get('remainingDays', 'N/A')}")
        else:
            self.log(f"Transfer failed: {result['status']}", "FAIL")
            return False
        
        # Verify USER_B now has #8001 as TRANSFERRED
        self.log("4b. Checking USER_B's NFT access (should have #8001 TRANSFERRED)...")
        result = self.api_call("GET", "/me/nft-access", token=USER_B["token_jwt"])
        if result["success"]:
            tokens = result["data"].get("tokens", [])
            token_8001 = next((t for t in tokens if t["tokenId"] == "8001"), None)
            if token_8001:
                status = token_8001["benefit"]["status"]
                can_activate = token_8001["benefit"]["canActivate"]
                expires_at = token_8001["benefit"]["expiresAt"]
                
                if status == "TRANSFERRED":
                    self.log("#8001 status is TRANSFERRED ✓", "PASS")
                else:
                    self.log(f"#8001 should be TRANSFERRED, got {status}", "FAIL")
                
                if not can_activate:
                    self.log("canActivate is false ✓", "PASS")
                else:
                    self.log("canActivate should be false for TRANSFERRED", "FAIL")
                
                # Verify expiresAt unchanged
                old_expires = self.activation_data.get("accessEndsAt")
                if expires_at == old_expires:
                    self.log("expiresAt UNCHANGED from step 1 ✓", "PASS")
                else:
                    self.log(f"expiresAt changed! Old: {old_expires}, New: {expires_at}", "FAIL")
            else:
                self.log("#8001 not found in USER_B's tokens", "FAIL")
        
        # Verify USER_A no longer has #8001
        self.log("4c. Checking USER_A no longer has #8001...")
        result = self.api_call("GET", "/me/nft-access", token=USER_A["token_jwt"])
        if result["success"]:
            tokens = result["data"].get("tokens", [])
            token_8001 = next((t for t in tokens if t["tokenId"] == "8001"), None)
            if not token_8001:
                self.log("USER_A no longer has #8001 ✓", "PASS")
            else:
                self.log("USER_A should not have #8001 after transfer", "FAIL")
        
        # Verify access: USER_A should be denied, USER_B should be allowed
        self.log("4d. Verifying USER_A access to earlyland.prime (should be DENY)...")
        result = self.api_call("GET", "/access/explain", token=USER_A["token_jwt"],
                              params={"capability": "earlyland.prime"})
        if result["success"]:
            allowed = result["data"].get("data", {}).get("allowed", False)
            if not allowed:
                self.log("USER_A correctly DENIED (lost NFT source)", "PASS")
            else:
                self.log("USER_A should be DENIED after transfer", "FAIL")
        
        self.log("4e. Verifying USER_B access to earlyland.prime (should be ALLOW)...")
        result = self.api_call("GET", "/access/explain", token=USER_B["token_jwt"],
                              params={"capability": "earlyland.prime"})
        if result["success"]:
            allowed = result["data"].get("data", {}).get("allowed", False)
            if allowed:
                self.log("USER_B correctly ALLOWED (received NFT)", "PASS")
            else:
                self.log("USER_B should be ALLOWED after transfer", "FAIL")
        
        return True
    
    def step5_subscription_overlap(self):
        """STEP 5: Subscription overlap"""
        self.log("\n=== STEP 5: SUBSCRIPTION OVERLAP ===")
        
        self.log("5a. Admin granting subscription to USER_B...")
        result = self.api_call("POST", "/admin/entitlements/subscriptions", token=self.admin_token,
                              data={
                                  "user": USER_B["wallet"],
                                  "planCode": "FOMO_AI_MEMBERSHIP",
                                  "activate": True
                              }, expect_status=201)
        if result["success"]:
            self.log("Subscription granted successfully", "PASS")
        else:
            self.log(f"Subscription grant failed: {result['status']}", "FAIL")
        
        # Verify membership has TWO sources
        self.log("5b. Checking USER_B membership (should have 2 sources)...")
        result = self.api_call("GET", "/access/membership", token=USER_B["token_jwt"])
        if result["success"]:
            membership = result["data"].get("data", {})
            sources = membership.get("sources", [])
            active = membership.get("active", False)
            
            if active:
                self.log("Membership is active ✓", "PASS")
            else:
                self.log("Membership should be active", "FAIL")
            
            if len(sources) == 2:
                self.log(f"Found TWO sources ✓", "PASS")
                source_types = [s.get("type") for s in sources]
                self.log(f"  Source types: {source_types}")
                if "SUBSCRIPTION" in source_types and "NFT_ACTIVATION" in source_types:
                    self.log("Both SUBSCRIPTION and NFT_ACTIVATION present ✓", "PASS")
                else:
                    self.log(f"Expected SUBSCRIPTION and NFT_ACTIVATION, got {source_types}", "FAIL")
            else:
                self.log(f"Expected 2 sources, found {len(sources)}", "FAIL")
        
        # Verify explain shows both sources
        self.log("5c. Checking explain access (should list both sources)...")
        result = self.api_call("GET", "/access/explain", token=USER_B["token_jwt"],
                              params={"capability": "earlyland.prime"})
        if result["success"]:
            data = result["data"].get("data", {})
            allowed = data.get("allowed", False)
            sources = data.get("sources", [])
            
            if allowed:
                self.log("Access ALLOWED ✓", "PASS")
            else:
                self.log("Access should be ALLOWED", "FAIL")
            
            if len(sources) >= 2:
                self.log(f"Explanation lists {len(sources)} sources ✓", "PASS")
            else:
                self.log(f"Expected at least 2 sources in explanation, found {len(sources)}", "FAIL")
        
        return True
    
    def step6_expiry(self):
        """STEP 6: Expiry via dev endpoint"""
        self.log("\n=== STEP 6: EXPIRY (via dev endpoint) ===")
        
        self.log("6a. Admin backdating #8001 activation to trigger expiry...")
        result = self.api_call("POST", "/access/admin/nft/test/expire", token=self.admin_token,
                              data={
                                  "chainId": CHAIN_ID,
                                  "contract": TEST_CONTRACT,
                                  "tokenId": "8001"
                              }, expect_status=201)
        if result["success"]:
            self.log("Expiry endpoint call successful", "PASS")
            expiry_result = result["data"]
            self.log(f"  Backdated: {expiry_result.get('backdated', 0)} activations")
            self.log(f"  Expired: {expiry_result.get('expiry', {}).get('expired', 0)} activations")
        else:
            self.log(f"Expiry call failed: {result['status']}", "FAIL")
        
        # Verify USER_B's #8001 is now EXPIRED
        self.log("6b. Checking USER_B's #8001 status (should be EXPIRED)...")
        result = self.api_call("GET", "/me/nft-access", token=USER_B["token_jwt"])
        if result["success"]:
            tokens = result["data"].get("tokens", [])
            token_8001 = next((t for t in tokens if t["tokenId"] == "8001"), None)
            if token_8001:
                status = token_8001["benefit"]["status"]
                if status == "EXPIRED":
                    self.log("#8001 status is EXPIRED ✓", "PASS")
                else:
                    self.log(f"#8001 should be EXPIRED, got {status}", "FAIL")
                
                # Verify utilities still show "independent"
                utilities = token_8001.get("utilities", {})
                if utilities.get("launchpad") == "independent":
                    self.log("Launchpad utility still 'independent' ✓", "PASS")
            else:
                self.log("#8001 not found in USER_B's tokens", "FAIL")
        
        # Verify USER_B still has access via SUBSCRIPTION
        self.log("6c. Verifying USER_B still has access via SUBSCRIPTION...")
        result = self.api_call("GET", "/access/explain", token=USER_B["token_jwt"],
                              params={"capability": "earlyland.prime"})
        if result["success"]:
            data = result["data"].get("data", {})
            allowed = data.get("allowed", False)
            matched_by = data.get("matchedBy")
            
            if allowed:
                self.log("USER_B still ALLOWED (via subscription) ✓", "PASS")
            else:
                self.log("USER_B should still be ALLOWED via subscription", "FAIL")
            
            if matched_by == "SUBSCRIPTION":
                self.log("matchedBy is SUBSCRIPTION ✓", "PASS")
            else:
                self.log(f"matchedBy should be SUBSCRIPTION, got {matched_by}", "FAIL")
        
        return True
    
    def step6b_expiry_without_subscription(self):
        """STEP 6b: Verify USER_A has no access (no NFT, no subscription)"""
        self.log("\n=== STEP 6b: EXPIRY WITHOUT SUBSCRIPTION ===")
        
        self.log("6b1. Verifying USER_A has no access to earlyland.prime...")
        result = self.api_call("GET", "/access/explain", token=USER_A["token_jwt"],
                              params={"capability": "earlyland.prime"})
        if result["success"]:
            allowed = result["data"].get("data", {}).get("allowed", False)
            if not allowed:
                self.log("USER_A correctly DENIED (no source) ✓", "PASS")
            else:
                self.log("USER_A should be DENIED (lost NFT, no subscription)", "FAIL")
        
        self.log("6b2. Verifying USER_A has no access to fomo_ai.access...")
        result = self.api_call("GET", "/access/explain", token=USER_A["token_jwt"],
                              params={"capability": "fomo_ai.access"})
        if result["success"]:
            allowed = result["data"].get("data", {}).get("allowed", False)
            if not allowed:
                self.log("USER_A correctly DENIED fomo_ai.access ✓", "PASS")
            else:
                self.log("USER_A should be DENIED fomo_ai.access", "FAIL")
        
        # Verify USER_A still owns #8002 and #8003 as AVAILABLE
        self.log("6b3. Verifying USER_A still owns #8002 and #8003 as AVAILABLE...")
        result = self.api_call("GET", "/me/nft-access", token=USER_A["token_jwt"])
        if result["success"]:
            tokens = result["data"].get("tokens", [])
            status_map = {t["tokenId"]: t["benefit"]["status"] for t in tokens}
            
            if status_map.get("8002") == "AVAILABLE":
                self.log("#8002 still AVAILABLE ✓", "PASS")
            else:
                self.log(f"#8002 should be AVAILABLE, got {status_map.get('8002')}", "FAIL")
            
            if status_map.get("8003") == "AVAILABLE":
                self.log("#8003 still AVAILABLE ✓", "PASS")
            else:
                self.log(f"#8003 should be AVAILABLE, got {status_map.get('8003')}", "FAIL")
        
        return True
    
    def step7_crm_propagation(self):
        """STEP 7: CRM propagation (API only, UI tested separately)"""
        self.log("\n=== STEP 7: CRM PROPAGATION (API) ===")
        
        self.log("7a. Checking admin activations endpoint...")
        result = self.api_call("GET", "/access/admin/nft/activations", token=self.admin_token)
        if result["success"]:
            activations = result["data"]
            if isinstance(activations, list):
                token_8001_acts = [a for a in activations if a.get("tokenId") == "8001"]
                if token_8001_acts:
                    self.log(f"Found {len(token_8001_acts)} activation(s) for #8001 ✓", "PASS")
                else:
                    self.log("No activations found for #8001", "FAIL")
        
        self.log("7b. Checking admin transfers endpoint...")
        result = self.api_call("GET", "/access/admin/nft/transfers", token=self.admin_token)
        if result["success"]:
            transfers = result["data"]
            if isinstance(transfers, list):
                token_8001_transfers = [t for t in transfers if t.get("tokenId") == "8001"]
                if token_8001_transfers:
                    self.log(f"Found {len(token_8001_transfers)} transfer(s) for #8001 ✓", "PASS")
                else:
                    self.log("No transfers found for #8001", "FAIL")
        
        return True
    
    def step8_product_regression(self):
        """STEP 8: Product regression"""
        self.log("\n=== STEP 8: PRODUCT REGRESSION ===")
        
        self.log("8a. Checking /api/products endpoint...")
        result = self.api_call("GET", "/products")
        if result["success"]:
            products = result["data"]
            if isinstance(products, list):
                product_types = [p.get("productType") for p in products]
                self.log(f"Found product types: {product_types}")
                
                if "FOMO_AI" in product_types and "FOMO_INTEL" in product_types:
                    self.log("FOMO_AI and FOMO_INTEL present ✓", "PASS")
                else:
                    self.log("Expected FOMO_AI and FOMO_INTEL", "FAIL")
                
                # Check for unwanted types
                unwanted = ["Starter", "Pro", "Research"]
                found_unwanted = [t for t in product_types if any(u.lower() in str(t).lower() for u in unwanted)]
                if not found_unwanted:
                    self.log("No Starter/Pro/Research product types ✓", "PASS")
                else:
                    self.log(f"Found unwanted product types: {found_unwanted}", "FAIL")
        
        return True
    
    def step9_ads_regression(self):
        """STEP 9: Ads regression"""
        self.log("\n=== STEP 9: ADS REGRESSION ===")
        
        self.log("9a. Checking ad serving with PRODUCT creative...")
        # Try up to 6 times to get a PRODUCT creative
        product_creative = None
        for i in range(6):
            result = self.api_call("GET", "/ads/serve",
                                  params={"placement": "GLOBAL_TOP_BANNER", "device": "desktop"})
            if result["success"]:
                data = result["data"]
                if data.get("filled") and data.get("creative", {}).get("creativeSource") == "PRODUCT":
                    product_creative = data["creative"]
                    self.log(f"Found PRODUCT creative on attempt {i+1} ✓", "PASS")
                    self.log(f"  Headline: {product_creative.get('headline')}")
                    self.log(f"  CTA Label: {product_creative.get('ctaLabel')}")
                    break
        
        if not product_creative:
            self.log("Could not find PRODUCT creative after 6 attempts (may be expected if no campaigns)", "INFO")
        
        return True
    
    def run_all_tests(self):
        """Run all test steps"""
        print("\n" + "="*70)
        print("NFT ACCESS LIFECYCLE E2E TEST")
        print("="*70)
        
        if not self.admin_login():
            self.log("Cannot proceed without admin token", "FAIL")
            return False
        
        steps = [
            ("STEP 1: Activation", self.step1_activation),
            ("STEP 2: Idempotency", self.step2_idempotency),
            ("STEP 3: Independence", self.step3_independence),
            ("STEP 4: Transfer", self.step4_transfer),
            ("STEP 5: Subscription Overlap", self.step5_subscription_overlap),
            ("STEP 6: Expiry", self.step6_expiry),
            ("STEP 6b: Expiry Without Subscription", self.step6b_expiry_without_subscription),
            ("STEP 7: CRM Propagation", self.step7_crm_propagation),
            ("STEP 8: Product Regression", self.step8_product_regression),
            ("STEP 9: Ads Regression", self.step9_ads_regression),
        ]
        
        for step_name, step_func in steps:
            try:
                if not step_func():
                    self.log(f"{step_name} encountered errors", "FAIL")
            except Exception as e:
                self.log(f"{step_name} exception: {e}", "FAIL")
        
        print("\n" + "="*70)
        print(f"RESULTS: {self.tests_passed}/{self.tests_run} tests passed")
        print("="*70)
        
        return self.tests_passed == self.tests_run

if __name__ == "__main__":
    tester = NFTLifecycleTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)
