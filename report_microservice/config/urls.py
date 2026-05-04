from django.urls import path

from worker import views

urlpatterns = [
    path("internal/health/", views.health),
    path("internal/reports/generate/", views.generate_report),
    path("internal/reports/<int:report_id>/cancel/", views.cancel_report),
]
