#!/usr/bin/env python3
"""
NEWS-1 Phase 6A Backend Test Suite
Tests P1-P8: News Detail projection, AI synthesis+publish, Comments as News entity,
Discussion AI Summary, Influence/XP, and Admin Audit.
"""

import requests
import sys
import time
from datetime import datetime
from typing import Dict, Any, Optional

BASE_URL = "https://fomo-crm-admin.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"
TEST_NEWS_ID = "6a8418aaede6de689fce9e7d"

class NewsPhase6ATest:
    def __init__(self):
        self.token: Optional[str] = None
        self.tests_run = 0
        self.tests_passed = 0
        self.tests_failed = 0
        self.results = []
        
    def log(self, message: str, level: str = "INFO"):
        """Log test messages"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")
        
    def test(self, name: str, method: str, endpoint: str, expected_status: int, 
             data: Optional[Dict] = None, headers: Optional[Dict] = None,
             validate_fn: Optional[callable] = None) -> tuple[bool, Any]:
        """Run a single test"""
        self.tests_run += 1
        url = f"{BASE_URL}/{endpoint}"
        
        req_headers = {"Content-Type": "application/json"}
        if self.token:
            req_headers["Authorization"] = f"Bearer {self.token}"
        if headers:
            req_headers.update(headers)
            
        self.log(f"Test #{self.tests_run}: {name}")
        
        try:
            if method == "GET":
                response = requests.get(url, headers=req_headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=data, headers=req_headers, timeout=30)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=req_headers, timeout=30)
            elif method == "DELETE":
                response = requests.delete(url, headers=req_headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            # Accept both 200 and 201 for POST operations (NestJS returns 201 for created resources)
            if method == "POST" and expected_status == 200 and response.status_code == 201:
                status_ok = True
            else:
                status_ok = response.status_code == expected_status
            
            try:
                response_data = response.json() if response.text else {}
            except:
                response_data = {"raw": response.text}
                
            # Additional validation
            validation_ok = True
            validation_msg = ""
            if validate_fn and status_ok:
                validation_ok, validation_msg = validate_fn(response_data)
                
            success = status_ok and validation_ok
            
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASS - Status: {response.status_code}", "PASS")
                if validation_msg:
                    self.log(f"   {validation_msg}", "INFO")
            else:
                self.tests_failed += 1
                if not status_ok:
                    self.log(f"❌ FAIL - Expected {expected_status}, got {response.status_code}", "FAIL")
                    self.log(f"   Response: {str(response_data)[:200]}", "ERROR")
                else:
                    self.log(f"❌ FAIL - Validation failed: {validation_msg}", "FAIL")
                    
            self.results.append({
                "test": name,
                "passed": success,
                "status": response.status_code,
                "expected": expected_status,
                "validation": validation_msg if validation_ok else f"FAILED: {validation_msg}"
            })
            
            return success, response_data
            
        except Exception as e:
            self.tests_failed += 1
            self.log(f"❌ FAIL - Exception: {str(e)}", "ERROR")
            self.results.append({
                "test": name,
                "passed": False,
                "error": str(e)
            })
            return False, {}
            
    def login(self) -> bool:
        """P0: Admin login"""
        self.log("=" * 60)
        self.log("P0: Admin Login")
        self.log("=" * 60)
        
        success, response = self.test(
            "Admin login",
            "POST",
            "user/admin/login",
            202,  # NestJS returns 202 for admin login
            data={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD}
        )
        
        if success and "accessToken" in response:
            self.token = response["accessToken"]
            self.log(f"✓ Token acquired: {self.token[:20]}...", "SUCCESS")
            return True
        else:
            self.log("✗ Login failed - cannot proceed", "ERROR")
            return False
            
    def test_p1_news_detail_projection(self) -> bool:
        """P1: News Detail projection with AI fields"""
        self.log("\n" + "=" * 60)
        self.log("P1: News Detail Projection (AI-generated news)")
        self.log("=" * 60)
        
        def validate_ai_news(data):
            required_fields = ["aiGenerated", "summary", "whyMatters", "keyPoints", 
                             "aiView", "provenanceUrls", "trustColor"]
            missing = []
            
            if not data.get("aiGenerated"):
                return False, "aiGenerated is not true"
                
            for field in required_fields:
                if field not in data:
                    missing.append(field)
                    
            if missing:
                return False, f"Missing AI fields: {', '.join(missing)}"
                
            # Validate keyPoints is array with at least 3 items
            if not isinstance(data.get("keyPoints"), list) or len(data.get("keyPoints", [])) < 3:
                return False, f"keyPoints should be array with >=3 items, got {len(data.get('keyPoints', []))}"
                
            # Validate trustColor
            if data.get("trustColor") not in ["GREEN", "YELLOW", "RED"]:
                return False, f"Invalid trustColor: {data.get('trustColor')}"
                
            return True, f"All AI fields present: aiGenerated={data['aiGenerated']}, trustColor={data['trustColor']}, keyPoints={len(data['keyPoints'])}"
            
        success, response = self.test(
            f"GET /api/news/item/{TEST_NEWS_ID} - AI news projection",
            "GET",
            f"news/item/{TEST_NEWS_ID}",
            200,
            validate_fn=validate_ai_news
        )
        
        return success
        
    def test_p1_ai_synthesis_publish(self) -> bool:
        """P1: AI synthesis + publish flow"""
        self.log("\n" + "=" * 60)
        self.log("P1: AI Synthesis + Publish Flow")
        self.log("=" * 60)
        
        # Step 1: Enqueue generation
        success, response = self.test(
            "POST /api/admin/news-ai/generate - enqueue synthesis",
            "POST",
            "admin/news-ai/generate",
            200,
            data={"windowLimit": 200, "maxClusters": 1, "minSources": 1},
            validate_fn=lambda d: (d.get("ok") and (d.get("queued", 0) > 0 or len(d.get("fingerprints", [])) > 0), 
                                  f"Selected {d.get('selected', 0)} clusters, queued {d.get('queued', 0)} (may be 0 if already generated)")
        )
        
        if not success or not response.get("fingerprints") or len(response.get("fingerprints", [])) == 0:
            self.log("✗ No fingerprints returned, cannot proceed with publish test", "WARN")
            return False
            
        fingerprint = response["fingerprints"][0]
        self.log(f"✓ Got fingerprint: {fingerprint}", "INFO")
        
        # Step 2: Wait for generation (poll with timeout)
        self.log("⏳ Waiting ~20s for AI generation...", "INFO")
        max_wait = 30
        wait_interval = 3
        elapsed = 0
        draft_ready = False
        
        while elapsed < max_wait:
            time.sleep(wait_interval)
            elapsed += wait_interval
            
            success, draft = self.test(
                f"GET /api/admin/news-ai/drafts/{fingerprint} - check status",
                "GET",
                f"admin/news-ai/drafts/{fingerprint}",
                200
            )
            
            if success and draft.get("genStatus") == "GENERATED":
                draft_ready = True
                self.log(f"✓ Draft GENERATED after {elapsed}s", "SUCCESS")
                break
            elif success:
                self.log(f"  Status: {draft.get('genStatus', 'UNKNOWN')} (waiting...)", "INFO")
                
        if not draft_ready:
            self.log(f"✗ Draft not ready after {max_wait}s", "WARN")
            return False
            
        # Step 3: Validate draft fields
        def validate_draft(d):
            required = ["short_en", "why_matters_en", "keyPoints", "ai_view_en", "providerCostUsd"]
            missing = [f for f in required if f not in d]
            
            if missing:
                return False, f"Missing draft fields: {', '.join(missing)}"
                
            if not isinstance(d.get("keyPoints"), list) or len(d.get("keyPoints", [])) < 3:
                return False, f"keyPoints should have >=3 items, got {len(d.get('keyPoints', []))}"
                
            if not isinstance(d.get("providerCostUsd"), (int, float)) or d.get("providerCostUsd", 0) <= 0:
                return False, f"providerCostUsd should be >0 (real COGS), got {d.get('providerCostUsd')}"
                
            return True, f"Draft valid: keyPoints={len(d['keyPoints'])}, COGS=${d['providerCostUsd']:.6f}"
            
        success, draft = self.test(
            f"Validate draft fields",
            "GET",
            f"admin/news-ai/drafts/{fingerprint}",
            200,
            validate_fn=validate_draft
        )
        
        if not success:
            return False
            
        # Step 4: Publish draft
        success, pub_response = self.test(
            f"POST /api/admin/news-ai/drafts/{fingerprint}/publish",
            "POST",
            f"admin/news-ai/drafts/{fingerprint}/publish",
            200,
            validate_fn=lambda d: (d.get("ok") and d.get("newsId"), 
                                  f"Published newsId={d.get('newsId')}, created={d.get('created')}")
        )
        
        if not success or not pub_response.get("newsId"):
            return False
            
        news_id = pub_response["newsId"]
        self.log(f"✓ Published newsId: {news_id}", "SUCCESS")
        
        # Step 5: Verify published news has AI fields
        def validate_published(d):
            if not d.get("aiGenerated"):
                return False, "Published news missing aiGenerated=true"
            if not d.get("summary") or not d.get("whyMatters"):
                return False, "Published news missing summary/whyMatters"
            return True, f"Published news has AI fields: summary={bool(d.get('summary'))}, whyMatters={bool(d.get('whyMatters'))}"
            
        success, _ = self.test(
            f"GET /api/news/item/{news_id} - verify published AI fields",
            "GET",
            f"news/item/{news_id}",
            200,
            validate_fn=validate_published
        )
        
        return success
        
    def test_p2_comments_as_news_entity(self) -> bool:
        """P2: Comments as News entity (CRUD)"""
        self.log("\n" + "=" * 60)
        self.log("P2: Comments as News Entity")
        self.log("=" * 60)
        
        page = f"crypto-news-{TEST_NEWS_ID}"
        
        # Step 1: Create a comment
        comment_text = f"Test comment at {datetime.now().isoformat()}"
        success, comment = self.test(
            f"POST /api/comments/{page} - create comment",
            "POST",
            f"comments/{page}",
            200,
            data={"text": comment_text, "isTopic": False, "path": page},
            validate_fn=lambda d: (d.get("_id") and d.get("text") == comment_text,
                                  f"Comment created: {d.get('_id')}")
        )
        
        if not success or not comment.get("_id"):
            return False
            
        comment_id = comment["_id"]
        self.log(f"✓ Comment ID: {comment_id}", "INFO")
        
        # Step 2: List comments for this news page
        success, comments_list = self.test(
            f"GET /api/comments/{page} - list comments",
            "GET",
            f"comments/{page}",
            200,
            validate_fn=lambda d: (isinstance(d, list) and len(d) > 0,
                                  f"Found {len(d) if isinstance(d, list) else 0} comments")
        )
        
        if not success:
            return False
            
        # Step 3: Add a reply
        reply_text = f"Test reply at {datetime.now().isoformat()}"
        success, reply = self.test(
            f"POST /api/comments/answer/{comment_id} - add reply",
            "POST",
            f"comments/answer/{comment_id}",
            200,
            data={"text": reply_text, "path": page},
            validate_fn=lambda d: (d.get("reply") and d.get("reply", {}).get("_id"),
                                  f"Reply created: {d.get('reply', {}).get('_id')}")
        )
        
        if not success:
            return False
            
        # Step 4: Toggle like
        success, like_response = self.test(
            f"PUT /api/comments/like/{comment_id} - toggle like",
            "PUT",
            f"comments/like/{comment_id}",
            200,
            validate_fn=lambda d: (d.get("_id") == comment_id,
                                  f"Like toggled on comment {comment_id}")
        )
        
        return success
        
    def test_p3_discussion_ai_summary(self) -> bool:
        """P3: Discussion AI Summary (STALE/READY states)"""
        self.log("\n" + "=" * 60)
        self.log("P3: Discussion AI Summary")
        self.log("=" * 60)
        
        page = f"crypto-news-{TEST_NEWS_ID}"
        
        # Step 1: Get initial summary status
        success, summary = self.test(
            f"GET /api/comments/discussion/{page}/summary - initial status",
            "GET",
            f"comments/discussion/{page}/summary",
            200,
            validate_fn=lambda d: (d.get("status") in ["NONE", "STALE", "READY"],
                                  f"Summary status: {d.get('status')}")
        )
        
        if not success:
            return False
            
        initial_status = summary.get("status")
        self.log(f"✓ Initial status: {initial_status}", "INFO")
        
        # Step 2: Regenerate summary (triggers real LLM call)
        self.log("⏳ Regenerating summary (may take 5-10s)...", "INFO")
        success, regen = self.test(
            f"POST /api/comments/discussion/{page}/summary/regenerate",
            "POST",
            f"comments/discussion/{page}/summary/regenerate",
            200,
            validate_fn=lambda d: (d.get("status") == "READY" and d.get("summary"),
                                  f"Summary regenerated: status={d.get('status')}")
        )
        
        if not success:
            return False
            
        # Validate summary fields
        summary_data = regen.get("summary", {})
        if not all(k in summary_data for k in ["overview", "keyTakeaways", "communityPulse"]):
            self.log("✗ Missing summary fields", "FAIL")
            return False
            
        if not isinstance(summary_data.get("providerCostUsd"), (int, float)) or summary_data.get("providerCostUsd", 0) <= 0:
            self.log(f"✗ Invalid providerCostUsd: {summary_data.get('providerCostUsd')}", "FAIL")
            return False
            
        self.log(f"✓ Summary fields: overview={bool(summary_data.get('overview'))}, "
                f"keyTakeaways={len(summary_data.get('keyTakeaways', []))}, "
                f"COGS=${summary_data.get('providerCostUsd', 0):.6f}", "SUCCESS")
        
        # Step 3: Add a NEW comment to make summary STALE
        new_comment_text = f"New comment to trigger STALE at {datetime.now().isoformat()}"
        success, _ = self.test(
            f"POST /api/comments/{page} - add comment to trigger STALE",
            "POST",
            f"comments/{page}",
            200,
            data={"text": new_comment_text, "isTopic": False, "path": page}
        )
        
        if not success:
            self.log("✗ Failed to add new comment", "WARN")
            return False
            
        # Step 4: Verify summary is now STALE
        success, stale_check = self.test(
            f"GET /api/comments/discussion/{page}/summary - verify STALE",
            "GET",
            f"comments/discussion/{page}/summary",
            200,
            validate_fn=lambda d: (d.get("status") == "STALE",
                                  f"Summary is STALE after new comment (lazy, no auto-LLM)")
        )
        
        if not success:
            self.log("✗ Summary should be STALE after new comment", "FAIL")
            return False
            
        # Step 5: Re-regenerate to get back to READY
        success, final = self.test(
            f"POST /api/comments/discussion/{page}/summary/regenerate - back to READY",
            "POST",
            f"comments/discussion/{page}/summary/regenerate",
            200,
            validate_fn=lambda d: (d.get("status") == "READY",
                                  f"Summary back to READY: status={d.get('status')}")
        )
        
        return success
        
    def test_p4_influence_xp(self) -> bool:
        """P4: Influence/XP for News comments"""
        self.log("\n" + "=" * 60)
        self.log("P4: Influence/XP")
        self.log("=" * 60)
        
        page = f"crypto-news-{TEST_NEWS_ID}"
        
        # Step 1: Recalculate influence (processes News discussion roots)
        success, recalc = self.test(
            "POST /api/comments/admin/influence/recalc",
            "POST",
            "comments/admin/influence/recalc",
            200,
            validate_fn=lambda d: (d.get("processed", 0) >= 1,
                                  f"Processed {d.get('processed', 0)} items, awarded {d.get('xpAwarded', 0)} XP")
        )
        
        if not success:
            return False
            
        # Step 2: Get a News root comment ID (create one if needed)
        success, comments = self.test(
            f"GET /api/comments/{page} - get News comments",
            "GET",
            f"comments/{page}",
            200
        )
        
        if not success or not isinstance(comments, list) or len(comments) == 0:
            # Create a root comment for testing
            success, new_comment = self.test(
                f"POST /api/comments/{page} - create root comment for influence test",
                "POST",
                f"comments/{page}",
                200,
                data={"text": f"Root comment for influence test at {datetime.now().isoformat()}", 
                     "isTopic": False, "path": page}
            )
            if not success or not new_comment.get("_id"):
                self.log("✗ Could not create root comment for influence test", "WARN")
                return False
            news_root_comment_id = new_comment["_id"]
        else:
            news_root_comment_id = comments[0].get("_id")
            
        self.log(f"✓ Testing influence for News comment: {news_root_comment_id}", "INFO")
        
        # Step 3: Get influence breakdown for News comment
        success, influence = self.test(
            f"GET /api/comments/topic/{news_root_comment_id}/influence",
            "GET",
            f"comments/topic/{news_root_comment_id}/influence",
            200,
            validate_fn=lambda d: (d is not None and "rawInfluence" in d and "breakdown" in d,
                                  f"Influence breakdown: rawInfluence={d.get('rawInfluence', 0)}, "
                                  f"breakdown keys={list(d.get('breakdown', {}).keys())}")
        )
        
        if not success:
            self.log("✗ Failed to get influence breakdown for News comment", "FAIL")
            return False
            
        # Note: rawInfluence may be 0 for single-user self-interactions (anti-farm)
        # This is CORRECT behavior, just verify the endpoint responds
        self.log(f"✓ News comment is an influence node (rawInfluence={influence.get('rawInfluence', 0)})", "SUCCESS")
        
        return True
        
    def test_p8_admin_audit(self) -> bool:
        """P8: Admin Audit events"""
        self.log("\n" + "=" * 60)
        self.log("P8: Admin Audit")
        self.log("=" * 60)
        
        # Get recent audit events
        success, events = self.test(
            "GET /api/admin/audit?limit=10",
            "GET",
            "admin/audit?limit=10",
            200,
            validate_fn=lambda d: (isinstance(d, list),
                                  f"Retrieved {len(d) if isinstance(d, list) else 0} audit events")
        )
        
        if not success or not isinstance(events, list):
            return False
            
        # Filter for NEWS or AI_POLICY domain events
        news_events = [e for e in events if e.get("domain") in ["NEWS", "AI_POLICY"]]
        
        if len(news_events) == 0:
            self.log("⚠ No NEWS/AI_POLICY audit events found (may be expected if no recent activity)", "WARN")
            # Not a failure - just means no recent activity
            return True
            
        self.log(f"✓ Found {len(news_events)} NEWS/AI_POLICY audit events", "INFO")
        
        # Validate audit event structure
        for event in news_events[:3]:  # Check first 3
            action = event.get("action", "")
            domain = event.get("domain", "")
            
            # Check for expected actions
            expected_actions = ["NEWS_PUBLISHED", "NEWS_REGENERATED", "NEWS_EDITED", 
                              "NEWS_APPROVED", "AI_BUDGET_CHANGED", "AI_POLICY_CHANGED"]
            
            if action in expected_actions:
                self.log(f"  ✓ Event: {domain}/{action} at {event.get('createdAt', 'unknown')}", "INFO")
                
                # Verify no secret/token fields in before/after
                before = event.get("before", {})
                after = event.get("after", {})
                
                secret_keys = ["secret", "password", "token", "apikey", "api_key", 
                             "authorization", "privatekey", "private_key", "credential"]
                
                for obj in [before, after]:
                    if obj and isinstance(obj, dict):
                        for key in obj.keys():
                            if any(s in key.lower() for s in secret_keys):
                                if obj[key] != "[REDACTED]":
                                    self.log(f"  ✗ Secret field '{key}' not redacted!", "FAIL")
                                    return False
                                    
        self.log("✓ Audit events validated: no secret/token fields exposed", "SUCCESS")
        return True
        
    def run_all_tests(self):
        """Run all test suites"""
        self.log("=" * 60)
        self.log("NEWS-1 Phase 6A Backend Test Suite")
        self.log("=" * 60)
        
        # P0: Login
        if not self.login():
            self.log("\n❌ Cannot proceed without admin token", "ERROR")
            return False
            
        # Run all test suites
        test_suites = [
            ("P1 News Detail Projection", self.test_p1_news_detail_projection),
            ("P1 AI Synthesis+Publish", self.test_p1_ai_synthesis_publish),
            ("P2 Comments as News Entity", self.test_p2_comments_as_news_entity),
            ("P3 Discussion AI Summary", self.test_p3_discussion_ai_summary),
            ("P4 Influence/XP", self.test_p4_influence_xp),
            ("P8 Admin Audit", self.test_p8_admin_audit),
        ]
        
        suite_results = []
        for suite_name, suite_fn in test_suites:
            try:
                result = suite_fn()
                suite_results.append((suite_name, result))
            except Exception as e:
                self.log(f"\n❌ Suite '{suite_name}' crashed: {str(e)}", "ERROR")
                suite_results.append((suite_name, False))
                
        # Print summary
        self.log("\n" + "=" * 60)
        self.log("TEST SUMMARY")
        self.log("=" * 60)
        
        for suite_name, result in suite_results:
            status = "✅ PASS" if result else "❌ FAIL"
            self.log(f"{status} - {suite_name}")
            
        self.log(f"\nTotal Tests: {self.tests_run}")
        self.log(f"Passed: {self.tests_passed} ({self.tests_passed*100//self.tests_run if self.tests_run > 0 else 0}%)")
        self.log(f"Failed: {self.tests_failed}")
        
        all_passed = all(result for _, result in suite_results)
        
        if all_passed:
            self.log("\n🎉 ALL TEST SUITES PASSED", "SUCCESS")
            return True
        else:
            self.log("\n⚠️  SOME TEST SUITES FAILED", "WARN")
            return False

def main():
    tester = NewsPhase6ATest()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())
