def analyze_policy(policy: dict):
    findings = []

    statements = policy.get("Statement", [])
    if isinstance(statements, dict):
        statements = [statements]

    for stmt in statements:
        effect = stmt.get("Effect")
        actions = stmt.get("Action")
        resources = stmt.get("Resource")

        # Normalize
        actions = [actions] if isinstance(actions, str) else actions
        resources = [resources] if isinstance(resources, str) else resources

        # Rule 1: Full admin access
        if effect == "Allow" and "*" in actions and "*" in resources:
            findings.append({
                "severity": "CRITICAL",
                "issue": "Full administrative access",
                "reason": "Allows all actions on all resources",
                "recommendation": "Apply least privilege and restrict actions/resources"
            })

        # Rule 2: Wildcard actions
        elif effect == "Allow" and "*" in actions:
            findings.append({
                "severity": "HIGH",
                "issue": "Wildcard actions",
                "reason": "Allows all actions on specific resources",
                "recommendation": "Restrict actions explicitly"
            })

        # Rule 3: Wildcard resources
        elif effect == "Allow" and "*" in resources:
            findings.append({
                "severity": "MEDIUM",
                "issue": "Wildcard resources",
                "reason": "Allows actions on all resources",
                "recommendation": "Restrict resources explicitly"
            })

    return findings
