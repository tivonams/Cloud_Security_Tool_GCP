import json
from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from services.Demo_Policy_funs.policy_analyzer import analyze_policy
from services.Demo_Policy_funs.policy_explainer import explain_finding
from services.Demo_Policy_funs.policy_fixer import generate_safe_policy
from services.Demo_Policy_funs.policy_diff import diff_policies

class PolicyAnalysisViewSet(ViewSet):

    def create(self, request):
        policy = request.data.get("policy")
        provider = request.data.get("provider", "aws")
                                                                                                                                                   
        if not policy:
            return Response(
                {"error": "policy JSON is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
                                            
        # ✅ CRITICAL: Ensure policy is a dict, not a string
        if isinstance(policy, str):
            try:
                policy = json.loads(policy)
            except json.JSONDecodeError:
                return Response(
                    {"error": "Invalid JSON format in policy field"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        #Analyze
        findings = analyze_policy(policy)

        #Generate safer version
        safe_policy = generate_safe_policy(policy)

        #Explain findings
        explained_findings = [
            explain_finding(finding, provider)
            for finding in findings
        ]

        #Diff original vs fixed
        policy_diff = diff_policies(
            original_policy=policy,
            updated_policy=safe_policy
        )

        return Response({
            "risk_level": (
                "CRITICAL" if any(f["severity"] == "CRITICAL" for f in findings)
                else "HIGH" if any(f["severity"] == "HIGH" for f in findings)
                else "MEDIUM" if findings else "LOW"
            ),
            "findings": explained_findings,
            "suggested_policy": safe_policy,
            "policy_diff": policy_diff
        })
