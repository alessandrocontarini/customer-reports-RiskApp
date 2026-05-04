import json
from datetime import datetime

from django.conf import settings
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.http import HttpRequest, HttpResponse, JsonResponse
from django.middleware.csrf import get_token
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt, ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .models import Entity, Report
from .pdf import build_mock_pdf

try:
    import requests
except ImportError:  # pragma: no cover
    requests = None


def _json_body(request: HttpRequest) -> dict:
    if not request.body:
        return {}
    return json.loads(request.body.decode("utf-8"))


def _data(data, status: int = 200) -> JsonResponse:
    response = JsonResponse({"data": data}, status=status)
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Origin"] = settings.FRONTEND_ORIGIN
    return response


def _error(code: str, message: str, status: int) -> JsonResponse:
    response = JsonResponse({"error": {"code": code, "message": message}}, status=status)
    response["Access-Control-Allow-Credentials"] = "true"
    response["Access-Control-Allow-Origin"] = settings.FRONTEND_ORIGIN
    return response


def _user_payload(user: User) -> dict:
    return {
        "id": user.id,
        "uuid": str(user.id),
        "username": user.username,
        "email": user.email,
        "first_name": user.first_name or None,
        "last_name": user.last_name or None,
        "is_active": user.is_active,
    }


def _entity_payload(entity: Entity) -> dict:
    return {
        "id": entity.id,
        "name": entity.name,
        "description": entity.description,
        "created_at": entity.created_at.isoformat(),
        "updated_at": entity.updated_at.isoformat(),
    }


def _report_payload(report: Report) -> dict:
    file_available = report.status == Report.COMPLETED and bool(report.file_content)
    return {
        "id": report.id,
        "title": report.title,
        "entity_id": report.entity_id,
        "entity_name": report.entity.name,
        "status": report.status,
        "file_available": file_available,
        "download_url": f"/api/reports/{report.id}/download/" if file_available else None,
        "error": (
            {"code": report.error_code, "message": report.error_message}
            if report.error_code
            else None
        ),
        "created_at": report.created_at.isoformat(),
        "updated_at": report.updated_at.isoformat(),
    }


def _is_internal(request: HttpRequest) -> bool:
    auth = request.headers.get("Authorization", "")
    internal = request.headers.get("X-Internal-Token", "")
    return (
        auth == f"Bearer {settings.INTERNAL_SERVICE_TOKEN}"
        or internal == settings.INTERNAL_SERVICE_TOKEN
    )


def _paginate(queryset, request: HttpRequest):
    limit = int(request.GET.get("limit", 20))
    offset = int(request.GET.get("offset", 0))
    limit = max(1, min(limit, 100))
    offset = max(0, offset)
    return queryset[offset : offset + limit], {
        "count": queryset.count(),
        "limit": limit,
        "offset": offset,
    }


@require_http_methods(["GET", "OPTIONS"])
def health(request: HttpRequest) -> JsonResponse:
    return _data(
        {
            "status": "ok",
            "service": "backend",
            "timestamp": datetime.now().isoformat(),
        }
    )


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def register(request: HttpRequest) -> JsonResponse:
    body = _json_body(request)
    email = body.get("email", "").strip().lower()
    password = body.get("password", "")
    password_confirm = body.get("password_confirm", "")
    if not email or not password or password != password_confirm:
        return _error("VALIDATION_ERROR", "Dati di registrazione non validi", 400)
    if User.objects.filter(username=email).exists():
        return _error("EMAIL_ALREADY_EXISTS", "Esiste gia' un utente con questa email", 409)
    user = User.objects.create_user(
        username=email,
        email=email,
        password=password,
        first_name=body.get("first_name", ""),
        last_name=body.get("last_name", ""),
    )
    return _data(_user_payload(user), 201)


@csrf_exempt
@ensure_csrf_cookie
@require_http_methods(["POST", "OPTIONS"])
def login_view(request: HttpRequest) -> JsonResponse:
    body = _json_body(request)
    username = (body.get("email") or body.get("username") or "").strip().lower()
    user = authenticate(request, username=username, password=body.get("password", ""))
    if user is None:
        return _error("INVALID_CREDENTIALS", "Credenziali non valide", 401)
    login(request, user)
    response = _data(_user_payload(user))
    response["X-CSRFToken"] = get_token(request)
    return response


