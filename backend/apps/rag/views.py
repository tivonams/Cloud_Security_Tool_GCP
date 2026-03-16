from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action
from django.http import FileResponse, StreamingHttpResponse
import json
import re

from services.rag_pipeline import answer_query, answer_query_stream
from services.doc_generator import build_docx

from datetime import datetime
from io import BytesIO


SMALL_TALK = {
    "hi", "hello", "hey", "hai",
    "good morning", "good afternoon", "good evening",
    "thanks", "thank you", "thx",
    "bye", "goodbye"
}

def is_small_talk(query: str) -> bool:
    q = query.lower().strip()
    q = re.sub(r"[^\w\s]", "", q)   # remove punctuation like "hi!!!"
    q = " ".join(q.split())         # normalize spaces
    return q in SMALL_TALK


class RAGQueryViewSet(ViewSet):
    def create(self, request):
        try:
            query = request.data.get("query")
            provider = request.data.get("provider")
            top_k = int(request.data.get("top_k", 5))
            generate_report = request.data.get("generate_report", False)

            if not query:
                return Response({"error": "query is required"}, status=status.HTTP_400_BAD_REQUEST)

            # ✅ STOP calling retriever + LLM for greetings / small talk
            if is_small_talk(query):
                return Response(
                    {
                        "query": query,
                        "answer": "Hi 👋 I’m your Cloud Security Assistant. Ask me about IAM, policies, roles, Terraform, AWS/GCP/Azure security.",
                        "sources": []
                    },
                    status=status.HTTP_200_OK
                )

            # ✅ RAG logic only for meaningful queries
            result = answer_query(
                question=query,
                provider=provider,
                top_k=top_k
            )

            response_payload = {
                "query": query,
                "answer": result["answer"],
                "sources": result["sources"]
            }

            # ✅ If user wants report → download directly
            if generate_report:
                doc = build_docx(response_payload)

                buffer = BytesIO()
                doc.save(buffer)
                buffer.seek(0)

                filename = f"rag_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"

                return FileResponse(
                    buffer,
                    as_attachment=True,
                    filename=filename,
                    content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                )

            return Response(response_payload, status=status.HTTP_200_OK)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=["post"])
    def stream(self, request):
        try:
            query = request.data.get("query")
            provider = request.data.get("provider")
            top_k = int(request.data.get("top_k", 5))

            if not query:
                return Response({"error": "query is required"}, status=status.HTTP_400_BAD_REQUEST)

            if is_small_talk(query):
                def small_talk_gen():
                    yield json.dumps({
                        "phase": "SmallTalk",
                        "status": "Done",
                        "content": "Hi 👋 I’m your Cloud Security Assistant. Ask me about IAM, policies, roles, Terraform, AWS/GCP/Azure security."
                    }) + "\n"
                return StreamingHttpResponse(small_talk_gen(), content_type="application/x-ndjson")

            return StreamingHttpResponse(
                answer_query_stream(question=query, provider=provider, top_k=top_k),
                content_type="application/x-ndjson"
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class RAGReportViewSet(ViewSet):
    def create(self, request):
        try:
            response_payload = request.data

            if not response_payload.get("answer"):
                return Response(
                    {"error": "answer is required to generate report"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            doc = build_docx(response_payload)

            buffer = BytesIO()
            doc.save(buffer)
            buffer.seek(0)

            filename = f"rag_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.docx"

            return FileResponse(
                buffer,
                as_attachment=True,
                filename=filename,
                content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            )
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
