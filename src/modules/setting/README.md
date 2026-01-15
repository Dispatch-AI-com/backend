# Verification Module - 模块化设计文档

## 概述

此验证模块采用模块化设计，具有高度的可复用性和可扩展性。其他同事可以在自己的模块中轻松复用验证功能，或替换不同的服务提供商（如 Twilio、SendGrid 等）。

## 模块结构

```
setting/
├── interfaces/
│   ├── email-verification.interface.ts    # 邮件验证服务接口
│   └── sms-verification.interface.ts       # SMS 验证服务接口
├── helpers/
│   ├── verification-code.util.ts           # 验证码生成、哈希、验证工具
│   ├── phone-number.util.ts                # 电话号码格式化工具
│   └── email-template.util.ts              # 邮件模板生成工具
├── aws-ses-email-verification.service.ts   # AWS SES 邮件服务实现
├── aws-sns-sms-verification.service.ts     # AWS SNS SMS 服务实现
├── verification.service.ts                 # 核心验证业务逻辑
├── verification.controller.ts              # API 控制器
└── README.md                               # 本文档
```

## 核心特性

### 1. 接口抽象层

所有服务都实现了统一的接口，便于替换不同的提供商：

- **`IEmailVerificationService`** - 邮件验证服务接口
- **`ISmsVerificationService`** - SMS 验证服务接口

### 2. 可复用工具函数

- **`verification-code.util.ts`** - 验证码相关工具：
  - `generateNumericCode()` - 生成数字验证码
  - `hashVerificationCode()` - 哈希验证码（用于安全存储）
  - `verifyVerificationCode()` - 验证验证码

- **`phone-number.util.ts`** - 电话号码工具：
  - `formatPhoneNumberToE164()` - 格式化为 E.164 格式
  - `normalizePhoneNumber()` - 标准化电话号码
  - `isValidPhoneNumber()` - 验证电话号码有效性

- **`email-template.util.ts`** - 邮件模板工具：
  - `generateVerificationEmailHtml()` - 生成 HTML 邮件模板
  - `generateVerificationEmailText()` - 生成纯文本邮件模板

### 3. Mock 模式支持

当 AWS 凭证未配置时，所有服务自动进入 Mock 模式，便于开发和测试。

## 使用示例

### 在其他模块中使用验证服务

#### 方式 1: 使用接口注入（推荐）

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { IEmailVerificationService } from '@/modules/setting/interfaces/email-verification.interface';
import { ISmsVerificationService } from '@/modules/setting/interfaces/sms-verification.interface';
import { generateNumericCode } from '@/modules/setting/helpers/verification-code.util';

@Injectable()
export class YourService {
  constructor(
    @Inject('IEmailVerificationService')
    private readonly emailService: IEmailVerificationService,
    @Inject('ISmsVerificationService')
    private readonly smsService: ISmsVerificationService,
  ) {}

  async sendVerification(userEmail: string, userPhone: string) {
    // 生成验证码
    const code = generateNumericCode();
    
    // 发送邮件验证码
    await this.emailService.sendVerificationCode(userEmail, code);
    
    // 发送 SMS 验证码
    await this.smsService.sendVerificationCode(userPhone, code);
  }
}
```

#### 方式 2: 直接使用工具函数

```typescript
import { generateNumericCode, hashVerificationCode } from '@/modules/setting/helpers/verification-code.util';
import { formatPhoneNumberToE164 } from '@/modules/setting/helpers/phone-number.util';

// 生成验证码
const code = generateNumericCode({ length: 6 });

// 哈希验证码用于存储
const hashedCode = await hashVerificationCode(code);

// 格式化电话号码
const formattedPhone = formatPhoneNumberToE164('0491050908');
// 结果: +61491050908
```

### 替换服务提供商

如果需要替换 AWS SES 或 SNS（例如使用 Twilio 或 SendGrid），只需：

#### 1. 创建新的服务实现

```typescript
// twilio-sms-verification.service.ts
import { Injectable } from '@nestjs/common';
import { ISmsVerificationService } from './interfaces/sms-verification.interface';
import { Twilio } from 'twilio';

