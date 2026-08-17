#!/usr/bin/env python3
"""
FOMO Emergent LLM Integration Test
Tests real Emergent LLM connectivity and Admin AI Chat
"""
import requests
import sys
import json
import time

BASE_URL = "https://fomo-dev-build.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@fomo.local"
ADMIN_PASSWORD = "Admin@12345"

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'

def log(msg, color=Colors.BLUE):
    print(f"{color}{msg}{Colors.END}")

def success(msg):
    log(f"✅ {msg}", Colors.GREEN)

def fail(msg):
    log(f"❌ {msg}", Colors.RED)

def info(msg):
    log(f"ℹ️  {msg}", Colors.BLUE)

def main():
    print("\n" + "="*70)
    print("FOMO Emergent LLM Integration Test")
    print("="*70)
    print(f"Base URL: {BASE_URL}")
    print("="*70 + "\n")
    
    # Step 1: Admin login
    info("Step 1: Admin login...")
    try:
        response = requests.post(
            f"{BASE_URL}/user/admin/login",
            json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
            timeout=15
        )
        
        if response.status_code != 202:
            fail(f"Login failed with status {response.status_code}")
            return 1
        
        data = response.json()
        admin_token = data.get('accessToken')
        
        if not admin_token:
            fail("No access token in response")
            return 1
        
        success(f"Admin login successful")
        headers = {'Authorization': f'Bearer {admin_token}', 'Content-Type': 'application/json'}
        
    except Exception as e:
        fail(f"Login error: {str(e)}")
        return 1
    
    # Step 2: Test Emergent LLM connectivity
    info("\nStep 2: Testing Emergent LLM connectivity...")
    try:
        response = requests.post(
            f"{BASE_URL}/admin/entitlements/ai/settings/test",
            headers=headers,
            timeout=30
        )
        
        if response.status_code != 201:
            fail(f"Connectivity test failed with status {response.status_code}")
            log(f"Response: {response.text[:500]}", Colors.YELLOW)
            return 1
        
        data = response.json()
        
        # Check required fields
        if data.get('ok') != True:
            fail(f"Expected ok=true, got {data.get('ok')}")
            return 1
        success("✓ ok=true")
        
        if data.get('mode') != 'emergent':
            fail(f"Expected mode='emergent', got '{data.get('mode')}'")
            return 1
        success("✓ mode='emergent'")
        
        model = data.get('model')
        if not model:
            fail("No model name returned")
            return 1
        success(f"✓ model='{model}'")
        
        sample = data.get('sample', '')
        if not sample:
            fail("No sample returned")
            return 1
        success(f"✓ sample='{sample}'")
        
        latency = data.get('latencyMs')
        if latency:
            info(f"  Latency: {latency}ms")
        
        success("Emergent LLM connectivity test PASSED")
        
    except Exception as e:
        fail(f"Connectivity test error: {str(e)}")
        return 1
    
    # Step 3: Test Admin AI Chat - Create Thread
    info("\nStep 3: Creating Admin AI Chat thread...")
    try:
        response = requests.post(
            f"{BASE_URL}/admin-ai-chat/threads",
            json={"title": "Test Emergent LLM Integration"},
            headers=headers,
            timeout=15
        )
        
        if response.status_code != 201:
            fail(f"Thread creation failed with status {response.status_code}")
            log(f"Response: {response.text[:500]}", Colors.YELLOW)
            return 1
        
        data = response.json()
        thread_id = data.get('_id') or data.get('id')
        
        if not thread_id:
            fail("No thread ID returned")
            return 1
        
        success(f"Thread created with ID: {thread_id}")
        
    except Exception as e:
        fail(f"Thread creation error: {str(e)}")
        return 1
    
    # Step 4: Test Admin AI Chat - Send Message (LIVE via Emergent)
    info("\nStep 4: Sending message to Admin AI Chat (LIVE via Emergent)...")
    info("  Note: This may take a few seconds as it's a real LLM call...")
    
    try:
        response = requests.post(
            f"{BASE_URL}/admin-ai-chat/threads/{thread_id}/messages",
            json={
                "message": "In one sentence, what is FOMO about?",
                "model": "gpt-4.1-mini"
            },
            headers=headers,
            timeout=60
        )
        
        if response.status_code != 201:
            fail(f"Message send failed with status {response.status_code}")
            log(f"Response: {response.text[:500]}", Colors.YELLOW)
            
            # Retry once as per instructions
            info("  Retrying once...")
            time.sleep(2)
            response = requests.post(
                f"{BASE_URL}/admin-ai-chat/threads/{thread_id}/messages",
                json={
                    "message": "In one sentence, what is FOMO about?",
                    "model": "gpt-4.1-mini"
                },
                headers=headers,
                timeout=60
            )
            
            if response.status_code != 201:
                fail(f"Retry failed with status {response.status_code}")
                return 1
        
        data = response.json()
        assistant_message = data.get('assistantMessage', {})
        content = assistant_message.get('content', '')
        
        if not content:
            fail("No assistant message content returned")
            return 1
        
        # CRITICAL: Check that response is NOT mock
        if 'MOCK NARRATION' in content or '[MOCK' in content:
            fail("CRITICAL: Response contains 'MOCK NARRATION' - LLM is not LIVE!")
            log(f"Response: {content[:300]}", Colors.RED)
            return 1
        
        success("✓ Response is LIVE (no 'MOCK NARRATION' found)")
        success(f"✓ Assistant response: {content[:150]}...")
        
        # Check metadata
        metadata = assistant_message.get('metadata', {})
        provider = metadata.get('provider')
        model_used = metadata.get('model')
        
        if provider:
            success(f"✓ Provider: {provider}")
        
        if model_used:
            success(f"✓ Model used: {model_used}")
        
        success("Admin AI Chat LIVE test PASSED")
        
    except requests.exceptions.Timeout:
        fail("Request timeout after 60s")
        return 1
    except Exception as e:
        fail(f"Message send error: {str(e)}")
        return 1
    
    # Step 5: Test AI Economics
    info("\nStep 5: Testing AI Economics endpoint...")
    try:
        response = requests.get(
            f"{BASE_URL}/admin/entitlements/ai/economics",
            headers=headers,
            timeout=15
        )
        
        if response.status_code != 200:
            fail(f"Economics endpoint failed with status {response.status_code}")
            log(f"Response: {response.text[:500]}", Colors.YELLOW)
            return 1
        
        data = response.json()
        budget = data.get('budget', {})
        
        # Check expected values
        net_revenue = budget.get('netRevenueUsd')
        allowed_ai_cost = budget.get('allowedAiCostUsd')
        max_cost_per_credit = budget.get('maxCostPerCreditUsd')
        
        if net_revenue == 44.1:
            success(f"✓ netRevenueUsd: ${net_revenue}")
        else:
            fail(f"Expected netRevenueUsd=44.1, got {net_revenue}")
            return 1
        
        if allowed_ai_cost == 22.05:
            success(f"✓ allowedAiCostUsd: ${allowed_ai_cost}")
        else:
            fail(f"Expected allowedAiCostUsd=22.05, got {allowed_ai_cost}")
            return 1
        
        if max_cost_per_credit == 0.02205:
            success(f"✓ maxCostPerCreditUsd: ${max_cost_per_credit}")
        else:
            fail(f"Expected maxCostPerCreditUsd=0.02205, got {max_cost_per_credit}")
            return 1
        
        success("AI Economics test PASSED")
        
    except Exception as e:
        fail(f"Economics test error: {str(e)}")
        return 1
    
    # All tests passed
    print("\n" + "="*70)
    success("ALL TESTS PASSED ✓")
    print("="*70 + "\n")
    
    return 0

if __name__ == "__main__":
    sys.exit(main())
