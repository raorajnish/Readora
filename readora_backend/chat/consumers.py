import json
from channels.generic.websocket import AsyncWebsocketConsumer
from asgiref.sync import sync_to_async
from django.core.cache import cache
from .models import Message, Reaction
from django.contrib.auth import get_user_model

User = get_user_model()

class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        self.book_id = self.scope['url_route']['kwargs']['book_id']
        self.room_group_name = f'chat_{self.book_id}'

        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )

        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'user_username') and self.user_username:
            count = await self.remove_user_from_cache(self.user_username)
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'online_count_update',
                    'online_count': count
                }
            )

        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)

        # 🧠 MESSAGE
        if data['type'] == 'message':
            save_data = await self.save_message(
                sender_id=data['sender_id'],
                content=data.get('content'),
                media_url=data.get('media_url'),
                reply_to_id=data.get('reply_to')
            )
            msg = save_data['msg']

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'id': msg.id,
                    'content': msg.content,
                    'media_url': msg.media_url,
                    'sender_id': msg.sender.id,
                    'username': msg.sender.username,
                    'reply_to': msg.reply_to_id,
                    'reply_content': save_data['reply_content'],
                    'reply_username': save_data['reply_username'],
                }
            )

        # 🧠 TYPING
        elif data['type'] == 'typing':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'typing_event',
                    'user_id': data['user_id'],
                    'username': data['username']
                }
            )

        # 🧠 SEEN
        elif data['type'] == 'seen':
            await self.mark_seen(data['message_id'])

        # ❤️ REACTION
        elif data['type'] == 'reaction':
            await self.save_reaction(
                message_id=data['message_id'],
                user_id=data['user_id'],
                emoji=data['emoji']
            )

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'reaction_event',
                    'message_id': data['message_id'],
                    'emoji': data['emoji'],
                    'user_id': data['user_id']
                }
            )

        # 🗑️ UNSEND
        elif data['type'] == 'unsend':
            await self.delete_message(data['message_id'], data['user_id'])
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'unsend_event',
                    'message_id': data['message_id']
                }
            )

        # 👋 JOIN
        elif data['type'] == 'join':
            self.user_username = data.get('username')
            if self.user_username:
                count = await self.add_user_to_cache(self.user_username)
            else:
                count = 1

            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'system_message',
                    'content': f"{data['username']} joined the room",
                    'online_count': count
                }
            )

        # 🗑️ MASS UNSEND
        elif data['type'] == 'delete_user_messages':
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'mass_unsend_event',
                    'user_id': data['user_id']
                }
            )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps(event))

    async def typing_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'typing',
            'username': event['username']
        }))
        
    async def reaction_event(self, event):
        await self.send(text_data=json.dumps(event))

    async def unsend_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'unsend',
            'message_id': event['message_id']
        }))

    async def mass_unsend_event(self, event):
        await self.send(text_data=json.dumps({
            'type': 'mass_unsend',
            'user_id': event['user_id']
        }))

    async def system_message(self, event):
        payload = {
            'type': 'system',
            'content': event['content']
        }
        if 'online_count' in event:
            payload['online_count'] = event['online_count']
        await self.send(text_data=json.dumps(payload))

    async def online_count_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'online_count_update',
            'online_count': event['online_count']
        }))

    @sync_to_async
    def save_message(self, sender_id, content, media_url, reply_to_id=None):
        user = User.objects.get(id=sender_id)
        msg = Message.objects.create(
            book_id=self.book_id,
            sender=user,
            content=content or "",
            media_url=media_url or "",
            reply_to_id=reply_to_id
        )
        
        reply_content = None
        reply_username = None
        if msg.reply_to:
            reply_content = msg.reply_to.content
            reply_username = msg.reply_to.sender.username
            
        return {
            'msg': msg,
            'reply_content': reply_content,
            'reply_username': reply_username
        }

    @sync_to_async
    def mark_seen(self, msg_id):
        Message.objects.filter(id=msg_id).update(is_seen=True)

    @sync_to_async
    def save_reaction(self, message_id, user_id, emoji):
        user = User.objects.get(id=user_id)
        Reaction.objects.update_or_create(
            message_id=message_id,
            user=user,
            defaults={'emoji': emoji}
        )

    @sync_to_async
    def delete_message(self, message_id, user_id):
        Message.objects.filter(id=message_id, sender_id=user_id).delete()

    @sync_to_async
    def add_user_to_cache(self, username):
        key = f'room_users_{self.book_id}'
        users = cache.get(key, set())
        users.add(username)
        cache.set(key, users, timeout=86400)
        return len(users)

    @sync_to_async
    def remove_user_from_cache(self, username):
        key = f'room_users_{self.book_id}'
        users = cache.get(key, set())
        if username in users:
            users.remove(username)
            cache.set(key, users, timeout=86400)
        return len(users)