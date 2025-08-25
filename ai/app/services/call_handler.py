from __future__ import annotations

import json
import os
import re
import sys
from typing import Any, Dict, List, Literal, Optional, TypedDict

from openai import OpenAI
from langgraph.graph import END, START, StateGraph
from custom_types import CustomerServiceState
from .redis_service import (
    update_user_info_field,
    update_service_selection,
    update_booking_status,
    get_message_history,
)
from config import settings


# Helper function to create default CustomerServiceState
def create_default_customer_service_state() -> CustomerServiceState:
    """Create a default CustomerServiceState for initialization"""
    return {
        "name": None,
        "phone": None,
        "address": None,
        "service": None,
        "service_id": None,
        "service_price": None,
        "service_description": None,
        "available_services": [],
        "service_time": None,
        "service_time_mongodb": None,
        "current_step": "collect_name",
        "name_attempts": 0,
        "phone_attempts": 0,
        "address_attempts": 0,
        "service_attempts": 0,
        "time_attempts": 0,
        "max_attempts": 3,
        "service_max_attempts": 3,
        "last_user_input": None,
        "last_llm_response": None,
        "name_complete": False,
        "phone_complete": False,
        "address_complete": False,
        "service_complete": False,
        "time_complete": False,
        "conversation_complete": False,
        "service_available": True,
        "time_available": True,
    }


# Remove ConversationState - we'll use CustomerServiceState directly with LangGraph


PHONE_REGEX = re.compile(r"^\+?\d{7,15}$")


