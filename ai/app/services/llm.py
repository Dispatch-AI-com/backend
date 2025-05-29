from dotenv import load_dotenv
import os
from langchain_openai import ChatOpenAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from .prompts import default_prompt

load_dotenv()
api_key = os.getenv("OPENAI_API_KEY")

llm = ChatOpenAI(api_key=api_key, model="gpt-4o", max_tokens=2500, streaming=False,temperature=0.0)

chain = default_prompt | llm | StrOutputParser()
