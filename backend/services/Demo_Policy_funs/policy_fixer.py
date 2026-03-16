def generate_safe_policy(policy: dict):
    """
    Generate a safer version of an IAM policy
    based on deterministic rules.
    """

    fixed_policy = {
        "Version": policy.get("Version", "2012-10-17"),
        "Statement": []
    }

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

        # 🔴 Fix 1: Full admin access → restrict
        if effect == "Allow" and "*" in actions and "*" in resources:
            fixed_policy["Statement"].append({
                "Effect": "Allow",
                "Action": [
                    "iam:GetUser",
                    "iam:ListUsers"
                ],
                "Resource": "*"
            })

        # 🟠 Fix 2: Wildcard actions → restrict actions
        elif effect == "Allow" and "*" in actions:
            fixed_policy["Statement"].append({
                "Effect": "Allow",
                "Action": [
                    actions[0].replace("*", "List"),
                    actions[0].replace("*", "Get")
                ],
                "Resource": resources
            })

        # 🟡 Fix 3: Wildcard resources → restrict resources
        elif effect == "Allow" and "*" in resources:
            fixed_policy["Statement"].append({
                "Effect": "Allow",
                "Action": actions,
                "Resource": "arn:aws:resource:example"
            })

        # ✅ Safe statement → keep as-is
        else:
            fixed_policy["Statement"].append(stmt)

    return fixed_policy
