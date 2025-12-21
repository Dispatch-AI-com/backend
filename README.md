# Backend Service - DispatchAI Platform

Edit Time: 9/11/2025

**NestJS REST API** handling business logic, integrations, and data management for the DispatchAI platform.

## 🎯 Overview

The Backend service is the core API layer that orchestrates all platform operations including authentication, telephony webhooks, payment processing, calendar integration, and data persistence.

## 🏗️ Architecture

### Tech Stack

- **Framework**: NestJS 11 (Node.js 18+)
- **Language**: TypeScript 5.8
- **Database**: MongoDB 7 with Mongoose ODM
- **Cache**: Redis 7 for sessions & caching
- **Auth**: JWT + Google OAuth 2.0
- **Payment**: Stripe
- **Telephony**: Twilio Voice API
- **Calendar**: Google Calendar API + Microsoft Graph (Outlook)
- **Validation**: class-validator + class-transformer
- **Logging**: Winston
- **Testing**: Jest + Supertest

### Project Structure

```
apps/backend/
├── src/
│   ├── main.ts                      # Application entry point
│   ├── modules/                     # Feature modules
│   │   ├── auth/                   # Authentication & authorization
│   │   ├── user/                   # User management
│   │   ├── company/                # Company/business management
│   │   ├── plan/                   # Subscription plans
│   │   ├── subscription/           # User subscriptions
│   │   ├── telephony/              # Twilio voice integration
│   │   ├── calllog/                # Call logs & history
│   │   ├── transcript/             # Call transcripts
│   │   ├── transcript-chunk/       # Transcript chunks
│   │   ├── service/                # Services catalog
│   │   ├── service-booking/        # Service bookings/appointments
│   │   ├── service-form-field/     # Dynamic form fields
│   │   ├── service-location-mapping/ # Service locations
│   │   ├── location/               # Location management
│   │   ├── availability/           # Business hours/availability
│   │   ├── google-calendar/        # Google Calendar integration
│   │   ├── google-places/          # Google Places API
│   │   ├── stripe/                 # Stripe payment processing
│   │   ├── onboarding/             # User onboarding flow
│   │   ├── setting/                # User settings
│   │   ├── blog/                   # Blog content
│   │   └── health/                 # Health check
│   ├── common/                     # Shared utilities
│   │   ├── constants/             # Constants
│   │   ├── decorators/            # Custom decorators
│   │   ├── filters/               # Exception filters
│   │   ├── guards/                # Auth guards
│   │   └── interfaces/            # TypeScript interfaces
│   ├── lib/                       # External library wrappers
│   │   ├── ai/                    # AI service HTTP client
│   │   ├── redis/                 # Redis client
│   │   └── twilio/                # Twilio client
│   ├── config/                    # Configuration
│   │   └── swagger.config.ts     # API documentation
│   └── utils/                     # Utility functions
├── test/                          # Test suite
│   ├── fixtures/                 # Test data
│   ├── helpers/                  # Test utilities
│   ├── integration/              # Integration tests
│   └── unit/                     # Unit tests
├── scripts/                       # Utility scripts
│   └── seeds/                    # Database seeding
├── package.json                  # Dependencies & scripts
├── tsconfig.json                 # TypeScript config
├── jest.config.json              # Jest config
├── nest-cli.json                 # NestJS CLI config
├── Dockerfile.dev               # Development Docker image
└── Dockerfile.uat               # UAT Docker image
```

## 🔌 API Endpoints

### Base URL
**Development**: `http://localhost:4000/api`  
**Swagger UI**: `http://localhost:4000/api`

### Core Modules & Endpoints

#### Authentication (`/auth`)

- `POST /auth/signup` - User registration
- `POST /auth/login` - Login with email/password
- `POST /auth/google` - Google OAuth login
- `POST /auth/logout` - Logout (clear cookie)
- `GET /auth/me` - Get current user

#### Telephony (`/telephony`)

- `POST /telephony/voice` - Handle incoming call (TwiML)
- `POST /telephony/gather` - Handle speech input (TwiML)
- `POST /telephony/status` - Handle call status callbacks

#### Call Logs (`/calllog`)

- `GET /calllog` - List call logs (paginated, filtered)
- `GET /calllog/:id` - Get single call log
- `GET /calllog/metrics` - Get call metrics/stats
- `POST /calllog` - Create call log
- `PATCH /calllog/:id` - Update call log

#### Transcripts (`/transcript`)

- `GET /transcript/call/:callSid` - Get transcript by call SID
- `POST /transcript` - Create transcript
- `PATCH /transcript/:id` - Update transcript

#### Service Bookings (`/service-booking`)

- `GET /service-booking` - List bookings
- `POST /service-booking` - Create booking
- `PATCH /service-booking/:id` - Update booking
- `DELETE /service-booking/:id` - Cancel booking

#### Calendar (`/google-calendar`)

