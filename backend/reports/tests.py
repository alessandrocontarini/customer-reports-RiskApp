import json

from django.contrib.auth.models import User
from django.test import TestCase

from .models import Entity, Report


class CustomerIsolationTests(TestCase):
    def setUp(self):
        self.user_a = User.objects.create_user(
            username="a@example.com",
            email="a@example.com",
            password="password",
        )
        self.user_b = User.objects.create_user(
            username="b@example.com",
            email="b@example.com",
            password="password",
        )

        self.entity_a = Entity.objects.create(
            owner=self.user_a,
            name="Cliente Utente A",
            description="Visibile solo ad A",
        )
        self.entity_b = Entity.objects.create(
            owner=self.user_b,
            name="Cliente Utente B",
            description="Visibile solo a B",
        )
        self.report_b = Report.objects.create(
            owner=self.user_b,
            entity=self.entity_b,
            title="Report di B",
            status=Report.COMPLETED,
        )
        self.report_a = Report.objects.create(
            owner=self.user_a,
            entity=self.entity_a,
            title="Report di A",
            status=Report.COMPLETED,
        )

    def test_user_sees_only_own_customers(self):
        self.client.login(username="a@example.com", password="password")

        response = self.client.get("/api/entities/")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        names = [entity["name"] for entity in payload["data"]]
        self.assertIn("Cliente Utente A", names)
        self.assertNotIn("Cliente Utente B", names)

    def test_user_cannot_read_other_user_customer_detail(self):
        self.client.login(username="a@example.com", password="password")

        response = self.client.get(f"/api/entities/{self.entity_b.id}/")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["error"]["code"], "ENTITY_NOT_FOUND")

    def test_user_cannot_create_report_for_other_user_customer(self):
        self.client.login(username="a@example.com", password="password")

        response = self.client.post(
            "/api/reports/",
            data=json.dumps(
                {
                    "title": "Tentativo su cliente di B",
                    "entity_id": self.entity_b.id,
                    "parameters": {},
                }
            ),
            content_type="application/json",
        )

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["error"]["code"], "ENTITY_NOT_FOUND")

    def test_user_cannot_read_other_user_report(self):
        self.client.login(username="a@example.com", password="password")

        response = self.client.get(f"/api/reports/{self.report_b.id}/")

        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.json()["error"]["code"], "REPORT_NOT_FOUND")

    def test_user_can_filter_reports_by_own_customer(self):
        other_entity_a = Entity.objects.create(
            owner=self.user_a,
            name="Altro cliente A",
            description="Altro cliente dello stesso utente",
        )
        Report.objects.create(
            owner=self.user_a,
            entity=other_entity_a,
            title="Report altro cliente A",
        )
        self.client.login(username="a@example.com", password="password")

        response = self.client.get(f"/api/reports/?entity_id={self.entity_a.id}")

        self.assertEqual(response.status_code, 200)
        payload = response.json()
        self.assertEqual([report["title"] for report in payload["data"]], ["Report di A"])

    def test_user_can_delete_completed_report(self):
        self.client.login(username="a@example.com", password="password")

        response = self.client.delete(f"/api/reports/{self.report_a.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Report.objects.filter(id=self.report_a.id).exists())

    def test_user_can_delete_cancelled_report(self):
        report = Report.objects.create(
            owner=self.user_a,
            entity=self.entity_a,
            title="Report annullato",
            status=Report.CANCELLED,
        )
        self.client.login(username="a@example.com", password="password")

        response = self.client.delete(f"/api/reports/{report.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Report.objects.filter(id=report.id).exists())

    def test_user_cannot_delete_running_report(self):
        report = Report.objects.create(
            owner=self.user_a,
            entity=self.entity_a,
            title="Report in corso",
            status=Report.RUNNING,
        )
        self.client.login(username="a@example.com", password="password")

        response = self.client.delete(f"/api/reports/{report.id}/")

        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()["error"]["code"], "REPORT_DELETE_NOT_ALLOWED")
        self.assertTrue(Report.objects.filter(id=report.id).exists())

    def test_user_cannot_delete_other_user_report(self):
        self.client.login(username="a@example.com", password="password")

        response = self.client.delete(f"/api/reports/{self.report_b.id}/")

        self.assertEqual(response.status_code, 404)
        self.assertTrue(Report.objects.filter(id=self.report_b.id).exists())

    def test_user_can_delete_own_report(self):
        self.client.login(username="a@example.com", password="password")

        response = self.client.delete(f"/api/reports/{self.report_a.id}/")

        self.assertEqual(response.status_code, 204)
        self.assertFalse(Report.objects.filter(id=self.report_a.id).exists())

    def test_user_cannot_delete_other_user_report(self):
        self.client.login(username="a@example.com", password="password")

        response = self.client.delete(f"/api/reports/{self.report_b.id}/")

        self.assertEqual(response.status_code, 404)
        self.assertTrue(Report.objects.filter(id=self.report_b.id).exists())
