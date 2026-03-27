from django.db import models
from django.conf import settings

# User model is referenced via settings.AUTH_USER_MODEL in ForeignKeys below


class Message(models.Model):
    book = models.ForeignKey('books.Book', on_delete=models.CASCADE)
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)

    content = models.TextField(blank=True)
    media_url = models.TextField(blank=True, null=True)

    is_delivered = models.BooleanField(default=False)
    is_seen = models.BooleanField(default=False)

    reply_to = models.ForeignKey(
        'self',
        null=True,
        blank=True,
        on_delete=models.SET_NULL
    )

    created_at = models.DateTimeField(auto_now_add=True)


class Reaction(models.Model):
    message = models.ForeignKey(Message, on_delete=models.CASCADE, related_name='reactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    emoji = models.CharField(max_length=10)