from asgiref.sync import async_to_sync
from channels.generic.websocket import JsonWebsocketConsumer
from django.conf import settings

from .crypto import encrypt_socket_message, import_rsa_public_key_from_jwk

try:
    import requests
except ImportError:  # pragma: no cover
    requests = None


class ReportsConsumer(JsonWebsocketConsumer):
    def connect(self) -> None:
        self.user_id = None
        self.group_name = None
        self.public_key = None
        self.accept()

    def disconnect(self, close_code: int) -> None:
        if self.group_name:
            async_to_sync(self.channel_layer.group_discard)(
                self.group_name,
                self.channel_name,
            )

    def receive_json(self, content: dict, **kwargs) -> None:
        message_type = content.get("type")

        if message_type == "auth":
            self._set_public_key(content.get("public_key"))
            self._authenticate_with_backend_cookie()
            return

        if message_type == "subscribe":
            if not self.user_id:
                self.send_json(
                    {
                        "type": "auth.failed",
                        "error": {
                            "code": "UNAUTHORIZED",
                            "message": "WebSocket non autenticato",
                        },
                    }
                )
                return

            self.send_json(
                {
                    "type": "subscribed",
                    "filters": content.get("filters", {}),
                }
            )
            return

    def report_message(self, event: dict) -> None:
        message = event["message"]

        if self.public_key is None:
            self.send_json(message)
            return

        self.send_json(encrypt_socket_message(self.public_key, message))

    def _set_public_key(self, public_key_jwk) -> None:
        if not public_key_jwk:
            self.public_key = None
            return

        try:
            self.public_key = import_rsa_public_key_from_jwk(public_key_jwk)
        except (KeyError, TypeError, ValueError):
            self.public_key = None

    def _authenticate_with_backend_cookie(self) -> None:
        if requests is None:
            self._auth_failed("Client HTTP non disponibile nel microservizio")
            return

        cookie_header = _header_value(self.scope["headers"], b"cookie")

        try:
            response = requests.get(
                f"{settings.BACKEND_BASE_URL}/api/me/",
                headers={"Cookie": cookie_header},
                timeout=3,
            )
        except requests.RequestException:
            self._auth_failed("Backend non raggiungibile")
            return

        if response.status_code != 200:
            self._auth_failed("Cookie di sessione non valido")
            return

        user = response.json()["data"]

        self.user_id = user["id"]
        self.group_name = f"reports_user_{self.user_id}"

        async_to_sync(self.channel_layer.group_add)(
            self.group_name,
            self.channel_name,
        )

        self.send_json({"type": "auth.success", "user": user})

    def _auth_failed(self, message: str) -> None:
        self.send_json(
            {
                "type": "auth.failed",
                "error": {
                    "code": "UNAUTHORIZED",
                    "message": message,
                },
            }
        )
        self.close()


def _header_value(headers: list[tuple[bytes, bytes]], name: bytes) -> str:
    for key, value in headers:
        if key.lower() == name:
            return value.decode("latin-1")
    return ""
