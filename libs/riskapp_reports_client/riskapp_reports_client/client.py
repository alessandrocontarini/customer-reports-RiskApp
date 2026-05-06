from __future__ import annotations

from typing import Any

import requests

from .exceptions import ReportsClientHTTPError, ReportsClientNetworkError
from .types import CancelReportRequest, GenerateReportRequest


class ReportsClient:
    def __init__(
        self,
        *,
        base_url: str,
        internal_token: str,
        timeout: float = 2.0,
        session: requests.Session | None = None,
    ) -> None:
        self.base_url = base_url.rstrip("/")
        self.internal_token = internal_token
        self.timeout = timeout
        self.session = session or requests.Session()

    def generate_report(
        self,
        *,
        report_id: int,
        entity_id: int,
        user_id: int,
        parameters: dict[str, Any],
        status_url: str,
    ) -> dict[str, Any]:
        request = GenerateReportRequest(
            report_id=report_id,
            entity_id=entity_id,
            user_id=user_id,
            parameters=parameters,
            status_url=status_url,
        )

        return self._post(
            "/internal/reports/generate/",
            json=request.to_payload(),
        )

    def cancel_report(self, *, report_id: int, reason: str) -> dict[str, Any]:
        request = CancelReportRequest(
            report_id=report_id,
            reason=reason,
        )

        return self._post(
            f"/internal/reports/{report_id}/cancel/",
            json=request.to_payload(),
        )

    def _post(self, path: str, *, json: dict[str, Any]) -> dict[str, Any]:
        try:
            response = self.session.post(
                f"{self.base_url}{path}",
                json=json,
                headers=self._headers(),
                timeout=self.timeout,
            )
        except requests.RequestException as exc:
            raise ReportsClientNetworkError(
                "Report microservice is unreachable"
            ) from exc

        if not response.ok:
            raise ReportsClientHTTPError(
                status_code=response.status_code,
                response_text=response.text,
            )

        return response.json()

    def _headers(self) -> dict[str, str]:
        return {
            "Authorization": f"Bearer {self.internal_token}",
        }