@csrf_exempt
@require_http_methods(["POST", "OPTIONS"])
def logout_view(request: HttpRequest) -> JsonResponse:
    logout(request)
    return _data({"success": True})


@login_required
@require_http_methods(["GET", "OPTIONS"])
def me(request: HttpRequest) -> JsonResponse:
    return _data(_user_payload(request.user))


@login_required
@require_http_methods(["GET", "OPTIONS"])
def user_compat(request: HttpRequest) -> JsonResponse:
    return JsonResponse(_user_payload(request.user))


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST", "OPTIONS"])
def entities(request: HttpRequest) -> JsonResponse:
    if request.method == "POST":
        body = _json_body(request)
        name = body.get("name", "").strip()
        if not name:
            return _error("VALIDATION_ERROR", "Il nome cliente e' obbligatorio", 400)
        entity = Entity.objects.create(
            owner=request.user,
            name=name,
            description=body.get("description", "").strip(),
        )
        return _data(_entity_payload(entity), 201)

    queryset = Entity.objects.filter(owner=request.user)
    search = request.GET.get("search", "").strip()
    if search:
        queryset = queryset.filter(name__icontains=search)
    page, meta = _paginate(queryset, request)
    return JsonResponse({"data": [_entity_payload(entity) for entity in page], "meta": meta})


@csrf_exempt
@login_required
@require_http_methods(["GET", "PATCH", "DELETE", "OPTIONS"])
def entity_detail(request: HttpRequest, entity_id: int) -> JsonResponse | HttpResponse:
    try:
        entity = Entity.objects.get(id=entity_id, owner=request.user)
    except Entity.DoesNotExist:
        return _error("ENTITY_NOT_FOUND", "Cliente non trovato", 404)

    if request.method == "GET":
        return _data(_entity_payload(entity))
    if request.method == "DELETE":
        if entity.reports.exclude(status__in=[Report.FAILED, Report.CANCELLED]).exists():
            return _error("ENTITY_IN_USE", "Cliente collegato a report ancora attivi", 409)
        entity.delete()
        return HttpResponse(status=204)

    body = _json_body(request)
    if "name" in body:
        entity.name = body["name"].strip()
    if "description" in body:
        entity.description = body["description"].strip()
    entity.save()
    return _data(_entity_payload(entity))


@csrf_exempt
@login_required
@require_http_methods(["GET", "POST", "OPTIONS"])
def reports(request: HttpRequest) -> JsonResponse:
    if request.method == "POST":
        body = _json_body(request)
        try:
            entity = Entity.objects.get(id=body.get("entity_id"), owner=request.user)
        except Entity.DoesNotExist:
            return _error("ENTITY_NOT_FOUND", "Cliente non trovato", 404)
        report = Report.objects.create(
            owner=request.user,
            entity=entity,
            title=body.get("title", "Report rischio cliente").strip() or "Report rischio cliente",
            parameters=body.get("parameters", {}),
        )
        _call_microservice_generate(report)
        return _data(_report_payload(report), 201)

    queryset = Report.objects.filter(owner=request.user).select_related("entity")
    status = request.GET.get("status", "").strip()
    entity_id = request.GET.get("entity_id", "").strip()
    if status:
        queryset = queryset.filter(status=status)
    if entity_id:
        queryset = queryset.filter(entity_id=entity_id)
    page, meta = _paginate(queryset, request)
    return JsonResponse({"data": [_report_payload(report) for report in page], "meta": meta})


@csrf_exempt
@login_required
@require_http_methods(["GET", "DELETE", "OPTIONS"])
def report_detail(request: HttpRequest, report_id: int) -> JsonResponse | HttpResponse:
    try:
        report = Report.objects.select_related("entity").get(
            id=report_id,
            owner=request.user,
        )
    except Report.DoesNotExist:
        return _error("REPORT_NOT_FOUND", "Report non trovato", 404)

    if request.method == "DELETE":
        if report.status not in [Report.CANCELLED, Report.COMPLETED]:
            return _error(
                "REPORT_DELETE_NOT_ALLOWED",
                "Il report puo' essere eliminato solo se completato o annullato",
                409,
            )
        report.delete()
        return HttpResponse(status=204)

    return _data(_report_payload(report))



