from django.urls import path
from . import views

app_name = 'chat'

urlpatterns = [
    path('messages/<int:book_id>/', views.get_messages, name='get_messages'),
    path('messages/<int:book_id>/delete/', views.delete_my_messages, name='delete_my_messages'),
    path('rooms/<int:book_id>/', views.get_online_users, name='chat_room'), # kept for compatibility if needed
    path('users/<int:book_id>/', views.get_online_users, name='online_users'),
]