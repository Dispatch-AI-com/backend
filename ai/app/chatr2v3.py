#目前融合前端的代码，需要更新的
#1.ai response message要精简，现在的内容太复杂了。
#2.redis update内容要对齐
#3.还没有问询用户的电子邮件
#4.目前的步骤是先获取用户所有的信息之后，每一步都update state，但是最后都完成之后才更新到redis里边。
'''虽然 extract_name_from_conversation 函数理论上不会返回 None，但是：
可能gpt-4o-mini模型的响应格式与预期不符
JSON解析可能出现意外情况
在异常处理中可能有遗漏的情况
'''
import json
import os
import re
from datetime import datetime
from typing import TypedDict, Literal, Optional
from openai import OpenAI
#from langgraph.graph import StateGraph, END

class CustomerServiceState(TypedDict):
    """客服系统状态定义"""
    # 用户信息
    name: Optional[str]
    phone: Optional[str]
    address: Optional[str]
    service: Optional[str]  # 新增服务项目字段
    service_time: Optional[str]  # 新增服务时间字段
    
    # 流程控制
    current_step: Literal["collect_name", "collect_phone", "collect_address", "collect_service", "collect_time", "completed"]  # 更新状态流转
    name_attempts: int
    phone_attempts: int
    address_attempts: int
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
    service_complete: bool  # 新增服务完成标记
    time_complete: bool  # 新增时间完成标记
    conversation_complete: bool
    service_available: bool  # 新增服务可用标记
    time_available: bool  # 新增时间可用标记
    
    # 时间戳
    name_timestamp: Optional[str]
    phone_timestamp: Optional[str]
    address_timestamp: Optional[str]
    service_timestamp: Optional[str]  # 新增服务时间戳
    time_timestamp: Optional[str]  # 新增服务时间时间戳

