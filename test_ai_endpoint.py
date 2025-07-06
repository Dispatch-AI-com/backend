#!/usr/bin/env python3
"""
通过HTTP请求测试AI端点的真实响应
需要AI服务运行: docker compose up dispatchai-ai
"""

import requests
import json

# 测试数据
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
    """测试AI summary端点"""
    url = "http://localhost:8000/api/ai/summary"
    
    try:
        print("🚀 发送请求到AI服务...")
        print(f"URL: {url}")
        print(f"数据: {json.dumps(test_data, indent=2)}")
        print("-" * 50)
        
        response = requests.post(url, json=test_data, timeout=30)
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI响应成功!")
            print(f"Summary: {result['summary']}")
            print(f"Key Points:")
            for i, point in enumerate(result['keyPoints'], 1):
                print(f"  {i}. {point}")
        else:
            print(f"❌ 请求失败: {response.status_code}")
            print(f"错误: {response.text}")
            
    except requests.exceptions.ConnectionError:
        print("❌ 无法连接AI服务")
        print("💡 请先运行: docker compose up dispatchai-ai")
    except Exception as e:
        print(f"❌ 请求错误: {str(e)}")

if __name__ == "__main__":
    test_ai_summary()