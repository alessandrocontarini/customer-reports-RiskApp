import json

from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.conf import settings

try:
    import requests
except ImportError:  # pragma: no cover
    requests = None


class ReportsConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self) -> None:
        self.user_id = None
        self.group_name = None
        await self.accept()

    async def disconnect(self, close_code: int) -> None:
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive_json(self, content: dict, **kwargs) -> None:
        message_type = content.get("type")
        if message_type == "auth":
            await self._authenticate_with_backend_cookie()
            return
        if message_type == "subscribe":
            if not self.user_id:
                await self.send_json(
                    {
                        "type": "auth.failed",
                        "error": {
                            "code": "UNAUTHORIZED",
                            "message": "WebSocket non autenticato",
                        },
                    }
                )
                return
            await self.send_json(
                {
                    "type": "subscribed",
                    "filters": content.get("filters", {}),
                }
            )

    async def report_message(self, event: dict) -> None:
        await self.send_json(event["message"])

    async def _authenticate_with_backend_cookie(self) -> None:
        if requests is None:
            await self._auth_failed("Client HTTP non disponibile nel microservizio")
            return

        cookie_header = _header_value(self.scope["headers"], b"cookie")
        try:
            response = requests.get(
                f"{settings.BACKEND_BASE_URL}/api/me/",
                headers={"Cookie": cookie_header},
                timeout=3,
            )
        except requests.RequestException:
            await self._auth_failed("Backend non raggiungibile")
            return

        if response.status_code != 200:
            await self._auth_failed("Cookie di sessione non valido")
            return

        user = response.json()["data"]
        self.user_id = user["id"]
        self.group_name = f"reports_user_{self.user_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.send_json({"type": "auth.success", "user": user})

    async def _auth_failed(self, message: str) -> None:
        await self.send_json(
            {
                "type": "auth.failed",
                "error": {"code": "UNAUTHORIZED", "message": message},
            }
        )
        await self.close()


def _header_value(headers: list[tuple[bytes, bytes]], name: bytes) -> str:
    for key, value in headers:
        if key.lower() == name:
            return value.decode("latin-1")
    return ""
