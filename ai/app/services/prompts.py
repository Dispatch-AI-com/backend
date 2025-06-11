from langchain_core.prompts import PromptTemplate

default_prompt = PromptTemplate(
    input_variables=["user_input"],
    template="你是一个 AI 助手，用户输入：{user_input}\n请给出简洁明了的回复：",
)
