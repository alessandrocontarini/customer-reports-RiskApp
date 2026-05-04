from django.urls import path

from reports import views

urlpatterns = [
    path("api/health/", views.health),
    path("api/auth/register/", views.register),
    path("api/auth/login/", views.login_view),
    path("api/auth/logout/", views.logout_view),
    path("api/me/", views.me),
    path("user/", views.user_compat),
    path("api/entities/", views.entities),
    path("api/entities/<int:entity_id>/", views.entity_detail),
    path("api/reports/", views.reports),
    path("api/reports/<int:report_id>/", views.report_detail),
    path("api/reports/<int:report_id>/download/", views.report_download),
    path("api/reports/<int:report_id>/cancel/", views.report_cancel),
    path("api/internal/reports/<int:report_id>/status/", views.internal_report_status),
]
