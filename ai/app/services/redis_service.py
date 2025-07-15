import redis
import json
from ..models.call import CallSkeleton, Message
from typing import Optional, Dict, Any
import os
from datetime import datetime

from ..config import settings

REDIS_HOST = settings.redis_host
REDIS_PORT = settings.redis_port
REDIS_DB = settings.redis_db

r = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB, decode_responses=True)

def get_call_skeleton(call_sid: str) -> CallSkeleton:
    data = r.get(f"call:{call_sid}")
    if not data:
        raise ValueError("CallSkeleton not found")
    return CallSkeleton.model_validate_json(data)

def set_call_skeleton(call_sid: str, skeleton: CallSkeleton):
    r.set(f"call:{call_sid}", skeleton.model_dump_json())

def get_call_skeleton_dict(call_sid: str) -> Dict[str, Any]:
    """获取CallSkeleton的字典格式"""
    data = r.get(f"call:{call_sid}")
    if not data:
        raise ValueError("CallSkeleton not found")
    return json.loads(data)

def update_user_info_field(call_sid: str, field_name: str, field_value: str, timestamp: str = None) -> bool:
    """实时更新用户信息的特定字段
    
    Args:
        call_sid: 通话ID
        field_name: 字段名 (name, phone, address, email)
        field_value: 字段值
        timestamp: 更新时间戳
    
    Returns:
        bool: 更新是否成功
    """
    try:
        # 获取当前CallSkeleton数据
        skeleton_dict = get_call_skeleton_dict(call_sid)
        
        # 更新用户信息字段
        if 'user' not in skeleton_dict:
            skeleton_dict['user'] = {'userInfo': {}, 'service': None, 'serviceBookedTime': None}
        if 'userInfo' not in skeleton_dict['user']:
            skeleton_dict['user']['userInfo'] = {}
            
        skeleton_dict['user']['userInfo'][field_name] = field_value
        
        # 添加时间戳记录
        if timestamp:
            timestamp_field = f"{field_name}_timestamp"
            skeleton_dict['user']['userInfo'][timestamp_field] = timestamp
        
        # 保存回Redis
        r.set(f"call:{call_sid}", json.dumps(skeleton_dict))
        
        print(f"✅ Redis更新成功: {field_name} = {field_value}")
        return True
        
    except Exception as e:
        print(f"❌ Redis更新失败 ({field_name}): {str(e)}")
        return False

def update_service_selection(call_sid: str, service_name: str, service_time: str = None, timestamp: str = None) -> bool:
    """实时更新服务选择信息
    
    Args:
        call_sid: 通话ID
        service_name: 服务名称
        service_time: 服务时间 (可选)
        timestamp: 更新时间戳
        
    Returns:
        bool: 更新是否成功
    """
    try:
        # 获取当前CallSkeleton数据
        skeleton_dict = get_call_skeleton_dict(call_sid)
        
        # 更新服务信息
        if 'user' not in skeleton_dict:
            skeleton_dict['user'] = {'userInfo': {}, 'service': None, 'serviceBookedTime': None}
            
        # 构建服务对象
        service_obj = {
            "id": f"service_{service_name.lower()}",
            "name": service_name,
            "price": None,
            "description": f"{service_name} service"
        }
        
        skeleton_dict['user']['service'] = service_obj
        
        # 更新服务时间
        if service_time:
            skeleton_dict['user']['serviceBookedTime'] = service_time
            
        # 添加时间戳记录
        if timestamp:
            if 'userInfo' not in skeleton_dict['user']:
                skeleton_dict['user']['userInfo'] = {}
            skeleton_dict['user']['userInfo']['service_timestamp'] = timestamp
            if service_time:
                skeleton_dict['user']['userInfo']['time_timestamp'] = timestamp
        
        # 保存回Redis
        r.set(f"call:{call_sid}", json.dumps(skeleton_dict))
        
        print(f"✅ Redis服务更新成功: {service_name}" + (f", 时间: {service_time}" if service_time else ""))
        return True
        
    except Exception as e:
        print(f"❌ Redis服务更新失败: {str(e)}")
        return False

def update_conversation_history(call_sid: str, message: Message) -> bool:
    """实时更新对话历史
    
    Args:
        call_sid: 通话ID
        message: 新的消息对象
        
    Returns:
        bool: 更新是否成功
    """
    try:
        # 获取当前CallSkeleton数据
        skeleton_dict = get_call_skeleton_dict(call_sid)
        
        # 确保history字段存在
        if 'history' not in skeleton_dict:
            skeleton_dict['history'] = []
            
        # 添加新消息
        message_dict = {
            "speaker": message.speaker,
            "message": message.message,
            "startedAt": message.startedAt
        }
        skeleton_dict['history'].append(message_dict)
        
        # 保存回Redis
        r.set(f"call:{call_sid}", json.dumps(skeleton_dict))
        
        print(f"✅ Redis对话历史更新成功: {message.speaker} - {message.message[:50]}...")
        return True
        
    except Exception as e:
        print(f"❌ Redis对话历史更新失败: {str(e)}")
        return False

def update_booking_status(call_sid: str, is_booked: bool, email_sent: bool = False) -> bool:
    """更新预订状态
    
    Args:
        call_sid: 通话ID
        is_booked: 是否已预订
        email_sent: 是否已发送确认邮件
        
    Returns:
        bool: 更新是否成功
    """
    try:
        # 获取当前CallSkeleton数据
        skeleton_dict = get_call_skeleton_dict(call_sid)
        
        # 更新预订状态
        skeleton_dict['servicebooked'] = is_booked
        skeleton_dict['confirmEmailsent'] = email_sent
        
        # 保存回Redis
        r.set(f"call:{call_sid}", json.dumps(skeleton_dict))
        
        print(f"✅ Redis预订状态更新成功: 已预订={is_booked}, 邮件已发送={email_sent}")
        return True
        
    except Exception as e:
        print(f"❌ Redis预订状态更新失败: {str(e)}")
        return False 