from rest_framework.viewsets import ViewSet
from rest_framework.response import Response

class UserViewSet(ViewSet):
    def list(self, request):
        return Response({
            "message": "Users endpoint is live"
        })
