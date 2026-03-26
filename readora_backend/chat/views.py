from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.core.cache import cache
from .models import Message
from books.models import Book

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_messages(request, book_id):
    """Get message history for a specific book with pagination"""
    book = get_object_or_404(Book, id=book_id)
    
    try:
        page = int(request.GET.get('page', 1))
    except (ValueError, TypeError):
        page = 1
        
    limit = 20
    offset = (page - 1) * limit
    
    total_msgs = Message.objects.filter(book=book).count()
    has_more = total_msgs > offset + limit

    # Get latest messages by page and reverse to chronological order
    messages = list(Message.objects.filter(book=book).order_by('-created_at')[offset:offset+limit])
    messages.reverse()

    message_data = []
    for msg in messages:
        reactions = [{'emoji': r.emoji, 'user_id': r.user_id} for r in msg.reactions.all()]
        message_data.append({
            'id': msg.id,
            'content': msg.content,
            'media_url': msg.media_url,
            'sender_id': msg.sender.id,
            'username': msg.sender.username,
            'created_at': msg.created_at.isoformat(),
            'is_seen': msg.is_seen,
            'is_delivered': msg.is_delivered,
            'reply_to': msg.reply_to_id,
            'reactions': reactions
        })

    return Response({'messages': message_data, 'has_more': has_more})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_my_messages(request, book_id):
    """Delete all messages sent by this user in the specific book room"""
    book = get_object_or_404(Book, id=book_id)
    Message.objects.filter(book=book, sender=request.user).delete()
    return Response({'success': True})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_online_users(request, book_id):
    """Get list of online users in a chat room"""
    book = get_object_or_404(Book, id=book_id)
    key = f'room_users_{book_id}'
    users = cache.get(key, set())
    
    online_users = [{'username': u, 'is_online': True} for u in users]
    
    # Fallback to include current request user initially if empty
    if not online_users:
        online_users = [{'username': request.user.username, 'is_online': True}]
        
    return Response({'online_users': online_users})
