"""
Quick Test for ChatBot Elasticsearch Integration
Simple script to test chatbot responses

Usage: python3 quick_test_chatbot.py
"""

import requests
import json

# Cloud Function URL
CLOUD_FUNCTION_URL = "https://us-central1-crafty-cairn-469222-a8.cloudfunctions.net/flight-risk-analysis"

def ask_chatbot(question: str):
    """Ask the chatbot a question and print the response"""
    print(f"\n{'='*80}")
    print(f"❓ YOU: {question}")
    print(f"{'='*80}")

    try:
        payload = {
            "message": question,
            "session_id": "quick_test_123",
            "context": {}
        }

        print(f"⏳ Asking chatbot...")

        response = requests.post(
            CLOUD_FUNCTION_URL,
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=150
        )

        if response.status_code == 200:
            result = response.json()

            # Extract response text
            response_text = result.get('response', '')

            print(f"\n🤖 CHATBOT:")
            print(response_text)

            # Check if based on reviews
            if any(phrase in response_text.lower() for phrase in ['based on', 'customer reviews', 'reviews']):
                print(f"\n✅ Response is based on real customer reviews from Elasticsearch!")
            else:
                print(f"\n⚠️  Response doesn't mention customer reviews - may be fallback")

        else:
            print(f"❌ Error: HTTP {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"❌ Error: {str(e)}")


def main():
    print("🚀 Quick ChatBot Elasticsearch Test")
    print(f"🌐 Cloud Function: {CLOUD_FUNCTION_URL}")

    # Test 1: Airline service question
    ask_chatbot("What do customers say about United Airlines service?")

    # Test 2: Comparison
    ask_chatbot("Compare Delta vs American Airlines")

    # Test 3: Recommendation
    ask_chatbot("Which airline is best for comfort?")

    # Test 4: Airport question
    ask_chatbot("How is security at Atlanta airport?")

    print(f"\n{'='*80}")
    print("✅ Quick test complete!")
    print(f"{'='*80}")


if __name__ == "__main__":
    main()
