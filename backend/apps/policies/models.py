from django.db import models
from django.contrib.auth.models import User

class Policy(models.Model):
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name="policies"
    )

    name = models.CharField(max_length=255)
    policy_json = models.JSONField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name
