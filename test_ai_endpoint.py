#!/usr/bin/env python3
"""
Test AI endpoint with real HTTP requests
Requires AI service to be running: docker compose up dispatchai-ai
"""

import requests
import json
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Test data
test_data = {
    "callSid": "test-prompt-demo",
    "conversation": [
        {
            "speaker": "AI",
            "message": "Welcome to DispatchAI Services! How can I help you today?",
            "timestamp": "2024-03-21T10:00:00Z"
        },
        {
            "speaker": "customer", 
            "message": "Hi, I have a major leak in my kitchen. The water is everywhere and I need urgent help!",
            "timestamp": "2024-03-21T10:00:15Z"
        },
        {
            "speaker": "AI",
            "message": "I understand this is urgent. Let me book an emergency plumber for you right away. Can you confirm your address?",
            "timestamp": "2024-03-21T10:00:30Z"
        },
        {
            "speaker": "customer",
            "message": "Yes, I am at 123 Main Street, Melbourne. How soon can someone come?",
            "timestamp": "2024-03-21T10:00:45Z"
        },
        {
            "speaker": "AI", 
            "message": "Perfect! I have booked an emergency plumber for you at 123 Main Street. They will arrive within 30 minutes. The service fee is $150. Is that acceptable?",
            "timestamp": "2024-03-21T10:01:00Z"
        },
        {
            "speaker": "customer",
            "message": "Yes, that is perfect! Thank you so much. I really appreciate the quick response.",
            "timestamp": "2024-03-21T10:01:15Z"
        }
    ],
    "serviceInfo": {
        "name": "Emergency Plumbing",
        "booked": True,
        "company": "DispatchAI Services"
    }
}

def test_ai_summary():
    """Test AI summary endpoint"""
    ai_url = os.getenv('AI_URL')
    url = f"{ai_url}/ai/summary"
    
    try:
        print("🚀 Sending request to AI service...")
        print(f"URL: {url}")
        print(f"Data: {json.dumps(test_data, indent=2)}")
        print("-" * 50)
        
        response = requests.post(url, json=test_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI response successful!")
            print(f"Summary: {result['summary']}")
            print(f"Key Points:")
            for i, point in enumerate(result['keyPoints'], 1):
                print(f"  {i}. {point}")
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Error: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to AI service")
        print("💡 Please run first: docker compose up dispatchai-ai")
    except Exception as e:
        print(f"❌ Request error: {str(e)}")

if __name__ == "__main__":
    test_ai_summary()