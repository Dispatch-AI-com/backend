"""
核心配置管理模块

集中管理所有应用配置，包括外部服务连接、业务参数等。
"""
import os
from typing import Optional, List

class Settings:
    """应用配置设置"""
    
    # Redis配置
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))
    
    # OpenAI配置
    OPENAI_API_KEY: Optional[str] = os.getenv("OPENAI_API_KEY")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    OPENAI_TEMPERATURE: float = 0.3
    OPENAI_MAX_TOKENS: int = 500
    
    # 业务配置 - 客户信息收集
    MAX_ATTEMPTS: int = 3
    SERVICE_MAX_ATTEMPTS: int = 3
    
    # 支持的服务类型
    SUPPORTED_SERVICES: List[str] = [
        'clean', 'cleaning', '清洁',
        'garden', 'gardening', '园艺', '花园',
        'plumber', 'plumbing', '水管工', '管道',
        'electric', 'electrical', '电工', '电器',
        'repair', '维修'
    ]
    
    # 支持的服务时间关键词
    SUPPORTED_TIME_KEYWORDS: List[str] = [
        'tomorrow', 'morning', 'afternoon', 'evening',
        'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
        '明天', '上午', '下午', '晚上',
        '周一', '周二', '周三', '周四', '周五', '周六', '周日',
        '星期一', '星期二', '星期三', '星期四', '星期五', '星期六', '星期日'
    ]
    
    # 姓名验证配置
    MIN_NAME_LENGTH: int = 2
    MAX_NAME_LENGTH: int = 50
    
    # 电话号码验证配置
    MIN_PHONE_LENGTH: int = 10
    MAX_PHONE_LENGTH: int = 15
    
    # 地址验证配置
    MIN_ADDRESS_LENGTH: int = 5
    MAX_ADDRESS_LENGTH: int = 200
    
    # 邮箱验证配置
    EMAIL_REGEX_PATTERN: str = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    
    # 对话历史配置
    MAX_CONVERSATION_CONTEXT: int = 3  # 最多使用最近3轮对话作为上下文
    
    # 调试配置
    DEBUG_MODE: bool = os.getenv("DEBUG", "false").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

# 创建全局配置实例
settings = Settings()

# 配置验证函数
def validate_config() -> bool:
    """验证关键配置是否正确设置"""
    if not settings.OPENAI_API_KEY:
        print("⚠️ 警告: OPENAI_API_KEY 未设置")
        return False
    
    if settings.MAX_ATTEMPTS <= 0:
        print("⚠️ 警告: MAX_ATTEMPTS 必须大于0")
        return False
        
    if settings.SERVICE_MAX_ATTEMPTS <= 0:
        print("⚠️ 警告: SERVICE_MAX_ATTEMPTS 必须大于0")
        return False
    
    return True

# 获取配置摘要
def get_config_summary() -> dict:
    """获取配置摘要（不包含敏感信息）"""
    return {
        "redis_host": settings.REDIS_HOST,
        "redis_port": settings.REDIS_PORT,
        "openai_model": settings.OPENAI_MODEL,
        "max_attempts": settings.MAX_ATTEMPTS,
        "service_max_attempts": settings.SERVICE_MAX_ATTEMPTS,
        "supported_services_count": len(settings.SUPPORTED_SERVICES),
        "debug_mode": settings.DEBUG_MODE
    }