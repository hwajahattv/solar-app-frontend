/**
 * Writes production environment.ts from process.env before `ng build`.
 *
 * Prefer a same-origin base (`/api/v1`) so the browser talks to the frontend
 * host and Vercel rewrites proxy to the Nest gateway — avoids CORS entirely.
 * Set API_BASE_URL to an absolute gateway URL only when you intentionally want
 * cross-origin calls (and have CORS_ORIGINS configured on the backend).
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const DEFAULT_API_BASE_URL = '/api/v1';
const apiBaseUrl = (process.env.API_BASE_URL ?? '').trim() || DEFAULT_API_BASE_URL;

const contents = `export const environment = {
  production: true,
  /**
   * Gateway URL. Injected at build time by scripts/write-env.mjs
   * from the API_BASE_URL environment variable.
   */
  apiBaseUrl: ${JSON.stringify(apiBaseUrl)},
  /** Default polling interval for live telemetry, in milliseconds. */
  defaultRefreshIntervalMs: 5000,
};
`;

const outPath = resolve(root, 'src/environments/environment.ts');
writeFileSync(outPath, contents, 'utf8');
console.log(`[write-env] Wrote ${outPath}`);
console.log(`[write-env] apiBaseUrl=${apiBaseUrl}`);
