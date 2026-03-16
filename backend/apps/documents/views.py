from rest_framework.viewsets import ViewSet
from rest_framework.response import Response
from rest_framework import status
from rest_framework.decorators import action

from services.ingestion import ingest_document, delete_document
from .models import Document

class DocumentViewSet(ViewSet):
    def list(self, request):
        documents = Document.objects.all().order_by('-created_at')
        data = [
            {
                "id": doc.id,
                "title": doc.title,
                "url": doc.source_url,
                "provider": doc.provider,
                "version": doc.version,
                "is_indexed": doc.is_indexed,
                "created_at": doc.created_at
            }
            for doc in documents
        ]
        return Response(data)

    def create(self, request):
        #getting input from the user as json
        title = request.data.get("title")
        url = request.data.get("url")
        provider = request.data.get("provider")
        version = request.data.get("version")

        if not title or not url or not provider:
            return Response(
                {"error": "title, url, provider are required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        #calling the ingest function 
        try:
            ingest_document(title, url, provider, version)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(
            {"message": "Document ingested successfully or skipped if unchanged"},
            status=status.HTTP_201_CREATED
        )

    def destroy(self, request, pk=None):
        try:
            doc = Document.objects.get(pk=pk)
            delete_document(doc.source_url)
            return Response({"message": "Document deleted successfully"}, status=status.HTTP_200_OK)
        except Document.DoesNotExist:
            return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