- `GET /google-calendar/auth-url` - Get OAuth URL
- `GET /google-calendar/callback` - OAuth callback
- `POST /google-calendar/token` - Store access token
- `GET /google-calendar/token` - Get stored token

#### Stripe (`/stripe`)

- `POST /stripe/webhook` - Handle Stripe webhooks
- `POST /stripe/create-checkout` - Create checkout session

#### Services (`/service`)

- `GET /service` - List services
- `POST /service` - Create service
- `PATCH /service/:id` - Update service
- `DELETE /service/:id` - Soft delete service

## 📊 Data Models

### Core Schemas

#### User (`user.schema.ts`)
```typescript
{
  firstName: string
  lastName: string
  email: string (unique, required)
  password?: string
  twilioPhoneNumber?: string
  fullPhoneNumber?: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'suspended'
  address?: {
    unitAptPOBox?: string
    streetAddress: string
    suburb: string
    state: string
    postcode: string
  }
  greeting: {
    message: string
    isCustom: boolean
  }
  createdAt: Date
  updatedAt: Date
}
```

#### Company (`company.schema.ts`)
```typescript
{
  businessName: string (required)
  abn: string (unique, required)
  user: ObjectId (ref: User)
  calendar_access_token?: string
  createdAt: Date
  updatedAt: Date
}
```

#### Service (`service.schema.ts`)
```typescript
{
  name: string
  description: string
  price: number
  duration: number (minutes)
  userId: string
  isDeleted?: boolean
  createdAt: Date
  updatedAt: Date
}
```

#### ServiceBooking (`service-booking.schema.ts`)
```typescript
{
  serviceId: string
  client: {
    name: string
    phoneNumber: string
    address: string
  }
  serviceFormValues: {
    serviceFieldId: string
    answer: string
  }[]
  status: 'Cancelled' | 'Confirmed' | 'Done'
  note: string
  bookingTime: Date
  userId: string
  callSid?: string
  createdAt: Date
  updatedAt: Date
}
```

#### CallLog (`calllog.schema.ts`)
```typescript
{
  userId: string
  callerNumber: string
  duration: number (seconds)
  status: 'completed' | 'no-answer' | 'busy' | 'failed'
  serviceBookedId?: string
  recordingUrl?: string
  transcriptionUrl?: string
  startAt: Date
  createdAt: Date
  updatedAt: Date
}
```

#### Transcript (`transcript.schema.ts`)
```typescript
{
  callSid: string
  userId: string
  fullTranscript: string
  summary?: string
  keyPoints?: string[]
  createdAt: Date
  updatedAt: Date
}
```

#### Plan (`plan.schema.ts`)
```typescript
{
  name: string (unique, required)
  tier: 'FREE' | 'BASIC' | 'PRO'
  pricing: {
    rrule: string
    price: number
    stripePriceId: string
  }[]
  features: {
    callMinutes: string
    support: string
  }
  isActive: boolean
}
```

#### Subscription (`subscription.schema.ts`)
```typescript
{
  userId: ObjectId (ref: User)
  planId: ObjectId (ref: Plan)
  subscriptionId?: string
  stripeCustomerId?: string
  chargeId?: string
  startAt: Date
  endAt: Date
  status: 'active' | 'failed' | 'cancelled'
  createdAt: Date
  updatedAt: Date
}
```

## 🧪 Testing

### Test Structure

```bash
test/
├── fixtures/           # Test data & factories
├── helpers/           # Test utilities (DB helper)
├── integration/       # Integration tests
│   ├── calendar/
│   ├── calllog/
│   ├── plan/
│   ├── subscription/
│   └── transcript/
└── unit/              # Unit tests
    ├── calendar/
    ├── calllog/
    ├── common/
    ├── plan/
    ├── subscription/
    └── transcript/
```

### Running Tests

```bash
cd apps/backend

# Run all tests
pnpm test

# Run unit tests only
pnpm test:unit

# Run integration tests only
pnpm test:integration

# Watch mode
pnpm test:watch

# With coverage
pnpm test -- --coverage

# Specific test file
pnpm test -- src/modules/auth/auth.service.spec.ts
```

### Database Seeding

```bash
# Run all seeds
pnpm seed

# Seed telephony test data
pnpm seed:telephony

# Seed call logs
pnpm seed:calllog
```

## 🔧 Configuration

### Environment Variables

**Required**:
```bash
# MongoDB
MONGODB_URI=mongodb://mongo:27017/dispatchai

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=7d

# Twilio
TWILIO_ACCOUNT_SID=ACxxx...
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890
```

**Optional**:
```bash
# Port
PORT=4000

# CORS
CORS_ORIGIN=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_client_secret
GOOGLE_REDIRECT_URI=http://localhost:4000/api/google-calendar/callback

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# AI Service
AI_SERVICE_URL=http://localhost:8000/api
```

### Configuration Files

