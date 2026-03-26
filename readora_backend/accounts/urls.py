from django.urls import path
from .views import register, login, me, profile, bookmarks

urlpatterns = [
    path('register/', register),
    path('login/', login),
    path('me/', me),
    path('profile/', profile),
    path('bookmarks/', bookmarks),
]