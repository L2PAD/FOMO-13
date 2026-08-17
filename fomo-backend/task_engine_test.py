#!/usr/bin/env python3
"""
Task Engine Backend Test Suite — Iteration 15
Tests: EarlyLand Funnel, Task Lifecycle, Archive, Hard-delete Guards, Review Queue, Route Regression
"""
import requests
import sys
import json
import io
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

class TaskEngineTester:
    def __init__(self):
        self.token: Optional[str] = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.results = []
        self.created_task_ids = []  # Track created tasks for cleanup
        
    def log(self, message: str, level: str = "info"):
        """Log with color"""
        colors = {"info": Colors.BLUE, "success": Colors.GREEN, "error": Colors.RED, "warning": Colors.YELLOW}
        color = colors.get(level, Colors.RESET)
        print(f"{color}{message}{Colors.RESET}")
    
    def test(self, name: str, method: str, endpoint: str, expected_status: int, 
             data: Optional[Dict] = None, headers: Optional[Dict] = None,
             validate_fn: Optional[callable] = None, accept_statuses: Optional[list] = None,
             files: Optional[Dict] = None) -> Dict[str, Any]:
        """Run a single test"""
        self.tests_run += 1
        url = f"{BASE_URL}/{endpoint}"
        
        # Prepare headers
        req_headers = {}
        if self.token:
            req_headers['Authorization'] = f'Bearer {self.token}'
        
        # Don't set Content-Type for multipart/form-data (requests will set it with boundary)
        if not files:
            req_headers['Content-Type'] = 'application/json'
        
        if headers:
            req_headers.update(headers)
        
        self.log(f"\n[{self.tests_run}] Testing: {name}", "info")
        self.log(f"    {method} {endpoint}", "info")
        
        try:
            # Make request
            if method == 'GET':
                response = requests.get(url, headers=req_headers, timeout=30)
            elif method == 'POST':
                if files:
                    response = requests.post(url, data=data, files=files, headers=req_headers, timeout=30)
                else:
                    response = requests.post(url, json=data, headers=req_headers, timeout=30)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=req_headers, timeout=30)
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
        self.log("TASK ENGINE BACKEND TEST SUITE - ITERATION 15", "info")
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
            )
        )
        
        if auth_result["success"] and "accessToken" in auth_result["data"]:
            self.token = auth_result["data"]["accessToken"]
            self.log(f"    Token acquired: {self.token[:20]}...", "success")
        else:
            self.log("    ⚠️  Cannot proceed without token. Stopping tests.", "error")
            return self.print_summary()
        
        # 2. EARLYLAND FUNNEL ANALYTICS
        self.log("\n### 2. EARLYLAND FUNNEL ANALYTICS ###", "warning")
        
        funnel_result = self.test(
            "GET /api/tasks/admin/earlyland-funnel?days=30",
            "GET",
            "tasks/admin/earlyland-funnel?days=30",
            200,
            validate_fn=lambda r: self.validate_earlyland_funnel(r)
        )
        
        # Test without auth (should be 403)
        saved_token = self.token
        self.token = None
        self.test(
            "EarlyLand Funnel without auth (should fail)",
            "GET",
            "tasks/admin/earlyland-funnel?days=30",
            403,
            accept_statuses=[401, 403]
        )
        self.token = saved_token
        
        # 3. TASK LIFECYCLE (special/global task)
        self.log("\n### 3. TASK LIFECYCLE (special/global task) ###", "warning")
        
        # 3a. Create a special task via multipart/form-data
        self.log("    Creating a special task (type=special, completionMode=MODERATOR_REVIEW)...", "info")
        
        # Prepare multipart form data
        task_data = {
            'name': f'Test Special Task {datetime.now().strftime("%Y%m%d%H%M%S")}',
            'type': 'special',
            'points': '50',
            'completionMode': 'MODERATOR_REVIEW',
            'taskStatus': 'draft',
            'description': 'Test task for lifecycle testing',
            'goal': '1',
            'accessTier': 'public'
        }
        
        create_result = self.test(
            "Create special task (POST /api/tasks multipart/form-data)",
            "POST",
            "tasks",
            201,
            data=task_data,
            files={'dummy': ('', '')},  # Empty file to trigger multipart
            accept_statuses=[200, 201],
            validate_fn=lambda r: (
                "_id" in r or "id" in r,
                f"✓ Task created with ID: {r.get('_id') or r.get('id')}"
            )
        )
        
        if not create_result["success"]:
            self.log("    ⚠️  Task creation failed. Skipping lifecycle tests.", "error")
            return self.print_summary()
        
        task_id = create_result["data"].get("_id") or create_result["data"].get("id")
        self.created_task_ids.append(task_id)
        self.log(f"    Created task ID: {task_id}", "success")
        
        # 3b. GET /api/tasks/detail/:taskId (canonical presentation)
        detail_result = self.test(
            "GET task detail (canonical presentation)",
            "GET",
            f"tasks/detail/{task_id}",
            200,
            validate_fn=lambda r: self.validate_task_detail(r)
        )
        
        # Verify actions include 'add' for fresh task
        if detail_result["success"]:
            actions = detail_result["data"].get("actions", [])
            if "add" in actions:
                self.log(f"    ✓ Actions include 'add' for fresh task: {actions}", "success")
            else:
                self.log(f"    ⚠️  Expected 'add' in actions, got: {actions}", "warning")
        
        # 3c. POST /api/tasks/my/add/:taskId
        add_result = self.test(
            "Add task to my tasker",
            "POST",
            f"tasks/my/add/{task_id}",
            200,
            accept_statuses=[200, 201],
            validate_fn=lambda r: (
                r.get("ok") == True or r.get("addedToTasker") == True,
                f"✓ Task added to tasker: {r}"
            )
        )
        
        # 3d. GET detail again - verify addedToTasker=true, actions include 'start' and 'remove'
        detail_after_add = self.test(
            "GET task detail after add (verify addedToTasker)",
            "GET",
            f"tasks/detail/{task_id}",
            200,
            validate_fn=lambda r: (
                r.get("addedToTasker") == True and "start" in r.get("actions", []) and "remove" in r.get("actions", []),
                f"✓ addedToTasker={r.get('addedToTasker')}, actions={r.get('actions', [])}"
            )
        )
        
        # 3e. POST /api/tasks/my/start/:taskId
        start_result = self.test(
            "Start task",
            "POST",
            f"tasks/my/start/{task_id}",
            200,
            accept_statuses=[200, 201],
            validate_fn=lambda r: (
                r.get("ok") == True or r.get("state") == "in_progress",
                f"✓ Task started: state={r.get('state')}"
            )
        )
        
        # 3f. GET detail again - verify status=in_progress, actions include 'submit'
        detail_after_start = self.test(
            "GET task detail after start (verify in_progress)",
            "GET",
            f"tasks/detail/{task_id}",
            200,
            validate_fn=lambda r: (
                r.get("status") == "in_progress" and "submit" in r.get("actions", []),
                f"✓ status={r.get('status')}, actions={r.get('actions', [])}"
            )
        )
        
        # 4. ARCHIVE ENDPOINTS
        self.log("\n### 4. ARCHIVE ENDPOINTS ###", "warning")
        
        # 4a. Archive task
        archive_result = self.test(
            "Archive task (PUT /api/tasks/:id/archive)",
            "PUT",
            f"tasks/{task_id}/archive",
            200,
            validate_fn=lambda r: (
                r.get("ok") == True and r.get("taskStatus") == "archived",
                f"✓ Task archived: {r}"
            )
        )
        
        # 4b. Unarchive task
        unarchive_result = self.test(
            "Unarchive task (PUT /api/tasks/:id/unarchive)",
            "PUT",
            f"tasks/{task_id}/unarchive",
            200,
            validate_fn=lambda r: (
                r.get("ok") == True and r.get("taskStatus") == "active",
                f"✓ Task unarchived: taskStatus={r.get('taskStatus')}"
            )
        )
        
        # 5. HARD-DELETE GUARD
        self.log("\n### 5. HARD-DELETE GUARD ###", "warning")
        
        # 5a. Try to delete task with progress (should FAIL with 400)
        self.log("    Attempting to delete task with progress (should fail)...", "info")
        delete_with_progress = self.test(
            "Delete task with progress (should fail)",
            "DELETE",
            f"tasks/{task_id}",
            400,
            validate_fn=lambda r: (
                "история" in str(r).lower() or "history" in str(r).lower() or "архив" in str(r).lower(),
                f"✓ Correctly rejected deletion with Russian message: {r}"
            )
        )
        
        # 5b. Create a DRAFT task WITHOUT progress and delete it (should succeed)
        self.log("    Creating a DRAFT task without progress for deletion test...", "info")
        draft_task_data = {
            'name': f'Draft Task for Deletion {datetime.now().strftime("%Y%m%d%H%M%S")}',
            'type': 'special',
            'points': '10',
            'completionMode': 'MODERATOR_REVIEW',
            'taskStatus': 'draft',
            'description': 'Draft task for deletion test',
            'goal': '1',
            'accessTier': 'public'
        }
        
        draft_create = self.test(
            "Create DRAFT task for deletion",
            "POST",
            "tasks",
            201,
            data=draft_task_data,
            files={'dummy': ('', '')},
            accept_statuses=[200, 201],
            validate_fn=lambda r: (
                "_id" in r or "id" in r,
                f"✓ Draft task created: {r.get('_id') or r.get('id')}"
            )
        )
        
        if draft_create["success"]:
            draft_task_id = draft_create["data"].get("_id") or draft_create["data"].get("id")
            self.log(f"    Draft task ID: {draft_task_id}", "success")
            
            # Delete draft task (should succeed)
            delete_draft = self.test(
                "Delete DRAFT task without progress (should succeed)",
                "DELETE",
                f"tasks/{draft_task_id}",
                200,
                validate_fn=lambda r: (
                    r.get("ok") == True and r.get("deleted") == True,
                    f"✓ Draft task deleted successfully: {r}"
                )
            )
        
        # 5c. Try to delete active task (should fail)
        self.log("    Creating an ACTIVE task to test deletion guard...", "info")
        active_task_data = {
            'name': f'Active Task for Deletion Test {datetime.now().strftime("%Y%m%d%H%M%S")}',
            'type': 'special',
            'points': '10',
            'completionMode': 'MODERATOR_REVIEW',
            'taskStatus': 'active',  # Active, not draft
            'description': 'Active task for deletion test',
            'goal': '1',
            'accessTier': 'public'
        }
        
        active_create = self.test(
            "Create ACTIVE task for deletion guard test",
            "POST",
            "tasks",
            201,
            data=active_task_data,
            files={'dummy': ('', '')},
            accept_statuses=[200, 201],
            validate_fn=lambda r: (
                "_id" in r or "id" in r,
                f"✓ Active task created: {r.get('_id') or r.get('id')}"
            )
        )
        
        if active_create["success"]:
            active_task_id = active_create["data"].get("_id") or active_create["data"].get("id")
            self.created_task_ids.append(active_task_id)
            self.log(f"    Active task ID: {active_task_id}", "success")
            
            # Try to delete active task (should fail)
            delete_active = self.test(
                "Delete ACTIVE task (should fail with 400)",
                "DELETE",
                f"tasks/{active_task_id}",
                400,
                validate_fn=lambda r: (
                    "история" in str(r).lower() or "опубликовано" in str(r).lower() or "архив" in str(r).lower(),
                    f"✓ Correctly rejected deletion of active task: {r}"
                )
            )
        
        # 6. REVIEW QUEUE (enriched)
        self.log("\n### 6. REVIEW QUEUE (enriched) ###", "warning")
        
        review_queue_result = self.test(
            "GET /api/tasks/admin/review-queue",
            "GET",
            "tasks/admin/review-queue",
            200,
            validate_fn=lambda r: self.validate_review_queue(r)
        )
        
        # 7. ROUTE REGRESSION
        self.log("\n### 7. ROUTE REGRESSION ###", "warning")
        
        # 7a. GET /api/tasks/my/tasker
        self.test(
            "GET /api/tasks/my/tasker (regression)",
            "GET",
            "tasks/my/tasker",
            200,
            validate_fn=lambda r: (
                "kpis" in r and "items" in r and "board" in r and "calendar" in r,
                f"✓ Tasker structure valid: kpis={list(r.get('kpis', {}).keys())}, items count={len(r.get('items', []))}"
            )
        )
        
        # 7b. GET /api/tasks/admin/list?group=earlyland
        self.test(
            "GET /api/tasks/admin/list?group=earlyland (regression)",
            "GET",
            "tasks/admin/list?group=earlyland",
            200,
            validate_fn=lambda r: (
                isinstance(r, list),
                f"✓ Admin list returned array with {len(r)} tasks"
            )
        )
        
        # Print summary
        self.print_summary()
    
    def validate_earlyland_funnel(self, data: Dict) -> tuple:
        """Validate EarlyLand funnel structure"""
        required_keys = ["audience", "funnel", "xp", "tasks", "byActivity"]
        missing = [k for k in required_keys if k not in data]
        
        if missing:
            return False, f"✗ Missing keys: {missing}"
        
        # Validate audience
        audience = data.get("audience", {})
        required_audience = ["uniqueUsers", "active1", "active7", "active30", "primeUsers", "publicUsers", "grants"]
        missing_audience = [k for k in required_audience if k not in audience]
        if missing_audience:
            return False, f"✗ Missing audience keys: {missing_audience}"
        
        # Validate grants
        grants = audience.get("grants", {})
        required_grants = ["active", "expired", "revoked"]
        missing_grants = [k for k in required_grants if k not in grants]
        if missing_grants:
            return False, f"✗ Missing grants keys: {missing_grants}"
        
        # Validate funnel
        funnel = data.get("funnel", [])
        if not isinstance(funnel, list):
            return False, f"✗ Funnel must be an array"
        
        expected_steps = ["view", "open", "add", "start", "submit", "approved", "xp"]
        funnel_steps = [step.get("key") for step in funnel]
        missing_steps = [s for s in expected_steps if s not in funnel_steps]
        if missing_steps:
            return False, f"✗ Missing funnel steps: {missing_steps}"
        
        # Validate funnel step structure
        for step in funnel:
            step_name = step.get("key")
            required_step_keys = ["users", "tracked", "conversionFromPrev", "conversionFromStart", "dropOff"]
            missing_step_keys = [k for k in required_step_keys if k not in step]
            if missing_step_keys:
                return False, f"✗ Step '{step_name}' missing keys: {missing_step_keys}"
            
            # view and open must have tracked:false and users:null
            if step_name in ["view", "open"]:
                if step.get("tracked") != False:
                    return False, f"✗ Step '{step_name}' must have tracked=false, got {step.get('tracked')}"
                if step.get("users") is not None:
                    return False, f"✗ Step '{step_name}' must have users=null, got {step.get('users')}"
        
        # Validate xp
        xp = data.get("xp", {})
        required_xp = ["awarded", "recipients", "awards", "perUser"]
        missing_xp = [k for k in required_xp if k not in xp]
        if missing_xp:
            return False, f"✗ Missing xp keys: {missing_xp}"
        
        # Validate tasks
        tasks = data.get("tasks", {})
        required_tasks = ["total", "prime", "public", "potentialXp"]
        missing_tasks = [k for k in required_tasks if k not in tasks]
        if missing_tasks:
            return False, f"✗ Missing tasks keys: {missing_tasks}"
        
        # Validate byActivity
        by_activity = data.get("byActivity", [])
        if not isinstance(by_activity, list):
            return False, f"✗ byActivity must be an array"
        
        msgs = []
        msgs.append(f"✓ All required keys present")
        msgs.append(f"✓ Audience: uniqueUsers={audience.get('uniqueUsers')}, active30={audience.get('active30')}, primeUsers={audience.get('primeUsers')}")
        msgs.append(f"✓ Grants: active={grants.get('active')}, expired={grants.get('expired')}, revoked={grants.get('revoked')}")
        msgs.append(f"✓ Funnel: {len(funnel)} steps with correct structure")
        msgs.append(f"✓ XP: awarded={xp.get('awarded')}, recipients={xp.get('recipients')}, perUser={xp.get('perUser')}")
        msgs.append(f"✓ Tasks: total={tasks.get('total')}, prime={tasks.get('prime')}, public={tasks.get('public')}, potentialXp={tasks.get('potentialXp')}")
        msgs.append(f"✓ byActivity: {len(by_activity)} activities")
        
        return True, "\n    ".join(msgs)
    
    def validate_task_detail(self, data: Dict) -> tuple:
        """Validate task detail canonical presentation"""
        required_keys = ["id", "title", "xpReward", "completionMode", "access", "repeat", 
                        "progress", "status", "taskerState", "actions", "steps"]
        missing = [k for k in required_keys if k not in data]
        
        if missing:
            return False, f"✗ Missing keys: {missing}"
        
        # Verify internal fields are NOT exposed
        internal_fields = ["reviewerNote", "evidence", "evidenceHash", "riskFlags", "riskScore"]
        exposed = [f for f in internal_fields if f in data]
        if exposed:
            return False, f"✗ Internal fields exposed: {exposed}"
        
        # Validate progress structure
        progress = data.get("progress", {})
        required_progress = ["value", "goal", "percent"]
        missing_progress = [k for k in required_progress if k not in progress]
        if missing_progress:
            return False, f"✗ Missing progress keys: {missing_progress}"
        
        msgs = []
        msgs.append(f"✓ All required keys present, no internal fields exposed")
        msgs.append(f"✓ Task: id={data.get('id')}, title={data.get('title')}, xpReward={data.get('xpReward')}")
        msgs.append(f"✓ Status: {data.get('status')}, taskerState={data.get('taskerState')}")
        msgs.append(f"✓ Progress: {progress.get('value')}/{progress.get('goal')} ({progress.get('percent')}%)")
        msgs.append(f"✓ Actions: {data.get('actions', [])}")
        msgs.append(f"✓ Steps: {len(data.get('steps', []))} steps")
        
        return True, "\n    ".join(msgs)
    
    def validate_review_queue(self, data: Dict) -> tuple:
        """Validate review queue enrichment"""
        if not isinstance(data, list):
            return False, f"✗ Review queue must be an array, got {type(data)}"
        
        # Empty queue is acceptable
        if len(data) == 0:
            return True, "✓ Review queue is empty (acceptable)"
        
        # If not empty, validate enrichment fields
        for item in data:
            required_enrichment = ["riskFlags", "riskScore", "submittedAt", "startedAt"]
            missing = [k for k in required_enrichment if k not in item]
            if missing:
                return False, f"✗ Review queue item missing enrichment fields: {missing}"
        
        msgs = []
        msgs.append(f"✓ Review queue has {len(data)} items")
        msgs.append(f"✓ All items have enrichment fields: riskFlags, riskScore, submittedAt, startedAt")
        
        # Show sample
        if len(data) > 0:
            sample = data[0]
            msgs.append(f"✓ Sample: taskId={sample.get('taskId')}, riskScore={sample.get('riskScore')}, riskFlags={sample.get('riskFlags', [])}")
        
        return True, "\n    ".join(msgs)
    
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
    tester = TaskEngineTester()
    exit_code = tester.run_all_tests()
    
    # Save results to JSON
    results_file = "/tmp/task_engine_test_results.json"
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
