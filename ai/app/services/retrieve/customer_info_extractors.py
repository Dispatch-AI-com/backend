"""
客户信息提取模块

负责从对话历史中提取客户信息，包括姓名、电话、地址、邮箱、服务类型和时间等。
所有提取函数都依赖于OpenAI API进行自然语言处理。

主要功能：
- 从对话历史中提取结构化的客户信息
- 支持多种信息类型的提取
- 统一的错误处理和降级机制
- 标准化的返回格式

依赖模块：
- app.prompt.customer_info_prompts: 获取提示词
- app.validate.customer_validators: 验证提取结果
"""

import json
import os
from typing import TypedDict, Optional
from openai import OpenAI

# 导入提示词模块
from ...utils.prompts.customer_info_prompts import (
    get_name_extraction_prompt,
    get_phone_extraction_prompt,
    get_address_extraction_prompt,
    get_email_extraction_prompt,
    get_service_extraction_prompt,
    get_time_extraction_prompt
)

# 导入验证模块
from ...utils.validators.customer_validators import (
    validate_name,
    validate_phone,
    validate_address,
    validate_email,
    validate_service,
    validate_time
)


class CustomerServiceState(TypedDict):
    """客服系统状态定义"""
    # 用户信息
    name: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    email: Optional[str]
    service: Optional[str]
    service_time: Optional[str]
    
    # 对话记录
    conversation_history: list
    
    # 最后的用户输入
    last_user_input: Optional[str]


def _get_openai_client():
    """获取OpenAI客户端实例"""
    return OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def _build_conversation_context(state: CustomerServiceState) -> str:
    """构建对话上下文"""
    return "\\n".join([
        f"{'用户' if msg['role'] == 'user' else '客服'}: {msg['content']}" 
        for msg in state["conversation_history"][-3:]
    ])


def _call_openai_api(prompt: str, conversation_context: str, user_input: str) -> dict:
    """调用OpenAI API的通用函数"""
    client = _get_openai_client()
    
    response = client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": prompt},
            {"role": "user", "content": f"对话历史：{conversation_context}\\n\\n当前用户输入：{user_input}"}
        ],
        temperature=0.3,
        max_tokens=500
    )
    
    content = response.choices[0].message.content.strip()
    
    try:
        return json.loads(content)
    except json.JSONDecodeError:
        return None


def extract_name_from_conversation(state: CustomerServiceState) -> dict:
    """使用LLM提取姓名信息"""
    try:
        conversation_context = _build_conversation_context(state)
        prompt = get_name_extraction_prompt()
        
        result = _call_openai_api(prompt, conversation_context, state['last_user_input'])
        
        if result:
            return result
        else:
            print(f"⚠️  JSON解析失败")
            return {
                "response": "抱歉，系统处理出现问题。请重新告诉我您的姓名。",
                "info_extracted": {"name": None},
                "info_complete": False,
                "analysis": "系统解析错误"
            }
            
    except Exception as e:
        print(f"❌ API调用失败：{e}")
        return {
            "response": "抱歉，系统暂时无法处理您的请求。请重新告诉我您的姓名。",
            "info_extracted": {"name": None},
            "info_complete": False,
            "analysis": f"API错误：{str(e)}"
        }


def extract_phone_from_conversation(state: CustomerServiceState) -> dict:
    """使用LLM提取电话信息"""
    try:
        conversation_context = _build_conversation_context(state)
        prompt = get_phone_extraction_prompt()
        
        result = _call_openai_api(prompt, conversation_context, state['last_user_input'])
        
        if result:
            return result
        else:
            print(f"⚠️  JSON解析失败")
            return {
                "response": "抱歉，系统处理出现问题。请重新告诉我您的电话号码。",
                "info_extracted": {"phone": None},
                "info_complete": False,
                "analysis": "系统解析错误"
            }
            
    except Exception as e:
        print(f"❌ API调用失败：{e}")
        return {
            "response": "抱歉，系统暂时无法处理您的请求。请重新告诉我您的电话号码。",
            "info_extracted": {"phone": None},
            "info_complete": False,
            "analysis": f"API错误：{str(e)}"
        }


