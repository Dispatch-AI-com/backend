# AI Service Architecture

## Core Components

### 1. AI Router (`ai/app/routers/ai.py`)
- **Purpose**: Main API endpoint for AI conversations
- **Key Endpoint**: `/ai/conversation` - processes customer messages
- **Workflow**: 
  1. Retrieves CallSkeleton from Redis
  2. Constructs AI state from existing data
  3. Determines current collection step
  4. Processes customer input through appropriate workflow
  5. Returns AI response

### 2. CustomerServiceLangGraph (`ai/app/chatr2v3.py`)
- **Purpose**: Main workflow controller for customer information collection
- **Key Features**:
  - Sequential information collection (name → phone → address → email → service → time)
  - LLM-based information extraction
  - Real-time Redis updates
  - Retry logic with attempt limits
  - State management and conversation history

### 3. Information Extraction Functions
- `extract_name_from_conversation()`: Extracts customer name
- `extract_phone_from_conversation()`: Extracts Australian phone numbers
- `extract_address_from_conversation()`: Extracts Australian addresses
- `extract_email_from_conversation()`: Extracts email addresses
- `extract_service_from_conversation()`: Extracts service type
- `extract_time_from_conversation()`: Extracts service time

### 4. Process Collection Functions
- `process_name_collection()`: Handles name collection workflow
- `process_phone_collection()`: Handles phone collection workflow
- `process_address_collection()`: Handles address collection workflow
- `process_email_collection()`: Handles email collection workflow
- `process_service_collection()`: Handles service collection workflow
- `process_time_collection()`: Handles time collection workflow

Each process function:
- Calls corresponding extraction function
- Validates extracted information
- Updates local state and Redis
- Manages retry attempts
- Advances workflow to next step