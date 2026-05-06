# Customer Reports RiskApp

Applicazione demo composta da frontend React/Vite, backend Django, microservizio Django Channels per la generazione report, PostgreSQL e Redis.

Il sistema usa autenticazione utente via cookie/sessione Django, comunicazione backend-microservizio tramite token interno e aggiornamenti live via WebSocket con payload report cifrati tramite RSA-OAEP SHA-256.

## Componenti

- `frontend`: applicazione React/Vite esposta su `https://localhost:3000`.
- `backend`: backend Django REST esposto su `http://127.0.0.1:8000`.
- `report-microservice`: microservizio Django/Channels esposto su `http://127.0.0.1:8100`.
- `postgres`: database principale del backend.
- `redis`: channel layer del microservizio Channels.
- `libs/riskapp_reports_client`: libreria Python riusabile per integrare backend presenti e futuri con il microservizio report.

## Avvio con Docker

Prepara i file ambiente:

```bash
cp .env.example .env
cp .env.local.example .env.local
```

Costruisci le immagini:

```bash
docker compose build
```

Avvia i servizi:

```bash
docker compose up postgres redis backend report-microservice frontend
```

Esegui le migrazioni del backend:

```bash
docker compose exec backend python manage.py migrate
```

Apri il frontend:

```text
https://localhost:3000
```

Il certificato HTTPS locale è generato da Vite, quindi il browser può mostrare un avviso di sicurezza.

## Health check

Backend:

```bash
curl http://127.0.0.1:8000/api/health/
```

Microservizio:

```bash
curl http://127.0.0.1:8100/internal/health/ \
  -H "Authorization: Bearer dev-internal-service-token"
```

## Utente di test

Puoi registrare un utente via API:

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"demo@example.com","password":"password","password_confirm":"password","first_name":"Demo","last_name":"User"}'
```

Poi accedi dal frontend con:

```text
email: demo@example.com
password: password
```

## Flusso report

1. Il frontend chiama `POST /api/auth/login/`; il backend imposta la sessione Django via cookie.
2. Il frontend usa `GET /api/me/` per verificare l'utente corrente.
3. L'utente crea un cliente e richiede un report.
4. Il backend crea un `Report` in stato `pending`.
5. Il backend usa `riskapp_reports_client.ReportsClient` per chiamare il microservizio su `POST /internal/reports/generate/`.
6. Il microservizio simula la lavorazione, aggiorna il backend via callback `PATCH /api/internal/reports/{id}/status/` e pubblica eventi su Channels.
7. Channels usa Redis come channel layer.
8. Il frontend riceve gli eventi WebSocket cifrati, li decripta in memoria e aggiorna la lista report.
9. Quando il report è `completed`, il download PDF viene abilitato.

## WebSocket e sicurezza

Endpoint WebSocket:

```text
/ws/reports/
```

Il WebSocket è autenticato tramite cookie di sessione Django:

1. Il frontend apre la connessione.
2. Il frontend genera una coppia RSA-OAEP temporanea con Web Crypto API.
3. Il frontend invia `{ "type": "auth", "public_key": ... }`.
4. Il microservizio legge il cookie dagli header WebSocket.
5. Il microservizio valida la sessione chiamando il backend su `/api/me/`.
6. Se l'utente è valido, la socket viene associata al gruppo `reports_user_<user_id>`.
7. Gli eventi report vengono cifrati dal microservizio con la public key del frontend.
8. Il frontend decripta gli eventi con la private key mantenuta solo in memoria.

I messaggi di controllo `auth.success` e `subscribed` restano in chiaro. Gli eventi report arrivano come envelope cifrata:

```json
{
  "type": "encrypted",
  "algorithm": "RSA-OAEP-256",
  "ciphertext": "..."
}
```

Nota: la cifratura applicativa non sostituisce HTTPS/WSS in produzione.

## Libreria Python

La libreria in `libs/riskapp_reports_client` incapsula l'integrazione HTTP backend -> microservizio.

Uso previsto:

```python
from riskapp_reports_client import ReportsClient

client = ReportsClient(
    base_url="http://report-microservice:8100",
    internal_token="dev-internal-service-token",
)

client.generate_report(
    report_id=1,
    entity_id=10,
    user_id=3,
    parameters={},
    status_url="http://backend:8000/api/internal/reports/1/status/",
)

client.cancel_report(
    report_id=1,
    reason="Richiesta annullata dall'utente",
)
```

Nel container backend la libreria viene installata durante la build dal `backend/Dockerfile`.

Per installarla localmente in sviluppo:

```bash
python3 -m pip install -e libs/riskapp_reports_client
```

## Verifiche utili

Validazione Django backend:

```bash
docker compose run --rm backend python manage.py check
```

Validazione Django microservizio:

```bash
docker compose run --rm report-microservice python manage.py check
```

Build frontend:

```bash
npm run build
```

Validazione Docker Compose:

```bash
docker compose config
```

## Note di sviluppo

- Il backend usa PostgreSQL quando sono presenti le variabili `POSTGRES_*`.
- Fuori Docker il backend mantiene un fallback SQLite per sviluppo locale (non lo usa; Django richiede la sua configurazione)
- Il microservizio usa SQLite solo come database Django minimale; il suo channel layer è Redis.
- La generazione PDF è ancora mockata nel backend tramite `build_mock_pdf`.
- La logica reale di generazione report può sostituire il mock senza cambiare il contratto backend-microservizio.
