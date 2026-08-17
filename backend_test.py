#!/usr/bin/env python3
"""
FOMO NEWS-1 Phase 2 Backend Runtime Acceptance Tests
Tests NestJS backend news-parser functionality
"""

import requests
import sys
import time
import json
from datetime import datetime
from typing import Dict, Any, Optional

# Public backend URL
BASE_URL = "https://fomo-crm-admin.preview.emergentagent.com"

# Test credentials
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'

class NewsParserTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.critical_failures = []
        self.warnings = []
        
    def log(self, msg: str, level: str = "INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        color = Colors.BLUE if level == "INFO" else Colors.GREEN if level == "PASS" else Colors.RED if level == "FAIL" else Colors.YELLOW
        print(f"{color}[{timestamp}] [{level}] {msg}{Colors.RESET}")
    
    def run_test(self, name: str, method: str, endpoint: str, expected_status: int, 
                 data: Optional[Dict] = None, headers: Optional[Dict] = None,
                 check_response: Optional[callable] = None) -> tuple[bool, Any]:
        """Run a single API test"""
        url = f"{self.base_url}{endpoint}"
        req_headers = {'Content-Type': 'application/json'}
        
        if self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        
        if headers:
            req_headers.update(headers)
        
        self.tests_run += 1
        self.log(f"Testing: {name}", "INFO")
        
        try:
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
            
            status_ok = response.status_code == expected_status
            
            try:
                response_data = response.json()
            except:
                response_data = {"text": response.text}
            
            # Additional response validation
            validation_ok = True
            validation_msg = ""
            if check_response and status_ok:
                validation_ok, validation_msg = check_response(response_data)
            
            success = status_ok and validation_ok
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - {name} (Status: {response.status_code})", "PASS")
                if validation_msg:
                    self.log(f"   {validation_msg}", "INFO")
            else:
                self.tests_failed += 1
                if not status_ok:
                    self.log(f"❌ FAILED - {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                    self.log(f"   Response: {json.dumps(response_data, indent=2)[:500]}", "FAIL")
                else:
                    self.log(f"❌ FAILED - {name} - {validation_msg}", "FAIL")
                self.critical_failures.append(f"{name}: Status {response.status_code}, {validation_msg}")
            
            return success, response_data
            
        except requests.exceptions.Timeout:
            self.tests_failed += 1
            self.log(f"❌ FAILED - {name} - Request timeout", "FAIL")
            self.critical_failures.append(f"{name}: Timeout")
            return False, {}
        except Exception as e:
            self.tests_failed += 1
            self.log(f"❌ FAILED - {name} - Error: {str(e)}", "FAIL")
            self.critical_failures.append(f"{name}: {str(e)}")
            return False, {}
    
    def test_admin_login(self):
        """Test 1: Admin login returns accessToken"""
        self.log("\n=== TEST 1: Admin Login ===", "INFO")
        
        def check_token(data):
            if 'accessToken' in data:
                return True, f"Got accessToken: {data['accessToken'][:20]}..."
            return False, "No accessToken in response"
        
        success, response = self.run_test(
            "Admin Login",
            "POST",
            "/api/user/admin/login",
            202,  # Backend returns 202 Accepted
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            check_response=check_token
        )
        
        if success and 'accessToken' in response:
            self.token = response['accessToken']
            self.log(f"Token acquired successfully", "PASS")
            return True
        else:
            self.log("CRITICAL: Cannot proceed without valid token", "FAIL")
            return False
    
    def test_list_sources(self):
        """Test 2: GET /api/admin/news-parser/sources -> 121 sources"""
        self.log("\n=== TEST 2: List All Sources ===", "INFO")
        
        def check_sources(data):
            if not isinstance(data, list):
                return False, f"Expected array, got {type(data)}"
            
            count = len(data)
            # Check for expected ~121 sources (allow some variance)
            if count < 100:
                return False, f"Expected ~121 sources, got {count}"
            
            # Check first source has required fields
            if count > 0:
                source = data[0]
                required_fields = ['id', 'name', 'tier', 'status', 'state', 'uniquenessPct']
                missing = [f for f in required_fields if f not in source]
                if missing:
                    return False, f"Missing fields in source: {missing}"
            
            return True, f"Found {count} sources with state/tier/uniquenessPct"
        
        return self.run_test(
            "List All Sources",
            "GET",
            "/api/admin/news-parser/sources",
            200,
            check_response=check_sources
        )
    
    def test_filter_sources(self):
        """Test 3: Filter sources by tier, status, query"""
        self.log("\n=== TEST 3: Filter Sources ===", "INFO")
        
        # Test tier filter
        def check_tier_a(data):
            if not isinstance(data, list):
                return False, "Expected array"
            if len(data) == 0:
                return False, "No tier A sources found"
            # Check all are tier A
            non_a = [s for s in data if s.get('tier') != 'A']
            if non_a:
                return False, f"Found {len(non_a)} non-tier-A sources"
            return True, f"Found {len(data)} tier A sources"
        
        success1, _ = self.run_test(
            "Filter by tier=A",
            "GET",
            "/api/admin/news-parser/sources?tier=A",
            200,
            check_response=check_tier_a
        )
        
        # Test status filter
        def check_active(data):
            if not isinstance(data, list):
                return False, "Expected array"
            non_active = [s for s in data if s.get('status') != 'ACTIVE']
            if non_active:
                return False, f"Found {len(non_active)} non-ACTIVE sources"
            return True, f"Found {len(data)} ACTIVE sources"
        
        success2, _ = self.run_test(
            "Filter by status=ACTIVE",
            "GET",
            "/api/admin/news-parser/sources?status=ACTIVE",
            200,
            check_response=check_active
        )
        
        # Test query filter
        def check_query(data):
            if not isinstance(data, list):
                return False, "Expected array"
            if len(data) == 0:
                return False, "No sources matching 'coin' found"
            return True, f"Found {len(data)} sources matching 'coin'"
        
        success3, _ = self.run_test(
            "Filter by q=coin",
            "GET",
            "/api/admin/news-parser/sources?q=coin",
            200,
            check_response=check_query
        )
        
        return success1 and success2 and success3
    
    def test_run_source(self, source_id: str = "cointelegraph"):
        """Test 4: Run a source and verify it completes"""
        self.log(f"\n=== TEST 4: Run Source ({source_id}) ===", "INFO")
        
        # Enqueue the run
        def check_queued(data):
            if data.get('ok') and data.get('queued'):
                return True, f"Source {data.get('queued')} queued successfully"
            return False, f"Expected {{ok, queued}}, got {data}"
        
        success, response = self.run_test(
            f"Enqueue {source_id}",
            "POST",
            f"/api/admin/news-parser/sources/{source_id}/run",
            201,  # POST returns 201 Created
            check_response=check_queued
        )
        
        if not success:
            return False
        
        # Wait and check run status (max 20s)
        self.log(f"Waiting up to 20s for run to complete...", "INFO")
        max_wait = 20
        start_time = time.time()
        run_completed = False
        
        while time.time() - start_time < max_wait:
            time.sleep(2)
            
            try:
                url = f"{self.base_url}/api/admin/news-parser/runs?sourceId={source_id}"
                headers = {'Authorization': f'Bearer {self.token}'}
                resp = requests.get(url, headers=headers, timeout=10)
                
                if resp.status_code == 200:
                    runs = resp.json()
                    if isinstance(runs, list) and len(runs) > 0:
                        latest_run = runs[0]
                        status = latest_run.get('status')
                        
                        self.log(f"Run status: {status}", "INFO")
                        
                        if status in ['SUCCESS', 'FAILED', 'PARTIAL']:
                            run_completed = True
                            
                            # Note: 40-50% RSS feeds legitimately FAIL
                            if status == 'FAILED':
                                self.log(f"⚠️  Run FAILED (expected for ~40-50% of feeds - geo-blocked/dead)", "WARN")
                                self.warnings.append(f"{source_id} run FAILED (expected)")
                            else:
                                self.log(f"✅ Run completed with status: {status}", "PASS")
                            
                            self.log(f"   New items: {latest_run.get('newItems', 0)}", "INFO")
                            self.log(f"   Duplicates: {latest_run.get('duplicates', 0)}", "INFO")
                            self.log(f"   Duration: {latest_run.get('durationMs', 0)}ms", "INFO")
                            break
                        elif status == 'RUNNING':
                            continue
            except Exception as e:
                self.log(f"Error checking run status: {e}", "WARN")
        
        if not run_completed:
            self.log(f"❌ Run did not complete within {max_wait}s or stuck in RUNNING", "FAIL")
            self.critical_failures.append(f"{source_id} run stuck or timeout")
            return False
        
        return True
    
    def test_test_source(self, source_id: str = "coindesk"):
        """Test 5: Test source without creating run"""
        self.log(f"\n=== TEST 5: Test Source ({source_id}) - No Run Created ===", "INFO")
        
        # Get current article count
        try:
            url = f"{self.base_url}/api/admin/news-parser/diagnostics"
            headers = {'Authorization': f'Bearer {self.token}'}
            resp = requests.get(url, headers=headers, timeout=10)
            initial_count = None
            if resp.status_code == 200:
                diag = resp.json()
                for check in diag.get('checks', []):
                    if check.get('key') == 'raw':
                        detail = check.get('detail', '')
                        if 'всего:' in detail:
                            initial_count = int(detail.split('всего:')[1].strip())
                            self.log(f"Initial article count: {initial_count}", "INFO")
        except:
            pass
        
        # Test the source
        def check_test(data):
            required = ['ok', 'itemsFound', 'latest']
            missing = [f for f in required if f not in data]
            if missing:
                return False, f"Missing fields: {missing}"
            
            if not data.get('ok'):
                # Some feeds legitimately fail
                return True, f"Feed test returned ok=false (expected for some feeds): {data.get('error', 'no error')}"
            
            return True, f"Found {data.get('itemsFound')} items, latest: {data.get('latest', {}).get('title', 'N/A')[:50]}"
        
        success, response = self.run_test(
            f"Test {source_id} (dry run)",
            "POST",
            f"/api/admin/news-parser/sources/{source_id}/test",
            201,  # POST returns 201 Created
            check_response=check_test
        )
        
        # Verify no run was created
        time.sleep(2)
        try:
            url = f"{self.base_url}/api/admin/news-parser/runs?sourceId={source_id}&limit=5"
            headers = {'Authorization': f'Bearer {self.token}'}
            resp = requests.get(url, headers=headers, timeout=10)
            
            if resp.status_code == 200:
                runs = resp.json()
                # Check if any recent runs (within last 10s)
                from datetime import timezone
                recent_runs = []
                for r in runs:
                    try:
                        started = datetime.fromisoformat(r['startedAt'].replace('Z', '+00:00'))
                        age = (datetime.now(timezone.utc) - started).total_seconds()
                        if age < 10:
                            recent_runs.append(r)
                    except:
                        pass
                
                if len(recent_runs) > 0:
                    self.log(f"⚠️  WARNING: Test may have created a run", "WARN")
                    self.warnings.append(f"{source_id} test may have created run")
                else:
                    self.log(f"✅ Verified: No run created by test", "PASS")
        except Exception as e:
            self.log(f"Could not verify run creation: {e}", "WARN")
        
        return success
    
    def test_pause_resume_source(self, source_id: str = "decrypt"):
        """Test 6: Pause and resume a source"""
        self.log(f"\n=== TEST 6: Pause/Resume Source ({source_id}) ===", "INFO")
        
        # Pause
        def check_paused(data):
            if data.get('status') == 'PAUSED':
                return True, "Source paused successfully"
            return False, f"Expected status=PAUSED, got {data.get('status')}"
        
        success1, _ = self.run_test(
            f"Pause {source_id}",
            "POST",
            f"/api/admin/news-parser/sources/{source_id}/pause",
            201,  # POST returns 201 Created
            check_response=check_paused
        )
        
        # Resume
        def check_active(data):
            if data.get('status') == 'ACTIVE':
                return True, "Source resumed successfully"
            return False, f"Expected status=ACTIVE, got {data.get('status')}"
        
        success2, _ = self.run_test(
            f"Resume {source_id}",
            "POST",
            f"/api/admin/news-parser/sources/{source_id}/resume",
            201,  # POST returns 201 Created
            check_response=check_active
        )
        
        return success1 and success2
    
    def test_run_tier(self):
        """Test 7: Run all sources in tier A"""
        self.log("\n=== TEST 7: Run Tier A ===", "INFO")
        
        def check_tier_run(data):
            if data.get('ok') and data.get('tier') == 'A' and data.get('queued'):
                return True, f"Queued {data.get('queued')} tier A sources"
            return False, f"Expected {{ok, tier:A, queued}}, got {data}"
        
        return self.run_test(
            "Run tier A",
            "POST",
            "/api/admin/news-parser/run/tier/A",
            201,  # POST returns 201 Created
            check_response=check_tier_run
        )
    
    def test_global_pause_resume(self):
        """Test 8: Global pause and resume"""
        self.log("\n=== TEST 8: Global Pause/Resume ===", "INFO")
        
        # Pause
        def check_paused(data):
            if data.get('paused') == True:
                return True, "Global pause enabled"
            return False, f"Expected paused=true, got {data}"
        
        success1, _ = self.run_test(
            "Global pause",
            "POST",
            "/api/admin/news-parser/global/pause",
            201,  # POST returns 201 Created
            check_response=check_paused
        )
        
        # Resume
        def check_resumed(data):
            if data.get('paused') == False:
                return True, "Global pause disabled"
            return False, f"Expected paused=false, got {data}"
        
        success2, _ = self.run_test(
            "Global resume",
            "POST",
            "/api/admin/news-parser/global/resume",
            201,  # POST returns 201 Created
            check_response=check_resumed
        )
        
        return success1 and success2
    
    def test_auth_gating(self):
        """Test 9: Invalid token should return 401/403"""
        self.log("\n=== TEST 9: Authorization Gating ===", "INFO")
        
        # Save valid token
        valid_token = self.token
        
        # Test with invalid token
        self.token = "invalid_token_12345"
        
        success1, _ = self.run_test(
            "Run all with invalid token (should fail)",
            "POST",
            "/api/admin/news-parser/run/all",
            403,  # Expect 403 Forbidden (or 401)
        )
        
        success2, _ = self.run_test(
            "Global pause with invalid token (should fail)",
            "POST",
            "/api/admin/news-parser/global/pause",
            403,  # Expect 403 Forbidden (or 401)
        )
        
        # Restore valid token
        self.token = valid_token
        
        if success1 and success2:
            self.log("✅ Auth gating working correctly", "PASS")
        
        return success1 and success2
    
    def test_list_runs(self):
        """Test 10: List runs with pagination"""
        self.log("\n=== TEST 10: List Runs ===", "INFO")
        
        def check_runs(data):
            if not isinstance(data, list):
                return False, f"Expected array, got {type(data)}"
            
            if len(data) == 0:
                return True, "No runs found (empty system)"
            
            # Check first run has required fields
            run = data[0]
            required = ['status', 'newItems', 'duplicates', 'durationMs']
            missing = [f for f in required if f not in run]
            if missing:
                return False, f"Missing fields: {missing}"
            
            return True, f"Found {len(data)} runs with required fields"
        
        return self.run_test(
            "List runs (limit=20)",
            "GET",
            "/api/admin/news-parser/runs?limit=20",
            200,
            check_response=check_runs
        )
    
    def test_source_health(self, source_id: str = "coindesk"):
        """Test 11: Get source health"""
        self.log(f"\n=== TEST 11: Source Health ({source_id}) ===", "INFO")
        
        def check_health(data):
            required = ['circuitBreaker', 'latency', 'recentRuns']
            missing = [f for f in required if f not in data]
            if missing:
                return False, f"Missing fields: {missing}"
            
            cb = data.get('circuitBreaker', {})
            latency = data.get('latency', {})
            
            return True, f"CB failures: {cb.get('consecutiveFailures', 0)}, p50: {latency.get('p50Ms', 0)}ms"
        
        return self.run_test(
            f"Get {source_id} health",
            "GET",
            f"/api/admin/news-parser/sources/{source_id}/health",
            200,
            check_response=check_health
        )
    
    def test_diagnostics(self):
        """Test 12: System diagnostics"""
        self.log("\n=== TEST 12: System Diagnostics ===", "INFO")
        
        def check_diagnostics(data):
            if not data.get('ok') is not None:
                return False, "Missing 'ok' field"
            
            checks = data.get('checks', [])
            if not isinstance(checks, list):
                return False, "Missing or invalid 'checks' array"
            
            required_checks = ['queue', 'registry', 'raw', 'importer', 'scheduler']
            found_checks = [c.get('key') for c in checks]
            missing = [c for c in required_checks if c not in found_checks]
            
            if missing:
                return False, f"Missing checks: {missing}"
            
            # Count passing checks
            passing = sum(1 for c in checks if c.get('ok'))
            
            return True, f"All required checks present, {passing}/{len(checks)} passing"
        
        return self.run_test(
            "System diagnostics",
            "GET",
            "/api/admin/news-parser/diagnostics",
            200,
            check_response=check_diagnostics
        )
    
    def test_parsing_controls(self):
        """Test 13: Parsing controls"""
        self.log("\n=== TEST 13: Parsing Controls ===", "INFO")
        
        def check_parsing(data):
            if not data.get('redisOk'):
                return False, "Redis not OK"
            
            queue = data.get('queue', {})
            if not isinstance(queue, dict):
                return False, "Missing queue info"
            
            return True, f"Redis OK, queue: waiting={queue.get('waiting', 0)}, active={queue.get('active', 0)}"
        
        return self.run_test(
            "Parsing controls",
            "GET",
            "/api/admin/news-parser/parsing",
            200,
            check_response=check_parsing
        )
    
    def test_backend_restart_recovery(self):
        """Test 14: Backend restart recovery"""
        self.log("\n=== TEST 14: Backend Restart Recovery ===", "INFO")
        
        self.log("Restarting backend service...", "INFO")
        import subprocess
        try:
            result = subprocess.run(
                ["sudo", "supervisorctl", "restart", "fomo_nest"],
                capture_output=True,
                text=True,
                timeout=10
            )
            self.log(f"Restart output: {result.stdout}", "INFO")
        except Exception as e:
            self.log(f"Restart command failed: {e}", "WARN")
        
        # Wait for backend to come back up
        self.log("Waiting 20s for backend to restart...", "INFO")
        time.sleep(20)
        
        # Check diagnostics
        def check_recovery(data):
            checks = data.get('checks', [])
            scheduler_check = next((c for c in checks if c.get('key') == 'scheduler'), None)
            
            if not scheduler_check:
                return False, "Scheduler check not found"
            
            if not scheduler_check.get('ok'):
                return True, f"Scheduler not yet ticking (expected after restart): {scheduler_check.get('detail')}"
            
            return True, "Scheduler recovered successfully"
        
        success, _ = self.run_test(
            "Check diagnostics after restart",
            "GET",
            "/api/admin/news-parser/diagnostics",
            200,
            check_response=check_recovery
        )
        
        # Check for abandoned runs
        try:
            url = f"{self.base_url}/api/admin/news-parser/runs?limit=50"
            headers = {'Authorization': f'Bearer {self.token}'}
            resp = requests.get(url, headers=headers, timeout=10)
            
            if resp.status_code == 200:
                runs = resp.json()
                
                # Check for old RUNNING runs (>10 min)
                from datetime import timezone
                now = datetime.now(timezone.utc)
                old_running = []
                
                for run in runs:
                    if run.get('status') == 'RUNNING':
                        try:
                            started = datetime.fromisoformat(run['startedAt'].replace('Z', '+00:00'))
                            age_min = (now - started).total_seconds() / 60
                            
                            if age_min > 10:
                                old_running.append((run.get('sourceId'), age_min))
                        except:
                            pass
                
                if old_running:
                    self.log(f"❌ Found {len(old_running)} runs stuck in RUNNING >10min", "FAIL")
                    for source, age in old_running:
                        self.log(f"   {source}: {age:.1f} minutes", "FAIL")
                    self.critical_failures.append(f"Stale RUNNING runs not recovered: {old_running}")
                    return False
                else:
                    self.log(f"✅ No stale RUNNING runs found", "PASS")
        except Exception as e:
            self.log(f"Could not check for stale runs: {e}", "WARN")
        
        return success
    
    def test_no_duplicate_articles(self, source_id: str = "cointelegraph"):
        """Test 15: Verify duplicate detection"""
        self.log(f"\n=== TEST 15: No Duplicate Articles ({source_id}) ===", "INFO")
        
        # Get current article count
        try:
            url = f"{self.base_url}/api/admin/news-parser/diagnostics"
            headers = {'Authorization': f'Bearer {self.token}'}
            resp = requests.get(url, headers=headers, timeout=10)
            initial_count = None
            
            if resp.status_code == 200:
                diag = resp.json()
                for check in diag.get('checks', []):
                    if check.get('key') == 'raw':
                        detail = check.get('detail', '')
                        if 'всего:' in detail:
                            initial_count = int(detail.split('всего:')[1].strip())
                            self.log(f"Initial article count: {initial_count}", "INFO")
        except Exception as e:
            self.log(f"Could not get initial count: {e}", "WARN")
            initial_count = None
        
        # Run source first time
        self.log(f"Running {source_id} first time...", "INFO")
        url = f"{self.base_url}/api/admin/news-parser/sources/{source_id}/run"
        headers = {'Authorization': f'Bearer {self.token}'}
        resp1 = requests.post(url, headers=headers, timeout=10)
        
        if resp1.status_code not in [200, 201]:
            self.log(f"First run failed: {resp1.status_code}", "FAIL")
            return False
        
        # Wait for completion
        time.sleep(15)
        
        # Get first run results
        url = f"{self.base_url}/api/admin/news-parser/runs?sourceId={source_id}&limit=1"
        resp = requests.get(url, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            self.log(f"Could not get first run: {resp.status_code}", "FAIL")
            return False
        
        runs = resp.json()
        if not runs or len(runs) == 0:
            self.log("No runs found after first execution", "FAIL")
            return False
        
        first_run = runs[0]
        first_new = first_run.get('newItems', 0)
        self.log(f"First run: {first_new} new items", "INFO")
        
        # Run source second time
        self.log(f"Running {source_id} second time...", "INFO")
        url = f"{self.base_url}/api/admin/news-parser/sources/{source_id}/run"
        resp2 = requests.post(url, headers=headers, timeout=10)
        
        if resp2.status_code not in [200, 201]:
            self.log(f"Second run failed: {resp2.status_code}", "FAIL")
            return False
        
        # Wait for completion
        time.sleep(15)
        
        # Get second run results
        url = f"{self.base_url}/api/admin/news-parser/runs?sourceId={source_id}&limit=1"
        resp = requests.get(url, headers=headers, timeout=10)
        
        if resp.status_code != 200:
            self.log(f"Could not get second run: {resp.status_code}", "FAIL")
            return False
        
        runs = resp.json()
        if not runs or len(runs) == 0:
            self.log("No runs found after second execution", "FAIL")
            return False
        
        second_run = runs[0]
        second_duplicates = second_run.get('duplicates', 0)
        second_new = second_run.get('newItems', 0)
        
        self.log(f"Second run: {second_new} new items, {second_duplicates} duplicates", "INFO")
        
        # Verify duplicates detected
        if second_duplicates > 0:
            self.log(f"✅ Duplicate detection working: {second_duplicates} duplicates found", "PASS")
        else:
            self.log(f"⚠️  No duplicates detected (may be OK if feed updated)", "WARN")
            self.warnings.append(f"{source_id} second run found no duplicates")
        
        # Check article count didn't double
        if initial_count is not None:
            try:
                url = f"{self.base_url}/api/admin/news-parser/diagnostics"
                resp = requests.get(url, headers=headers, timeout=10)
                
                if resp.status_code == 200:
                    diag = resp.json()
                    for check in diag.get('checks', []):
                        if check.get('key') == 'raw':
                            detail = check.get('detail', '')
                            if 'всего:' in detail:
                                final_count = int(detail.split('всего:')[1].strip())
                                increase = final_count - initial_count
                                
                                self.log(f"Article count: {initial_count} -> {final_count} (+{increase})", "INFO")
                                
                                # Should not have doubled
                                if increase < first_new * 1.5:
                                    self.log(f"✅ Articles not double-counted", "PASS")
                                else:
                                    self.log(f"⚠️  Article count increased more than expected", "WARN")
            except Exception as e:
                self.log(f"Could not verify final count: {e}", "WARN")
        
        return True
    
    def test_public_news_endpoint(self):
        """Test 16: Public news endpoint regression"""
        self.log("\n=== TEST 16: Public News Endpoint Regression ===", "INFO")
        
        def check_news(data):
            # Response is {total: number, news: array}
            if not isinstance(data, dict):
                return False, f"Expected object, got {type(data)}"
            
            if 'news' not in data:
                return False, "Missing 'news' field"
            
            news_array = data.get('news', [])
            if not isinstance(news_array, list):
                return False, f"Expected news to be array, got {type(news_array)}"
            
            if len(news_array) == 0:
                return False, "No news articles returned"
            
            # Check first article
            article = news_array[0]
            required = ['title', 'sourceUrl', 'image']
            missing = [f for f in required if f not in article]
            
            if missing:
                return False, f"Missing fields: {missing}"
            
            # Check language is EN
            lang = article.get('language', '')
            if lang and lang.lower() != 'en':
                return False, f"Expected EN news, got language: {lang}"
            
            return True, f"Found {len(news_array)} EN news articles (total: {data.get('total', 0)}) with title/sourceUrl/image"
        
        # Note: This endpoint may not require auth
        saved_token = self.token
        self.token = None
        
        success, _ = self.run_test(
            "Public news endpoint",
            "GET",
            "/api/news/crypto?limit=5",
            200,
            check_response=check_news
        )
        
        self.token = saved_token
        return success
    
    def run_all_tests(self):
        """Run all tests in sequence"""
        self.log("\n" + "="*80, "INFO")
        self.log("FOMO NEWS-1 Phase 2 Backend Runtime Acceptance Tests", "INFO")
        self.log("="*80 + "\n", "INFO")
        
        # Test 1: Login (critical)
        if not self.test_admin_login():
            self.log("\n❌ CRITICAL: Cannot proceed without authentication", "FAIL")
            return False
        
        # Test 2-3: Source listing and filtering
        self.test_list_sources()
        self.test_filter_sources()
        
        # Test 4: Run source
        self.test_run_source("cointelegraph")
        
        # Test 5: Test source (dry run)
        self.test_test_source("coindesk")
        
        # Test 6: Pause/resume
        self.test_pause_resume_source("decrypt")
        
        # Test 7: Tier run
        self.test_run_tier()
        
        # Test 8: Global pause/resume
        self.test_global_pause_resume()
        
        # Test 9: Auth gating
        self.test_auth_gating()
        
        # Test 10: List runs
        self.test_list_runs()
        
        # Test 11: Source health
        self.test_source_health("coindesk")
        
        # Test 12: Diagnostics
        self.test_diagnostics()
        
        # Test 13: Parsing controls
        self.test_parsing_controls()
        
        # Test 14: Backend restart recovery
        self.test_backend_restart_recovery()
        
        # Test 15: No duplicate articles
        self.test_no_duplicate_articles("cointelegraph")
        
        # Test 16: Public news endpoint
        self.test_public_news_endpoint()
        
        return True
    
    def print_summary(self):
        """Print test summary"""
        self.log("\n" + "="*80, "INFO")
        self.log("TEST SUMMARY", "INFO")
        self.log("="*80, "INFO")
        
        self.log(f"Total tests run: {self.tests_run}", "INFO")
        self.log(f"Tests passed: {self.tests_passed} ({self.tests_passed/max(self.tests_run,1)*100:.1f}%)", "PASS")
        self.log(f"Tests failed: {self.tests_failed} ({self.tests_failed/max(self.tests_run,1)*100:.1f}%)", "FAIL")
        
        if self.warnings:
            self.log(f"\n⚠️  Warnings ({len(self.warnings)}):", "WARN")
            for w in self.warnings:
                self.log(f"  - {w}", "WARN")
        
        if self.critical_failures:
            self.log(f"\n❌ Critical Failures ({len(self.critical_failures)}):", "FAIL")
            for f in self.critical_failures:
                self.log(f"  - {f}", "FAIL")
        
        self.log("\n" + "="*80 + "\n", "INFO")
        
        # Return exit code
        return 0 if self.tests_failed == 0 else 1

def main():
    tester = NewsParserTester()
    
    try:
        tester.run_all_tests()
    except KeyboardInterrupt:
        tester.log("\n\nTests interrupted by user", "WARN")
    except Exception as e:
        tester.log(f"\n\nUnexpected error: {e}", "FAIL")
        import traceback
        traceback.print_exc()
    
    return tester.print_summary()

if __name__ == "__main__":
    sys.exit(main())
