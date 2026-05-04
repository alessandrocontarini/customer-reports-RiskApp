# Customer Reports Mock

Sistema demo composto da:

- frontend React/Vite production-ready fornito;
- backend Django con autenticazione solo via cookie/sessione;
- microservizio Django mock per generazione asincrona report PDF;
- REST per dati applicativi e WebSocket per aggiornamenti live report.

## Avvio locale

Installa le dipendenze Python:

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
pip install -r report_microservice/requirements.txt
```

Prepara il backend:

```bash
cd backend
python manage.py makemigrations reports
python manage.py migrate
python manage.py runserver 127.0.0.1:8000
```

In un secondo terminale avvia il microservizio:

```bash
source .venv/bin/activate
cd report_microservice
daphne -b 127.0.0.1 -p 8100 config.asgi:application
```

In un terzo terminale avvia il frontend:

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Il login usa cookie Django. Per provare rapidamente puoi registrare un utente via API:

```bash
curl -X POST http://127.0.0.1:8000/api/auth/register/ \
  -H 'Content-Type: application/json' \
  -d '{"email":"demo@example.com","password":"password","password_confirm":"password","first_name":"Demo","last_name":"User"}'
```

Poi accedi dal frontend con:

```text
username: alessandro_contarini
password: prova123
```

## Flusso implementato

1. Il frontend chiama `POST /api/auth/login/`; il backend imposta la sessione Django via cookie.
2. La rotta protetta chiama `GET /api/me/` per verificare l'utente corrente.
3. La Home carica `GET /api/entities/` e `GET /api/reports/`.
4. L'utente crea un cliente e richiede un report PDF.
5. Il backend crea `Report(status=pending)` e chiama il microservizio su `POST /internal/reports/generate/`.
6. Il microservizio simula un task asincrono, aggiorna il backend via `PATCH /api/internal/reports/{id}/status/` e invia eventi WebSocket.
7. Il frontend riceve `report.updated` / `report.ready`, ricarica i report e abilita il download PDF.

Nota: rispetto al PDF di progettazione, l'autenticazione è stata adattata alla tua correzione: niente Bearer token utente nel frontend, solo cookie gestiti dal backend.

---

# Template Originale

# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x';
import reactDom from 'eslint-plugin-react-dom';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
