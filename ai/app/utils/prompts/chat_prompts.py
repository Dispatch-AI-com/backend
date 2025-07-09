from langchain_core.prompts import PromptTemplate

# Default chat prompt template
DEFAULT_CHAT_PROMPT = PromptTemplate(
    input_variables=["user_input"],
    template="你是一个 AI 助手，用户输入：{user_input}\n请给出简洁明了的回复：",
)

# English chat prompt template
ENGLISH_CHAT_PROMPT = PromptTemplate(
    input_variables=["user_input"],
    template="You are an AI assistant. User input: {user_input}\nPlease provide a clear and concise response:",
)

# Customer service chat prompt template
CUSTOMER_SERVICE_PROMPT = PromptTemplate(
    input_variables=["user_input"],
    template="""You are a helpful customer service AI assistant for DispatchAI Services.
    
User message: {user_input}

Please provide a professional and helpful response. Focus on:
- Understanding the customer's needs
- Providing clear information
- Offering solutions when possible
- Maintaining a friendly and professional tone

Response:""",
)

# Emergency service prompt template
EMERGENCY_SERVICE_PROMPT = PromptTemplate(
    input_variables=["user_input", "service_type"],
    template="""You are an emergency service dispatcher for {service_type} services.
    
Customer message: {user_input}

Please respond with urgency and professionalism. Focus on:
- Quickly understanding the emergency
- Gathering essential information (location, severity)
- Providing immediate assistance or dispatch
- Maintaining calm and reassuring tone

Response:""",
)

def get_chat_prompt(prompt_type: str = "default") -> PromptTemplate:
    """Get chat prompt template by type."""
    prompts = {
        "default": DEFAULT_CHAT_PROMPT,
        "english": ENGLISH_CHAT_PROMPT,
        "customer_service": CUSTOMER_SERVICE_PROMPT,
        "emergency": EMERGENCY_SERVICE_PROMPT,
    }
    
    return prompts.get(prompt_type, DEFAULT_CHAT_PROMPT)