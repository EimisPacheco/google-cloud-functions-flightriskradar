#!/usr/bin/env python3
"""
Quick test to check if session memory is working
Single API call with session_id to see if backend accepts it
"""
import requests
import json
import time

FUNCTION_URL = "https://us-central1-crafty-cairn-469222-a8.cloudfunctions.net/flight-risk-analysis"
SESSION_ID = f"quick_test_{int(time.time())}"
USER_ID = f"test_user_{int(time.time())}"

print("🧪 Quick Session Test")
print(f"URL: {FUNCTION_URL}")
print(f"Session ID: {SESSION_ID}")
print(f"User ID: {USER_ID}\n")

payload = {
    "message": "Hello, can you help me?",
    "session_id": SESSION_ID,
    "user_id": USER_ID
}

print(f"📤 Sending request with session_id and user_id...\n")

try:
    response = requests.post(
        FUNCTION_URL,
        json=payload,
        headers={"Content-Type": "application/json"},
        timeout=60
    )

    print(f"✅ Status Code: {response.status_code}\n")

    if response.status_code == 200:
        data = response.json()

        print("📊 Response Analysis:")
        print(f"   Success: {data.get('success', 'N/A')}")

        if 'orchestrator' in data:
            print(f"   Intent: {data['orchestrator'].get('intent', 'N/A')}")

        # KEY CHECK: Does response include session_stats?
        if 'session_stats' in data:
            print("\n✅ SESSION STATS FOUND!")
            stats = data['session_stats']
            print(f"   Total messages: {stats.get('total_messages', 0)}")
            print(f"   User messages: {stats.get('user_messages', 0)}")
            print(f"   Assistant messages: {stats.get('assistant_messages', 0)}")
            print(f"   Session ID: {stats.get('session_id', 'N/A')}")
            print("\n🎉 SESSION MEMORY IS DEPLOYED AND WORKING!")
        else:
            print("\n⚠️  NO SESSION STATS IN RESPONSE")
            print("   This means one of two things:")
            print("   1. SessionManager not deployed yet (need to deploy)")
            print("   2. SessionManager failed to initialize (check logs)")

        # Print response snippet
        if 'response' in data:
            response_text = data['response'][:200]
            print(f"\n💬 Response Preview:\n{response_text}...\n")

        print("\n" + "="*60)
        print("VERDICT:")
        if 'session_stats' in data:
            print("✅ Session memory is ACTIVE and working!")
            print("   Ready to test multi-turn conversations")
        else:
            print("❌ Session memory is NOT active")
            print("   Need to deploy the updated code:")
            print("   cd cloud-functions && bash deploy.sh")
        print("="*60)

    else:
        print(f"❌ Error Response:\n{response.text}")

except requests.exceptions.Timeout:
    print("❌ Request timed out (60s)")
    print("   Cloud Function might be cold starting or hanging")
except Exception as e:
    print(f"❌ Exception: {e}")

print("\n")
