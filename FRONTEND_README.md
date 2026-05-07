# Frontend RiskApp

Questo README descrive le scelte lato frontend dell'applicazione RiskApp e il ruolo della libreria TypeScript interna `src/lib/riskapp-client`.

Il frontend e' una single page application React costruita con Vite. Gestisce autenticazione via cookie Django, CRUD dei clienti, generazione e gestione dei report PDF, aggiornamenti live via WebSocket e decifratura client-side degli eventi report.

## Stack

- React 18 con React Router.
- Vite su HTTPS locale, tramite `@vitejs/plugin-basic-ssl`.
- TypeScript come contratto statico tra UI, API HTTP e WebSocket.
- Redux Toolkit e RTK Query per stato applicativo, cache e chiamate API.
- Ant Design per layout, form, tabelle, modali e feedback utente.
- Web Crypto API per generare chiavi RSA-OAEP temporanee e decifrare eventi report.

## Struttura

```text
src/
  components/              Componenti riusabili e layout
  hooks/                   Hook applicativi, incluso useReportsSocket
  lib/riskapp-client/      Libreria TypeScript condivisa lato frontend
  pages/                   Pagine principali
  services/                API RTK Query costruite sui contratti della lib
  store/                   Store Redux e stato autenticazione
  router.tsx               Definizione rotte pubbliche e protette
```

La separazione importante e' questa:

- `src/lib/riskapp-client` definisce il contratto applicativo: tipi, path API, messaggi WebSocket, parsing e crypto.
- `src/services` decide come quel contratto viene usato dentro React, tramite RTK Query.
- `src/pages` e `src/components` restano concentrate sull'esperienza utente.



## Variabili ambiente

Le variabili piu' rilevanti sono:

```text
VITE_API_BASE_URL
VITE_API_BASE_PATHS
VITE_API_PROXY_TARGET
VITE_WS_PROXY_TARGET
VITE_REPORT_WS_URL
```

In sviluppo, `vite.config.ts` crea due proxy:

- `/api` verso il backend Django;
- `/ws` verso il microservizio WebSocket.

Questo permette al browser di parlare con backend e microservizio passando dallo stesso host del frontend. E' utile soprattutto per cookie di sessione, CORS e WebSocket.

## Routing e autenticazione

Le rotte sono definite in `src/router.tsx`.

Le pagine pubbliche sono:

- `/login`
- `/register`
- `/session-expired`

Le pagine protette passano da `ProtectedRoutes`:

- `/home`
- `/profile`
- `/entities/:entityId`
- `/entities/:entityId/reports/new`

`ProtectedRoutes` legge `auth.isAuthenticated` dallo store Redux. Quando il valore e' `null`, chiama `GET /me/` tramite `useLazyGetUserQuery` per capire se la sessione Django e' ancora valida. Se la verifica riesce, l'utente entra nell'app; se fallisce, viene mandato a `/login`.

Questa scelta evita di fidarsi di uno stato frontend persistito. La sorgente della verita' rimane la sessione lato backend.

## RTK Query

Il file `src/services/api.ts` definisce due API RTK Query:

- `publicApi`, usata per login e registrazione.
- `baseApi`, usata per endpoint autenticati.

Entrambe usano `fetchBaseQuery`, ma `baseApi` aggiunge una logica centralizzata di gestione dei `401`.

Quando una richiesta autenticata riceve `401`, il frontend:

1. mette lo stato auth in pending;
2. prova `POST /auth/refresh-token/`;
3. se il refresh riesce, ripete la richiesta originale;
4. se fallisce, chiama logout e marca l'utente come non autenticato.

Le API funzionali sono poi composte con `injectEndpoints`:

- `src/services/auth.ts` per login e registrazione.
- `src/services/common.ts` per utente corrente e logout.
- `src/services/reports.ts` per clienti e report.

## Cache e aggiornamento dati

Le entita' principali sono cacheate con tag RTK Query:

- `Entities`
- `Reports`

Le mutation invalidano i tag interessati. Per esempio:

- creare o modificare un cliente invalida `Entities`;
- creare, cancellare o annullare un report invalida `Reports`;
- gli eventi WebSocket live invalidano `Reports`.

La pagina dettaglio cliente usa questa strategia: mostra i dati cacheati quando disponibili, ma appena arriva un evento live sul report invalida la lista e lascia che RTK Query recuperi lo stato aggiornato dal backend.

## Libreria TypeScript `riskapp-client`

La cartella `src/lib/riskapp-client` e' una piccola libreria applicativa interna. Non contiene componenti React e non dipende da Redux. Il suo obiettivo e' tenere in un solo posto il contratto tra frontend, backend e microservizio.

Esporta tutto da `index.ts`, cosi' il resto dell'app importa da un unico punto:

```ts
import {
  authPaths,
  reportPaths,
  type Report,
  type CreateReportRequest,
} from '../lib/riskapp-client';
```

### `types.ts`

`types.ts` definisce i modelli condivisi:

- `User`
- `Entity`
- `Report`
- `ReportStatus`
- `ApiError`
- wrapper HTTP come `DataResponse<T>` e `ListResponse<T>`
- payload request come `LoginRequest`, `RegisterRequest`, `CreateEntityRequest`, `CreateReportRequest`

Questi tipi rispecchiano le risposte del backend. Per esempio il backend ritorna spesso oggetti nella forma:

```ts
interface DataResponse<T> {
  data: T;
}
```

