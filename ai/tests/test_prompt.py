#!/usr/bin/env python3
"""
Test AI Summary Prompt Generation
Usage: python3 test_prompt.py
"""

def format_conversation_for_ai(conversation):
    """Convert conversation messages to text format for AI analysis."""
    formatted_lines = []
    for msg in conversation:
        speaker_label = "Assistant" if msg["speaker"].upper() == "AI" else "Customer"
        formatted_lines.append(f"{speaker_label}: {msg['message']}")
    return "\n".join(formatted_lines)


def create_summary_prompt(conversation_text, service_info=None):
    """Create AI prompt for conversation summarization."""
    service_context = ""
    if service_info:
        service_name = service_info.get("name", "Unknown service")
        service_booked = service_info.get("booked", False)
        service_context = f"\nService discussed: {service_name}\nService was {'booked' if service_booked else 'not booked'}"

    return f"""
Please analyze this customer service call conversation and provide a summary with key points.

CONVERSATION:
{conversation_text}
{service_context}

Please respond in the following JSON format:
{{
    "summary": "A concise 2-3 sentence summary of the call",
    "keyPoints": ["Key point 1", "Key point 2", "Key point 3"]
}}

Focus on:
- What the customer needed
- What services were discussed
- Whether any booking was made
- The outcome of the call
- Any follow-up actions needed
"""

# Test conversation data - real kitchen leak emergency scenario
test_conversation = [
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
]

test_service_info = {
    "name": "Emergency Plumbing",
    "booked": True,
    "company": "DispatchAI Services"
}

def test_ai_summary_endpoint():
    """Test the actual AI summary endpoint to see generated summary."""
    try:
        import requests
        
        # Prepare request data
        request_data = {
            "callSid": "test-prompt-demo", 
            "conversation": test_conversation,
            "serviceInfo": test_service_info
        }
        
        print("4. Testing AI Summary Endpoint:")
        print("   Sending request to AI service...")
        
        # Call AI service
        response = requests.post(
            "http://localhost:8000/api/ai/summary",
            json=request_data,
            timeout=30
        )
        
        if response.status_code == 200:
            result = response.json()
            print("   AI Response Success!")
            print(f"   Summary: {result['summary']}")
            print("   Key Points:")
            for i, point in enumerate(result['keyPoints'], 1):
                print(f"     {i}. {point}")
        else:
            print(f"   Request failed: {response.status_code}")
            print(f"   Error: {response.text}")
            
    except ImportError:
        print("   requests module not available")
        print("   Install with: pip install requests")
    except Exception as e:
        print(f"  Error: {str(e)}")
        print("   Make sure AI service is running: docker compose up dispatchai-ai")


def main():
    print("=== AI Summary Prompt Test ===\n")
    
    # 1. Format conversation
    print("1. Formatted conversation content:")
    conversation_text = format_conversation_for_ai(test_conversation)
    print(conversation_text)
    print("\n" + "="*50 + "\n")
    
    # 2. Generate AI prompt
    print("2. Generated AI Prompt:")
    prompt = create_summary_prompt(conversation_text, test_service_info)
    print(prompt)
    print("\n" + "="*50 + "\n")
    
    # 3. Show prompt statistics
    print("3. Prompt Statistics:")
    print(f"   - Character count: {len(prompt)}")
    print(f"   - Line count: {len(prompt.split(chr(10)))}")
    print(f"   - Conversation turns: {len(test_conversation)}")
    print("\n" + "="*50 + "\n")
    
    # 4. Test actual AI summary generation
    test_ai_summary_endpoint()

if __name__ == "__main__":
    main()