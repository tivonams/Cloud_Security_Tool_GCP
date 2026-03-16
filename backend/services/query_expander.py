def expand_query_for_security(question: str, provider: str | None = None) -> str:
    q = question.strip()

    # Provider keywords
    provider_map = {
        "gcp": [
            "Google Cloud",
            "IAM policy",
            "organization policy",
            "security controls",
            "least privilege",
            "audit logs",
            "VPC firewall rules",
        ],
        "aws": [
            "AWS IAM policy",
            "least privilege",
            "CloudTrail logs",
            "security groups",
            "S3 bucket policy",
        ],
        "azure": [
            "Azure RBAC",
            "conditional access",
            "activity logs",
            "network security groups",
        ],
    }

    extra_terms = [
        "IAM",
        "access control",
        "policy",
        "security best practices",
        "compliance",
        "audit logging",
    ]

    if provider:
        p = provider.lower()
        extra_terms.extend(provider_map.get(p, []))

    # ✅ Expanded query
    expanded = q + " | " + " , ".join(extra_terms)

    return expanded
