from django.urls import path
from .views import get_books, get_book, create_book, update_book, verify_password, toggle_bookmark, delete_book, get_user_books

urlpatterns = [
    path('', get_books),
    path('user/', get_user_books),
    path('create/', create_book),
    path('<int:book_id>/', get_book),
    path('<int:book_id>/update/', update_book),
    path('<int:book_id>/verify/', verify_password),
    path('<int:book_id>/bookmark/', toggle_bookmark),
    path('<int:book_id>/delete/', delete_book),
]