@login_required
@require_http_methods(["GET", "OPTIONS"])
def report_download(request: HttpRequest, report_id: int) -> HttpResponse:
    try:
        report = Report.objects.get(id=report_id, owner=request.user)
    except Report.DoesNotExist:
        return _error("REPORT_NOT_FOUND", "Report non trovato", 404)
    if report.status != Report.COMPLETED or not report.file_content:
        return _error("REPORT_NOT_READY", "Report non ancora pronto", 409)
    response = HttpResponse(bytes(report.file_content), content_type="application/pdf")
    response["Content-Disposition"] = f'attachment; filename="report-{report.id}.pdf"'
    return response


@csrf_exempt
@login_required
@require_http_methods(["POST", "OPTIONS"])
def report_cancel(request: HttpRequest, report_id: int) -> JsonResponse:
    try:
        report = Report.objects.get(id=report_id, owner=request.user)
    except Report.DoesNotExist:
        return _error("REPORT_NOT_FOUND", "Report non trovato", 404)
    if report.status == Report.COMPLETED:
        return _error("REPORT_ALREADY_COMPLETED", "Report gia' completato", 409)
    report.status = Report.CANCELLED
    report.file_content = None
    report.save()
    _call_microservice_cancel(report)
    return _data(_report_payload(report))


@csrf_exempt
@require_http_methods(["PATCH", "OPTIONS"])
def internal_report_status(request: HttpRequest, report_id: int) -> JsonResponse:
    if not _is_internal(request):
        return _error("UNAUTHORIZED", "Token interno non valido", 401)
    try:
        report = Report.objects.select_related("entity").get(id=report_id)
    except Report.DoesNotExist:
        return _error("REPORT_NOT_FOUND", "Report non trovato", 404)

    body = _json_body(request)
    status = body.get("status")
    if status not in dict(Report.STATUS_CHOICES):
        return _error("VALIDATION_ERROR", "Stato report non valido", 400)

    report.status = status
    report.error_code = body.get("error", {}).get("code", "") if status == Report.FAILED else ""
    report.error_message = body.get("error", {}).get("message", "") if status == Report.FAILED else ""
    if status == Report.COMPLETED:
        report.file_content = build_mock_pdf(report.title, report.entity.name)
    report.save()
    return _data(_report_payload(report))


def _call_microservice_generate(report: Report) -> None:
    if requests is None:
        return
    payload = {
        "report_id": report.id,
        "entity_id": report.entity_id,
        "user_id": report.owner_id,
        "parameters": report.parameters,
        "callback": {
            "status_url": f"http://127.0.0.1:8000/api/internal/reports/{report.id}/status/"
        },
    }
    try:
        requests.post(
            f"{settings.MICROSERVICE_BASE_URL}/internal/reports/generate/",
            json=payload,
            headers={"Authorization": f"Bearer {settings.INTERNAL_SERVICE_TOKEN}"},
            timeout=2,
        )
    except requests.RequestException:
        report.status = Report.FAILED
        report.error_code = "MICROSERVICE_UNAVAILABLE"
        report.error_message = "Microservizio report non raggiungibile"
        report.updated_at = timezone.now()
        report.save(update_fields=["status", "error_code", "error_message", "updated_at"])


def _call_microservice_cancel(report: Report) -> None:
    if requests is None:
        return
    try:
        requests.post(
            f"{settings.MICROSERVICE_BASE_URL}/internal/reports/{report.id}/cancel/",
            json={"report_id": report.id, "reason": "Richiesta annullata dall'utente"},
            headers={"Authorization": f"Bearer {settings.INTERNAL_SERVICE_TOKEN}"},
            timeout=2,
        )
    except requests.RequestException:
        pass
