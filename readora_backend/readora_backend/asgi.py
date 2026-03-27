import os
from django.core.asgi import get_asgi_application

# Set settings environment variable
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'readora_backend.settings')

# Initialize the Django ASGI application first.
# This ensures django.setup() is called before any models/routing are imported.
django_asgi_app = get_asgi_application()

# Now we can safely import everything else
import django
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack

# Import routing AFTER django.setup() (which is done by get_asgi_application)
# This prevents the ImproperlyConfigured error
from chat.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": AuthMiddlewareStack(
        URLRouter(websocket_urlpatterns)
    ),
})