# DispatchAI Project Overview

## Project Purpose
DispatchAI is a Twilio-integrated AI-powered customer service system that automates the collection of customer information for service booking. The system uses AI to have natural conversations with customers while collecting essential information like name, phone, address, email, service type, and service time.

## Architecture
- **Backend**: NestJS + TypeScript application with MongoDB
- **AI Service**: FastAPI + Python application with OpenAI integration
- **Storage**: Redis for session management, MongoDB for persistent data
- **Communication**: Twilio for voice calls, HTTP APIs for internal communication

## Key Components
1. **NestJS Backend** (`src/`): Main API server handling business logic
2. **Python AI Service** (`ai/app/`): AI conversation engine with workflow management
3. **Redis Integration**: Real-time session data storage
4. **MongoDB**: Persistent data storage for users, services, bookings

## Tech Stack
- **Backend**: NestJS, TypeScript, MongoDB, Redis
- **AI Service**: FastAPI, Python, OpenAI GPT-4o-mini
- **Infrastructure**: Docker, Docker Compose
- **Communication**: Twilio Voice API, HTTP REST APIs