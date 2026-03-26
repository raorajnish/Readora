import logging
import cloudinary.uploader
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
from urllib.parse import urlparse
import cloudinary.uploader
from .models import Book
from .serializers import BookSerializer, BookCreateSerializer
from accounts.models import Bookmark

logger = logging.getLogger(__name__)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_books(request):
    search = request.query_params.get('search', '').strip()
    qs = Book.objects.all().order_by('-created_at')
    if search:
        qs = qs.filter(
            Q(title__icontains=search) |
            Q(book_username__icontains=search) |
            Q(author__icontains=search)
        )
    serializer = BookSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_book(request, book_id):
    try:
        book = Book.objects.get(id=book_id)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

    serializer = BookSerializer(book, context={'request': request})
    book_data = serializer.data

    debug_info = {
        'pdf_url': book.pdf_url,
        'cover_image_url': book.cover_image_url,
        'cloudinary_source': book.pdf_url and 'cloudinary' in book.pdf_url,
    }

    logger.info('get_book debug: %s', debug_info)

    return Response({**book_data, 'debug': debug_info})


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def create_book(request):
    data = request.data.copy()
    pdf_url = ''
    cover_url = ''

    # Upload PDF to Cloudinary
    pdf_file = request.FILES.get('pdf_file')
    if pdf_file:
        try:
            upload_result = cloudinary.uploader.upload(
                pdf_file,
                resource_type='raw',
                folder='readora/pdfs',
            )
            pdf_url = upload_result.get('secure_url', '')
            logger.info('Cloudinary PDF upload result: %s', upload_result)
        except Exception as e:
            logger.error('PDF upload failed: %s', e, exc_info=True)
            return Response({'error': f'PDF upload failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    # Upload cover image to Cloudinary
    cover_file = request.FILES.get('cover_file')
    if cover_file:
        try:
            upload_result = cloudinary.uploader.upload(
                cover_file,
                resource_type='image',
                folder='readora/covers',
            )
            cover_url = upload_result.get('secure_url', '')
            logger.info('Cloudinary cover upload result: %s', upload_result)
        except Exception as e:
            logger.error('Cover upload failed: %s', e, exc_info=True)
            return Response({'error': f'Cover upload failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = BookCreateSerializer(data={
        'title': data.get('title'),
        'description': data.get('description', ''),
        'author': data.get('author', ''),
        'book_username': data.get('book_username'),
        'password': data.get('password'),
        'pdf_url': pdf_url or data.get('pdf_url', ''),
        'cover_image_url': cover_url or data.get('cover_image_url', ''),
    })
    serializer.is_valid(raise_exception=True)
    book = serializer.save(created_by=request.user)

    book_data = BookSerializer(book, context={'request': request}).data
    logger.info('Saved book to DB: %s', book_data)

    # Include debug info in response for tracing if needed
    debug_data = {
        'pdf_url': pdf_url,
        'cover_url': cover_url,
        'payload': {
            'title': data.get('title'),
            'book_username': data.get('book_username'),
            'author': data.get('author'),
        },
    }

    response_data = {**book_data, 'debug': debug_data}
    return Response(response_data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def _extract_cloudinary_public_id(url):
    if not url:
        return None
    try:
        parsed = urlparse(url)
        path = parsed.path
        if '/upload/' not in path:
            return None
        after_upload = path.split('/upload/')[1]
        public_id = after_upload.rsplit('.', 1)[0]
        return public_id
    except Exception:
        return None


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_book(request, book_id):
    try:
        book = Book.objects.get(id=book_id, created_by=request.user)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found or not owned by user'}, status=status.HTTP_404_NOT_FOUND)

    # Delete Cloudinary resources when available
    try:
        pdf_id = _extract_cloudinary_public_id(book.pdf_url)
        if pdf_id:
            cloudinary.uploader.destroy(pdf_id, resource_type='raw', invalidate=True)
    except Exception as e:
        logger.warning('Cloudinary PDF destroy failed: %s', e)

    try:
        cover_id = _extract_cloudinary_public_id(book.cover_image_url)
        if cover_id:
            cloudinary.uploader.destroy(cover_id, resource_type='image', invalidate=True)
    except Exception as e:
        logger.warning('Cloudinary cover destroy failed: %s', e)

    book.delete()
    return Response({'success': True})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_books(request):
    qs = Book.objects.filter(created_by=request.user).order_by('-created_at')
    serializer = BookSerializer(qs, many=True, context={'request': request})
    return Response(serializer.data)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def update_book(request, book_id):
    try:
        book = Book.objects.get(id=book_id, created_by=request.user)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found or not owned by you'}, status=status.HTTP_404_NOT_FOUND)

    data = request.data.copy()
    pdf_url = book.pdf_url
    cover_url = book.cover_image_url

    pdf_file = request.FILES.get('pdf_file')
    if pdf_file:
        try:
            upload_result = cloudinary.uploader.upload(
                pdf_file,
                resource_type='raw',
                folder='readora/pdfs',
            )
            pdf_url = upload_result.get('secure_url', pdf_url)
        except Exception as e:
            return Response({'error': f'PDF upload failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    cover_file = request.FILES.get('cover_file')
    if cover_file:
        try:
            upload_result = cloudinary.uploader.upload(
                cover_file,
                resource_type='image',
                folder='readora/covers',
            )
            cover_url = upload_result.get('secure_url', cover_url)
        except Exception as e:
            return Response({'error': f'Cover upload failed: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = BookCreateSerializer(book, data={
        'title': data.get('title', book.title),
        'description': data.get('description', book.description),
        'author': data.get('author', book.author),
        'book_username': data.get('book_username', book.book_username),
        'password': data.get('password', book.password),
        'pdf_url': pdf_url,
        'cover_image_url': cover_url,
    }, partial=True)
    serializer.is_valid(raise_exception=True)
    book = serializer.save()

    return Response(BookSerializer(book, context={'request': request}).data)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_password(request, book_id):
    try:
        book = Book.objects.get(id=book_id)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

    if book.password == request.data.get('password', ''):
        return Response({'access': True})

    return Response({'access': False, 'error': 'Invalid Promocode'}, status=status.HTTP_403_FORBIDDEN)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def toggle_bookmark(request, book_id):
    try:
        book = Book.objects.get(id=book_id)
    except Book.DoesNotExist:
        return Response({'error': 'Book not found'}, status=status.HTTP_404_NOT_FOUND)

    bm, created = Bookmark.objects.get_or_create(user=request.user, book=book)
    if not created:
        bm.delete()
        return Response({'bookmarked': False})
    return Response({'bookmarked': True})