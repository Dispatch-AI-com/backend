# 电话系统测试数据说明

## 概述
这个测试数据脚本为电话系统创建了完整的测试环境，包括用户、公司和服务数据。

## 运行测试数据

### 1. 运行电话测试数据种子脚本
```bash
cd backend
npm run seed:telephony
```

### 2. 运行所有种子数据（包括电话测试数据）
```bash
cd backend
npm run seed
```

## 创建的测试数据

### 👤 测试用户
- **邮箱**: john.doe@example.com
- **密码**: Admin123!
- **电话**: +1-555-123-4567

### 🏢 测试公司
- **名称**: ABC Cleaning Services
- **邮箱**: info@abccleaning.com
- **电话**: +1-555-987-6543
- **地址**: 123 Main Street, Sydney NSW 2000

### 🔧 可用服务
1. **House Cleaning** - $120.00
   - 专业房屋清洁服务，包括除尘、吸尘和浴室清洁

2. **Garden Maintenance** - $80.00
   - 完整的花园护理，包括割草、修剪和植物护理

3. **Plumbing Service** - $150.00
   - 紧急和常规管道维修和维护

4. **Carpet Cleaning** - $100.00
   - 深度地毯清洁和污渍清除服务

5. **Window Cleaning** - $90.00
   - 住宅和商业物业的专业窗户清洁

## 测试流程

### 1. 启动服务
```bash
# 启动后端服务
npm run dev

# 启动 AI 服务
cd ../ai
python -m uvicorn app.main:app --reload
```

### 2. 配置 Twilio Webhook
确保你的 Twilio 配置指向正确的 webhook URL：
- Voice Webhook: `https://your-domain/api/telephony/voice`
- Status Webhook: `https://your-domain/api/telephony/status`

### 3. 进行测试通话
1. 拨打你的 Twilio 号码
2. AI 应该会识别公司名称 "ABC Cleaning Services"
3. 询问可用服务时，AI 应该能够列出所有 5 个服务
4. 测试信息收集流程（姓名、电话、地址、邮箱、服务选择、时间安排）

### 4. 测试场景
- **服务查询**: "What services do you offer?"
- **预约清洁**: "I'd like to book a house cleaning service"
- **信息收集**: AI 会引导收集客户信息
- **时间安排**: "I'd like it tomorrow morning"

## Redis 数据结构

测试数据会生成符合 CallSkeleton 接口的数据结构：

```json
{
  "callSid": "CAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "services": [
    {
      "id": "service_id",
      "name": "House Cleaning",
      "price": 120.00,
      "description": "Professional house cleaning service..."
    }
  ],
  "company": {
    "id": "company_id",
    "name": "ABC Cleaning Services",
    "email": "info@abccleaning.com",
    "phone": "+1-555-987-6543"
  },
  "user": {
    "service": null,
    "serviceBookedTime": null,
    "userInfo": {}
  },
  "history": [],
  "servicebooked": false,
  "confirmEmailsent": false,
  "createdAt": "2024-01-01T00:00:00.000Z"
}
```

## 故障排除

### 常见问题
1. **MongoDB 连接失败**: 确保 MongoDB 正在运行
2. **数据未创建**: 检查控制台输出是否有错误信息
3. **AI 服务无响应**: 确保 AI 服务正在运行且可访问

### 日志检查
- 后端日志: 查看 NestJS 应用日志
- AI 服务日志: 查看 Python 应用日志
- Twilio 日志: 在 Twilio 控制台查看通话日志

## 清理数据
如果需要清理测试数据，可以重新运行种子脚本：
```bash
npm run seed:telephony
```

这将清除现有数据并重新创建测试数据。 