def extract_address_from_conversation(state: CustomerServiceState) -> dict:
    """使用LLM提取地址信息"""
    try:
        conversation_context = _build_conversation_context(state)
        prompt = get_address_extraction_prompt()
        
        result = _call_openai_api(prompt, conversation_context, state['last_user_input'])
        
        if result:
            return result
        else:
            print(f"⚠️  JSON解析失败")
            return {
                "response": "抱歉，系统处理出现问题。请重新告诉我您的地址。",
                "info_extracted": {"address": None},
                "info_complete": False,
                "analysis": "系统解析错误"
            }
            
    except Exception as e:
        print(f"❌ API调用失败：{e}")
        return {
            "response": "抱歉，系统暂时无法处理您的请求。请重新告诉我您的地址。",
            "info_extracted": {"address": None},
            "info_complete": False,
            "analysis": f"API错误：{str(e)}"
        }


def extract_email_from_conversation(state: CustomerServiceState) -> dict:
    """使用LLM提取电子邮件信息"""
    try:
        conversation_context = _build_conversation_context(state)
        prompt = get_email_extraction_prompt()
        
        result = _call_openai_api(prompt, conversation_context, state['last_user_input'])
        
        if result:
            return result
        else:
            print(f"⚠️  JSON解析失败")
            return {
                "response": "抱歉，系统处理出现问题。请重新告诉我您的电子邮件地址。",
                "info_extracted": {"email": None},
                "info_complete": False,
                "analysis": "系统解析错误"
            }
            
    except Exception as e:
        print(f"❌ API调用失败：{e}")
        return {
            "response": "抱歉，系统暂时无法处理您的请求。请重新告诉我您的电子邮件地址。",
            "info_extracted": {"email": None},
            "info_complete": False,
            "analysis": f"API错误：{str(e)}"
        }


def extract_service_from_conversation(state: CustomerServiceState) -> dict:
    """使用LLM提取服务需求信息"""
    try:
        conversation_context = _build_conversation_context(state)
        prompt = get_service_extraction_prompt()
        
        result = _call_openai_api(prompt, conversation_context, state['last_user_input'])
        
        if result:
            return result
        else:
            print(f"⚠️  JSON解析失败")
            return {
                "response": "抱歉，系统处理出现问题。请重新告诉我您需要什么服务。",
                "info_extracted": {"service": None},
                "info_complete": False,
                "analysis": "系统解析错误"
            }
            
    except Exception as e:
        print(f"❌ API调用失败：{e}")
        return {
            "response": "抱歉，系统暂时无法处理您的请求。请重新告诉我您需要什么服务。",
            "info_extracted": {"service": None},
            "info_complete": False,
            "analysis": f"API错误：{str(e)}"
        }


def extract_time_from_conversation(state: CustomerServiceState) -> dict:
    """使用LLM提取服务时间信息"""
    try:
        conversation_context = _build_conversation_context(state)
        prompt = get_time_extraction_prompt()
        
        result = _call_openai_api(prompt, conversation_context, state['last_user_input'])
        
        if result:
            return result
        else:
            print(f"⚠️  JSON解析失败")
            return {
                "response": "抱歉，系统处理出现问题。请重新告诉我您期望的服务时间。",
                "info_extracted": {"time": None},
                "info_complete": False,
                "analysis": "系统解析错误"
            }
            
    except Exception as e:
        print(f"❌ API调用失败：{e}")
        return {
            "response": "抱歉，系统暂时无法处理您的请求。请重新告诉我您期望的服务时间。",
            "info_extracted": {"time": None},
            "info_complete": False,
            "analysis": f"API错误：{str(e)}"
        }