from rest_framework import serializers
from .models import Book


class BookSerializer(serializers.ModelSerializer):
    is_bookmarked = serializers.SerializerMethodField()
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)

    class Meta:
        model = Book
        fields = [
            'id', 'title', 'description', 'author', 'book_username',
            'pdf_url', 'cover_image_url', 'created_by', 'created_by_username',
            'created_at', 'is_bookmarked',
        ]
        extra_kwargs = {
            'password': {'write_only': True},
            'created_by': {'read_only': True},
        }

    def get_is_bookmarked(self, obj):
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            return obj.bookmarked_by.filter(user=request.user).exists()
        return False


class BookCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Book
        fields = [
            'id', 'title', 'description', 'author', 'book_username',
            'password', 'pdf_url', 'cover_image_url',
        ]