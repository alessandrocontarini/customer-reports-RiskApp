import json
from datetime import datetime

from django.conf import settings
from django.http import HttpRequest, JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from .tasks import cancel_report_task, start_report_task


def _json_body(request: HttpRequest) -> dict:
    if not request.body:
        return {}
    return json.loads(request.body.decode("utf-8"))


def _data(data, status: int = 200) -> JsonResponse:
    return JsonResponse({"data": data}, status=status)


def _error(code: str, message: str, status: int) -> JsonResponse:
    return JsonResponse({"error": {"code": code, "message": message}}, status=status)


def _is_internal(request: HttpRequest) -> bool:
    auth = request.headers.get("Authorization", "")
    internal = request.headers.get("X-Internal-Token", "")
    return (
        auth == f"Bearer {settings.INTERNAL_SERVICE_TOKEN}"
        or internal == settings.INTERNAL_SERVICE_TOKEN
    )


@require_http_methods(["GET"])
def health(request: HttpRequest) -> JsonResponse:
    if not _is_internal(request):
        return _error("UNAUTHORIZED", "Token interno non valido", 401)
    return _data(
        {
            "status": "ok",
            "service": "report-microservice",
            "timestamp": datetime.now().isoformat(),
        }
    )


@csrf_exempt
@require_http_methods(["POST"])
def generate_report(request: HttpRequest) -> JsonResponse:
    if not _is_internal(request):
        return _error("UNAUTHORIZED", "Token interno non valido", 401)
    body = _json_body(request)
    start_report_task(body)
    return _data(
        {
            "accepted": True,
            "report_id": body.get("report_id"),
            "status": "queued",
        },
        202,
    )


@csrf_exempt
@require_http_methods(["POST"])
def cancel_report(request: HttpRequest, report_id: int) -> JsonResponse:
    if not _is_internal(request):
        return _error("UNAUTHORIZED", "Token interno non valido", 401)
    cancel_report_task(report_id)
    return _data({"accepted": True, "report_id": report_id, "status": "cancelling"})
