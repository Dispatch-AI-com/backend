# Verification Module

这是一个独立的、可复用的邮箱和手机号验证模块，支持通过AWS SES发送邮件验证码和通过AWS SNS发送短信验证码。

## 模块结构

```
verification/
├── controllers/
│   └── verification.controller.ts    # 验证API控制器
├── services/
│   ├── verification.service.ts       # 主要验证服务
│   ├── verification-code.service.ts  # 验证码管理服务
│   ├── aws-ses-email-verification.service.ts  # AWS SES邮件服务
│   └── aws-sns-sms-verification.service.ts    # AWS SNS短信服务
├── schemas/
│   ├── verification.schema.ts        # 验证状态数据模型
│   └── verification-code.schema.ts   # 验证码数据模型
├── dto/
│   └── verification.dto.ts           # 数据传输对象
├── verification.module.ts            # 模块定义
└── README.md                         # 本文档
```

## 功能特性

### 邮箱验证
- 生成6位数字验证码
- 通过AWS SES发送验证邮件
- 支持HTML和纯文本邮件格式
- 验证码30分钟有效期
- 一次性使用（验证后自动删除）

### 手机号验证
- 生成6位数字验证码
- 通过AWS SNS发送短信
- 支持E.164格式电话号码
- 验证码30分钟有效期
- 一次性使用（验证后自动删除）

### 安全特性
- JWT认证保护
- 用户权限验证
- 验证码自动过期清理
- 防重放攻击

## API端点

### 获取验证状态
```
GET /api/verification/user/:userId
```

### 更新验证设置
```
PUT /api/verification/user/:userId
```

### 邮箱验证
```
POST /api/verification/user/:userId/email/send    # 发送验证码
POST /api/verification/user/:userId/email/verify  # 验证邮箱
```

### 手机号验证
```
POST /api/verification/user/:userId/mobile/send    # 发送验证码
POST /api/verification/user/:userId/mobile/verify  # 验证手机号
```

## 环境变量

```env
# AWS配置
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# 邮件配置
SES_FROM=noreply@dispatchai.com

# 应用配置
APP_NAME=DispatchAI
```

## 使用示例

### 在其他模块中使用

```typescript
import { VerificationModule } from '@/modules/verification/verification.module';

@Module({
  imports: [VerificationModule],
  // ...
})
export class YourModule {}
```

### 注入服务

```typescript
import { VerificationService } from '@/modules/verification/services/verification.service';

@Injectable()
export class YourService {
  constructor(
    private readonly verificationService: VerificationService,
  ) {}

  async sendEmailVerification(userId: string, email: string) {
    return this.verificationService.sendEmailVerification(userId, email);
  }
}
```

## Mock模式

当AWS凭证未配置时，模块会自动进入Mock模式：
- 邮件验证：在控制台输出验证码
- 短信验证：在控制台输出验证码
- 不会实际发送邮件或短信

## 数据模型

### Verification
- `userId`: 用户ID
- `type`: 验证类型 (SMS/Email/Both)
- `mobile`: 手机号
- `email`: 邮箱
- `mobileVerified`: 手机号是否已验证
- `emailVerified`: 邮箱是否已验证
- `marketingPromotions`: 是否同意营销推广

### VerificationCode
- `userId`: 用户ID
- `contact`: 联系方式（邮箱或手机号）
- `code`: 验证码
- `type`: 验证类型 (email/phone)
- `expiresAt`: 过期时间

## 注意事项

1. 验证码会自动过期（30分钟）
2. 每个用户每种类型只能有一个有效验证码
3. 验证成功后验证码会被自动删除
4. 支持TTL索引自动清理过期验证码
5. 所有API都需要JWT认证
6. 用户只能操作自己的验证信息
