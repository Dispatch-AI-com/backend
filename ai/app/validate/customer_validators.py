"""
客户信息验证模块

该模块包含所有用于验证客户信息有效性的函数。
每个验证函数负责检查特定类型的用户输入数据，确保数据格式正确且符合业务规则。

功能：
- 姓名验证
- 电话号码验证（澳洲格式）
- 地址验证（澳洲格式）
- 电子邮件验证（RFC 5321标准）
- 服务类型验证
- 服务时间验证

使用方式：
from app.validate.customer_validators import validate_name, validate_phone
is_valid = validate_name("John Smith")
"""

import re
from typing import Tuple


def validate_name(name: str) -> bool:
    """验证姓名的有效性
    
    Args:
        name (str): 待验证的姓名
        
    Returns:
        bool: 姓名是否有效
        
    验证规则：
        - 长度在1-50个字符之间
        - 不包含特殊符号（@, #, $, %, ^, &, *, (, ), =, +, {, }, [, ]）
        - 不能是纯数字
        - 不能为空或只包含空格
    """
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


def validate_phone(phone: str) -> bool:
    """验证电话号码的有效性（仅支持澳洲格式）
    
    Args:
        phone (str): 待验证的电话号码
        
    Returns:
        bool: 电话号码是否有效
        
    支持的澳洲手机号格式：
        - 04XXXXXXXX
        - +614XXXXXXXX  
        - 00614XXXXXXXX
        - 614XXXXXXXX
    """
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
    
    # 清理电话号码（移除空格、连字符等）
    cleaned_phone = re.sub(r'[\s\-\(\)]', '', phone)
    
    for pattern in australian_patterns:
        if re.match(pattern, cleaned_phone):
            return True
            
    return False


def validate_address(address: str) -> bool:
    """验证澳大利亚地址的有效性
    
    Args:
        address (str): 待验证的地址
        
    Returns:
        bool: 地址是否有效
        
    验证规则：
        - 长度在5-200个字符之间
        - 必须包含以下组成部分中的至少4个：
          1. 街道号码（数字）
          2. 街道名称和类型（Street, St, Road, Rd, Avenue, Ave等）
          3. 城市/区域名称
          4. 州/领地（NSW, VIC, QLD, WA, SA, TAS, NT, ACT）
          5. 邮编（4位数字）
    """
    if not address or address.strip() == "":
        return False
    
    address = address.strip()
    
    # 验证基本长度
    if len(address) < 5 or len(address) > 200:
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


def validate_email(email: str) -> bool:
    """验证电子邮件地址的有效性
    
    Args:
        email (str): 待验证的电子邮件地址
        
    Returns:
        bool: 电子邮件地址是否有效
        
    验证规则（遵循RFC 5321标准）：
        - 总长度在5-254个字符之间
        - 包含且仅包含一个@符号
        - 用户名部分不超过64个字符
        - 域名部分不超过253个字符且包含至少一个点
        - 域名不能以点开头或结尾
        - 不能包含连续的点
        - 符合标准邮箱格式正则表达式
    """
    if not email or email.strip() == "":
        return False
    
    email = email.strip()
    
    # 基本长度检查
    if len(email) < 5 or len(email) > 254:  # RFC 5321 标准
        return False
    
    # 检查是否包含@符号，且只有一个
    if email.count('@') != 1:
        return False
    
    # 分割用户名和域名部分
    local_part, domain_part = email.split('@')
    
    # 验证用户名部分（不能为空）
    if not local_part or len(local_part) > 64:  # RFC 5321 标准
        return False
    
    # 验证域名部分
    if not domain_part or len(domain_part) > 253:  # RFC 5321 标准
        return False
    
    # 域名必须包含至少一个点
    if '.' not in domain_part:
        return False
    
    # 简单的正则表达式验证
    email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    if not re.match(email_pattern, email):
        return False
    
    # 检查域名部分是否以点开头或结尾
    if domain_part.startswith('.') or domain_part.endswith('.'):
        return False
    
    # 检查是否有连续的点
    if '..' in email:
        return False
    
    return True


def validate_service(service: str) -> Tuple[bool, bool]:
    """验证服务类型的有效性
    
    Args:
        service (str): 待验证的服务类型
        
    Returns:
        Tuple[bool, bool]: (是否有效输入, 服务是否可用)
        
    支持的服务类型：
        - clean（清洁）
        - garden（园艺）  
        - plumber（水管工）
    """
    if not service or service.strip() == "":
        return False, False
    
    service = service.strip().lower()
    
    # 支持的服务类型列表
    supported_services = ['clean', 'garden', 'plumber']
    
    # 检查服务是否在支持列表中
    service_available = service in supported_services
    
    return True, service_available


def validate_time(service_time: str) -> Tuple[bool, bool]:
    """验证服务时间的有效性
    
    Args:
        service_time (str): 待验证的服务时间
        
    Returns:
        Tuple[bool, bool]: (是否有效输入, 时间是否可用)
        
    支持的服务时间：
        - tomorrow morning
        - saturday morning  
        - sunday afternoon
    """
    if not service_time or service_time.strip() == "":
        return False, False
    
    service_time = service_time.strip().lower()
    
    # 支持的服务时间列表
    supported_times = ['tomorrow morning', 'saturday morning', 'sunday afternoon']
    
    # 检查时间是否在支持列表中
    time_available = service_time in supported_times
    
    return True, time_available


# 验证器管理类 (可选，用于更高级的验证管理)
class CustomerValidators:
    """客户信息验证器管理类
    
    提供所有客户信息验证相关功能的统一访问接口
    """
    
    @staticmethod
    def validate_name(name: str) -> bool:
        return validate_name(name)
    
    @staticmethod
    def validate_phone(phone: str) -> bool:
        return validate_phone(phone)
    
    @staticmethod
    def validate_address(address: str) -> bool:
        return validate_address(address)
    
    @staticmethod
    def validate_email(email: str) -> bool:
        return validate_email(email)
    
    @staticmethod
    def validate_service(service: str) -> Tuple[bool, bool]:
        return validate_service(service)
    
    @staticmethod
    def validate_time(service_time: str) -> Tuple[bool, bool]:
        return validate_time(service_time)
    
    @classmethod
    def validate_all_user_info(cls, name: str, phone: str, address: str, email: str) -> dict:
        """验证所有用户基本信息
        
        Args:
            name (str): 姓名
            phone (str): 电话号码
            address (str): 地址
            email (str): 电子邮件
            
        Returns:
            dict: 包含所有验证结果的字典
        """
        return {
            'name_valid': cls.validate_name(name),
            'phone_valid': cls.validate_phone(phone),
            'address_valid': cls.validate_address(address),
            'email_valid': cls.validate_email(email)
        }
    
    @classmethod
    def validate_service_info(cls, service: str, service_time: str) -> dict:
        """验证服务相关信息
        
        Args:
            service (str): 服务类型
            service_time (str): 服务时间
            
        Returns:
            dict: 包含服务验证结果的字典
        """
        service_valid, service_available = cls.validate_service(service)
        time_valid, time_available = cls.validate_time(service_time)
        
        return {
            'service_valid': service_valid,
            'service_available': service_available,
            'time_valid': time_valid,
            'time_available': time_available
        }