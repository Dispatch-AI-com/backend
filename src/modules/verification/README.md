# Verification Module

This is an independent, reusable email and phone number verification module that supports sending email verification codes via AWS SES and SMS verification codes via AWS SNS.

## Module Structure

```
verification/
├── controllers/
│   └── verification.controller.ts    # Verification API controller
├── services/
│   ├── verification.service.ts       # Main verification service
│   ├── verification-code.service.ts  # Verification code management service
│   ├── aws-ses-email-verification.service.ts  # AWS SES email service
│   └── aws-sns-sms-verification.service.ts    # AWS SNS SMS service
├── schemas/
│   ├── verification.schema.ts        # Verification status data model
│   └── verification-code.schema.ts   # Verification code data model
├── dto/
│   └── verification.dto.ts           # Data transfer objects
├── verification.module.ts            # Module definition
└── README.md                         # This document
```

## Features

### Email Verification
- Generate 6-digit verification codes
- Send verification emails via AWS SES
- Support HTML and plain text email formats
- 30-minute verification code validity
- One-time use (automatically deleted after verification)

### Phone Number Verification
- Generate 6-digit verification codes
- Send SMS via AWS SNS
- Support E.164 format phone numbers
- 30-minute verification code validity
- One-time use (automatically deleted after verification)

### Security Features
- JWT authentication protection
- User permission verification
- Automatic verification code expiration cleanup
- Replay attack prevention

## API Endpoints

### Get Verification Status
```
GET /api/verification/user/:userId
```

### Update Verification Settings
```
PUT /api/verification/user/:userId
```

### Email Verification
```
POST /api/verification/user/:userId/email/send    # Send verification code
POST /api/verification/user/:userId/email/verify  # Verify email
```

### Phone Number Verification
```
POST /api/verification/user/:userId/mobile/send    # Send verification code
POST /api/verification/user/:userId/mobile/verify  # Verify phone number
```

## Environment Variables

```env
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1

# Email Configuration
SES_FROM=noreply@dispatchai.com

# Application Configuration
APP_NAME=DispatchAI
```

## Usage Examples

### Using in Other Modules

```typescript
import { VerificationModule } from '@/modules/verification/verification.module';

@Module({
  imports: [VerificationModule],
  // ...
})
export class YourModule {}
```

### Injecting Services

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

## Mock Mode

When AWS credentials are not configured, the module automatically enters Mock mode:
- Email verification: Output verification code to console
- SMS verification: Output verification code to console
- No actual emails or SMS will be sent

## Data Models

### Verification
- `userId`: User ID
- `type`: Verification type (SMS/Email/Both)
- `mobile`: Phone number
- `email`: Email address
- `mobileVerified`: Whether phone number is verified
- `emailVerified`: Whether email is verified
- `marketingPromotions`: Whether marketing promotions are accepted

### VerificationCode
- `userId`: User ID
- `contact`: Contact information (email or phone number)
- `code`: Verification code
- `type`: Verification type (email/phone)
- `expiresAt`: Expiration time

## Notes

1. Verification codes automatically expire (30 minutes)
2. Each user can only have one valid verification code per type
3. Verification codes are automatically deleted after successful verification
4. Supports TTL index for automatic cleanup of expired verification codes
5. All APIs require JWT authentication
6. Users can only operate their own verification information