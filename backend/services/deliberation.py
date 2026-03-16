from services.llm import call_llm
import logging
import json

logger = logging.getLogger(__name__)

# Agent Roles and their assigned models
AGENTS = {
    "Analyst": "llama3.2:3b",
    "Architect": "llama3.2:3b",
    "Reviewer": "llama3.2:3b",  # Switched from phi3:mini for better stability
    "Arbiter": "llama3.2:3b"
}

def deliberate_answer(question: str, context: str, provider: str | None = None, prompt_template: str | None = None):
    """
    Generator that orchestrates a multi-agent deliberation process with token-level streaming.
    Yields JSON strings representing the current phase, status, and incremental content (deltas).
    """
    provider_str = provider.upper() if provider else "Cloud"
    logger.info(f"Starting Multi-Agent Deliberation for {provider_str}...")

    # Stage 1: Analyst
    yield json.dumps({ "phase": "Analyst", "status": "Thinking..." }) + "\n"
    analyst_prompt = f"""
    You are a {provider_str} Security Analyst. Based on the provided context, summarize the key technical constraints and security requirements relevant to the user's question.
    
    Context:
    {context}
    
    Question:
    {question}
    
    Summary:
    """
    analysis = ""
    for token in call_llm(analyst_prompt, model=AGENTS["Analyst"], stream=True):
        analysis += token
        yield json.dumps({ "phase": "Analyst", "delta": token }) + "\n"
    yield json.dumps({ "phase": "Analyst", "status": "Done" }) + "\n"

    # Stage 2: Architect
    yield json.dumps({ "phase": "Architect", "status": "Drafting Response..." }) + "\n"
    architect_prompt = f"""
    You are a Cloud Security Architect. Using the Analyst's summary and the original context, provide a detailed and accurate answer to the user's question. Use best practices and provide code snippets if applicable.
    
    Summary:
    {analysis}
    
    Context:
    {context}
    
    Question:
    {question}
    
    Architectural Response:
    """
    draft = ""
    for token in call_llm(architect_prompt, model=AGENTS["Architect"], stream=True):
        draft += token
        yield json.dumps({ "phase": "Architect", "delta": token }) + "\n"
    yield json.dumps({ "phase": "Architect", "status": "Done" }) + "\n"

    # Stage 3: Reviewer
    yield json.dumps({ "phase": "Reviewer", "status": "Critiquing..." }) + "\n"
    reviewer_prompt = f"""
    You are a Security Reviewer. Briefly critique the draft for accuracy and security best practices. 
    Point out errors or missing security controls. Be very concise.
    
    Draft:
    {draft}
    
    Question:
    {question}
    
    Critique:
    """
    critique = ""
    max_critique_len = 5000  # Safety limit to prevent runaway looping models
    for token in call_llm(reviewer_prompt, model=AGENTS["Reviewer"], stream=True):
        critique += token
        yield json.dumps({ "phase": "Reviewer", "delta": token }) + "\n"
        if len(critique) > max_critique_len:
            logger.warning("Reviewer critique exceeded safety length limit.")
            break
    yield json.dumps({ "phase": "Reviewer", "status": "Done" }) + "\n"

    # Stage 4: Arbiter
    yield json.dumps({ "phase": "Arbiter", "status": "Finalizing Outcome..." }) + "\n"
    
    if prompt_template:
        # Augment the context with the deliberation history
        refined_context = f"""
Original Context:
{context}

---
Expert Deliberation Logic:

[Analyst Summary]:
{analysis}

[Architect Draft]:
{draft}

[Reviewer Critique]:
{critique}
---
"""
        # Ensure the template has the {context} and {question} placeholders
        arbiter_prompt = prompt_template.format(context=refined_context, question=question)
    else:
        # Fallback to default if no template provided
        arbiter_prompt = f"""
        You are the Final Arbiter. Consider the Analyst's summary, the Architect's draft, and the Reviewer's critique to produce the final, definitive response to the user's question.
        Ensure the answer is polished, incorporates the reviewer's feedback, and is highly accurate.
        
        Analyst Summary:
        {analysis}
        
        Architect Draft:
        {draft}
        
        Reviewer Critique:
        {critique}
        
        Final Question:
        {question}
        
        Final Definitive Response:
        """
        
    final_answer = ""
    for token in call_llm(arbiter_prompt, model=AGENTS["Arbiter"], stream=True):
        final_answer += token
        yield json.dumps({ "phase": "Arbiter", "delta": token }) + "\n"
    yield json.dumps({ "phase": "Arbiter", "status": "Completed", "content": final_answer }) + "\n"