import requests
import logging
from django.conf import settings

logger = logging.getLogger(__name__)

import json

def call_llm(prompt: str, temperature: float = 0.2, top_p: float = 0.9, model: str | None = None, stream: bool = False):
    # Ensure no double slashes if settings has a trailing slash
    base_url = settings.OLLAMA_BASE_URL.rstrip('/')
    url = f"{base_url}/api/generate"
    
    selected_model = model if model else settings.LLM_MODEL
    
    payload = {
        "model": selected_model,
        "prompt": prompt,
        "stream": stream,
        "options": {
            "temperature": temperature,
            "top_p": top_p,
            "num_predict": 1024,  # Safety limit for generation
        }
    }

    try:
        if stream:
            return _streaming_call_llm(url, payload)
        
        response = requests.post(url, json=payload, timeout=400)
        response.raise_for_status()
        return response.json()["response"]
    except requests.exceptions.RequestException as e:
        logger.error(f"LLM Call Failed: {str(e)}")
        if hasattr(e, 'response') and e.response is not None:
            logger.error(f"Response content: {e.response.text}")
        raise

def _streaming_call_llm(url, payload):
    """Generator for streaming Ollama response."""
    with requests.post(url, json=payload, stream=True, timeout=400) as response:
        response.raise_for_status()
        for line in response.iter_lines():
            if line:
                chunk = json.loads(line.decode('utf-8'))
                if "response" in chunk:
                    yield chunk["response"]
                if chunk.get("done"):
                    break

def classify_relevance(question: str) -> bool:
    """
    Uses a fast LLM call to classify if a question is relevant to cloud security/IAM.
    Returns True if relevant, False otherwise.
    """
    prompt = f"""
    Task: Classify if the following user query is a legitimate question or request about Cloud Security, IAM (Identity and Access Management), or Cloud Infrastructure policies.
    
    Rules:
    - If it's a valid question/request about AWS, GCP, Azure, IAM, Security, or Policies, answer "YES".
    - If it's gibberish, random characters (e.g., "owuhuowhfu"), unrelated small talk, or completely irrelevant to the domain, answer "NO".
    - Answer ONLY with "YES" or "NO".
    
    Query: "{question}"
    
    Relevance:"""

    try:
        # Use a temperature of 0 for deterministic output
        response = call_llm(prompt, temperature=0.0, model=settings.LLM_MODEL)
        result = response.strip().upper()
        return True if result == "YES" else False
    except Exception as e:
        logger.error(f"Relevance classification failed: {str(e)}")
        return True  # Fallback to True to avoid blocking legitimate queries on error