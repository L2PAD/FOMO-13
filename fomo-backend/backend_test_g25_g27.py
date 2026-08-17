#!/usr/bin/env python3
"""
FOMO G25/G27 Testing Suite
Tests NFT collection visibility and memberships page redesign
"""

import requests
import json
import sys
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://fomo53-crm.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"
USER_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ3YWxsZXQiOiIweDk0Yzg2MmMwZWY1OTgyOGU3NGFmZDYwYWQ5ODUzNzNmYjk3MjNmOTciLCJpYXQiOjE3ODY0ODg1NjUsImV4cCI6MTc4NjU3NDk2NX0.c_it4WAAOoPILfpVvARH7Mrkscwyvd0Rt_viNWwcSPU"
WALLET_ADDRESS = "0x94c862c0ef59828e74afd60ad985373fb9723f97"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class FomoG25G27Tester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.critical_failures = []
        self.admin_token = None

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
        self.log(f"\n{'='*60}")
        self.log(f"TEST {self.tests_run}: {name}")
        self.log(f"{'='*60}")
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

    def get(self, endpoint: str, headers: Optional[Dict] = None, params: Optional[Dict] = None) -> requests.Response:
        """Make GET request"""
        url = f"{BASE_URL}/{endpoint}"
        self.log(f"GET {url}")
        if params:
            self.log(f"Params: {json.dumps(params, indent=2)}")
        response = requests.get(url, headers=headers or {}, params=params)
        self.log(f"Status: {response.status_code}")
        return response

    def post(self, endpoint: str, data: Dict, headers: Optional[Dict] = None) -> requests.Response:
        """Make POST request"""
        url = f"{BASE_URL}/{endpoint}"
        self.log(f"POST {url}")
        self.log(f"Body: {json.dumps(data, indent=2)}")
        response = requests.post(url, headers=headers or {}, json=data)
        self.log(f"Status: {response.status_code}")
        if response.status_code >= 400:
            self.log(f"Error Response: {response.text}")
        return response

    def put(self, endpoint: str, data: Dict, headers: Optional[Dict] = None) -> requests.Response:
        """Make PUT request"""
        url = f"{BASE_URL}/{endpoint}"
        self.log(f"PUT {url}")
        self.log(f"Body: {json.dumps(data, indent=2)}")
        response = requests.put(url, headers=headers or {}, json=data)
        self.log(f"Status: {response.status_code}")
        if response.status_code >= 400:
            self.log(f"Error Response: {response.text}")
        return response

    def test_admin_login(self):
        """Test: Admin login"""
        def test():
            data = {
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            }
            
            response = self.post("user/admin/login", data)
            
            if response.status_code not in [200, 201, 202]:
                self.failure(f"Admin login failed with status {response.status_code}", critical=True)
                return False
            
            result = response.json()
            self.log(f"Login response: {json.dumps(result, indent=2)}")
            
            if 'accessToken' not in result:
                self.failure("No accessToken in login response", critical=True)
                return False
            
            self.admin_token = result['accessToken']
            self.success(f"Admin logged in successfully, token: {self.admin_token[:20]}...")
            
            return True
        
        return self.test("Admin login", test)

    def test_nft_access_backend(self):
        """Test: TASK1 backend - NFT access endpoint with USER_TOKEN"""
        def test():
            headers = {
                'Authorization': f'Bearer {USER_TOKEN}',
                'Content-Type': 'application/json'
            }
            
            response = self.get("me/nft-access", headers=headers)
            
            if response.status_code not in [200, 201]:
                self.failure(f"NFT access endpoint failed with status {response.status_code}", critical=True)
                return False
            
            result = response.json()
            self.log(f"NFT access response: {json.dumps(result, indent=2)}")
            
            # Verify providerMode='test'
            if result.get('providerMode') != 'test':
                self.failure(f"Expected providerMode='test', got '{result.get('providerMode')}'", critical=True)
                return False
            self.success("providerMode is 'test'")
            
            # Verify tokens array exists
            tokens = result.get('tokens', [])
            if not tokens:
                self.failure("No tokens found in response", critical=True)
                return False
            
            # Verify 3 tokens
            if len(tokens) != 3:
                self.failure(f"Expected 3 tokens, got {len(tokens)}", critical=True)
                return False
            self.success("Found 3 tokens")
            
            # Verify token IDs
            token_ids = [t.get('tokenId') for t in tokens]
            expected_ids = ['7001', '7002', '7003']
            for expected_id in expected_ids:
                if expected_id not in token_ids:
                    self.failure(f"Expected token #{expected_id} not found", critical=True)
                    return False
            self.success(f"Found all expected token IDs: {token_ids}")
            
            # Verify collection name
            for token in tokens:
                collection_name = token.get('collection', {}).get('name')
                if collection_name != 'FOMO Test Collection':
                    self.failure(f"Expected collection 'FOMO Test Collection', got '{collection_name}'", critical=True)
                    return False
            self.success("All tokens have collection 'FOMO Test Collection'")
            
            # Verify benefit status and canActivate
            for token in tokens:
                token_id = token.get('tokenId')
                benefit = token.get('benefit', {})
                status = benefit.get('status')
                can_activate = benefit.get('canActivate')
                
                if status != 'AVAILABLE':
                    self.failure(f"Token #{token_id}: Expected status 'AVAILABLE', got '{status}'", critical=True)
                    return False
                
                if not can_activate:
                    self.failure(f"Token #{token_id}: Expected canActivate=true, got {can_activate}", critical=True)
                    return False
                
                self.success(f"Token #{token_id}: status='AVAILABLE', canActivate=true")
            
            return True
        
        return self.test("TASK1 backend - NFT access endpoint", test)

    def test_memberships_page_public(self):
        """Test: TASK2 backend - Public memberships page content"""
        def test():
            response = self.get("products/page/memberships")
            
            if response.status_code not in [200, 201]:
                self.failure(f"Memberships page endpoint failed with status {response.status_code}", critical=True)
                return False
            
            result = response.json()
            self.log(f"Memberships page response: {json.dumps(result, indent=2)}")
            
            # Verify heroTitle exists
            if 'heroTitle' not in result:
                self.failure("heroTitle not found in response", critical=True)
                return False
            self.success(f"heroTitle: {result['heroTitle']}")
            
            # Verify valueProps exists and has 4 items
            value_props = result.get('valueProps', [])
            if len(value_props) != 4:
                self.failure(f"Expected 4 valueProps, got {len(value_props)}", critical=True)
                return False
            self.success(f"Found 4 valueProps")
            
            # Verify FAQ exists and has at least 3 items
            faq = result.get('faq', [])
            if len(faq) < 3:
                self.failure(f"Expected at least 3 FAQ items, got {len(faq)}", critical=True)
                return False
            self.success(f"Found {len(faq)} FAQ items")
            
            return True
        
        return self.test("TASK2 backend - Public memberships page content", test)

    def test_memberships_page_admin_get(self):
        """Test: TASK2 backend - Admin get memberships page config"""
        def test():
            if not self.admin_token:
                self.failure("Admin token not available", critical=True)
                return False
            
            headers = {
                'Authorization': f'Bearer {self.admin_token}',
                'Content-Type': 'application/json'
            }
            
            response = self.get("admin/entitlements/page/memberships", headers=headers)
            
            if response.status_code not in [200, 201]:
                self.failure(f"Admin memberships page endpoint failed with status {response.status_code}", critical=True)
                return False
            
            result = response.json()
            self.log(f"Admin memberships page response: {json.dumps(result, indent=2)}")
            
            # Verify ok:true
            if not result.get('ok'):
                self.failure("Expected ok:true in response", critical=True)
                return False
            self.success("Response has ok:true")
            
            # Verify config exists
            config = result.get('config')
            if not config:
                self.failure("config not found in response", critical=True)
                return False
            self.success("config found in response")
            
            return True
        
        return self.test("TASK2 backend - Admin get memberships page config", test)

    def test_memberships_page_admin_edit(self):
        """Test: TASK2 backend - Admin edit memberships page"""
        def test():
            if not self.admin_token:
                self.failure("Admin token not available", critical=True)
                return False
            
            headers = {
                'Authorization': f'Bearer {self.admin_token}',
                'Content-Type': 'application/json'
            }
            
            # First, get current config
            get_response = self.get("admin/entitlements/page/memberships", headers=headers)
            if get_response.status_code not in [200, 201]:
                self.failure("Failed to get current config")
                return False
            
            current_config = get_response.json().get('config', {})
            original_title = current_config.get('heroTitle', 'Choose your FOMO intelligence layer')
            self.log(f"Original heroTitle: {original_title}")
            
            # Update heroTitle to test value
            test_title = "Choose your FOMO intelligence layer TEST"
            update_data = {
                "heroTitle": test_title
            }
            
            put_response = self.put("admin/entitlements/page/memberships", update_data, headers=headers)
            
            if put_response.status_code not in [200, 201]:
                self.failure(f"Failed to update memberships page: {put_response.status_code}", critical=True)
                return False
            
            update_result = put_response.json()
            self.log(f"Update response: {json.dumps(update_result, indent=2)}")
            
            # Verify ok:true
            if not update_result.get('ok'):
                self.failure("Expected ok:true in update response", critical=True)
                return False
            self.success("Update response has ok:true")
            
            # Verify the title was updated
            updated_config = update_result.get('config', {})
            if updated_config.get('heroTitle') != test_title:
                self.failure(f"heroTitle not updated. Expected '{test_title}', got '{updated_config.get('heroTitle')}'", critical=True)
                return False
            self.success(f"heroTitle updated to: {test_title}")
            
            # Verify public endpoint reflects the change
            public_response = self.get("products/page/memberships")
            if public_response.status_code not in [200, 201]:
                self.failure("Failed to get public page after update")
                return False
            
            public_result = public_response.json()
            if public_result.get('heroTitle') != test_title:
                self.failure(f"Public page not updated. Expected '{test_title}', got '{public_result.get('heroTitle')}'", critical=True)
                return False
            self.success(f"Public page reflects updated heroTitle: {test_title}")
            
            # Revert back to original
            revert_data = {
                "heroTitle": original_title
            }
            revert_response = self.put("admin/entitlements/page/memberships", revert_data, headers=headers)
            
            if revert_response.status_code not in [200, 201]:
                self.warning(f"Failed to revert heroTitle to original value")
            else:
                self.success(f"Reverted heroTitle back to: {original_title}")
            
            return True
        
        return self.test("TASK2 backend - Admin edit memberships page", test)

    def test_products_catalog(self):
        """Test: Public products catalog endpoint"""
        def test():
            response = self.get("products")
            
            if response.status_code not in [200, 201]:
                self.failure(f"Products catalog endpoint failed with status {response.status_code}", critical=True)
                return False
            
            result = response.json()
            self.log(f"Products catalog response: {json.dumps(result, indent=2)}")
            
            # Verify items array exists
            items = result.get('items', [])
            if not items:
                self.failure("No products found in catalog", critical=True)
                return False
            
            # Verify we have at least 2 products (FOMO_AI and FOMO_INTEL)
            if len(items) < 2:
                self.failure(f"Expected at least 2 products, got {len(items)}", critical=True)
                return False
            self.success(f"Found {len(items)} products")
            
            # Verify product types
            product_types = [item.get('productType') for item in items]
            if 'FOMO_AI' not in product_types:
                self.failure("FOMO_AI product not found", critical=True)
                return False
            if 'FOMO_INTEL' not in product_types:
                self.failure("FOMO_INTEL product not found", critical=True)
                return False
            self.success("Found both FOMO_AI and FOMO_INTEL products")
            
            # Verify FOMO_AI has recommended flag
            fomo_ai = next((item for item in items if item.get('productType') == 'FOMO_AI'), None)
            if fomo_ai and fomo_ai.get('recommended'):
                self.success("FOMO_AI is marked as recommended")
            else:
                self.warning("FOMO_AI is not marked as recommended")
            
            return True
        
        return self.test("Public products catalog", test)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
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
            print(f"\n{Colors.GREEN}🎉 ALL TESTS PASSED!{Colors.END}")
            return 0
        else:
            print(f"\n{Colors.RED}❌ SOME TESTS FAILED{Colors.END}")
            return 1

def main():
    print(f"{Colors.BLUE}{'='*60}")
    print("FOMO G25/G27 Testing Suite")
    print("Testing NFT collection and memberships page redesign")
    print(f"{'='*60}{Colors.END}\n")
    
    tester = FomoG25G27Tester()
    
    # Run tests in order
    tester.test_admin_login()
    tester.test_nft_access_backend()
    tester.test_memberships_page_public()
    tester.test_memberships_page_admin_get()
    tester.test_memberships_page_admin_edit()
    tester.test_products_catalog()
    
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())
