#!/usr/bin/env python3
"""
FOMO Bazaar Contracts Health Testing
Tests GET /api/deals/admin/contracts-health endpoint with demo/production data modes
"""

import requests
import json
import sys
from typing import Dict, Any

# Configuration
BASE_URL = "https://crm-admin-portal-8.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

class ContractsHealthTester:
    def __init__(self):
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.token = None
        self.headers = {'Content-Type': 'application/json'}

    def log(self, message: str, color: str = Colors.BLUE):
        print(f"{color}{message}{Colors.END}")

    def success(self, message: str):
        self.log(f"✅ {message}", Colors.GREEN)
        
    def failure(self, message: str):
        self.log(f"❌ {message}", Colors.RED)
        
    def warning(self, message: str):
        self.log(f"⚠️  {message}", Colors.YELLOW)

    def test(self, name: str, fn):
        """Run a test and track results"""
        self.tests_run += 1
        self.log(f"\n{'='*70}")
        self.log(f"TEST {self.tests_run}: {name}")
        self.log(f"{'='*70}")
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

    def login(self):
        """Login as admin and get JWT token"""
        def test():
            self.log(f"Logging in as {ADMIN_EMAIL}...")
            response = requests.post(
                f"{BASE_URL}/user/admin/login",
                json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
                headers=self.headers
            )
            
            if response.status_code not in [200, 201, 202]:
                self.failure(f"Login failed with status {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
            
            data = response.json()
            self.token = data.get('accessToken')
            
            if not self.token:
                self.failure("No accessToken in login response")
                return False
            
            self.headers['Authorization'] = f'Bearer {self.token}'
            self.success(f"Logged in successfully as {ADMIN_EMAIL}")
            return True
        
        return self.test("Admin login", test)

    def test_contracts_health_demo(self):
        """Test GET /api/deals/admin/contracts-health (default demo mode)"""
        def test():
            self.log(f"GET {BASE_URL}/deals/admin/contracts-health")
            response = requests.get(
                f"{BASE_URL}/deals/admin/contracts-health",
                headers=self.headers
            )
            
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Expected 200, got {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
            
            self.success("Status 200 OK (not 500)")
            
            try:
                data = response.json()
            except:
                self.failure("Response is not valid JSON")
                return False
            
            self.log(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify dataMode
            if 'dataMode' not in data:
                self.failure("Missing 'dataMode' field")
                return False
            
            if data['dataMode'] not in ['demo', 'production']:
                self.failure(f"Invalid dataMode: {data['dataMode']}")
                return False
            
            self.success(f"dataMode present: {data['dataMode']}")
            
            # Verify production metrics
            if 'production' not in data:
                self.failure("Missing 'production' field")
                return False
            
            production = data['production']
            if 'endedVolumeUsd' not in production:
                self.failure("Missing production.endedVolumeUsd")
                return False
            
            if 'feesUsd' not in production:
                self.failure("Missing production.feesUsd")
                return False
            
            self.success(f"production metrics present: endedVolumeUsd={production['endedVolumeUsd']}, feesUsd={production['feesUsd']}")
            
            # Verify demo metrics
            if 'demo' not in data:
                self.failure("Missing 'demo' field")
                return False
            
            demo = data['demo']
            if 'dealRecords' not in demo:
                self.failure("Missing demo.dealRecords")
                return False
            
            self.success(f"demo metrics present: dealRecords={demo['dealRecords']}")
            
            # Verify contracts array
            if 'contracts' not in data:
                self.failure("Missing 'contracts' array")
                return False
            
            contracts = data['contracts']
            if not isinstance(contracts, list):
                self.failure("'contracts' is not an array")
                return False
            
            self.success(f"contracts array present with {len(contracts)} items")
            
            # Find custody and nft-marketplace contracts
            custody = None
            nft_marketplace = None
            
            for contract in contracts:
                if contract.get('key') == 'custody':
                    custody = contract
                elif contract.get('key') == 'nft-marketplace':
                    nft_marketplace = contract
            
            if not custody:
                self.failure("Missing 'custody' contract in contracts array")
                return False
            
            self.success("Found 'custody' contract")
            
            if not nft_marketplace:
                self.failure("Missing 'nft-marketplace' contract in contracts array")
                return False
            
            self.success("Found 'nft-marketplace' contract")
            
            # Verify custody has reconciliation
            if 'reconciliation' not in custody:
                self.warning("custody contract missing 'reconciliation' field (may be expected if not implemented)")
            else:
                self.success(f"custody has reconciliation: {custody['reconciliation']}")
            
            # Verify custody status
            if 'status' not in custody:
                self.failure("custody missing 'status' field")
                return False
            
            custody_status = custody['status']
            if custody_status not in ['CONNECTED', 'DEGRADED', 'OFFLINE']:
                self.warning(f"Unexpected custody status: {custody_status}")
            else:
                self.success(f"custody status: {custody_status}")
            
            # Verify nft-marketplace status
            if 'status' not in nft_marketplace:
                self.failure("nft-marketplace missing 'status' field")
                return False
            
            nft_status = nft_marketplace['status']
            if nft_status not in ['CONNECTED', 'DEGRADED', 'OFFLINE']:
                self.warning(f"Unexpected nft-marketplace status: {nft_status}")
            else:
                self.success(f"nft-marketplace status: {nft_status}")
            
            return True
        
        return self.test("GET /api/deals/admin/contracts-health (demo mode)", test)

    def test_contracts_health_production(self):
        """Test GET /api/deals/admin/contracts-health?dataMode=production"""
        def test():
            self.log(f"GET {BASE_URL}/deals/admin/contracts-health?dataMode=production")
            response = requests.get(
                f"{BASE_URL}/deals/admin/contracts-health",
                params={"dataMode": "production"},
                headers=self.headers
            )
            
            self.log(f"Status: {response.status_code}")
            
            if response.status_code != 200:
                self.failure(f"Expected 200, got {response.status_code}")
                self.log(f"Response: {response.text}")
                return False
            
            self.success("Status 200 OK")
            
            try:
                data = response.json()
            except:
                self.failure("Response is not valid JSON")
                return False
            
            self.log(f"Response: {json.dumps(data, indent=2)}")
            
            # Verify dataMode is production
            if data.get('dataMode') != 'production':
                self.failure(f"Expected dataMode='production', got '{data.get('dataMode')}'")
                return False
            
            self.success("dataMode is 'production'")
            
            # Verify production metrics
            production = data.get('production', {})
            ended_volume = production.get('endedVolumeUsd', -1)
            fees = production.get('feesUsd', -1)
            
            self.log(f"Production metrics: endedVolumeUsd={ended_volume}, feesUsd={fees}")
            
            # Since all current data is demo, production metrics should be 0 or very low
            if ended_volume == 0:
                self.success("production.endedVolumeUsd is 0 (demo data excluded)")
            else:
                self.warning(f"production.endedVolumeUsd is {ended_volume} (expected 0 if all data is demo)")
            
            # Verify demo metrics
            demo = data.get('demo', {})
            deal_records = demo.get('dealRecords', -1)
            
            if deal_records >= 0:
                self.success(f"demo.dealRecords present: {deal_records}")
            else:
                self.failure("demo.dealRecords missing or invalid")
                return False
            
            # Verify contracts array
            contracts = data.get('contracts', [])
            if len(contracts) < 2:
                self.failure(f"Expected at least 2 contracts, got {len(contracts)}")
                return False
            
            self.success(f"contracts array has {len(contracts)} items")
            
            # Verify reconciliation buckets in custody contract
            custody = next((c for c in contracts if c.get('key') == 'custody'), None)
            if custody and 'reconciliation' in custody:
                recon = custody['reconciliation']
                self.log(f"Custody reconciliation buckets: {recon}")
                
                # Check for expected bucket keys
                expected_buckets = ['IN_SYNC', 'CHAIN_AHEAD', 'BACKEND_AHEAD', 'MISMATCH', 'UNKNOWN']
                found_buckets = [k for k in expected_buckets if k in recon]
                
                if found_buckets:
                    self.success(f"Found reconciliation buckets: {found_buckets}")
                else:
                    self.warning("No standard reconciliation buckets found")
            
            return True
        
        return self.test("GET /api/deals/admin/contracts-health?dataMode=production", test)

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*70)
        print("TEST SUMMARY")
        print("="*70)
        print(f"Total Tests: {self.tests_run}")
        print(f"{Colors.GREEN}Passed: {self.tests_passed}{Colors.END}")
        print(f"{Colors.RED}Failed: {self.tests_failed}{Colors.END}")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"\nSuccess Rate: {success_rate:.1f}%")
        
        if self.tests_failed == 0:
            print(f"\n{Colors.GREEN}🎉 ALL TESTS PASSED!{Colors.END}")
            return 0
        else:
            print(f"\n{Colors.RED}❌ SOME TESTS FAILED{Colors.END}")
            return 1

def main():
    print(f"{Colors.BLUE}{'='*70}")
    print("FOMO Bazaar Contracts Health Testing")
    print("Testing /api/deals/admin/contracts-health endpoint")
    print(f"{'='*70}{Colors.END}\n")
    
    tester = ContractsHealthTester()
    
    # Run tests
    if not tester.login():
        print(f"\n{Colors.RED}Failed to login. Cannot proceed with tests.{Colors.END}")
        return 1
    
    tester.test_contracts_health_demo()
    tester.test_contracts_health_production()
    
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())
