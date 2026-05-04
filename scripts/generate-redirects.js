import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootDir = path.resolve(__dirname, '..');
const envPath = path.resolve(rootDir, '.env.local');
const redirectsPath = path.resolve(rootDir, 'public', '_redirects');

// Funzione per leggere le variabili d'ambiente da un file .env semplice
function readEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, 'utf-8');
  const env = {};
  content.split('\n').forEach((line) => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let value = match[2] || '';
      if (value.startsWith('"') && value.endsWith('"'))
        value = value.slice(1, -1);
      if (value.startsWith("'") && value.endsWith("'"))
        value = value.slice(1, -1);
      env[match[1]] = value;
    }
  });
  return env;
}

const env = readEnvFile(envPath);
const apiUrl = process.env.VITE_API_BASE_URL || env.VITE_API_BASE_URL;
const apiPaths = process.env.VITE_API_BASE_PATHS || env.VITE_API_BASE_PATHS;

if (apiUrl === undefined) {
  console.error(
    'Errore: VITE_API_BASE_URL non trovata né in process.env né in .env.local',
  );
  process.exit(1);
}
if (apiUrl && !apiPaths) {
  console.error(
    'Errore: VITE_API_BASE_PATH non trovata né in process.env né in .env.local',
  );
  process.exit(1);
}

// Assicurati che l'URL non finisca con /
const cleanApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl;
const rewrites = apiUrl
  ? apiPaths.split(',').map((path) => {
      // Pulizia path: rimuovi slash iniziali e finali per manipolarlo
      const normalizedPath = path.replace(/^\/+|\/+$/g, '');

      return `/${normalizedPath}/*  ${cleanApiUrl}/${normalizedPath}/:splat  200!`;
    })
  : [];

const redirectsContent = [...rewrites, '/*    /index.html   200'];

fs.writeFileSync(
  redirectsPath,
  redirectsContent.map((str) => str + '\n').join(''),
);
