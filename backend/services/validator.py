import re
from services.llm import classify_relevance

def validate_provider_mismatch(question: str, selected_provider: str | None) -> dict:
    """
    Detects if the user's question mentions a cloud provider different from the selected one.
    Returns a dict with 'mismatch' (bool) and 'detected_providers' (list).
    """
    if not selected_provider:
        return {"mismatch": False, "detected_providers": []}

    q = question.lower()
    selected_p = selected_provider.lower()

    # Define provider keyword maps (expanded lists)
    provider_keywords = {
        "aws": [
            "aws", "amazon", "s3", "lambda", "ec2", "cloudtrail", "dynamodb", "ebs", "vpc aws", 
            "athena", "fargate", "cloudformation", "route53", "rds", "sqs", "sns", "kinesis", 
            "eks", "redshift", "iam user", "security group", "elbv2", "alb", "nlb", 
            "elasticache", "guardduty", "inspector", "macie", "shield", "waf", "sagemaker", 
            "step functions", "iam role aws", "kms aws"
        ],
        "gcp": [
            "gcp", "google cloud", "cloud storage", "gcs", "compute engine", "bigquery", 
            "org policy", "cloud run", "pub/sub", "spanner", "bigtable", "gke", 
            "kubernetes engine", "cloud functions", "dataproc", "dataflow", "vpc google", 
            "firestore", "app engine", "cloud sql", "stackdriver", "anthos", "apigee", 
            "cloud armor", "cloud build", "iam gcp", "kms gcp"
        ],
        "azure": [
            "azure", "blob storage", "virtual machine", "entra id", "active directory", 
            "cosmos db", "app service", "aks", "synapse", "key vault", "application gateway", 
            "azure function", "logic app", "sql database", "storage account", "sentinel", 
            "blueprint", "traffic manager", "expressroute", "azure devops", "aks cluster", 
            "azure monitor", "azure policy", "arm template"
        ]
    }

    detected_others = []

    for provider, keywords in provider_keywords.items():
        if provider == selected_p:
            continue
        
        # Check if any keyword of another provider is in the question
        for kw in keywords:
            # Use regex to find word boundaries to avoid false positives like "iam" in "diagram"
            if re.search(rf"\b{re.escape(kw)}\b", q):
                detected_others.append(provider.upper())
                break # Only need one keyword to detect the provider

    return {
        "mismatch": len(detected_others) > 0,
        "detected_providers": list(set(detected_others))
    }

def is_query_relevant(question: str) -> bool:
    """
    Checks if a query is relevant to the domain (Cloud Security, IAM, etc.)
    and not just gibberish or simple greetings.
    """
    q = question.strip().lower()

    # 1. Minimum length check (avoid single char or very short strings)
    if len(q) < 3:
        return False

    # 2. Basic greetings/small talk that should be handled differently (if not already handled)
    # The user mentioned "hi" triggers small talk, so we keep it simple.
    greetings = ["hi", "hello", "hey", "thanks", "thank you", "bye", "goodbye"]
    if q in greetings:
        return True # Let it pass if we want LLM to handle greetings, but user said "hi" is already handled.
    
    # If the user mentioned "hi" is triggered elsewhere, we might want to let perfectly normal greetings pass
    # but block "hiii" or "heyoo" if they don't match exactly.

    # 3. Domain keywords - if any of these are present, it's definitely relevant.
    domain_keywords = [
        "iam", "policy", "security", "cloud", "aws", "gcp", "azure", "access", 
        "role", "permission", "bucket", "s3", "storage", "compute", "network", 
        "firewall", "vpc", "audit", "log", "compliance", "identity", "token",
        "secret", "key", "vault", "encrypt", "decrypt", "user", "group"
    ]

    if len(q.split()) >= 2:
        # Secondary check with LLM for more robustness
        return classify_relevance(question)
    
    if any(re.search(rf"\b{re.escape(kw)}\b", q) for kw in domain_keywords):
        return True

    # 4. Gibberish/Irrelevance detection
    # If it's a long string with no spaces and no keywords, it might be gibberish
    if " " not in q and len(q) > 10:
        return False

    # Small talk patterns like "hiii", "heyyy"
    if re.match(r"^(h+i+|h+e+y+|h+e+l+o+)\W*$", q):
        # We only allow exact short greetings if we want them to pass.
        # Repeating chars often indicates low-effort/irrelevant input.
        if len(q) > 5: 
            return False

    # If it doesn't match any domain keywords and looks like random chars
    if not any(char.isalpha() for char in q):
        return False

    # Default to True for now to avoid false positives, but we can tighten this.
    # If it's at least two words, we'll let it try retrieval.


    return False
