from django.urls import path
from rest_framework.routers import DefaultRouter

from apps.users.views import UserViewSet
from apps.documents.views import DocumentViewSet
from apps.rag.views import RAGQueryViewSet , RAGReportViewSet
from apps.policies.views import PolicyAnalysisViewSet

from .views import health_check

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="users")
router.register(r"documents", DocumentViewSet, basename="documents")
router.register(r"rag", RAGQueryViewSet, basename="rag")
router.register(r"policies", PolicyAnalysisViewSet, basename="policies")
router.register(r"doc_download", RAGReportViewSet, basename="doc_download" )

urlpatterns = [
    path("health/", health_check, name="health_check"),
] + router.urls

