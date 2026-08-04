/**
 * Writes production environment.ts from process.env before `ng build`.
 * Vercel (or CI) should set API_BASE_URL to the absolute gateway base.
 */
import { writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');

const DEFAULT_API_BASE_URL = 'https://solar-app-ochre.vercel.app/api/v1';
const apiBaseUrl = (process.env.API_BASE_URL ?? '').trim() || DEFAULT_API_BASE_URL;

const contents = `export const environment = {
  production: true,
  /**
   * Absolute gateway URL. Injected at build time by scripts/write-env.mjs
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