**`.eslintrc.js`**: ESLint configuration  
**`tsconfig.json`**: TypeScript compiler options  
**`jest.config.json`**: Jest test configuration  
**`nest-cli.json`**: NestJS CLI settings  

## 🚀 Development

### Local Development

1. **Install dependencies**:
   ```bash
   cd apps/backend
   pnpm install
   ```
   
   **Note**: This project uses **pnpm** as the package manager. If you don't have pnpm installed:
   ```bash
   npm install -g pnpm
   ```

2. **Set up environment**:
   ```bash
   # Create .env.local
   cp .env.example .env.local
   # Edit with your values
   ```

3. **Start MongoDB & Redis**:
   ```bash
   docker compose up mongo redis
   ```

4. **Run in watch mode**:
   ```bash
   pnpm dev
   ```

5. **Access services**:
   - API: http://localhost:4000/api
   - Swagger: http://localhost:4000/api
   - Health: http://localhost:4000/api/health

### Code Quality

```bash
# Lint code
pnpm lint

# Lint source only
pnpm lint:src

# Lint tests only
pnpm lint:test

# Type checking
pnpm type-check
```

### Docker Development

```bash
# Build image
docker build -f Dockerfile.dev -t dispatchai-backend:dev .

# Run container
docker run -p 4000:4000 dispatchai-backend:dev

# Or use docker-compose
docker compose up api
```

## 🔗 Key Integrations

### Twilio Voice API

**Webhooks**:
- `/telephony/voice` - Initial call
- `/telephony/gather` - Speech input
- `/telephony/status` - Call status updates

**Features**:
- Call routing & handling
- Speech recognition
- Text-to-speech
- Recording

**References**:
- `src/modules/telephony/`
- `src/lib/twilio/`

### Stripe Payment

**Features**:
- Subscription management
- Webhook handling
- Customer portal

**References**:
- `src/modules/stripe/`
- `src/modules/plan/`
- `src/modules/subscription/`

### Google Calendar API

**Features**:
- OAuth 2.0 flow
- Token storage
- Event creation
- Calendar sync

**References**:
- `src/modules/google-calendar/`

### AI Service Integration

**Usage**:
```typescript
import { AiHttpModule } from '@/lib/ai/ai-http.module';

@Module({
  imports: [AiHttpModule],
})
export class MyModule {}
```

**References**:
- `src/lib/ai/`

### Redis Usage

**Features**:
- Session storage
- CallSkeleton caching
- Rate limiting

**References**:
- `src/lib/redis/`

## 📚 Module Deep Dive

### Authentication Module

**Strategies**:
- JWT strategy (Passport)
- Google OAuth strategy

**Guards**:
- JWT auth guard
- CSRF guard

**Files**:
- `src/modules/auth/auth.module.ts`
- `src/modules/auth/auth.service.ts`
- `src/modules/auth/strategies/jwt.strategy.ts`
- `src/modules/auth/strategies/google.strategy.ts`

### Telephony Module

**Process Flow**:
1. Incoming call → `/telephony/voice`
2. Gather speech → `/telephony/gather`
3. Send to AI service
4. Generate TwiML response
5. Play AI response to customer

**Files**:
- `src/modules/telephony/telephony.module.ts`
- `src/modules/telephony/telephony.service.ts`
- `src/modules/telephony/services/call-processor.service.ts`

### Transcript Module

**Features**:
- Store full transcripts
- Generate summaries
- Extract key points
- Chunk management

**Files**:
- `src/modules/transcript/transcript.service.ts`
- `src/modules/transcript-chunk/transcript-chunk.service.ts`

## 🐛 Common Issues

### Issue: MongoDB Connection Failed

**Fix**: Ensure MongoDB is running and `MONGODB_URI` is correct

### Issue: Redis Connection Failed

**Fix**: Ensure Redis is running and accessible

### Issue: JWT Token Invalid

**Fix**: Check `JWT_SECRET` matches between services

### Issue: Twilio Webhook Fails

**Fix**: Verify webhook URL in Twilio console, check authentication

### Issue: Stripe Webhook Signature Invalid

**Fix**: Ensure `STRIPE_WEBHOOK_SECRET` matches Stripe dashboard

## 📖 Additional Resources

- **NestJS Docs**: https://docs.nestjs.com
- **Mongoose Docs**: https://mongoosejs.com
- **Twilio Docs**: https://www.twilio.com/docs
- **Stripe Docs**: https://stripe.com/docs
- **Google Calendar API**: https://developers.google.com/calendar
- **Jest Docs**: https://jestjs.io

## 🤝 Contributing

When adding new modules:
1. Generate module with Nest CLI: `nest g module module-name`
2. Create schema in `schema/`
3. Add service in module root
4. Add controller in module root
5. Create DTOs in `dto/`
6. Write tests in `test/unit/`
7. Update `app.module.ts`
8. Document in Swagger