Per questo i servizi RTK Query possono fare `transformResponse` in modo tipizzato, estraendo `response.data` senza duplicare shape e interfacce nei componenti.

### `auth.ts`, `entities.ts`, `reports.ts`

Questi file esportano i path HTTP:

```ts
export const reportPaths = {
  list: '/reports/',
  detail: (id: number) => `/reports/${id}/`,
  cancel: (id: number) => `/reports/${id}/cancel/`,
  download: (id: number) => `/reports/${id}/download/`,
};
```

La scelta e' intenzionale: i componenti e i servizi non scrivono stringhe endpoint a mano. Se cambia un URL backend, il punto da modificare e' nella lib.

I path dinamici sono funzioni tipizzate, quindi non si passa accidentalmente una stringa dove serve un id numerico.

### `errors.ts`

`errors.ts` contiene `isApiErrorResponse`, una type guard per verificare se un valore sconosciuto ha la forma:

```ts
{
  error: {
    code: string;
    message: string;
  }
}
```

E' utile per trattare errori API in modo piu' robusto, senza assumere che ogni errore ricevuto dal network abbia davvero la shape prevista.

### `websocket.ts`

`websocket.ts` descrive il protocollo WebSocket lato report.

I messaggi client sono:

- `auth`, con public key opzionale;
- `subscribe`, con filtro sugli stati report.

I messaggi server sono:

- `auth.success`
- `auth.failed`
- `subscribed`
- `encrypted`
- `report.updated`
- `report.ready`
- `report.failed`

Il tipo `ReportsSocketMessage` e' una union discriminata sul campo `type`. Questo rende il codice in `useReportsSocket` piu' sicuro: quando si controlla `message.type`, TypeScript restringe automaticamente i campi disponibili.

Il file contiene anche:

- `reportStatusSubscriptions`, cioe' gli stati report sottoscritti dal frontend;
- `parseReportsSocketMessage`, parser JSON difensivo che ritorna `null` se il messaggio non e' valido;
- `serializeReportsSocketMessage`, serializer dei messaggi inviati dal client.

### `crypto.ts`

`crypto.ts` incapsula la parte Web Crypto API.

`createReportsCryptoContext` genera una coppia di chiavi RSA-OAEP:

- algoritmo `RSA-OAEP`;
- modulo 2048 bit;
- hash `SHA-256`;
- public exponent `65537`;
- chiave privata mantenuta in memoria;
- public key esportata in formato JWK.

Il frontend invia la public key al microservizio durante l'autenticazione WebSocket. Il microservizio usa quella chiave per cifrare gli eventi report. Il frontend decifra gli envelope `encrypted` con `decryptReportsSocketMessage`.

Questa scelta mantiene i payload report cifrati anche a livello applicativo. Non sostituisce HTTPS/WSS, ma aggiunge una protezione specifica sul contenuto degli eventi.

### `config.ts`

`config.ts` definisce `ClientConfig`, pensato come contratto di configurazione riusabile:

```ts
interface ClientConfig {
  apiBaseUrl: string;
  apiBasePath: string;
  reportsWsUrl?: string;
}
```

Nel codice attuale la configurazione effettiva viene ancora letta nei servizi e negli hook da `import.meta.env`, ma il tipo rende esplicita la forma attesa da un eventuale client piu' autonomo.

## Flusso WebSocket nel frontend

Il flusso vive in `src/hooks/useReportsSocket.ts`.

Il frontend usa direttamente il WebSocket nativo del browser invece di una libreria come `react-use-websocket`. Una libreria React avrebbe reso piu' semplice la gestione base della connessione, dei reconnect e del ciclo di vita dentro i componenti. In questo caso pero' e' stato preferito l'uso nativo per avere controllo esplicito sugli stati applicativi della socket, sul momento esatto in cui viene generata la coppia di chiavi, sull'handshake `auth` e sulla distinzione tra messaggi in chiaro e messaggi cifrati.

1. La pagina dettaglio cliente abilita il socket con `useReportsSocket(true)`.
2. L'hook apre `new WebSocket(getWsUrl())`.
3. Alla `open`, genera una coppia RSA-OAEP.
4. Invia `{ type: 'auth', public_key }`.
5. Quando riceve `auth.success`, passa allo stato `authenticated`.
6. Invia una subscribe per gli stati `pending`, `running`, `completed`, `failed`.
7. Se arriva un messaggio in chiaro, lo gestisce subito.
8. Se arriva un messaggio `encrypted`, lo decifra con la private key in memoria.
9. Per eventi report, aggiorna il messaggio live e invalida il tag RTK Query `Reports`.

Gli stati possibili del socket sono:

```ts
type ReportsSocketState =
  | 'connecting'
  | 'connected'
  | 'authenticated'
  | 'closed';
```

La UI mostra questi stati con un `Alert` nella pagina dettaglio cliente.

## Scelte UI

Il frontend usa Ant Design per mantenere una UI operativa e densa, adatta a un'app gestionale:

- `Layout`, `Header`, `Menu` e `Content` per la cornice applicativa;
- `Table` per clienti e report;
- `Form`, `Input`, `Modal` e `Popconfirm` per operazioni CRUD;
- `Alert`, `Tag`, `Empty`, `Spin` e message API per feedback immediato.

Le pagine principali seguono un flusso lineare:

- `Home` crea e lista clienti;
- `EntityDetailPage` mostra dettaglio cliente, report, WebSocket live, download, annullamento, eliminazione e modifica cliente;
- `GenerateReportPage` crea un nuovo report per il cliente selezionato.