@Injectable()
export class TwilioSmsVerificationService implements ISmsVerificationService {
  private twilioClient: Twilio;

  constructor(private readonly configService: ConfigService) {
    this.twilioClient = new Twilio(
      configService.get('TWILIO_ACCOUNT_SID'),
      configService.get('TWILIO_AUTH_TOKEN'),
    );
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<void> {
    await this.twilioClient.messages.create({
      body: `Your verification code is: ${code}`,
      to: phoneNumber,
      from: this.configService.get('TWILIO_PHONE_NUMBER'),
    });
  }
}
```

#### 2. 更新模块配置

```typescript
// your-module.module.ts
@Module({
  providers: [
    {
      provide: 'ISmsVerificationService',
      useClass: TwilioSmsVerificationService, // 替换为新的实现
    },
  ],
})
export class YourModule {}
```

### 自定义邮件模板

```typescript
import { generateVerificationEmailHtml } from '@/modules/setting/helpers/email-template.util';

// 自定义模板选项
const htmlEmail = generateVerificationEmailHtml({
  appName: 'YourApp',
  verificationCode: '123456',
  firstName: 'John',
  expirationMinutes: 15, // 自定义过期时间
});
```

## 依赖注入配置

在 `setting.module.ts` 中，服务通过接口 token 注册：

```typescript
providers: [
  {
    provide: 'IEmailVerificationService',
    useClass: AwsSesEmailVerificationService,
  },
  {
    provide: 'ISmsVerificationService',
    useClass: AwsSnsSmsVerificationService,
  },
]
```

这样设计的好处：
- **松耦合**：业务逻辑层不依赖具体实现
- **易测试**：可以轻松注入 Mock 服务进行单元测试
- **易扩展**：替换服务提供商只需修改模块配置

## 环境变量配置

```bash
# AWS 凭证（可选，未配置时使用 Mock 模式）
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-2

# SES 配置
SES_FROM=noreply@yourdomain.com

# 应用配置
APP_NAME=DispatchAI

# 验证码配置（可选，有默认值）
VERIFICATION_EMAIL_TTL_SECONDS=600
VERIFICATION_EMAIL_RESEND_SECONDS=60
VERIFICATION_EMAIL_MAX_ATTEMPTS=5
VERIFICATION_SMS_TTL_SECONDS=600
VERIFICATION_SMS_RESEND_SECONDS=60
VERIFICATION_SMS_MAX_ATTEMPTS=5
```

## 设计原则

1. **单一职责原则**：每个服务和工具函数只负责一个明确的功能
2. **依赖倒置原则**：依赖接口而非具体实现
3. **开放封闭原则**：对扩展开放，对修改封闭（可扩展新实现，无需修改现有代码）
4. **接口隔离原则**：接口设计简洁，只包含必要的方法

## 测试建议

```typescript
// 单元测试示例
describe('YourService', () => {
  let service: YourService;
  let emailService: jest.Mocked<IEmailVerificationService>;
  let smsService: jest.Mocked<ISmsVerificationService>;

  beforeEach(() => {
    emailService = {
      sendVerificationCode: jest.fn(),
    };
    smsService = {
      sendVerificationCode: jest.fn(),
    };
    
    service = new YourService(emailService, smsService);
  });

  it('should send verification codes', async () => {
    await service.sendVerification('test@example.com', '+61491050908');
    
    expect(emailService.sendVerificationCode).toHaveBeenCalled();
    expect(smsService.sendVerificationCode).toHaveBeenCalled();
  });
});
```

## 总结

此验证模块经过精心设计，具有：
- ✅ **高度模块化**：清晰的职责分离
- ✅ **易于复用**：工具函数和服务可在其他模块直接使用
- ✅ **易于扩展**：通过接口抽象，可轻松替换服务提供商
- ✅ **易于测试**：支持 Mock 模式，便于单元测试
- ✅ **配置灵活**：支持环境变量配置和默认值

其他同事可以根据自己的需求，灵活使用工具函数、服务接口或完整服务，无需修改核心代码。