class CustomerServiceLangGraph:
    """Customer service workflow controller using LangGraph - 5-Step Workflow"""
    
    def __init__(self, api_key=None):
        """Initialize customer service system"""
        if api_key:
            self.client = OpenAI(api_key=api_key)
        else:
            self.client = OpenAI(api_key=settings.openai_api_key)
        
        # Build LangGraph workflow
        self.workflow = self._build_graph()
    
    def _build_graph(self):
        """Build the LangGraph workflow"""
        graph = StateGraph(CustomerServiceState)
        graph.add_node("conversation", self._smart_conversation_node)
        graph.add_edge(START, "conversation")
        graph.add_edge("conversation", END)
        return graph.compile()
    
    async def process_customer_workflow(self, state: CustomerServiceState, call_sid: Optional[str] = None):
        """Main entry point for external API calls"""
        # Add call_sid to state for Redis operations
        if call_sid:
            state = state.copy()  # Don't modify original
            state["call_sid"] = call_sid
        
        # Process through LangGraph directly with CustomerServiceState
        updated_state = self.workflow.invoke(state)
        
        return updated_state

    def _smart_conversation_node(self, state: CustomerServiceState) -> CustomerServiceState:
        """Smart conversation node with Redis integration"""
        user_input = state.get("last_user_input", "")
        call_sid = state.get("call_sid")
        
        # Get message history from Redis if call_sid is available
        message_history = []
        if call_sid:
            try:
                message_history = get_message_history(call_sid)
                print(f"🔍 Retrieved {len(message_history)} messages from Redis for call_sid: {call_sid}")
            except Exception as e:
                print(f"⚠️ Failed to get message history: {e}")
        
        # 动态确定缺失的信息（按优先级顺序）
        missing_fields = []
        if not state.get('name'): missing_fields.append('姓名')
        if not state.get('phone'): missing_fields.append('电话')
        if not state.get('address'): missing_fields.append('地址')
        if not state.get('service'): missing_fields.append('服务选择')
        if not state.get('service_time'): missing_fields.append('服务时间')
        
        # 动态状态显示
        name_status = state.get('name') or '未收集'
        phone_status = state.get('phone') or '未收集'
        address_status = state.get('address') or '未收集'
        service_status = state.get('service') or '未收集'
        service_time_status = state.get('service_time') or '未收集'
        missing_status = ', '.join(missing_fields) if missing_fields else '全部收集完成'
        
        # 获取可用服务列表
        available_services = state.get('available_services', [])
        services_text = ""
        if available_services:
            services_text = '\n'.join([
                f"- {service.get('name', service)}: ${service.get('price', 'N/A')}"
                if isinstance(service, dict) else f"- {service}"
                for service in available_services
            ])
        
        # 如果是第一次交互（没有用户输入），直接开始对话
        if not user_input:
            response_text = "你好！我需要收集一些基本信息来为您提供服务。请问你的姓名是？"
            state["last_llm_response"] = {
                "response": response_text,
                "info_extracted": {},
                "info_complete": False,
                "analysis": "Initial greeting"
            }
            return state
        
        system_prompt = f"""
        你是一个友好的服务预约助手。

        【当前收集状态】
        - 姓名：{name_status}
        - 电话：{phone_status}  
        - 地址：{address_status}
        - 服务选择：{service_status}
        - 服务时间：{service_time_status}
        - 还需收集：{missing_status}

        【可用服务列表】
        {services_text}

        【用户最新输入】
        "{user_input}"

        【对话策略】
        1. 收集顺序：姓名→电话→地址→服务选择→服务时间
        2. 如果成功提取到新信息，要确认并感谢，然后引导到下一个缺失字段
        3. 当需要收集服务选择时，先展示可用服务列表，然后让用户选择
        4. 服务时间支持多种格式：具体日期、时间段、相对时间等
        5. 保持对话自然流畅，避免机械提问
        6. 多个信息要逐一确认
        7. 电话号码格式：数字，可选前缀+，长度7-15位

        【输出格式】
        返回严格的JSON格式：
        {{
            "response": "基于当前状态的自然对话回应",
            "extracted": {{
                "name": "新提取的姓名或null",
                "phone": "新提取的电话或null", 
                "address": "新提取的地址或null",
                "service": "新提取的服务选择或null",
                "service_time": "新提取的服务时间或null"
            }},
            "next_action": "{'complete' if not missing_fields else 'continue'}",
            "show_services": {str('服务选择' in missing_fields and not state.get('service')).lower()}
        }}

        不要添加任何解释，只返回JSON。
        """

        try:
            resp = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    *message_history,  # Add message history to context
                    {"role": "user", "content": user_input}
                ],
                temperature=0.3,
                max_tokens=500,
            )
            text = resp.choices[0].message.content or ""
            data = _extract_first_json_blob(text) or {}
        except Exception as e:
            print(f"❌ OpenAI API call failed: {e}")
            data = {}
        
        # 处理LLM回应
        response_text = data.get("response", "抱歉，我没有理解。请再次提供信息。")
        extracted = data.get("extracted", {}) if isinstance(data, dict) else {}
        
        # 处理提取的信息并更新到 Redis
        redis_updates = {}
        info_extracted = {}
        
        # 处理提取的姓名
        name = extracted.get("name") if isinstance(extracted, dict) else None
        if name and not state.get("name"):
            cleaned_name = str(name).strip()
            state["name"] = cleaned_name
            state["name_complete"] = True
            redis_updates["name"] = cleaned_name
            info_extracted["name"] = cleaned_name
            
        # 处理提取的电话
        phone = extracted.get("phone") if isinstance(extracted, dict) else None
        if phone and not state.get("phone"):
            ok, normalized, error_msg = validate_and_normalize_phone(str(phone))
            if ok:
                state["phone"] = normalized
                state["phone_complete"] = True
                redis_updates["phone"] = normalized
                info_extracted["phone"] = normalized
            else:
                response_text = f"电话号码格式不正确。{error_msg or '请提供7-15位数字，可选前缀+。'}"
        
        # 处理提取的地址
        address = extracted.get("address") if isinstance(extracted, dict) else None
        if address and not state.get("address"):
            cleaned_address = str(address).strip()
            state["address"] = cleaned_address
            state["address_complete"] = True
            redis_updates["address"] = cleaned_address
            info_extracted["address"] = cleaned_address
            
        # 处理提取的服务选择
        service = extracted.get("service") if isinstance(extracted, dict) else None
        if service and not state.get("service"):
            service_name = str(service).strip()
            # 验证服务是否在可用列表中
            valid_service = False
            service_details = None
            
            for available_service in available_services:
                if isinstance(available_service, dict):
                    if available_service.get("name", "").lower() == service_name.lower():
                        valid_service = True
                        service_details = available_service
                        break
                elif str(available_service).lower() == service_name.lower():
                    valid_service = True
                    break
            
            if valid_service:
                state["service"] = service_name
                state["service_complete"] = True
                if service_details:
                    state["service_id"] = service_details.get("id")
                    state["service_price"] = service_details.get("price")
                info_extracted["service"] = service_name
                
                # Update service selection in Redis
                if call_sid and service_details:
                    try:
                        update_service_selection(
                            call_sid=call_sid,
                            service_name=service_name,
                            service_id=service_details.get("id"),
                            service_price=service_details.get("price"),
                            service_time=None,
                        )
                        print(f"✅ Service updated in Redis: {service_name}")
                    except Exception as e:
                        print(f"⚠️ Failed to update service in Redis: {e}")
            else:
                response_text = f"您选择的服务不在我们的服务列表中。请从以下服务中选择：\n{services_text}"
        
        # 处理提取的服务时间
        service_time = extracted.get("service_time") if isinstance(extracted, dict) else None
        if service_time and not state.get("service_time"):
            cleaned_time = str(service_time).strip()
            state["service_time"] = cleaned_time
            state["time_complete"] = True
            info_extracted["service_time"] = cleaned_time
            
            # Update service time in Redis if service is also selected
            if call_sid and state.get("service"):
                try:
                    update_service_selection(
                        call_sid=call_sid,
                        service_name=state["service"],
                        service_id=state.get("service_id"),
                        service_price=state.get("service_price"),
                        service_time=cleaned_time,
                    )
                    print(f"✅ Service time updated in Redis: {cleaned_time}")
                except Exception as e:
                    print(f"⚠️ Failed to update service time in Redis: {e}")
        
        # Update user info fields in Redis
        if call_sid:
            for field_name, field_value in redis_updates.items():
                try:
                    success = update_user_info_field(call_sid, field_name, field_value)
                    if success:
                        print(f"✅ Updated {field_name} in Redis: {field_value}")
                    else:
                        print(f"⚠️ Failed to update {field_name} in Redis")
                except Exception as e:
                    print(f"❌ Error updating {field_name} in Redis: {e}")
        
        # 判断是否完成收集
        all_complete = (state.get("name_complete") and 
                       state.get("phone_complete") and 
                       state.get("address_complete") and 
                       state.get("service_complete") and 
                       state.get("time_complete"))
        
        if all_complete:
            state["conversation_complete"] = True
            state["current_step"] = "completed"
            # Update booking status in Redis
            if call_sid:
                try:
                    update_booking_status(call_sid, is_booked=True, email_sent=False)
                    print("✅ Booking status updated in Redis: completed")
                except Exception as e:
                    print(f"⚠️ Failed to update booking status in Redis: {e}")
        
        # Set LLM response
        state["last_llm_response"] = {
            "response": response_text,
            "info_extracted": info_extracted,
            "info_complete": all_complete,
            "analysis": "LangGraph processing completed"
        }
        
        return state


