from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass(frozen=True)
class GenerateReportRequest:
    report_id: int
    entity_id: int
    user_id: int
    status_url: str
    parameters: dict[str, Any] = field(default_factory=dict)

    def to_payload(self) -> dict[str, Any]:
        return {
            "report_id": self.report_id,
            "entity_id": self.entity_id,
            "user_id": self.user_id,
            "parameters": self.parameters,
            "callback": {
                "status_url": self.status_url,
            },
        }


@dataclass(frozen=True)
class CancelReportRequest:
    report_id: int
    reason: str

    def to_payload(self) -> dict[str, Any]:
        return {
            "report_id": self.report_id,
            "reason": self.reason,
        }
