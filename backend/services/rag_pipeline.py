from services.retriever import semantic_search
from services.llm import call_llm
from services.deliberation import deliberate_answer
from services.reasoning import build_context
from services.query_expander import expand_query_for_security
from services.validator import validate_provider_mismatch, is_query_relevant
from django.conf import settings
import json

# ✅ Prompt template paths
PROMPT_DIR = settings.BASE_DIR / "core/prompts"
PROMPT_TEMPLATES = {
    "gcp": PROMPT_DIR / "policy_prompt_gcp.txt",
    "aws": PROMPT_DIR / "policy_prompt_aws.txt",
    "azure": PROMPT_DIR / "policy_prompt_azure.txt",
}

def get_prompt_template(provider: str | None = None) -> str:
    """
    Load the appropriate prompt template based on cloud provider.
    Raises ValueError if provider is not specified or unknown.
    """
    if not provider:
        raise ValueError("Provider parameter is required. Please specify 'gcp', 'aws', or 'azure'.")
    
    provider_key = provider.lower()
    template_path = PROMPT_TEMPLATES.get(provider_key)
    
    if not template_path:
        raise ValueError(f"Unknown provider '{provider}'. Supported providers: {', '.join(PROMPT_TEMPLATES.keys())}")
    
    try:
        return template_path.read_text()
    except FileNotFoundError:
        raise FileNotFoundError(f"Prompt template not found at {template_path}")

SIMILARITY_SCORE_THRESHOLD = settings.RAG_SIMILARITY_THRESHOLD


def answer_query(question: str, provider: str | None = None, top_k: int = 5):
    """Sync version of answer_query for standard requests."""
    gen = answer_query_stream(question, provider, top_k)
    sources = []
    final_answer = ""
    
    for chunk in gen:
        data = json.loads(chunk)
        if data.get("phase") == "Metadata":
            sources = data.get("sources", [])
        if data.get("phase") == "Arbiter" and data.get("status") == "Completed":
            final_answer = data.get("content", "")
            
    return {
        "answer": final_answer.strip() or "⚠️ Failed to generate a refined answer.",
        "sources": sources
    }

def answer_query_stream(question: str, provider: str | None = None, top_k: int = 5):
    """Generator version of answer_query for streaming requests."""
    # ✅ 0. Relevance Validation
    if not is_query_relevant(question):
        msg = "⚠️ I'm sorry, but your input doesn't seem to be a valid security-related question. Please ask something about cloud security, IAM, or policies."
        yield json.dumps({"error": msg, "phase": "Validator", "status": "Filtered"}) + "\n"
        return

    # ✅ 1. Cross-Cloud Validation
    if provider:
        validation = validate_provider_mismatch(question, provider)
        if validation["mismatch"]:
            mismatched = ", ".join(validation["detected_providers"])
            error_msg = f"❌ Error: Your question mentions {mismatched}, but you have selected {provider.upper()}. Please select the correct cloud provider and try again."
            yield json.dumps({"phase": "Validator", "status": "Error", "content": error_msg}) + "\n"
            return

    # expanded query for best retrieval
    expanded_query = expand_query_for_security(question, provider)


    # ✅ Semantic search
    retrieved_chunks = semantic_search(
        query=expanded_query,
        provider=provider,
        top_k=top_k
    )

    # ✅ Keep only relevant chunks based on score
    good_chunks = [c for c in retrieved_chunks if c.get("score", 999) <= SIMILARITY_SCORE_THRESHOLD]

    # ✅ Handle case where nothing relevant is found
    # We still allow the process to continue so a general Overview can be provided
    # but we set a note for the agents and avoid crashing with the error.
    context = build_context(good_chunks) if good_chunks else "NO_DOCUMENT_CONTEXT_AVAILABLE"
    sources = [chunk["metadata"] for chunk in good_chunks] if good_chunks else []

    # Yield metadata first (may be empty)
    yield json.dumps({"phase": "Metadata", "sources": sources}) + "\n"

    # ✅ Multi-Agent Deliberation Flow
    prompt_template = None
    if provider:
        try:
            prompt_template = get_prompt_template(provider)
        except Exception:
            pass # Fallback to default behavior if template fails

    deliberation_gen = deliberate_answer(question, context, provider, prompt_template=prompt_template)
    for chunk in deliberation_gen:
        yield chunk
