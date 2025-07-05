"""
测试 LLM 集成的对话流程
"""
import asyncio
from .models import Message, CallSkeleton, Service, Company, UserState, UserInfo
from .dialog_manager import process_customer_message
from datetime import datetime

def create_test_skeleton() -> CallSkeleton:
    """创建测试用的CallSkeleton"""
    services = [
        Service(id="1", name="清洁服务", price=100.0, description="专业清洁服务"),
        Service(id="2", name="维修服务", price=150.0, description="设备维修服务"),
        Service(id="3", name="安装服务", price=200.0, description="设备安装服务")
    ]
    
    company = Company(
        id="1",
        name="Mark Clearing Company",
        phone="02111222"
    )
    
    return CallSkeleton(
        callSid="test_call_123",
        services=services,
        company=company,
        user=UserState(),
        history=[],
        servicebooked=False,
        confirmEmailsent=False,
        createdAt=datetime.utcnow().isoformat() + "Z"
    )

async def test_llm_conversation():
    """测试 LLM 集成的对话流程"""
    print("=== 开始测试 LLM 集成对话流程 ===\n")
    
    skeleton = create_test_skeleton()
    
    # 模拟客户对话
    conversations = [
        "你好，我想预约服务",
        "我叫张三",
        "我的电话是13812345678",
        "我的地址是北京市朝阳区某某街道123号",
        "我需要清洁服务",
        "明天下午2点",
        "确认"
    ]
    
    for i, customer_text in enumerate(conversations, 1):
        print(f"第{i}轮对话:")
        print(f"客户: {customer_text}")
        
        # 创建客户消息
        customer_msg = Message(
            speaker="customer",
            message=customer_text,
            startedAt=datetime.utcnow().isoformat() + "Z"
        )
        
        # 处理消息（调用 LLM）
        ai_response, updated_skeleton = await process_customer_message(skeleton, customer_msg)
        skeleton = updated_skeleton
        
        print(f"AI (LLM): {ai_response.message}")
        print(f"当前状态:")
        print(f"  - 姓名: {skeleton.user.userInfo.name or '未收集'}")
        print(f"  - 电话: {skeleton.user.userInfo.phone or '未收集'}")
        print(f"  - 地址: {skeleton.user.userInfo.address or '未收集'}")
        print(f"  - 服务: {skeleton.user.service.name if skeleton.user.service else '未选择'}")
        print(f"  - 时间: {skeleton.user.serviceBookedTime or '未预约'}")
        print(f"  - 已预约: {skeleton.servicebooked}")
        print("-" * 50)
    
    print("=== 测试完成 ===")
    print(f"最终CallSkeleton状态:")
    print(f"  - 姓名: {skeleton.user.userInfo.name}")
    print(f"  - 电话: {skeleton.user.userInfo.phone}")
    print(f"  - 地址: {skeleton.user.userInfo.address}")
    print(f"  - 服务: {skeleton.user.service.name if skeleton.user.service else 'None'}")
    print(f"  - 时间: {skeleton.user.serviceBookedTime}")
    print(f"  - 已预约: {skeleton.servicebooked}")
    print(f"  - 对话历史长度: {len(skeleton.history)}")

if __name__ == "__main__":
    asyncio.run(test_llm_conversation()) 