def validate_and_normalize_phone(raw: str) -> tuple[bool, Optional[str], Optional[str]]:
    if raw is None:
        return False, None, "Empty phone number"
    # remove spaces, hyphens, parentheses
    cleaned = re.sub(r"[\s\-()]+", "", raw)
    if PHONE_REGEX.match(cleaned):
        return True, cleaned, None
    return False, None, "Phone must be digits only with optional leading +, length 7-15"


# Removed unused helper functions - simplified design


def _extract_first_json_blob(text: str) -> Optional[dict]:
    # Try to find the first {...} JSON object in the text and parse it
    try:
        import re as _re
        match = _re.search(r"\{[\s\S]*\}", text)
        if not match:
            return None
        return json.loads(match.group(0))
    except Exception:
        return None




# Removed print_latest_assistant - no longer needed with simplified design


async def main() -> None:
    """Main function for standalone testing - uses new class structure"""
    if not os.environ.get("OPENAI_API_KEY"):
        print("OPENAI_API_KEY is not set. Please export it and try again.")
        sys.exit(1)

    # Create customer service instance using the new class
    cs_agent = CustomerServiceLangGraph()

    # Initialize CustomerServiceState for standalone testing
    state: CustomerServiceState = create_default_customer_service_state()
    state.update({
        "available_services": [
            {"id": "cleaning", "name": "房屋清洁", "price": 100.0},
            {"id": "repair", "name": "维修服务", "price": 200.0},
            {"id": "garden", "name": "园艺服务", "price": 150.0}
        ]
    })

    print("🤖 AI Customer Service Assistant Started (LangGraph + Redis Integration)")
    print("💡 Type 'quit' or 'exit' to exit conversation")
    print("-" * 50)

    # Initial greeting
    state["last_user_input"] = ""  # Trigger initial greeting
    state = await cs_agent.process_customer_workflow(state, call_sid=None)
    
    if state.get("last_llm_response"):
        print(f"🤖 AI: {state['last_llm_response']['response']}")

    # Main conversation loop
    while not state.get("conversation_complete"):
        try:
            # Get user input
            user_input = input("\n👤 You: ").strip()
            
            # Check for exit commands
            if user_input.lower() in ["quit", "exit"]:
                print("👋 Thank you for using AI customer service assistant, goodbye!")
                break
            elif not user_input:
                print("⚠️ Please enter valid content")
                continue

            # Set user input and process
            state["last_user_input"] = user_input
            state = await cs_agent.process_customer_workflow(state, call_sid=None)
            
            # Display AI response
            if state.get("last_llm_response"):
                ai_response = state["last_llm_response"]["response"]
                print(f"🤖 AI: {ai_response}")

            # Check if completed
            if state.get("conversation_complete"):
                print("\n🎉 Information collection completed!")
                print("📋 Final collected information:")
                print(f"- 姓名: {state.get('name', 'Not collected')}")
                print(f"- 电话: {state.get('phone', 'Not collected')}")
                print(f"- 地址: {state.get('address', 'Not collected')}")
                print(f"- 服务: {state.get('service', 'Not collected')}")
                print(f"- 服务时间: {state.get('service_time', 'Not collected')}")
                break

        except KeyboardInterrupt:
            print("\n\n⚠️ Conversation interrupted")
            break
        except Exception as e:
            print(f"❌ Error occurred during processing: {e}")
            continue


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())


