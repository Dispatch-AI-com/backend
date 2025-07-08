"""
AI客户服务工作流控制器 - 重构版本

专注于工作流控制和业务逻辑处理，提示词和验证功能已解耦到独立模块。

主要职责：
- 管理客户信息收集工作流
- 处理对话状态和转换
- 协调LLM交互和数据验证
- 管理Redis数据更新
- 处理异常和错误恢复

架构说明：
- 提示词模块：app.prompt.customer_info_prompts
- 验证模块：app.validate.customer_validators
- 工作流控制：本文件(chatr2v3.py)
"""

import json
import os
import re
from datetime import datetime
from typing import TypedDict, Literal, Optional
from openai import OpenAI

# 导入解耦后的模块
from .retrieve.customer_info_extractors import (
    extract_name_from_conversation,
    extract_phone_from_conversation,
    extract_address_from_conversation,
    extract_email_from_conversation,
    extract_service_from_conversation,
    extract_time_from_conversation
)

from .validate.customer_validators import (
    validate_name,
    validate_phone,
    validate_address,
    validate_email,
    validate_service,
    validate_time
)

from .redis_client import (
    update_user_info_field,
    update_service_selection,
    update_conversation_history,
    update_booking_status
)

from .models import Message


class CustomerServiceState(TypedDict):
    """客服系统状态定义"""
    # 用户信息
    name: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    email: Optional[str]  # 新增电子邮件字段
    service: Optional[str]  # 新增服务项目字段
    service_time: Optional[str]  # 新增服务时间字段
    
    # 流程控制
    current_step: Literal["collect_name", "collect_phone", "collect_address", "collect_email", "collect_service", "collect_time", "completed"]  # 更新状态流转
    name_attempts: int
    phone_attempts: int
    address_attempts: int
    email_attempts: int  # 新增邮箱尝试次数
    service_attempts: int  # 新增服务尝试次数
    time_attempts: int  # 新增时间尝试次数
    max_attempts: int
    service_max_attempts: int  # 新增服务最大尝试次数
    
    # 对话记录
    conversation_history: list
    
    # 最后的用户输入和LLM响应
    last_user_input: Optional[str]
    last_llm_response: Optional[dict]
    
    # 状态标记
    name_complete: bool
    phone_complete: bool
    address_complete: bool
    email_complete: bool  # 新增邮箱完成标记
    service_complete: bool  # 新增服务完成标记
    time_complete: bool  # 新增时间完成标记
    conversation_complete: bool
    service_available: bool  # 新增服务可用标记
    time_available: bool  # 新增时间可用标记
    
    # 时间戳
    name_timestamp: Optional[str]
    phone_timestamp: Optional[str]
    address_timestamp: Optional[str]
    email_timestamp: Optional[str]  # 新增邮箱时间戳
    service_timestamp: Optional[str]  # 新增服务时间戳
    time_timestamp: Optional[str]  # 新增服务时间时间戳


