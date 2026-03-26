from django.db import models
from django.conf import settings


class Book(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    author = models.CharField(max_length=255, blank=True)
    book_username = models.CharField(max_length=100, unique=True)
    password = models.CharField(max_length=255)

    pdf_url = models.URLField(blank=True)
    cover_image_url = models.URLField(blank=True)

    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='books')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title