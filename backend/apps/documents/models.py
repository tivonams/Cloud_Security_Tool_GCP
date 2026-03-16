from django.db import models


class Document(models.Model):
    title = models.CharField(max_length=255)

    source_url = models.URLField(
        unique=True,
        help_text="Original URL of the document"
    )

    provider = models.CharField(
        max_length=50,
        help_text="aws | gcp | azure | general"
    )

    version = models.CharField(
        max_length=50,
        blank=True,
        null=True
    )

    content_hash = models.CharField(
        max_length=64,
        help_text="SHA256 hash of cleaned content"
    )

    is_indexed = models.BooleanField(
        default=False,
        help_text="Whether document is already ingested into vector DB"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.title} ({self.provider})"
