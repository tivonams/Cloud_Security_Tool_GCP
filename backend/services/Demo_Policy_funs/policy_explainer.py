from services.retriever import semantic_search
from services.llm import call_llm
from pathlib import Path

PROMPT_PATH = Path("core/prompts/policy_explain_prompt.txt")


def explain_finding(finding: dict, provider: str = "aws"):
    issue = finding["issue"]
    severity = finding["severity"]
    reason = finding["reason"]
    recommendation = finding["recommendation"]

    # Retrieve supporting docs
    docs = semantic_search(
        query=f"{issue} IAM policy best practices",
        provider=provider,
        top_k=3
    )

    context = "\n\n".join(
        doc["page_content"] for doc in docs
    )

    prompt = PROMPT_PATH.read_text().format(
        issue=issue,
        severity=severity,
        reason=reason,
        recommendation=recommendation,
        context=context,
        question=issue
    )

    explanation = call_llm(prompt)

    return {
        "issue": issue,
        "severity": severity,
        "explanation": explanation.strip(),
        "sources": [doc["metadata"] for doc in docs]
    }
