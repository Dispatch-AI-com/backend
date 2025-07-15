# Data Models (`ai/app/models.py`)

## Core Data Structures

### Message
```python
class Message(BaseModel):
    speaker: Literal['AI', 'customer']
    message: str
    startedAt: str  # ISO datetime string
```

### Service
```python
class Service(BaseModel):
    id: str
    name: str
    price: Optional[float]
    description: Optional[str] = None
```

### UserInfo
```python
class UserInfo(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    email: Optional[str] = None
```

### Company
```python
class Company(BaseModel):
    id: str
    name: str
    email: str
    phone: Optional[str] = None
```

### UserState
```python
class UserState(BaseModel):
    service: Optional[Service] = None
    serviceBookedTime: Optional[str] = None
    userInfo: Optional[UserInfo] = UserInfo()
```

### CallSkeleton
```python
class CallSkeleton(BaseModel):
    callSid: str
    services: List[Service]
    company: Company
    user: UserState
    history: List[Message]
    servicebooked: bool
    confirmEmailsent: bool
    createdAt: str
```

## CustomerServiceState (Internal AI State)
Used within chatr2v3.py for workflow management:
- User information fields
- Completion flags for each step
- Attempt counters with max limits
- Conversation history
- Timestamps for each field
- Service/time availability flags