class CustomerServiceLangGraph:
    def __init__(self, api_key=None):
        """初始化客服系统"""
        if api_key:
            self.client = OpenAI(api_key=api_key)
        else:
            self.client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        
        # 创建LangGraph工作流 - 使用简化的方式
        self.workflow = None
        
    def get_name_extraction_prompt(self):
        """获取姓名提取的系统提示词"""
        return """你是一个专业的客服助手。你的任务是：
1. 与用户进行自然友好的对话
2. 收集用户的姓名信息，而不是用户提到的他人的姓名。
3. 严格按照JSON格式返回结果

请务必按照以下JSON格式回复，不要添加任何其他内容：
{
  "response": "你要说给用户的话",
  "info_extracted": {
    "name": "提取到的姓名，如果没有提取到则为null"
  },
  "info_complete": true/false,
  "analysis": "简短分析用户输入是否包含用户自己的有效姓名"
}

规则：
- 如果用户提供了有效的中文或英文姓名，将info_complete设为true
- 如果用户没有提供自己的姓名或提供的不是姓名（如数字、符号等），将info_complete设为false
- response字段要自然友好，符合客服语气
- 姓名应该是合理的人名，不接受明显的假名或无意义字符，必须是用户自己的名字，而不是第三方的名字。
- 分析用户输入内容，判断是否真的包含姓名信息"""

    def get_phone_extraction_prompt(self):
        """获取电话提取的系统提示词"""
        return """你是一个专业的客服助手。你的任务是：
1. 与用户进行自然友好的对话
2. 收集用户的电话号码信息
3. 严格按照JSON格式返回结果

请务必按照以下JSON格式回复，不要添加任何其他内容：
{
  "response": "你要说给用户的话",
  "info_extracted": {
    "phone": "提取到的电话号码，如果没有提取到则为null"
  },
  "info_complete": true/false,
  "analysis": "简短分析用户输入是否包含有效澳洲电话号码"
}

规则：
- 只接受澳洲手机号格式：04XXXXXXXX 或 +614XXXXXXXX 或 0061XXXXXXXXX 或 614XXXXXXXX
- 不接受其他国家的电话号码格式（如中国的138xxxxxxxx、美国的+1xxxxxxxxxx等）
- 如果用户提供了澳洲格式的有效电话号码，将info_complete设为true
- 如果用户提供的不是澳洲格式电话号码，将info_complete设为false，并友善地说明只接受澳洲号码
- response字段要自然友好，符合客服语气
- 严格验证电话号码格式，只有符合澳洲格式的才认为有效"""

    def get_address_extraction_prompt(self):
        """获取地址提取的系统提示词"""
        return """你是一个专业的客服助手。你的任务是：
1. 与用户进行自然友好的对话
2. 收集用户的澳大利亚地址信息
3. 严格按照JSON格式返回结果

请务必按照以下JSON格式回复，不要添加任何其他内容：
{
  "response": "你要说给用户的话",
  "info_extracted": {
    "address": "提取到的完整地址，如果没有提取到则为null"
  },
  "info_complete": true/false,
  "analysis": "简短分析用户输入是否包含有效澳洲地址"
}

规则：
- 地址必须包含：街道号码、街道名称、城市/区域、州/领地、邮编
- 只接受澳大利亚地址格式
- 邮编必须是有效的澳大利亚邮编（4位数字）
- 州/领地必须是以下之一：NSW, VIC, QLD, WA, SA, TAS, NT, ACT
- 如果用户提供了完整的澳洲格式地址，将info_complete设为true
- 如果地址信息不完整或不符合澳洲格式，将info_complete设为false
- response字段要自然友好，引导用户提供完整地址信息
- 分析用户输入是否包含所有必要的地址组成部分"""

    def get_service_extraction_prompt(self):
        """获取服务需求提取的系统提示词"""
        return """你是一个专业的客服助手。你的任务是：
1. 与用户进行自然友好的对话
2. 理解并提取用户需要的服务类型
3. 严格按照JSON格式返回结果

请务必按照以下JSON格式回复，不要添加任何其他内容：
{
  "response": "你要说给用户的话",
  "info_extracted": {
    "service": "提取到的服务类型，如果没有提取到则为null"
  },
  "info_complete": true/false,
  "analysis": "简短分析用户需要的服务是否在支持范围内"
}

规则：
- 目前支持的服务类型仅限于：clean（清洁）, garden（园艺）, plumber（水管工）
- 如果用户提到的服务在支持范围内，将info_complete设为true
- 如果用户提到的服务不在支持范围内，将info_complete设为false
- response字段要自然友好，说明是否能提供相应服务
- 如果服务不可用，友善地解释并表示会通知用户
- 分析用户输入，准确判断所需服务类型"""

    def get_time_extraction_prompt(self):
        """获取服务时间提取的系统提示词"""
        return """你是一个专业的客服助手。你的任务是：
1. 与用户进行自然友好的对话
2. 理解并提取用户期望的服务时间
3. 严格按照JSON格式返回结果

请务必按照以下JSON格式回复，不要添加任何其他内容：
{
  "response": "你要说给用户的话",
  "info_extracted": {
    "time": "提取到的服务时间，如果没有提取到则为null"
  },
  "info_complete": true/false,
  "analysis": "简短分析用户期望的服务时间是否在可提供范围内"
}

规则：
- 目前支持的服务时间仅限于：tomorrow morning, Saturday morning, Sunday afternoon
- 如果用户提到的时间在支持范围内，将info_complete设为true
- 如果用户提到的时间不在支持范围内，将info_complete设为false
- response字段要自然友好，说明是否能在该时间提供服务
- 如果时间不可用，友善地解释并表示会通知用户下周可用时间
- 分析用户输入，准确判断所需服务时间"""

    def validate_service(self, service):
        """验证服务类型的有效性"""
        if not service or service.strip() == "":
            return False, False
        
        service = service.strip().lower()
        
        # 支持的服务类型列表
        supported_services = ['clean', 'garden', 'plumber']
        
        # 检查服务是否在支持列表中
        service_available = service in supported_services
        
        return True, service_available

    def validate_time(self, service_time):
        """验证服务时间的有效性"""
        if not service_time or service_time.strip() == "":
            return False, False
        
        service_time = service_time.strip().lower()
        
        # 支持的服务时间列表
        supported_times = ['tomorrow morning', 'saturday morning', 'sunday afternoon']
        
        # 检查时间是否在支持列表中
        time_available = service_time in supported_times
        
        return True, time_available

    def extract_service_from_conversation(self, state: CustomerServiceState):
        """使用LLM提取服务需求信息"""
        try:
            # 构建对话历史
            conversation_context = "\n".join([
                f"{'用户' if msg['role'] == 'user' else '客服'}: {msg['content']}" 
                for msg in state["conversation_history"][-3:]
            ])
            
            # 调用OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.get_service_extraction_prompt()}, #注意role system是从系统角度出发给LLM的设定、条件和约束，比如“你是一个CS架构师”这个设定就应该是一个role system，也不会在终端客户的输入中出现。
                    {"role": "user", "content": f"对话历史：{conversation_context}\n\n当前用户输入：{state['last_user_input']}"} #此时的user的input就是完全的用户的输入。
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            
            try:
                result = json.loads(content)
                return result
            except json.JSONDecodeError:
                print(f"⚠️  JSON解析失败，原始回复：{content}")
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

    def extract_name_from_conversation(self, state: CustomerServiceState):
        """使用LLM提取姓名信息"""
        try:
            # 构建对话历史
            conversation_context = "\n".join([
                f"{'用户' if msg['role'] == 'user' else '客服'}: {msg['content']}" 
                for msg in state["conversation_history"][-3:]
            ])
            
            # 调用OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.get_name_extraction_prompt()},
                    {"role": "user", "content": f"对话历史：{conversation_context}\n\n当前用户输入：{state['last_user_input']}"}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            
            try:
                result = json.loads(content)
                return result
            except json.JSONDecodeError:
                print(f"⚠️  JSON解析失败，原始回复：{content}")
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

    def extract_phone_from_conversation(self, state: CustomerServiceState):
        """使用LLM提取电话信息"""
        try:
            # 构建对话历史
            conversation_context = "\n".join([
                f"{'用户' if msg['role'] == 'user' else '客服'}: {msg['content']}" 
                for msg in state["conversation_history"][-3:]
            ])
            
            # 调用OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.get_phone_extraction_prompt()},
                    {"role": "user", "content": f"对话历史：{conversation_context}\n\n当前用户输入：{state['last_user_input']}"}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            
            try:
                result = json.loads(content)
                return result
            except json.JSONDecodeError:
                print(f"⚠️  JSON解析失败，原始回复：{content}")
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

    def validate_name(self, name):
        """验证姓名的有效性"""
        if not name or name.strip() == "":
            return False
        
        name = name.strip()
        
        if len(name) < 1 or len(name) > 50:
            return False
            
        invalid_chars = ['@', '#', '$', '%', '^', '&', '*', '(', ')', '=', '+', '{', '}', '[', ']']
        if any(char in name for char in invalid_chars):
            return False
            
        if name.isdigit():
            return False
            
        return True

    def validate_phone(self, phone):
        """验证电话号码的有效性（仅支持澳洲格式）"""
        if not phone or phone.strip() == "":
            return False
        
        phone = phone.strip()
        
        # 澳洲手机号格式
        australian_patterns = [
            r'^04\d{8}$',  # 04XXXXXXXX
            r'^\+614\d{8}$',  # +614XXXXXXXX
            r'^00614\d{8}$',  # 00614XXXXXXXX
            r'^614\d{8}$',  # 614XXXXXXXX
        ]
        
        # 只使用澳洲格式，不再支持通用格式
        all_patterns = australian_patterns
        
        # 清理电话号码（移除空格、连字符等）
        cleaned_phone = re.sub(r'[\s\-\(\)]', '', phone)
        
        for pattern in all_patterns:
            if re.match(pattern, cleaned_phone):
                return True
                
        return False

    def validate_address(self, address):
        """验证澳大利亚地址的有效性"""
        if not address or address.strip() == "":
            return False
        
        address = address.strip()
        
        # 验证基本长度
        if len(address) < 5 or len(address) > 200:  # 降低最小长度要求
            return False
        
        # 验证是否包含必要组成部分
        required_components = [
            r'\d+',  # 街道号码
            r'[A-Za-z\s]+(Street|St|Road|Rd|Avenue|Ave|Drive|Dr|Lane|Ln|Place|Pl|Way|Parade|Pde|Circuit|Cct|Close|Cl)',  # 扩展街道类型
            r'[A-Za-z\s]+',  # 城市/区域名称 - 更灵活的匹配
            r'(NSW|VIC|QLD|WA|SA|TAS|NT|ACT)',  # 州/领地
            r'\d{4}'  # 邮编
        ]
        
        # 将地址转换为大写以进行不区分大小写的匹配
        upper_address = address.upper()
        
        # 检查每个必要组成部分是否存在
        matches = 0
        for pattern in required_components:
            if re.search(pattern, upper_address, re.IGNORECASE):
                matches += 1
        
        # 如果匹配到至少4个组成部分，则认为地址有效
        # 这样可以允许一些灵活性，比如街道类型的缩写可能不在我们的列表中
        return matches >= 4

    def extract_address_from_conversation(self, state: CustomerServiceState):
        """使用LLM提取地址信息"""
        try:
            # 构建对话历史
            conversation_context = "\n".join([
                f"{'用户' if msg['role'] == 'user' else '客服'}: {msg['content']}" 
                for msg in state["conversation_history"][-3:]
            ])
            
            # 调用OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.get_address_extraction_prompt()},
                    {"role": "user", "content": f"对话历史：{conversation_context}\n\n当前用户输入：{state['last_user_input']}"}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            
            try:
                result = json.loads(content)
                return result
            except json.JSONDecodeError:
                print(f"⚠️  JSON解析失败，原始回复：{content}")
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

    def extract_time_from_conversation(self, state: CustomerServiceState):
        """使用LLM提取服务时间信息"""
        try:
            # 构建对话历史
            conversation_context = "\n".join([
                f"{'用户' if msg['role'] == 'user' else '客服'}: {msg['content']}" 
                for msg in state["conversation_history"][-3:]
            ])
            
            # 调用OpenAI API
            response = self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": self.get_time_extraction_prompt()},
                    {"role": "user", "content": f"对话历史：{conversation_context}\n\n当前用户输入：{state['last_user_input']}"}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            
            try:
                result = json.loads(content)
                return result
            except json.JSONDecodeError:
                print(f"⚠️  JSON解析失败，原始回复：{content}")
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

    def add_to_conversation(self, state: CustomerServiceState, role, content):
        """添加对话到历史记录"""
        state["conversation_history"].append({
            "role": role,
            "content": content,
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        })

    def process_name_collection(self, state: CustomerServiceState):
        """处理姓名收集逻辑"""
        if not state["last_user_input"]:
            return state
            
        print("🔄 正在处理您的消息...")
        result = self.extract_name_from_conversation(state)
        
        # 检查result是否为None
        if result is None:
            print("⚠️  系统处理出现问题，请重新输入您的姓名。")
            state["name_attempts"] += 1
            return state
            
        state["last_llm_response"] = result
        
        # 显示AI回复
        ai_response = result.get("response", "抱歉，我没有理解您的意思。")
        print(f"🤖 客服：{ai_response}")
        self.add_to_conversation(state, "assistant", ai_response)
        
        # 显示分析结果
        analysis = result.get("analysis", "")
        if analysis:
            print(f"💭 系统分析：{analysis}")
        
        # 检查是否提取到有效姓名
        info_extracted = result.get("info_extracted", {})
        extracted_name = info_extracted.get("name") if info_extracted else None
        is_complete = result.get("info_complete", False)
        
        if is_complete and extracted_name and self.validate_name(extracted_name):
            # 成功提取到姓名
            state["name"] = extracted_name.strip()
            state["name_timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            state["name_complete"] = True
            state["current_step"] = "collect_phone"
            
            print(f"✅ 姓名提取成功：{extracted_name}")
        else:
            # 未能提取到有效姓名
            if extracted_name:
                print(f"⚠️  提取到的姓名可能无效：{extracted_name}")
            state["name_attempts"] += 1
        
        return state

    def process_phone_collection(self, state: CustomerServiceState):
        """处理电话收集逻辑"""
        if not state["last_user_input"]:
            return state
            
        print("🔄 正在处理您的电话号码...")
        result = self.extract_phone_from_conversation(state)
        
        # 检查result是否为None
        if result is None:
            print("⚠️  系统处理出现问题，请重新输入您的电话号码。")
            state["phone_attempts"] += 1
            return state
            
        state["last_llm_response"] = result
        
        # 显示AI回复
        ai_response = result.get("response", "抱歉，我没有理解您的电话号码。")
        print(f"🤖 客服：{ai_response}")
        self.add_to_conversation(state, "assistant", ai_response)
        
        # 显示分析结果
        analysis = result.get("analysis", "")
        if analysis:
            print(f"💭 系统分析：{analysis}")
        
        # 检查是否提取到有效电话
        info_extracted = result.get("info_extracted", {})
        extracted_phone = info_extracted.get("phone") if info_extracted else None
        is_complete = result.get("info_complete", False)
        
        if is_complete and extracted_phone and self.validate_phone(extracted_phone):
            # 成功提取到电话
            state["phone"] = extracted_phone.strip()
            state["phone_timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            state["phone_complete"] = True
            state["current_step"] = "collect_address"  # 修改为进入地址收集步骤
            
            print(f"✅ 电话提取成功：{extracted_phone}")
        else:
            # 未能提取到有效电话
            if extracted_phone:
                print(f"⚠️  提取到的电话可能无效：{extracted_phone}")
            state["phone_attempts"] += 1
        
        return state

    def process_address_collection(self, state: CustomerServiceState):
        """处理地址收集逻辑"""
        if not state["last_user_input"]:
            return state
            
        print("🔄 正在处理您的地址信息...")
        result = self.extract_address_from_conversation(state)
        
        # 检查result是否为None
        if result is None:
            print("⚠️  系统处理出现问题，请重新输入您的地址。")
            state["address_attempts"] += 1
            return state
            
        state["last_llm_response"] = result
        
        # 显示AI回复
        ai_response = result.get("response", "抱歉，我没有理解您的地址。")
        print(f"🤖 客服：{ai_response}")
        self.add_to_conversation(state, "assistant", ai_response)
        
        # 显示分析结果
        analysis = result.get("analysis", "")
        if analysis:
            print(f"💭 系统分析：{analysis}")
        
        # 检查是否提取到有效地址
        info_extracted = result.get("info_extracted", {})
        extracted_address = info_extracted.get("address") if info_extracted else None
        is_complete = result.get("info_complete", False)
        
        if is_complete and extracted_address and self.validate_address(extracted_address):
            # 成功提取到地址
            state["address"] = extracted_address.strip()
            state["address_timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            state["address_complete"] = True
            state["current_step"] = "collect_service"  # 修改为进入服务收集步骤
            
            print(f"✅ 地址提取成功：{extracted_address}")
        else:
            # 未能提取到有效地址
            if extracted_address:
                print(f"⚠️  提取到的地址可能无效：{extracted_address}")
            state["address_attempts"] += 1
        
        return state

    def process_service_collection(self, state: CustomerServiceState):
        """处理服务需求收集逻辑"""
        if not state["last_user_input"]:
            return state
            
        print("🔄 正在处理您的服务需求...")
        result = self.extract_service_from_conversation(state)
        
        # 检查result是否为None
        if result is None:
            print("⚠️  系统处理出现问题，请重新告诉我您需要什么服务。")
            state["service_attempts"] += 1
            return state
            
        state["last_llm_response"] = result
        
        # 显示AI回复
        ai_response = result.get("response", "抱歉，我没有理解您需要的服务。")
        print(f"🤖 客服：{ai_response}")
        self.add_to_conversation(state, "assistant", ai_response)
        
        # 显示分析结果
        analysis = result.get("analysis", "")
        if analysis:
            print(f"💭 系统分析：{analysis}")
        
        # 检查是否提取到有效服务
        info_extracted = result.get("info_extracted", {})
        extracted_service = info_extracted.get("service") if info_extracted else None
        is_complete = result.get("info_complete", False)
        
        if is_complete and extracted_service:
            # 验证服务有效性和可用性
            is_valid, is_available = self.validate_service(extracted_service)
            
            if is_valid:
                state["service"] = extracted_service.strip().lower()
                state["service_timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                state["service_complete"] = True
                state["service_available"] = is_available
                state["current_step"] = "collect_time"  # 修改为进入时间收集步骤
                
                if is_available:
                    print(f"✅ 服务需求提取成功：{extracted_service}")
                else:
                    print(f"❌ 服务暂不可用：{extracted_service}")
            else:
                print(f"⚠️  提取到的服务类型无效：{extracted_service}")
                state["service_attempts"] += 1
        else:
            # 未能提取到有效服务
            if extracted_service:
                print(f"⚠️  提取到的服务类型可能无效：{extracted_service}")
            state["service_attempts"] += 1
        
        return state

    def process_time_collection(self, state: CustomerServiceState):
        """处理服务时间收集逻辑"""
        if not state["last_user_input"]:
            return state
            
        print("🔄 正在处理您期望的服务时间...")
        result = self.extract_time_from_conversation(state)
        
        # 检查result是否为None
        if result is None:
            print("⚠️  系统处理出现问题，请重新告诉我您期望的服务时间。")
            state["time_attempts"] += 1
            return state
            
        state["last_llm_response"] = result
        
        # 显示AI回复
        ai_response = result.get("response", "抱歉，我没有理解您期望的服务时间。")
        print(f"🤖 客服：{ai_response}")
        self.add_to_conversation(state, "assistant", ai_response)
        
        # 显示分析结果
        analysis = result.get("analysis", "")
        if analysis:
            print(f"💭 系统分析：{analysis}")
        
        # 检查是否提取到有效时间
        info_extracted = result.get("info_extracted", {})
        extracted_time = info_extracted.get("time") if info_extracted else None
        is_complete = result.get("info_complete", False)
        
        if is_complete and extracted_time:
            # 验证时间有效性和可用性
            is_valid, is_available = self.validate_time(extracted_time)
            
            if is_valid:
                state["service_time"] = extracted_time.strip().lower()
                state["time_timestamp"] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                state["time_complete"] = True
                state["time_available"] = is_available
                state["current_step"] = "completed"
                state["conversation_complete"] = True
                
                if is_available:
                    print(f"✅ 服务时间提取成功：{extracted_time}")
                    print("🎉 信息收集完成！我们将安排服务人员与您电话联系具体细节。")
                else:
                    print(f"❌ 该时间段暂不可预约：{extracted_time}")
                    print("📱 我们会将下周可预约时间通过短信发送给您。")
            else:
                print(f"⚠️  提取到的服务时间无效：{extracted_time}")
                state["time_attempts"] += 1
        else:
            # 未能提取到有效时间
            if extracted_time:
                print(f"⚠️  提取到的服务时间可能无效：{extracted_time}")
            state["time_attempts"] += 1
        
        return state

    def print_results(self, state: CustomerServiceState):
        """打印最终收集到的信息"""
        print("\n" + "=" * 50)
        print("📋 最终收集结果")
        print("=" * 50)
        
        if state["name"]:
            print(f"✅ 客户姓名：{state['name']}")
            print(f"📅 姓名收集时间：{state['name_timestamp']}")
        else:
            print("❌ 未能成功收集到客户姓名")
        
        if state["phone"]:
            print(f"✅ 客户电话：{state['phone']}")
            print(f"📅 电话收集时间：{state['phone_timestamp']}")
        else:
            print("❌ 未能成功收集到客户电话")
            
        if state["address"]:
            print(f"✅ 客户地址：{state['address']}")
            print(f"📅 地址收集时间：{state['address_timestamp']}")
        else:
            print("❌ 未能成功收集到客户地址")
            
        if state["service"]:
            print(f"✅ 所需服务：{state['service']}")
            print(f"📅 服务收集时间：{state['service_timestamp']}")
            if state["service_available"]:
                print("✨ 服务状态：可提供")
                
                if state["service_time"]:
                    print(f"✅ 预约时间：{state['service_time']}")
                    print(f"📅 时间收集时间：{state['time_timestamp']}")
                    if state["time_available"]:
                        print("✨ 时间状态：可预约")
                    else:
                        print("❌ 时间状态：不可预约")
                else:
                    print("❌ 未能成功收集到预约时间")
            else:
                print("❌ 服务状态：暂不可用")
        else:
            print("❌ 未能成功收集到客户所需服务")
        
        print(f"💬 总对话轮数：{len(state['conversation_history'])}")
        print(f"🔄 姓名尝试次数：{state['name_attempts']}")
        print(f"🔄 电话尝试次数：{state['phone_attempts']}")
        print(f"🔄 地址尝试次数：{state['address_attempts']}")
        print(f"🔄 服务尝试次数：{state['service_attempts']}")
        print(f"🔄 时间尝试次数：{state['time_attempts']}")
        
        # 保存信息到文件
        self.save_to_file(state)

    def save_to_file(self, state: CustomerServiceState):
        """保存对话记录到文件"""
        try:
            filename = f"customer_service_simple_log_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
            
            log_data = {
                "customer_info": {
                    "name": state["name"],
                    "phone": state["phone"],
                    "address": state["address"],
                    "service": state["service"],
                    "service_time": state["service_time"],
                    "name_timestamp": state["name_timestamp"],
                    "phone_timestamp": state["phone_timestamp"],
                    "address_timestamp": state["address_timestamp"],
                    "service_timestamp": state["service_timestamp"],
                    "time_timestamp": state["time_timestamp"],
                    "service_available": state["service_available"],
                    "time_available": state["time_available"],
                    "conversation_complete": state["conversation_complete"]
                },
                "attempts": {
                    "name_attempts": state["name_attempts"],
                    "phone_attempts": state["phone_attempts"],
                    "address_attempts": state["address_attempts"],
                    "service_attempts": state["service_attempts"],
                    "time_attempts": state["time_attempts"],
                    "max_attempts": state["max_attempts"],
                    "service_max_attempts": state["service_max_attempts"]
                },
                "conversation_history": state["conversation_history"],
                "total_messages": len(state["conversation_history"])
            }
            
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(log_data, f, ensure_ascii=False, indent=2)
            
            print(f"💾 对话记录已保存到：{filename}")
        except Exception as e:
            print(f"⚠️  保存文件失败：{e}")

    def start_conversation(self):
        """开始客服对话 - 简化版本，先不用LangGraph"""
        print("=" * 50)
        print("🤖 AI客服系统启动 (简化版本)")
        print("=" * 50)
        
        # 初始化状态
        current_state: CustomerServiceState = {
            "name": None,
            "phone": None,
            "address": None,
            "service": None,
            "service_time": None,
            "current_step": "collect_name",
            "name_attempts": 0,
            "phone_attempts": 0,
            "address_attempts": 0,
            "service_attempts": 0,
            "time_attempts": 0,
            "max_attempts": 10,
            "service_max_attempts": 3,
            "conversation_history": [],
            "last_user_input": None,
            "last_llm_response": None,
            "name_complete": False,
            "phone_complete": False,
            "address_complete": False,
            "service_complete": False,
            "time_complete": False,
            "service_available": False,
            "time_available": False,
            "conversation_complete": False,
            "name_timestamp": None,
            "phone_timestamp": None,
            "address_timestamp": None,
            "service_timestamp": None,
            "time_timestamp": None
        }
        
        # 显示欢迎消息
        welcome_msg = "您好，欢迎使用客服服务！为了更好地为您服务，请告诉我您的姓名。"
        print(f"\n🤖 客服：{welcome_msg}")
        self.add_to_conversation(current_state, "assistant", welcome_msg)
        current_state["name_attempts"] += 1
        
        # 主对话循环
        while not current_state["conversation_complete"]:
            # 显示当前状态
            if current_state["current_step"] == "collect_name":
                print(f"\n[姓名收集 - 第 {current_state['name_attempts']} 次尝试]")
            elif current_state["current_step"] == "collect_phone":
                print(f"\n[电话收集 - 第 {current_state['phone_attempts']} 次尝试]")
            elif current_state["current_step"] == "collect_address":
                print(f"\n[地址收集 - 第 {current_state['address_attempts']} 次尝试]")
            elif current_state["current_step"] == "collect_service":
                print(f"\n[服务需求收集 - 第 {current_state['service_attempts']} 次尝试]")
            elif current_state["current_step"] == "collect_time":
                print(f"\n[服务时间收集 - 第 {current_state['time_attempts']} 次尝试]")
            
            # 获取用户输入
            user_input = input("👤 您：").strip()
            
            if not user_input:
                print("🤖 客服：请输入您的回复。")
                continue
                
            # 处理退出命令
            if user_input.lower() in ['quit', 'exit', '退出', '结束']:
                print("🤖 客服：感谢您的使用，再见！")
                break
            
            # 记录用户输入
            self.add_to_conversation(current_state, "user", user_input)
            current_state["last_user_input"] = user_input
            
            # 根据当前步骤处理
            try:
                if current_state["current_step"] == "collect_name":
                    current_state = self.process_name_collection(current_state)
                    
                    # 检查是否需要转到电话收集
                    if current_state["name_complete"]:
                        current_state["current_step"] = "collect_phone"
                        phone_msg = f"好的，{current_state['name']}！现在请提供您的联系电话，以便我们能够及时与您联系。"
                        print(f"\n🤖 客服：{phone_msg}")
                        self.add_to_conversation(current_state, "assistant", phone_msg)
                        current_state["phone_attempts"] += 1
                    elif current_state["name_attempts"] >= current_state["max_attempts"]:
                        print(f"\n⏰ 姓名收集已达到最大尝试次数（{current_state['max_attempts']}次）")
                        break
                        
                elif current_state["current_step"] == "collect_phone":
                    current_state = self.process_phone_collection(current_state)
                    
                    # 检查是否需要转到地址收集
                    if current_state["phone_complete"]:
                        current_state["current_step"] = "collect_address"
                        address_msg = f"谢谢您提供电话号码！最后，请告诉我您的详细住址，包括街道号码、街道名称、城市、州/领地和邮编。"
                        print(f"\n🤖 客服：{address_msg}")
                        self.add_to_conversation(current_state, "assistant", address_msg)
                        current_state["address_attempts"] += 1
                    elif current_state["phone_attempts"] >= current_state["max_attempts"]:
                        print(f"\n⏰ 电话收集已达到最大尝试次数（{current_state['max_attempts']}次）")
                        break
                        
                elif current_state["current_step"] == "collect_address":
                    current_state = self.process_address_collection(current_state)
                    
                    # 检查是否需要转到服务收集
                    if current_state["address_complete"]:
                        current_state["current_step"] = "collect_service"
                        service_msg = f"感谢您提供地址信息！请告诉我您需要什么服务？我们目前提供：清洁(clean)、园艺(garden)和水管维修(plumber)服务。"
                        print(f"\n🤖 客服：{service_msg}")
                        self.add_to_conversation(current_state, "assistant", service_msg)
                        current_state["service_attempts"] += 1
                    elif current_state["address_attempts"] >= current_state["max_attempts"]:
                        print(f"\n⏰ 地址收集已达到最大尝试次数（{current_state['max_attempts']}次）")
                        break
                        
                elif current_state["current_step"] == "collect_service":
                    current_state = self.process_service_collection(current_state)
                    
                    # 检查是否需要转到时间收集
                    if current_state["service_complete"]:
                        if current_state["service_available"]:
                            current_state["current_step"] = "collect_time"
                            time_msg = f"很好！我们可以提供{current_state['service']}服务。请告诉我您期望的服务时间，我们目前可以安排：tomorrow morning、Saturday morning或Sunday afternoon。"
                            print(f"\n🤖 客服：{time_msg}")
                            self.add_to_conversation(current_state, "assistant", time_msg)
                            current_state["time_attempts"] += 1
                        else:
                            current_state["conversation_complete"] = True
                            print("📱 我们会在服务开通后通过短信通知您。")
                    elif current_state["service_attempts"] >= current_state["service_max_attempts"]:
                        print(f"\n⏰ 服务需求收集已达到最大尝试次数（{current_state['service_max_attempts']}次）")
                        break
                        
                elif current_state["current_step"] == "collect_time":
                    current_state = self.process_time_collection(current_state)
                    
                    # 检查是否完成
                    if current_state["time_complete"]:
                        current_state["conversation_complete"] = True
                    elif current_state["time_attempts"] >= current_state["max_attempts"]:
                        print(f"\n⏰ 服务时间收集已达到最大尝试次数（{current_state['max_attempts']}次）")
                        break
                    
            except Exception as e:
                print(f"❌ 处理过程出错：{e}")
                break
        
        # 显示最终结果
        self.print_results(current_state)

def main():
    """主函数"""
    print("🚀 正在启动AI客服系统...")
    
    # 检查API密钥
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ 请设置OPENAI_API_KEY环境变量")
        api_key = input("请输入您的OpenAI API密钥：").strip()
        if not api_key:
            print("❌ 未提供API密钥，程序退出")
            return
    
    try:
        # 创建客服实例
        cs = CustomerServiceLangGraph(api_key=api_key)
        
        # 开始对话
        cs.start_conversation()
        
    except Exception as e:
        print(f"❌ 程序运行出错：{e}")

if __name__ == "__main__":
    main()