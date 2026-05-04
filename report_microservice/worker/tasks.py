import threading
import time
from typing import Any

from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from django.conf import settings

import requests

_cancelled_reports: set[int] = set()


def is_cancelled(report_id: int) -> bool:
    return report_id in _cancelled_reports


def cancel_report_task(report_id: int) -> None:
    _cancelled_reports.add(report_id)


def start_report_task(payload: dict[str, Any]) -> None:
    thread = threading.Thread(target=_run_report_task, args=(payload,), daemon=True)
    thread.start()


def _run_report_task(payload: dict[str, Any]) -> None:
    report_id = int(payload["report_id"])
    user_id = int(payload["user_id"])
    callback_url = payload["callback"]["status_url"]

    try:
        _update_backend(callback_url, {"status": "running"})
        _broadcast(user_id, {"type": "report.updated", "report_id": report_id, "status": "running"})
        time.sleep(2)

        if is_cancelled(report_id):
            _broadcast(
                user_id,
                {"type": "report.updated", "report_id": report_id, "status": "cancelled"},
            )
            return

        time.sleep(2)
        updated = _update_backend(callback_url, {"status": "completed"})
        _broadcast(
            user_id,
            {
                "type": "report.ready",
                "report_id": report_id,
                "status": "completed",
                "payload": {
                    "download_url": updated.get("data", {}).get(
                        "download_url", f"/api/reports/{report_id}/download/"
                    )
                },
            },
        )
    except Exception:
        _update_backend(
            callback_url,
            {
                "status": "failed",
                "error": {
                    "code": "REPORT_GENERATION_FAILED",
                    "message": "Errore durante la generazione del PDF",
                },
            },
        )
        _broadcast(
            user_id,
            {
                "type": "report.failed",
                "report_id": report_id,
                "status": "failed",
                "error": {
                    "code": "REPORT_GENERATION_FAILED",
                    "message": "Errore durante la generazione del PDF",
                },
            },
        )


def _update_backend(url: str, body: dict[str, Any]) -> dict[str, Any]:
    response = requests.patch(
        url,
        json=body,
        headers={"Authorization": f"Bearer {settings.INTERNAL_SERVICE_TOKEN}"},
        timeout=5,
    )
    response.raise_for_status()
    return response.json()


def _broadcast(user_id: int, message: dict[str, Any]) -> None:
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"reports_user_{user_id}",
        {"type": "report.message", "message": message},
    )
