import os
from django.core.asgi import get_asgi_application

# Set settings before anything else
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'readora_backend.settings')

# Initialize Django ASGI application early
django_asgi_app = get_asgi_application()

# Now import channels and routing
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from chat.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})