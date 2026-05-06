class ReportsClientError(Exception):
    """Errore base della libreria client report."""


class ReportsClientNetworkError(ReportsClientError):
    """Errore di rete: il microservizio report non e' raggiungibile."""


class ReportsClientHTTPError(ReportsClientError):
    """Errore HTTP restituito dal microservizio report."""

    def __init__(self, *, status_code: int, response_text: str) -> None:
        super().__init__(f"Report microservice returned HTTP {status_code}")
        self.status_code = status_code
        self.response_text = response_text
