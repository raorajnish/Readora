from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, UserProfile, Bookmark


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'phone_number', 'is_staff', 'date_joined')
    fieldsets = UserAdmin.fieldsets + (
        ('Extra', {'fields': ('phone_number',)}),
    )
    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Extra', {'fields': ('phone_number',)}),
    )


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ('user', 'bio')


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ('user', 'book', 'created_at')
