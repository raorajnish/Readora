from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework import status
from .serializers import RegisterSerializer, UserSerializer, UserProfileSerializer, BookmarkSerializer
from .models import User, UserProfile, Bookmark
from django.contrib.auth import authenticate
from rest_framework_simplejwt.tokens import RefreshToken


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    user = serializer.save()

    # Auto-create profile
    UserProfile.objects.get_or_create(user=user)

    token = RefreshToken.for_user(user)

    return Response({
        "user": UserSerializer(user).data,
        "token": str(token.access_token)
    }, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    username = request.data.get('username', '').strip()
    password = request.data.get('password', '')

    # Allow login by email too
    if '@' in username:
        try:
            username = User.objects.get(email__iexact=username).username
        except User.DoesNotExist:
            return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

    user = authenticate(username=username, password=password)

    if not user:
        return Response({"error": "Invalid credentials"}, status=status.HTTP_400_BAD_REQUEST)

    token = RefreshToken.for_user(user)

    return Response({
        "token": str(token.access_token),
        "user": UserSerializer(user).data,
    })


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile(request):
    user_profile, _ = UserProfile.objects.get_or_create(user=request.user)
    if request.method == 'GET':
        return Response(UserProfileSerializer(user_profile).data)
    serializer = UserProfileSerializer(user_profile, data=request.data, partial=True)
    serializer.is_valid(raise_exception=True)
    serializer.save()
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def bookmarks(request):
    bms = Bookmark.objects.filter(user=request.user).select_related('book')
    return Response(BookmarkSerializer(bms, many=True).data)