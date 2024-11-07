from langchain_google_genai import ChatGoogleGenerativeAI
import os
import logging

llm = None

def init():
    global llm

    if "GOOGLE_API_KEY" not in os.environ:
        logging.error("GOOGLE_API_KEY not set.")
        exit(1)

    llm = ChatGoogleGenerativeAI(
        model="gemini-1.5-flash",
        temperature=0,
        max_tokens=None,
        timeout=None,
        max_retries=3,
    )
    return llm

def get_llm():
    global llm
    if llm is None:
        llm = init()
    return llm