class CustomerServiceLangGraph:
    """客户服务工作流控制器
    
    主要负责管理整个客户信息收集流程，协调各个组件之间的交互。
    """
    
    def __init__(self, api_key=None):
        """初始化客服系统"""
        if api_key:
            self.client = OpenAI(api_key=api_key)
        else:
            self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # 创建LangGraph工作流 - 使用简化的方式
        self.workflow = None
        
    # ================== 对话管理函数 ==================
    
    def add_to_conversation(self, state: CustomerServiceState, role, content, call_sid: str = None):
        """添加对话记录并实时更新到Redis"""
        current_time = datetime.utcnow().isoformat() + "Z"
        
        # 本地状态更新
        state["conversation_history"].append({
            "role": role,
            "content": content,
            "timestamp": current_time
        })
        
        # 🆕 实时Redis更新
        if call_sid:
            # 确定消息发送者
            speaker = "customer" if role == "user" else "AI"
            
            # 创建Message对象
            message = Message(
                speaker=speaker,
                message=content,
                startedAt=current_time
            )
            
            # 实时更新对话历史到Redis
            redis_success = update_conversation_history(call_sid, message)
            
            if not redis_success:
                print(f"⚠️ 对话历史Redis更新失败，但继续处理: {speaker} - {content[:50]}...")
        
        return state

    # ================== 信息收集处理函数 ==================
    
    def process_name_collection(self, state: CustomerServiceState, call_sid: str = None):
        """处理姓名收集步骤"""
        # 添加用户输入到对话历史
        state = self.add_to_conversation(state, "user", state["last_user_input"], call_sid)
        
        # 调用LLM提取姓名
        result = extract_name_from_conversation(state)
        state["last_llm_response"] = result
        
        # 添加AI回复到对话历史
        state = self.add_to_conversation(state, "assistant", result["response"], call_sid)
        
        # 检查是否提取到姓名
        extracted_name = result["info_extracted"].get("name")
        is_complete = result["info_complete"]
        
        if is_complete and extracted_name and validate_name(extracted_name):
            # 清理和标准化姓名
            cleaned_name = extracted_name.strip()
            current_time = datetime.utcnow().isoformat() + "Z"
            
            # 本地状态更新
            state["name"] = cleaned_name
            state["name_timestamp"] = current_time
            state["name_complete"] = True
            state["current_step"] = "collect_phone"
            
            # 🆕 实时Redis更新
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid,
                    field_name="name", 
                    field_value=cleaned_name,
                    timestamp=current_time
                )
                
                if redis_success:
                    print(f"✅ 姓名提取并保存成功：{cleaned_name}")
                else:
                    print(f"⚠️ 姓名提取成功但Redis保存失败：{cleaned_name}")
            
            print(f"✅ 姓名收集完成：{cleaned_name}")
        else:
            # 增加尝试次数
            state["name_attempts"] += 1
            
            if state["name_attempts"] >= state["max_attempts"]:
                print(f"❌ 姓名收集失败，已达到最大尝试次数 ({state['max_attempts']})")
                state["current_step"] = "collect_phone"  # 跳到下一步骤
            else:
                print(f"⚠️ 姓名提取失败，尝试次数：{state['name_attempts']}/{state['max_attempts']}")
        
        return state

    def process_phone_collection(self, state: CustomerServiceState, call_sid: str = None):
        """处理电话收集步骤"""
        # 添加用户输入到对话历史
        state = self.add_to_conversation(state, "user", state["last_user_input"], call_sid)
        
        # 调用LLM提取电话
        result = extract_phone_from_conversation(state)
        state["last_llm_response"] = result
        
        # 添加AI回复到对话历史
        state = self.add_to_conversation(state, "assistant", result["response"], call_sid)
        
        # 检查是否提取到电话
        extracted_phone = result["info_extracted"].get("phone")
        is_complete = result["info_complete"]
        
        if is_complete and extracted_phone and validate_phone(extracted_phone):
            # 清理和标准化电话
            cleaned_phone = extracted_phone.strip()
            current_time = datetime.utcnow().isoformat() + "Z"
            
            # 本地状态更新
            state["phone"] = cleaned_phone
            state["phone_timestamp"] = current_time
            state["phone_complete"] = True
            state["current_step"] = "collect_address"
            
            # 🆕 实时Redis更新
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid,
                    field_name="phone",
                    field_value=cleaned_phone,
                    timestamp=current_time
                )
                
                if redis_success:
                    print(f"✅ 电话提取并保存成功：{cleaned_phone}")
                else:
                    print(f"⚠️ 电话提取成功但Redis保存失败：{cleaned_phone}")
            
            print(f"✅ 电话收集完成：{cleaned_phone}")
        else:
            # 增加尝试次数
            state["phone_attempts"] += 1
            
            if state["phone_attempts"] >= state["max_attempts"]:
                print(f"❌ 电话收集失败，已达到最大尝试次数 ({state['max_attempts']})")
                state["current_step"] = "collect_address"  # 跳到下一步骤
            else:
                print(f"⚠️ 电话提取失败，尝试次数：{state['phone_attempts']}/{state['max_attempts']}")
        
        return state

    def process_address_collection(self, state: CustomerServiceState, call_sid: str = None):
        """处理地址收集步骤"""
        # 添加用户输入到对话历史
        state = self.add_to_conversation(state, "user", state["last_user_input"], call_sid)
        
        # 调用LLM提取地址
        result = extract_address_from_conversation(state)
        state["last_llm_response"] = result
        
        # 添加AI回复到对话历史
        state = self.add_to_conversation(state, "assistant", result["response"], call_sid)
        
        # 检查是否提取到地址
        extracted_address = result["info_extracted"].get("address")
        is_complete = result["info_complete"]
        
        if is_complete and extracted_address and validate_address(extracted_address):
            # 清理和标准化地址
            cleaned_address = extracted_address.strip()
            current_time = datetime.utcnow().isoformat() + "Z"
            
            # 本地状态更新
            state["address"] = cleaned_address
            state["address_timestamp"] = current_time
            state["address_complete"] = True
            state["current_step"] = "collect_email"
            
            # 🆕 实时Redis更新
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid,
                    field_name="address",
                    field_value=cleaned_address,
                    timestamp=current_time
                )
                
                if redis_success:
                    print(f"✅ 地址提取并保存成功：{cleaned_address}")
                else:
                    print(f"⚠️ 地址提取成功但Redis保存失败：{cleaned_address}")
            
            print(f"✅ 地址收集完成：{cleaned_address}")
        else:
            # 增加尝试次数
            state["address_attempts"] += 1
            
            if state["address_attempts"] >= state["max_attempts"]:
                print(f"❌ 地址收集失败，已达到最大尝试次数 ({state['max_attempts']})")
                state["current_step"] = "collect_email"  # 跳到下一步骤
            else:
                print(f"⚠️ 地址提取失败，尝试次数：{state['address_attempts']}/{state['max_attempts']}")
        
        return state

    def process_email_collection(self, state: CustomerServiceState, call_sid: str = None):
        """处理电子邮件收集步骤"""
        # 添加用户输入到对话历史
        state = self.add_to_conversation(state, "user", state["last_user_input"], call_sid)
        
        # 调用LLM提取电子邮件
        result = extract_email_from_conversation(state)
        state["last_llm_response"] = result
        
        # 添加AI回复到对话历史
        state = self.add_to_conversation(state, "assistant", result["response"], call_sid)
        
        # 检查是否提取到电子邮件
        extracted_email = result["info_extracted"].get("email")
        is_complete = result["info_complete"]
        
        if is_complete and extracted_email and validate_email(extracted_email):
            # 清理和标准化电子邮件
            cleaned_email = extracted_email.strip()
            current_time = datetime.utcnow().isoformat() + "Z"
            
            # 本地状态更新
            state["email"] = cleaned_email
            state["email_timestamp"] = current_time
            state["email_complete"] = True
            state["current_step"] = "collect_service"
            
            # 🆕 实时Redis更新
            if call_sid:
                redis_success = update_user_info_field(
                    call_sid=call_sid,
                    field_name="email", 
                    field_value=cleaned_email,
                    timestamp=current_time
                )
                
                if redis_success:
                    print(f"✅ 电子邮件提取并保存成功：{cleaned_email}")
                else:
                    print(f"⚠️ 电子邮件提取成功但Redis保存失败：{cleaned_email}")
            
            print(f"✅ 电子邮件收集完成：{cleaned_email}")
        else:
            # 增加尝试次数
            state["email_attempts"] += 1
            
            if state["email_attempts"] >= state["max_attempts"]:
                print(f"❌ 电子邮件收集失败，已达到最大尝试次数 ({state['max_attempts']})")
                state["current_step"] = "collect_service"  # 跳到下一步骤
            else:
                print(f"⚠️ 电子邮件提取失败，尝试次数：{state['email_attempts']}/{state['max_attempts']}")
        
        return state

    def process_service_collection(self, state: CustomerServiceState, call_sid: str = None):
        """处理服务收集步骤"""
        # 添加用户输入到对话历史
        state = self.add_to_conversation(state, "user", state["last_user_input"], call_sid)
        
        # 调用LLM提取服务
        result = extract_service_from_conversation(state)
        state["last_llm_response"] = result
        
        # 添加AI回复到对话历史
        state = self.add_to_conversation(state, "assistant", result["response"], call_sid)
        
        # 检查是否提取到服务
        extracted_service = result["info_extracted"].get("service")
        is_complete = result["info_complete"]
        
        if is_complete and extracted_service:
            # 验证服务
            is_valid_input, service_available = validate_service(extracted_service)
            
            if is_valid_input:
                # 清理和标准化服务
                cleaned_service = extracted_service.strip().lower()
                current_time = datetime.utcnow().isoformat() + "Z"
                
                # 本地状态更新
                state["service"] = cleaned_service
                state["service_timestamp"] = current_time
                state["service_complete"] = True
                state["service_available"] = service_available
                state["current_step"] = "collect_time"
                
                # 🆕 实时Redis更新
                if call_sid:
                    redis_success = update_service_selection(
                        call_sid=call_sid,
                        service_name=cleaned_service,
                        timestamp=current_time
                    )
                    
                    if redis_success:
                        print(f"✅ 服务提取并保存成功：{cleaned_service}")
                    else:
                        print(f"⚠️ 服务提取成功但Redis保存失败：{cleaned_service}")
                
                print(f"✅ 服务收集完成：{cleaned_service}，可用性：{service_available}")
            else:
                print(f"⚠️ 服务验证失败：{extracted_service}")
                state["service_attempts"] += 1
        else:
            # 增加尝试次数
            state["service_attempts"] += 1
            
        # 检查是否超过最大尝试次数
        if state["service_attempts"] >= state["service_max_attempts"]:
            print(f"❌ 服务收集失败，已达到最大尝试次数 ({state['service_max_attempts']})")
            state["current_step"] = "collect_time"  # 跳到下一步骤
        elif state["service_attempts"] > 0 and not state["service_complete"]:
            print(f"⚠️ 服务提取失败，尝试次数：{state['service_attempts']}/{state['service_max_attempts']}")
        
        return state

    def process_time_collection(self, state: CustomerServiceState, call_sid: str = None):
        """处理时间收集步骤"""
        # 添加用户输入到对话历史
        state = self.add_to_conversation(state, "user", state["last_user_input"], call_sid)
        
        # 调用LLM提取时间
        result = extract_time_from_conversation(state)
        state["last_llm_response"] = result
        
        # 添加AI回复到对话历史
        state = self.add_to_conversation(state, "assistant", result["response"], call_sid)
        
        # 检查是否提取到时间
        extracted_time = result["info_extracted"].get("time")
        is_complete = result["info_complete"]
        
        if is_complete and extracted_time:
            # 验证时间
            is_valid_input, time_available = validate_time(extracted_time)
            
            if is_valid_input:
                # 清理和标准化时间
                cleaned_time = extracted_time.strip().lower()
                current_time = datetime.utcnow().isoformat() + "Z"
                
                # 本地状态更新
                state["service_time"] = cleaned_time
                state["time_timestamp"] = current_time
                state["time_complete"] = True
                state["time_available"] = time_available
                
                # 🆕 实时Redis更新
                if call_sid:
                    # 更新服务时间
                    redis_success = update_service_selection(
                        call_sid=call_sid,
                        service_name=state.get("service", ""),
                        service_time=cleaned_time,
                        timestamp=current_time
                    )
                    
                    if redis_success:
                        print(f"✅ 服务时间提取并保存成功：{cleaned_time}")
                    else:
                        print(f"⚠️ 服务时间提取成功但Redis保存失败：{cleaned_time}")
                    
                    # 如果时间可用，更新预订状态
                    if time_available:
                        state["conversation_complete"] = True
                        state["current_step"] = "completed"
                        update_booking_status(call_sid, is_booked=True, email_sent=False)
                        print("✅ 预订完成，所有信息收集成功")
                    else:
                        print("⚠️ 请求的时间不可用，但信息已收集")
                
                print(f"✅ 时间收集完成：{cleaned_time}，可用性：{time_available}")
            else:
                print(f"⚠️ 时间验证失败：{extracted_time}")
                state["time_attempts"] += 1
        else:
            # 增加尝试次数
            state["time_attempts"] += 1
            
        # 检查是否超过最大尝试次数
        if state["time_attempts"] >= state["max_attempts"]:
            print(f"❌ 时间收集失败，已达到最大尝试次数 ({state['max_attempts']})")
            state["conversation_complete"] = True
            state["current_step"] = "completed"
            
            # 即使时间收集失败，也标记为完成状态
            if call_sid:
                update_booking_status(call_sid, is_booked=False, email_sent=False)
                print("⚠️ 时间收集失败，但流程已完成")
        elif state["time_attempts"] > 0 and not state["time_complete"]:
            print(f"⚠️ 时间提取失败，尝试次数：{state['time_attempts']}/{state['max_attempts']}")
        
        return state

    # ================== 统一工作流入口函数 ==================
    
    def process_customer_workflow(self, state: CustomerServiceState, call_sid: str = None):
        """统一的客户信息收集工作流处理函数
        
        这是供外部API调用的主要入口点，负责根据当前状态自动判断
        应该执行哪个收集步骤，并返回更新后的状态。
        
        Args:
            state: 客户服务状态对象
            call_sid: 可选的通话ID，用于Redis实时更新
            
        Returns:
            CustomerServiceState: 更新后的状态对象
        """
        # 根据完成状态判断当前应该执行的步骤
        if not state["name_complete"]:
            state = self.process_name_collection(state, call_sid)
        elif not state["phone_complete"]:
            state = self.process_phone_collection(state, call_sid)
        elif not state["address_complete"]:
            state = self.process_address_collection(state, call_sid)
        elif not state["email_complete"]:
            state = self.process_email_collection(state, call_sid)
        elif not state["service_complete"]:
            state = self.process_service_collection(state, call_sid)
        elif not state["time_complete"]:
            state = self.process_time_collection(state, call_sid)
        else:
            # 所有信息收集完成
            state["conversation_complete"] = True
            state["current_step"] = "completed"
            print("✅ 所有客户信息收集完成")
        
        return state

    # ================== 实用工具函数 ==================
    
    def print_results(self, state: CustomerServiceState):
        """打印收集结果的摘要"""
        print("\\n" + "="*50)
        print("📋 客户信息收集结果摘要")
        print("="*50)
        
        # 基本信息
        print(f"👤 姓名: {state.get('name', '未收集')} {'✅' if state.get('name_complete') else '❌'}")
        print(f"📞 电话: {state.get('phone', '未收集')} {'✅' if state.get('phone_complete') else '❌'}")
        print(f"🏠 地址: {state.get('address', '未收集')} {'✅' if state.get('address_complete') else '❌'}")
        print(f"📧 邮箱: {state.get('email', '未收集')} {'✅' if state.get('email_complete') else '❌'}")
        
        # 服务信息
        service_status = ""
        if state.get('service_complete'):
            if state.get('service_available'):
                service_status = "✅ (可提供)"
            else:
                service_status = "⚠️ (不可提供)"
        else:
            service_status = "❌"
            
        time_status = ""
        if state.get('time_complete'):
            if state.get('time_available'):
                time_status = "✅ (可安排)"
            else:
                time_status = "⚠️ (不可安排)"
        else:
            time_status = "❌"
        
        print(f"🔧 服务: {state.get('service', '未收集')} {service_status}")
        print(f"⏰ 时间: {state.get('service_time', '未收集')} {time_status}")
        
        # 对话统计
        print(f"💬 对话轮数: {len(state.get('conversation_history', []))}")
        print(f"📊 当前步骤: {state.get('current_step', '未知')}")
        print(f"✅ 流程完成: {'是' if state.get('conversation_complete') else '否'}")
        
        # 尝试次数统计
        print("\\n📈 尝试次数统计:")
        print(f"  • 姓名: {state.get('name_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • 电话: {state.get('phone_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • 地址: {state.get('address_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • 邮箱: {state.get('email_attempts', 0)}/{state.get('max_attempts', 3)}")
        print(f"  • 服务: {state.get('service_attempts', 0)}/{state.get('service_max_attempts', 3)}")
        print(f"  • 时间: {state.get('time_attempts', 0)}/{state.get('max_attempts', 3)}")
        
        print("="*50)

    def save_to_file(self, state: CustomerServiceState, filename: str = None):
        """保存对话到文件"""
        if filename is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"customer_service_conversation_{timestamp}.json"
        
        # 准备保存的数据
        save_data = {
            "metadata": {
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "conversation_complete": state.get("conversation_complete", False),
                "total_messages": len(state.get("conversation_history", []))
            },
            "customer_info": {
                "name": state.get("name"),
                "phone": state.get("phone"),
                "address": state.get("address"),
                "email": state.get("email"),
                "service": state.get("service"),
                "service_time": state.get("service_time")
            },
            "collection_status": {
                "name_complete": state.get("name_complete", False),
                "phone_complete": state.get("phone_complete", False),
                "address_complete": state.get("address_complete", False),
                "email_complete": state.get("email_complete", False),
                "service_complete": state.get("service_complete", False),
                "time_complete": state.get("time_complete", False)
            },
            "conversation_history": state.get("conversation_history", []),
            "attempts": {
                "name_attempts": state.get("name_attempts", 0),
                "phone_attempts": state.get("phone_attempts", 0),
                "address_attempts": state.get("address_attempts", 0),
                "email_attempts": state.get("email_attempts", 0),
                "service_attempts": state.get("service_attempts", 0),
                "time_attempts": state.get("time_attempts", 0)
            }
        }
        
        try:
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(save_data, f, ensure_ascii=False, indent=2)
            print(f"✅ 对话已保存到文件: {filename}")
            return filename
        except Exception as e:
            print(f"❌ 保存文件失败: {e}")
            return None

    def start_conversation(self, initial_message: str = "你好！我是AI客服助手。请问您的姓名是什么？"):
        """启动对话流程 (用于独立测试)"""
        # 初始化状态
        state: CustomerServiceState = {
            "name": None,
            "phone": None,
            "address": None,
            "email": None,
            "service": None,
            "service_time": None,
            "current_step": "collect_name",
            "name_attempts": 0,
            "phone_attempts": 0,
            "address_attempts": 0,
            "email_attempts": 0,
            "service_attempts": 0,
            "time_attempts": 0,
            "max_attempts": 3,
            "service_max_attempts": 3,
            "conversation_history": [],
            "last_user_input": None,
            "last_llm_response": None,
            "name_complete": False,
            "phone_complete": False,
            "address_complete": False,
            "email_complete": False,
            "service_complete": False,
            "time_complete": False,
            "conversation_complete": False,
            "service_available": True,
            "time_available": True,
            "name_timestamp": None,
            "phone_timestamp": None,
            "address_timestamp": None,
            "email_timestamp": None,
            "service_timestamp": None,
            "time_timestamp": None,
        }
        
        print("🤖 AI客服助手已启动")
        print("💡 输入 'quit' 或 'exit' 退出对话")
        print("💡 输入 'status' 查看当前收集状态")
        print("💡 输入 'save' 保存对话到文件")
        print("-" * 50)
        
        # 添加初始消息
        state = self.add_to_conversation(state, "assistant", initial_message)
        print(f"🤖 AI: {initial_message}")
        
        # 主对话循环
        while not state["conversation_complete"]:
            try:
                # 获取用户输入
                user_input = input("\\n👤 您: ").strip()
                
                # 检查特殊命令
                if user_input.lower() in ['quit', 'exit']:
                    print("👋 感谢使用AI客服助手，再见！")
                    break
                elif user_input.lower() == 'status':
                    self.print_results(state)
                    continue
                elif user_input.lower() == 'save':
                    filename = self.save_to_file(state)
                    if filename:
                        print(f"📁 对话已保存: {filename}")
                    continue
                elif not user_input:
                    print("⚠️ 请输入有效内容")
                    continue
                
                # 设置用户输入
                state["last_user_input"] = user_input
                
                # 根据当前步骤处理
                if not state["name_complete"]:
                    state = self.process_name_collection(state)
                elif not state["phone_complete"]:
                    state = self.process_phone_collection(state)
                elif not state["address_complete"]:
                    state = self.process_address_collection(state)
                elif not state["email_complete"]:
                    state = self.process_email_collection(state)
                elif not state["service_complete"]:
                    state = self.process_service_collection(state)
                elif not state["time_complete"]:
                    state = self.process_time_collection(state)
                else:
                    state["conversation_complete"] = True
                
                # 显示AI回复
                if state["last_llm_response"]:
                    ai_response = state["last_llm_response"]["response"]
                    print(f"🤖 AI: {ai_response}")
                
                # 检查是否完成
                if state["conversation_complete"]:
                    print("\\n🎉 信息收集完成！")
                    self.print_results(state)
                    
                    # 询问是否保存
                    save_choice = input("\\n💾 是否保存对话记录？(y/n): ").strip().lower()
                    if save_choice in ['y', 'yes', '是']:
                        self.save_to_file(state)
                    
                    break
                    
            except KeyboardInterrupt:
                print("\\n\\n⚠️ 对话被中断")
                save_choice = input("💾 是否保存当前对话记录？(y/n): ").strip().lower()
                if save_choice in ['y', 'yes', '是']:
                    self.save_to_file(state)
                break
            except Exception as e:
                print(f"❌ 处理过程中出现错误：{e}")
                continue
        
        return state


# ================== 模块测试入口 ==================

if __name__ == "__main__":
    """模块测试入口"""
    print("🚀 启动AI客服系统测试...")
    
    # 创建客服实例
    cs_agent = CustomerServiceLangGraph()
    
    # 启动对话
    final_state = cs_agent.start_conversation()
    
    print("\\n📊 最终状态总结:")
    cs_agent.print_results(final_state)